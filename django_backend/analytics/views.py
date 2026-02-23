from datetime import timedelta

from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.models import User

from .models import AnalyticsEvent

MAX_EVENTS_PER_BATCH = 50
MAX_PAGE_PATH_LENGTH = 500
MAX_REFERRER_LENGTH = 500
MAX_PAGE_TITLE_LENGTH = 255
DEFAULT_SCORING_DAYS = 30
MAX_SCORING_DAYS = 180


# Rule-based product interest scoring weights. Keep this small and explicit so it is
# easy to validate/tune with actual usage data before introducing more complex models.
INTEREST_WEIGHTS = {
    AnalyticsEvent.EVENT_PRODUCT_CLICK: 1,
    AnalyticsEvent.EVENT_PRODUCT_DETAIL_VIEW: 3,
    "page_engagement_30s": 3,
    "page_engagement_90s": 2,
    "tab_specifications": 2,
    "tab_documents": 3,
    "tab_features": 1,
    AnalyticsEvent.EVENT_DOCUMENT_DOWNLOAD_CLICK: 5,
    AnalyticsEvent.EVENT_DOCUMENT_EMAIL_REQUEST_SUBMIT: 7,
    "request_quote_click_product_detail": 8,
}


def _get_session_user(request):
    user_id = request.session.get("account_user_id")
    if not user_id:
        return None
    return User.objects.filter(id=user_id, is_active=True).first()


def _detect_device_type(user_agent: str) -> str:
    ua = (user_agent or "").lower()
    if not ua:
        return ""
    if "bot" in ua or "spider" in ua or "crawler" in ua:
        return "bot"
    if "ipad" in ua or "tablet" in ua:
        return "tablet"
    if "mobi" in ua or "android" in ua or "iphone" in ua:
        return "mobile"
    return "desktop"


def _coerce_event_time(value):
    if not value:
        return timezone.now()
    parsed = parse_datetime(value)
    if parsed is None:
        return None
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
    return parsed


def _validate_properties(properties):
    if properties is None:
        return {}
    if not isinstance(properties, dict):
        return None
    return properties


def _coerce_int(value, default=None, min_value=None, max_value=None):
    if value in (None, ""):
        return default
    try:
        result = int(value)
    except (TypeError, ValueError):
        return default
    if min_value is not None and result < min_value:
        result = min_value
    if max_value is not None and result > max_value:
        result = max_value
    return result


def _coerce_number(value):
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _event_product_context(event: AnalyticsEvent):
    props = event.properties or {}
    product_id = _coerce_int(props.get("product_id"))
    if not product_id:
        return None
    return {
        "product_id": product_id,
        "product_slug": str(props.get("product_slug") or ""),
        "product_name": str(props.get("product_name") or ""),
        "power_source_slug": str(props.get("power_source_slug") or ""),
        "power_source_name": str(props.get("power_source_name") or ""),
    }


def _add_product_score(bucket, product_ctx, points, event_name):
    if points <= 0 or not product_ctx:
        return
    product_key = str(product_ctx["product_id"])
    if product_key not in bucket:
        bucket[product_key] = {
            "product_id": product_ctx["product_id"],
            "product_slug": product_ctx.get("product_slug") or "",
            "product_name": product_ctx.get("product_name") or "",
            "power_source_slug": product_ctx.get("power_source_slug") or "",
            "power_source_name": product_ctx.get("power_source_name") or "",
            "score": 0,
            "event_counts": {},
        }
    row = bucket[product_key]
    if not row["product_slug"] and product_ctx.get("product_slug"):
        row["product_slug"] = product_ctx["product_slug"]
    if not row["product_name"] and product_ctx.get("product_name"):
        row["product_name"] = product_ctx["product_name"]
    if not row["power_source_slug"] and product_ctx.get("power_source_slug"):
        row["power_source_slug"] = product_ctx["power_source_slug"]
    if not row["power_source_name"] and product_ctx.get("power_source_name"):
        row["power_source_name"] = product_ctx["power_source_name"]

    row["score"] += points
    row["event_counts"][event_name] = row["event_counts"].get(event_name, 0) + 1


def _add_power_source_score(bucket, slug, name, points, event_name):
    if points <= 0 or not slug:
        return
    if slug not in bucket:
        bucket[slug] = {
            "power_source_slug": slug,
            "power_source_name": name or "",
            "score": 0,
            "event_counts": {},
        }
    row = bucket[slug]
    if not row["power_source_name"] and name:
        row["power_source_name"] = name
    row["score"] += points
    row["event_counts"][event_name] = row["event_counts"].get(event_name, 0) + 1


