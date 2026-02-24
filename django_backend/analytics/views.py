from datetime import timedelta
from decimal import Decimal

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
MAX_PAGE_TITLE_LENGTH = 255
MAX_REFERRER_LENGTH = 500
MAX_USER_AGENT_LENGTH = 4000

DEFAULT_SUMMARY_DAYS = 30
MAX_SUMMARY_DAYS = 180
DEFAULT_LIMIT = 10
MAX_LIMIT = 100

USER_INTEREST_WEIGHTS = {
    "nav_click_products": 1,
    AnalyticsEvent.EVENT_POWER_SOURCE_CARD_CLICK: 2,
    AnalyticsEvent.EVENT_INDUSTRY_CARD_CLICK: 2,
    AnalyticsEvent.EVENT_PRODUCT_FILTERS_APPLIED: 1,
    AnalyticsEvent.EVENT_PRODUCT_CLICK: 2,
    AnalyticsEvent.EVENT_PRODUCT_DETAIL_VIEW: 3,
    "tab_features": 1,
    "tab_specifications": 3,
    "tab_documents": 4,
    "request_quote_click_product": 8,
    AnalyticsEvent.EVENT_DOCUMENT_DOWNLOAD_CLICK: 5,
    AnalyticsEvent.EVENT_DOCUMENT_EMAIL_REQUEST_SUBMIT: 7,
    "page_engagement_120s": 6,
}


def _get_session_user(request):
    # Prefer Django auth user if present.
    django_user = getattr(request, "user", None)
    if getattr(django_user, "is_authenticated", False):
        return User.objects.filter(id=django_user.id, is_active=True).first()

    user_id = request.session.get("account_user_id")
    if not user_id:
        return None
    return User.objects.filter(id=user_id, is_active=True).first()


def _detect_device_type(user_agent: str) -> str:
    ua = (user_agent or "").lower()
    if not ua:
        return ""
    if any(token in ua for token in ("bot", "spider", "crawler")):
        return "bot"
    if any(token in ua for token in ("ipad", "tablet")):
        return "tablet"
    if any(token in ua for token in ("mobi", "android", "iphone")):
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


def _validate_properties(value):
    if value is None:
        return {}
    return value if isinstance(value, dict) else None


def _coerce_int(value, default=None, min_value=None, max_value=None):
    if value in (None, ""):
        result = default
    else:
        try:
            result = int(value)
        except (TypeError, ValueError):
            result = default
    if result is None:
        return None
    if min_value is not None and result < min_value:
        result = min_value
    if max_value is not None and result > max_value:
        result = max_value
    return result


def _coerce_decimal(value):
    if value in (None, ""):
        return None
    try:
        return Decimal(str(value))
    except Exception:
        return None


def _safe_str(value, max_len=None):
    text = str(value or "").strip()
    return text[:max_len] if max_len else text


def _event_product_ctx(properties):
    product_id = _coerce_int(properties.get("product_id"))
    if not product_id:
        return None
    return {
        "product_id": product_id,
        "product_slug": _safe_str(properties.get("product_slug")),
        "product_name": _safe_str(properties.get("product_name")),
        "power_source_slug": _safe_str(properties.get("power_source_slug")),
        "power_source_name": _safe_str(properties.get("power_source_name")),
    }


def _event_document_ctx(properties):
    catalogue_id = _coerce_int(properties.get("catalogue_id"))
    if not catalogue_id:
        return None
    return {
        "catalogue_id": catalogue_id,
        "document_title": _safe_str(properties.get("document_title")),
        "doc_type": _safe_str(properties.get("doc_type")),
        "access_type": _safe_str(properties.get("access_type")),
    }


def _score_logged_in_event(event):
    props = event.properties or {}
    product_ctx = _event_product_ctx(props)
    points = 0
    score_label = event.event_name

    if event.event_name == AnalyticsEvent.EVENT_NAV_CLICK:
        if _safe_str(props.get("label")).lower() == "products":
            points = USER_INTEREST_WEIGHTS["nav_click_products"]
            score_label = "nav_click_products"
    elif event.event_name == AnalyticsEvent.EVENT_POWER_SOURCE_CARD_CLICK:
        points = USER_INTEREST_WEIGHTS[AnalyticsEvent.EVENT_POWER_SOURCE_CARD_CLICK]
    elif event.event_name == AnalyticsEvent.EVENT_INDUSTRY_CARD_CLICK:
        points = USER_INTEREST_WEIGHTS[AnalyticsEvent.EVENT_INDUSTRY_CARD_CLICK]
    elif event.event_name == AnalyticsEvent.EVENT_PRODUCT_FILTERS_APPLIED:
        points = USER_INTEREST_WEIGHTS[AnalyticsEvent.EVENT_PRODUCT_FILTERS_APPLIED]
    elif event.event_name == AnalyticsEvent.EVENT_PRODUCT_CLICK:
        points = USER_INTEREST_WEIGHTS[AnalyticsEvent.EVENT_PRODUCT_CLICK]
    elif event.event_name == AnalyticsEvent.EVENT_PRODUCT_DETAIL_VIEW:
        points = USER_INTEREST_WEIGHTS[AnalyticsEvent.EVENT_PRODUCT_DETAIL_VIEW]
    elif event.event_name == AnalyticsEvent.EVENT_PRODUCT_DETAIL_TAB_CLICK:
        tab = _safe_str(props.get("tab")).lower()
        if tab == "features":
            points = USER_INTEREST_WEIGHTS["tab_features"]
            score_label = "tab_features"
        elif tab == "specifications":
            points = USER_INTEREST_WEIGHTS["tab_specifications"]
            score_label = "tab_specifications"
        elif tab == "documents":
            points = USER_INTEREST_WEIGHTS["tab_documents"]
            score_label = "tab_documents"
    elif event.event_name == AnalyticsEvent.EVENT_REQUEST_QUOTE_CLICK:
        if _safe_str(props.get("source_section")).lower() == "product_detail":
            points = USER_INTEREST_WEIGHTS["request_quote_click_product"]
            score_label = "request_quote_click_product"
    elif event.event_name == AnalyticsEvent.EVENT_DOCUMENT_DOWNLOAD_CLICK:
        points = USER_INTEREST_WEIGHTS[AnalyticsEvent.EVENT_DOCUMENT_DOWNLOAD_CLICK]
    elif event.event_name == AnalyticsEvent.EVENT_DOCUMENT_EMAIL_REQUEST_SUBMIT:
        points = USER_INTEREST_WEIGHTS[AnalyticsEvent.EVENT_DOCUMENT_EMAIL_REQUEST_SUBMIT]
    elif event.event_name == AnalyticsEvent.EVENT_PAGE_ENGAGEMENT:
        page_type = _safe_str(props.get("page_type")).lower()
        active_seconds = _coerce_decimal(props.get("active_seconds")) or Decimal("0")
        if page_type == "product_detail" and active_seconds >= Decimal("120"):
            points = USER_INTEREST_WEIGHTS["page_engagement_120s"]
            score_label = "page_engagement_120s"

    power_source_slug = _safe_str(props.get("power_source_slug"))
    power_source_name = _safe_str(props.get("power_source_name"))
    if product_ctx:
        power_source_slug = product_ctx["power_source_slug"] or power_source_slug
        power_source_name = product_ctx["power_source_name"] or power_source_name

    return {
        "points": points,
        "score_label": score_label,
        "product_ctx": product_ctx,
        "document_ctx": _event_document_ctx(props),
        "power_source_slug": power_source_slug,
        "power_source_name": power_source_name,
        "industry_slug": _safe_str(props.get("industry_slug")),
        "industry_name": _safe_str(props.get("industry_name")),
    }


def _increment_count(bucket, key, by=1):
    bucket[key] = bucket.get(key, 0) + by


def _add_scored_row(bucket, key, base_payload, points, score_label):
    if not key or points <= 0:
        return
    if key not in bucket:
        bucket[key] = {**base_payload, "score": 0, "event_counts": {}}
    row = bucket[key]
    row["score"] += points
    _increment_count(row["event_counts"], score_label)


def _add_popularity_row(bucket, key, base_payload, metric_key):
    if not key:
        return
    if key not in bucket:
        bucket[key] = {**base_payload, "counts": {}}
    _increment_count(bucket[key]["counts"], metric_key)


def _track_unique_anon(bucket, key, anon_id, metric_key=None):
    if not key or not anon_id or key not in bucket:
        return
    row = bucket[key]
    row.setdefault("_unique_anon_ids", set()).add(anon_id)
    if metric_key:
        metric_map = row.setdefault("_unique_metric_anon_ids", {})
        metric_map.setdefault(metric_key, set()).add(anon_id)