def _score_event(event: AnalyticsEvent):
    props = event.properties or {}
    event_name = event.event_name
    product_ctx = _event_product_context(event)
    product_points = 0
    power_source_points = 0
    score_label = event_name

    if event_name == AnalyticsEvent.EVENT_PRODUCT_CLICK:
        product_points = INTEREST_WEIGHTS[AnalyticsEvent.EVENT_PRODUCT_CLICK]
        power_source_points = product_points
    elif event_name == AnalyticsEvent.EVENT_PRODUCT_DETAIL_VIEW:
        product_points = INTEREST_WEIGHTS[AnalyticsEvent.EVENT_PRODUCT_DETAIL_VIEW]
        power_source_points = product_points
    elif event_name == AnalyticsEvent.EVENT_PAGE_ENGAGEMENT:
        active_seconds = _coerce_number(props.get("active_seconds")) or 0
        page_type = str(props.get("page_type") or "")
        if page_type == "product_detail" and product_ctx and active_seconds >= 30:
            product_points += INTEREST_WEIGHTS["page_engagement_30s"]
            power_source_points += INTEREST_WEIGHTS["page_engagement_30s"]
            score_label = "page_engagement_30s"
            if active_seconds >= 90:
                product_points += INTEREST_WEIGHTS["page_engagement_90s"]
                power_source_points += INTEREST_WEIGHTS["page_engagement_90s"]
                score_label = "page_engagement_90s"
    elif event_name == AnalyticsEvent.EVENT_PRODUCT_DETAIL_TAB_CLICK and product_ctx:
        tab = str(props.get("tab") or "").lower()
        if tab == "specifications":
            product_points = INTEREST_WEIGHTS["tab_specifications"]
            power_source_points = product_points
            score_label = "tab_specifications"
        elif tab == "documents":
            product_points = INTEREST_WEIGHTS["tab_documents"]
            power_source_points = product_points
            score_label = "tab_documents"
        elif tab == "features":
            product_points = INTEREST_WEIGHTS["tab_features"]
            power_source_points = product_points
            score_label = "tab_features"
    elif event_name == AnalyticsEvent.EVENT_DOCUMENT_DOWNLOAD_CLICK and product_ctx:
        product_points = INTEREST_WEIGHTS[AnalyticsEvent.EVENT_DOCUMENT_DOWNLOAD_CLICK]
        power_source_points = product_points
    elif event_name == AnalyticsEvent.EVENT_DOCUMENT_EMAIL_REQUEST_SUBMIT and product_ctx:
        product_points = INTEREST_WEIGHTS[AnalyticsEvent.EVENT_DOCUMENT_EMAIL_REQUEST_SUBMIT]
        power_source_points = product_points
    elif event_name == AnalyticsEvent.EVENT_REQUEST_QUOTE_CLICK:
        source_section = str(props.get("source_section") or "").lower()
        if source_section == "product_detail" and product_ctx:
            product_points = INTEREST_WEIGHTS["request_quote_click_product_detail"]
            power_source_points = product_points
            score_label = "request_quote_click_product_detail"
    elif event_name == AnalyticsEvent.EVENT_POWER_SOURCE_CARD_CLICK:
        slug = str(props.get("power_source_slug") or "")
        name = str(props.get("power_source_name") or "")
        points = 1
        return {
            "product_ctx": None,
            "product_points": 0,
            "power_source_slug": slug,
            "power_source_name": name,
            "power_source_points": points,
            "score_label": AnalyticsEvent.EVENT_POWER_SOURCE_CARD_CLICK,
        }

    power_source_slug = ""
    power_source_name = ""
    if product_ctx:
        power_source_slug = product_ctx.get("power_source_slug") or ""
        power_source_name = product_ctx.get("power_source_name") or ""

    return {
        "product_ctx": product_ctx,
        "product_points": product_points,
        "power_source_slug": power_source_slug,
        "power_source_name": power_source_name,
        "power_source_points": power_source_points,
        "score_label": score_label,
    }