def _build_logged_in_interest_summary(*, user, days, limit):
    end_time = timezone.now()
    start_time = end_time - timedelta(days=days)

    relevant_events = [
        AnalyticsEvent.EVENT_NAV_CLICK,
        AnalyticsEvent.EVENT_POWER_SOURCE_CARD_CLICK,
        AnalyticsEvent.EVENT_INDUSTRY_CARD_CLICK,
        AnalyticsEvent.EVENT_PRODUCT_FILTERS_APPLIED,
        AnalyticsEvent.EVENT_PRODUCT_CLICK,
        AnalyticsEvent.EVENT_PRODUCT_DETAIL_VIEW,
        AnalyticsEvent.EVENT_PRODUCT_DETAIL_TAB_CLICK,
        AnalyticsEvent.EVENT_REQUEST_QUOTE_CLICK,
        AnalyticsEvent.EVENT_DOCUMENT_DOWNLOAD_CLICK,
        AnalyticsEvent.EVENT_DOCUMENT_EMAIL_REQUEST_SUBMIT,
        AnalyticsEvent.EVENT_PAGE_ENGAGEMENT,
    ]

    qs = (
        AnalyticsEvent.objects.filter(
            user=user,
            event_time__gte=start_time,
            event_time__lte=end_time,
            event_name__in=relevant_events,
        )
        .order_by("-event_time")
        .only("event_name", "event_time", "properties", "anon_id")
    )

    total_score = 0
    overall_counts = {}
    unscored_event_counts = {}
    by_product = {}
    by_power_source = {}
    by_industry = {}
    processed_events = 0

    for event in qs.iterator(chunk_size=500):
        processed_events += 1
        scored = _score_logged_in_event(event)
        points = scored["points"]
        if points <= 0:
            _increment_count(unscored_event_counts, event.event_name)
            continue

        total_score += points
        _increment_count(overall_counts, scored["score_label"])

        product_ctx = scored["product_ctx"]
        if product_ctx:
            _add_scored_row(
                by_product,
                str(product_ctx["product_id"]),
                {
                    "product_id": product_ctx["product_id"],
                    "product_slug": product_ctx["product_slug"],
                    "product_name": product_ctx["product_name"],
                    "power_source_slug": product_ctx["power_source_slug"],
                    "power_source_name": product_ctx["power_source_name"],
                },
                points,
                scored["score_label"],
            )

        if scored["power_source_slug"]:
            _add_scored_row(
                by_power_source,
                scored["power_source_slug"],
                {
                    "power_source_slug": scored["power_source_slug"],
                    "power_source_name": scored["power_source_name"],
                },
                points,
                scored["score_label"],
            )

        if scored["industry_slug"]:
            _add_scored_row(
                by_industry,
                scored["industry_slug"],
                {
                    "industry_slug": scored["industry_slug"],
                    "industry_name": scored["industry_name"],
                },
                points,
                scored["score_label"],
            )

    top_products = sorted(by_product.values(), key=lambda x: (-x["score"], x["product_id"]))[:limit]
    top_power_sources = sorted(by_power_source.values(), key=lambda x: (-x["score"], x["power_source_slug"]))[:limit]
    top_industries = sorted(by_industry.values(), key=lambda x: (-x["score"], x["industry_slug"]))[:limit]

    return {
        "window_days": days,
        "window_start": start_time,
        "window_end": end_time,
        "weights": USER_INTEREST_WEIGHTS,
        "processed_events": processed_events,
        "user": {"id": user.id, "email": user.email, "name": user.name},
        "overall_interest_score": total_score,
        "overall_event_counts": overall_counts,
        "unscored_event_counts": unscored_event_counts,
        "top_products": top_products,
        "top_power_sources": top_power_sources,
        "top_industries": top_industries,
    }


def build_user_interest_summary(*, user, days=DEFAULT_SUMMARY_DAYS, limit=DEFAULT_LIMIT):
    days = _coerce_int(days, default=DEFAULT_SUMMARY_DAYS, min_value=1, max_value=MAX_SUMMARY_DAYS)
    limit = _coerce_int(limit, default=DEFAULT_LIMIT, min_value=1, max_value=MAX_LIMIT)
    return _build_logged_in_interest_summary(user=user, days=days, limit=limit)


def _build_anonymous_popularity_summary(*, days, limit):
    end_time = timezone.now()
    start_time = end_time - timedelta(days=days)

    relevant_events = [
        AnalyticsEvent.EVENT_POWER_SOURCE_CARD_CLICK,
        AnalyticsEvent.EVENT_INDUSTRY_CARD_CLICK,
        AnalyticsEvent.EVENT_PRODUCT_CLICK,
        AnalyticsEvent.EVENT_PRODUCT_DETAIL_VIEW,
        AnalyticsEvent.EVENT_DOCUMENT_DOWNLOAD_CLICK,
        AnalyticsEvent.EVENT_DOCUMENT_EMAIL_REQUEST_SUBMIT,
    ]

    qs = (
        AnalyticsEvent.objects.filter(
            user__isnull=True,
            event_time__gte=start_time,
            event_time__lte=end_time,
            event_name__in=relevant_events,
        )
        .order_by("-event_time")
        .only("event_name", "event_time", "properties")
    )

    products = {}
    documents = {}
    power_sources = {}
    industries = {}
    totals = {}
    processed_events = 0

    for event in qs.iterator(chunk_size=500):
        processed_events += 1
        props = event.properties or {}
        anon_id = _safe_str(event.anon_id)
        _increment_count(totals, event.event_name)

        if event.event_name in (AnalyticsEvent.EVENT_PRODUCT_CLICK, AnalyticsEvent.EVENT_PRODUCT_DETAIL_VIEW):
            product_ctx = _event_product_ctx(props)
            metric = "detail_views" if event.event_name == AnalyticsEvent.EVENT_PRODUCT_DETAIL_VIEW else "product_clicks"
            if product_ctx:
                _add_popularity_row(
                    products,
                    str(product_ctx["product_id"]),
                    {
                        "product_id": product_ctx["product_id"],
                        "product_slug": product_ctx["product_slug"],
                        "product_name": product_ctx["product_name"],
                        "power_source_slug": product_ctx["power_source_slug"],
                    },
                    metric,
                )
                _track_unique_anon(products, str(product_ctx["product_id"]), anon_id, metric)
        elif event.event_name in (
            AnalyticsEvent.EVENT_DOCUMENT_DOWNLOAD_CLICK,
            AnalyticsEvent.EVENT_DOCUMENT_EMAIL_REQUEST_SUBMIT,
        ):
            doc_ctx = _event_document_ctx(props)
            product_ctx = _event_product_ctx(props)
            metric = "email_requests" if event.event_name == AnalyticsEvent.EVENT_DOCUMENT_EMAIL_REQUEST_SUBMIT else "downloads"
            if doc_ctx:
                _add_popularity_row(
                    documents,
                    str(doc_ctx["catalogue_id"]),
                    {
                        "catalogue_id": doc_ctx["catalogue_id"],
                        "document_title": doc_ctx["document_title"],
                        "doc_type": doc_ctx["doc_type"],
                        "access_type": doc_ctx["access_type"],
                        "product_id": product_ctx["product_id"] if product_ctx else None,
                        "product_slug": product_ctx["product_slug"] if product_ctx else "",
                    },
                    metric,
                )
                _track_unique_anon(documents, str(doc_ctx["catalogue_id"]), anon_id, metric)
        elif event.event_name == AnalyticsEvent.EVENT_POWER_SOURCE_CARD_CLICK:
            slug = _safe_str(props.get("power_source_slug"))
            _add_popularity_row(
                power_sources,
                slug,
                {
                    "power_source_slug": slug,
                    "power_source_name": _safe_str(props.get("power_source_name")),
                },
                "clicks",
            )
            _track_unique_anon(power_sources, slug, anon_id, "clicks")
        elif event.event_name == AnalyticsEvent.EVENT_INDUSTRY_CARD_CLICK:
            slug = _safe_str(props.get("industry_slug"))
            _add_popularity_row(
                industries,
                slug,
                {
                    "industry_slug": slug,
                    "industry_name": _safe_str(props.get("industry_name")),
                },
                "clicks",
            )
            _track_unique_anon(industries, slug, anon_id, "clicks")

    def _score_counts(counts):
        return (
            counts.get("email_requests", 0) * 5
            + counts.get("downloads", 0) * 4
            + counts.get("detail_views", 0) * 3
            + counts.get("product_clicks", 0) * 2
            + counts.get("clicks", 0)
        )

    for bucket in (products, documents, power_sources, industries):
        for row in bucket.values():
            row["popularity_score"] = _score_counts(row["counts"])
            unique_anon_ids = row.pop("_unique_anon_ids", set())
            row["unique_anonymous_users"] = len(unique_anon_ids)
            metric_sets = row.pop("_unique_metric_anon_ids", {})
            row["unique_counts"] = {metric: len(ids) for metric, ids in metric_sets.items()}

    top_products = sorted(
        products.values(),
        key=lambda x: (
            -x["counts"].get("detail_views", 0),
            -x["unique_counts"].get("detail_views", 0),
            -x["counts"].get("product_clicks", 0),
            -x["unique_counts"].get("product_clicks", 0),
            x.get("product_id") or 0,
        ),
    )[:limit]
    top_documents = sorted(
        documents.values(),
        key=lambda x: (
            -x["counts"].get("downloads", 0),
            -x["unique_counts"].get("downloads", 0),
            -x["counts"].get("email_requests", 0),
            -x["unique_counts"].get("email_requests", 0),
            x.get("catalogue_id") or 0,
        ),
    )[:limit]
    top_power_sources = sorted(
        power_sources.values(),
        key=lambda x: (-x["popularity_score"], x.get("power_source_slug") or ""),
    )[:limit]
    top_industries = sorted(
        industries.values(),
        key=lambda x: (-x["popularity_score"], x.get("industry_slug") or ""),
    )[:limit]

    return {
        "window_days": days,
        "window_start": start_time,
        "window_end": end_time,
        "processed_events": processed_events,
        "event_totals": totals,
        "top_products": top_products,
        "top_documents": top_documents,
        "top_power_sources": top_power_sources,
        "top_industries": top_industries,
    }