def build_product_interest_summary(*, days=DEFAULT_SCORING_DAYS, limit=10):
    days = _coerce_int(days, default=DEFAULT_SCORING_DAYS, min_value=1, max_value=MAX_SCORING_DAYS)
    limit = _coerce_int(limit, default=10, min_value=1, max_value=100)

    end_time = timezone.now()
    start_time = end_time - timedelta(days=days)

    relevant_events = [
        AnalyticsEvent.EVENT_PRODUCT_CLICK,
        AnalyticsEvent.EVENT_PRODUCT_DETAIL_VIEW,
        AnalyticsEvent.EVENT_PAGE_ENGAGEMENT,
        AnalyticsEvent.EVENT_PRODUCT_DETAIL_TAB_CLICK,
        AnalyticsEvent.EVENT_DOCUMENT_DOWNLOAD_CLICK,
        AnalyticsEvent.EVENT_DOCUMENT_EMAIL_REQUEST_SUBMIT,
        AnalyticsEvent.EVENT_REQUEST_QUOTE_CLICK,
        AnalyticsEvent.EVENT_POWER_SOURCE_CARD_CLICK,
    ]

    events_qs = (
        AnalyticsEvent.objects.filter(event_time__gte=start_time, event_time__lte=end_time, event_name__in=relevant_events)
        .order_by("-event_time")
        .only("event_name", "event_time", "properties")
    )

    product_scores = {}
    power_source_scores = {}
    processed = 0

    for event in events_qs.iterator(chunk_size=500):
        processed += 1
        scored = _score_event(event)
        label = scored["score_label"]
        _add_product_score(product_scores, scored["product_ctx"], scored["product_points"], label)
        _add_power_source_score(
            power_source_scores,
            scored["power_source_slug"],
            scored["power_source_name"],
            scored["power_source_points"],
            label,
        )

    top_products = sorted(product_scores.values(), key=lambda item: (-item["score"], item["product_id"]))[:limit]
    top_power_sources = sorted(power_source_scores.values(), key=lambda item: (-item["score"], item["power_source_slug"]))[:limit]

    return {
        "window_days": days,
        "limit": limit,
        "window_start": start_time,
        "window_end": end_time,
        "weights": INTEREST_WEIGHTS,
        "processed_events": processed,
        "top_products": top_products,
        "top_power_sources": top_power_sources,
    }


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def ingest_events(request):
    payload = request.data if isinstance(request.data, dict) else {}
    events = payload.get("events")

    if not isinstance(events, list):
        return Response({"detail": "events must be a list."}, status=status.HTTP_400_BAD_REQUEST)
    if not events:
        return Response({"detail": "events list cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)
    if len(events) > MAX_EVENTS_PER_BATCH:
        return Response(
            {"detail": f"Maximum {MAX_EVENTS_PER_BATCH} events per batch allowed."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    allowed_event_names = {choice[0] for choice in AnalyticsEvent.EVENT_CHOICES}
    request_user = _get_session_user(request)
    user_agent = request.META.get("HTTP_USER_AGENT", "")
    device_type = _detect_device_type(user_agent)

    to_create = []
    errors = []

    for index, item in enumerate(events):
        if not isinstance(item, dict):
            errors.append({"index": index, "detail": "Each event must be an object."})
            continue

        event_name = item.get("event_name")
        event_time = _coerce_event_time(item.get("event_time"))
        session_id = str(item.get("session_id") or "").strip()
        anon_id = str(item.get("anon_id") or "").strip()
        page_path = str(item.get("page_path") or "").strip()
        page_title = str(item.get("page_title") or "").strip()
        referrer = str(item.get("referrer") or "").strip()
        properties = _validate_properties(item.get("properties"))

        if event_name not in allowed_event_names:
            errors.append({"index": index, "detail": "Invalid event_name."})
            continue
        if event_time is None:
            errors.append({"index": index, "detail": "Invalid event_time."})
            continue
        if not session_id:
            errors.append({"index": index, "detail": "session_id is required."})
            continue
        if not anon_id:
            errors.append({"index": index, "detail": "anon_id is required."})
            continue
        if not page_path:
            errors.append({"index": index, "detail": "page_path is required."})
            continue
        if properties is None:
            errors.append({"index": index, "detail": "properties must be an object."})
            continue

        to_create.append(
            AnalyticsEvent(
                event_name=event_name,
                event_time=event_time,
                session_id=session_id[:128],
                anon_id=anon_id[:128],
                user=request_user,
                page_path=page_path[:MAX_PAGE_PATH_LENGTH],
                page_title=page_title[:MAX_PAGE_TITLE_LENGTH],
                referrer=referrer[:MAX_REFERRER_LENGTH],
                properties=properties,
                user_agent=user_agent[:4000],
                device_type=device_type,
            )
        )

    if errors:
        return Response(
            {"detail": "One or more events are invalid.", "errors": errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    AnalyticsEvent.objects.bulk_create(to_create, batch_size=MAX_EVENTS_PER_BATCH)
    return Response({"accepted": len(to_create)}, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def product_interest_summary(request):
    summary = build_product_interest_summary(
        days=request.query_params.get("days"),
        limit=request.query_params.get("limit"),
    )
    return Response(summary, status=status.HTTP_200_OK)