def build_anonymous_popularity_summary(*, days=DEFAULT_SUMMARY_DAYS, limit=DEFAULT_LIMIT):
    days = _coerce_int(days, default=DEFAULT_SUMMARY_DAYS, min_value=1, max_value=MAX_SUMMARY_DAYS)
    limit = _coerce_int(limit, default=DEFAULT_LIMIT, min_value=1, max_value=MAX_LIMIT)
    return _build_anonymous_popularity_summary(days=days, limit=limit)


def build_logged_in_document_activity_summary(*, days=DEFAULT_SUMMARY_DAYS, limit=DEFAULT_LIMIT):
    days = _coerce_int(days, default=DEFAULT_SUMMARY_DAYS, min_value=1, max_value=MAX_SUMMARY_DAYS)
    limit = _coerce_int(limit, default=DEFAULT_LIMIT, min_value=1, max_value=MAX_LIMIT)

    end_time = timezone.now()
    start_time = end_time - timedelta(days=days)

    qs = (
        AnalyticsEvent.objects.filter(
            user__isnull=False,
            event_time__gte=start_time,
            event_time__lte=end_time,
            event_name__in=[
                AnalyticsEvent.EVENT_DOCUMENT_DOWNLOAD_CLICK,
                AnalyticsEvent.EVENT_DOCUMENT_EMAIL_REQUEST_SUBMIT,
            ],
        )
        .order_by("-event_time")
        .select_related("user")
        .only("event_name", "properties", "user_id", "user__id", "user__name", "user__email")
    )

    documents = {}
    processed_events = 0
    for event in qs.iterator(chunk_size=500):
        processed_events += 1
        props = event.properties or {}
        doc_ctx = _event_document_ctx(props)
        if not doc_ctx:
            continue
        product_ctx = _event_product_ctx(props)
        if not event.user_id:
            continue
        key = f"{event.user_id}:{doc_ctx['catalogue_id']}"
        metric = "email_requests" if event.event_name == AnalyticsEvent.EVENT_DOCUMENT_EMAIL_REQUEST_SUBMIT else "downloads"
        _add_popularity_row(
            documents,
            key,
            {
                "user": {
                    "id": event.user_id,
                    "name": getattr(event.user, "name", "") or "",
                    "email": getattr(event.user, "email", "") or "",
                },
                "catalogue_id": doc_ctx["catalogue_id"],
                "document_title": doc_ctx["document_title"],
                "doc_type": doc_ctx["doc_type"],
                "access_type": doc_ctx["access_type"],
                "product_id": product_ctx["product_id"] if product_ctx else None,
                "product_slug": product_ctx["product_slug"] if product_ctx else "",
            },
            metric,
        )
        row = documents[key]
        # In this table each row is already user+document scoped, so "unique" counts are binary per metric.
        row.setdefault("unique_counts", {})
        row["unique_counts"][metric] = 1

    top_documents = sorted(
        documents.values(),
        key=lambda x: (
            -x["counts"].get("downloads", 0),
            -x["counts"].get("email_requests", 0),
            (x.get("user", {}) or {}).get("id") or 0,
            x.get("catalogue_id") or 0,
        ),
    )[:limit]

    return {
        "window_days": days,
        "window_start": start_time,
        "window_end": end_time,
        "processed_events": processed_events,
        "top_documents": top_documents,
    }


def build_user_interest_leaderboard(*, days=DEFAULT_SUMMARY_DAYS, limit=20, per_user_top_limit=3):
    days = _coerce_int(days, default=DEFAULT_SUMMARY_DAYS, min_value=1, max_value=MAX_SUMMARY_DAYS)
    limit = _coerce_int(limit, default=20, min_value=1, max_value=MAX_LIMIT)
    per_user_top_limit = _coerce_int(per_user_top_limit, default=3, min_value=1, max_value=20)

    end_time = timezone.now()
    start_time = end_time - timedelta(days=days)
    user_ids = (
        AnalyticsEvent.objects.filter(user__isnull=False, event_time__gte=start_time, event_time__lte=end_time)
        .values_list("user_id", flat=True)
        .distinct()
    )
    users = User.objects.filter(id__in=user_ids, is_active=True).order_by("name", "email")

    rows = []
    for user in users.iterator(chunk_size=200):
        summary = _build_logged_in_interest_summary(user=user, days=days, limit=per_user_top_limit)
        rows.append(
            {
                "user": summary["user"],
                "overall_interest_score": summary["overall_interest_score"],
                "processed_events": summary["processed_events"],
                "overall_event_counts": summary["overall_event_counts"],
                "unscored_event_counts": summary["unscored_event_counts"],
                "top_products": summary["top_products"][:per_user_top_limit],
                "top_power_sources": summary["top_power_sources"][:per_user_top_limit],
                "top_industries": summary["top_industries"][:per_user_top_limit],
            }
        )

    rows.sort(key=lambda item: (-item["overall_interest_score"], -item["processed_events"], item["user"]["id"]))
    return {
        "window_days": days,
        "window_start": start_time,
        "window_end": end_time,
        "users": rows[:limit],
        "weights": USER_INTEREST_WEIGHTS,
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
    user_agent = _safe_str(request.META.get("HTTP_USER_AGENT", ""), MAX_USER_AGENT_LENGTH)
    device_type = _detect_device_type(user_agent)

    to_create = []
    errors = []

    for index, item in enumerate(events):
        if not isinstance(item, dict):
            errors.append({"index": index, "detail": "Each event must be an object."})
            continue

        event_name = item.get("event_name")
        event_time = _coerce_event_time(item.get("event_time"))
        session_id = _safe_str(item.get("session_id"), 128)
        anon_id = _safe_str(item.get("anon_id"), 128)
        page_path = _safe_str(item.get("page_path"), MAX_PAGE_PATH_LENGTH)
        page_title = _safe_str(item.get("page_title"), MAX_PAGE_TITLE_LENGTH)
        referrer = _safe_str(item.get("referrer"), MAX_REFERRER_LENGTH)
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
                session_id=session_id,
                anon_id=anon_id,
                user=request_user,
                page_path=page_path,
                page_title=page_title,
                referrer=referrer,
                properties=properties,
                user_agent=user_agent,
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
def my_interest_summary(request):
    user = _get_session_user(request)
    if not user:
        return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

    summary = build_user_interest_summary(
        user=user,
        days=request.query_params.get("days"),
        limit=request.query_params.get("limit"),
    )
    return Response(summary, status=status.HTTP_200_OK)


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def anonymous_popularity_summary(request):
    summary = build_anonymous_popularity_summary(
        days=request.query_params.get("days"),
        limit=request.query_params.get("limit"),
    )
    return Response(summary, status=status.HTTP_200_OK)
