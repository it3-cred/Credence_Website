from django.db import connection
from django.db.models import Q
from django.http import JsonResponse
from django.utils.text import slugify
from rest_framework.decorators import api_view
from rest_framework.response import Response

from content.models import Achievement, News
from products.models import Product, ProductCatalogue

# Create your views here.
def healthCheck(request):
    server_status = "ok"
    db_status = "ok"

    try:
        # Ensure the connection is usable; with CONN_HEALTH_CHECKS this avoids stale connections.
        connection.ensure_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception:
        db_status = "error"

    return JsonResponse(
        {
            "server_status": server_status,
            "db_status": db_status,
        },
        status=200 if db_status == "ok" else 503,
    )


def _coerce_limit(raw_value, default=6, max_limit=20):
    try:
        value = int(raw_value)
    except (TypeError, ValueError):
        return default
    return max(1, min(value, max_limit))


def _safe_slug(value, fallback):
    slug = slugify(value or "")
    return slug or fallback


@api_view(["GET"])
def global_search(request):
    query = (request.GET.get("q") or "").strip()
    limit = _coerce_limit(request.GET.get("limit"), default=6, max_limit=20)

    if len(query) < 2:
        return Response(
            {
                "query": query,
                "counts": {"products": 0, "news": 0, "achievements": 0, "documents": 0, "total": 0},
                "results": {"products": [], "news": [], "achievements": [], "documents": []},
            }
        )

    products_qs = (
        Product.objects.filter(is_visible=True)
        .select_related("power_source")
        .filter(
            Q(name__icontains=query)
            | Q(short_summary__icontains=query)
            | Q(description__icontains=query)
        )
        .order_by("name")[:limit]
    )

    news_qs = (
        News.objects.filter(is_visible=True)
        .filter(
            Q(title__icontains=query)
            | Q(summary__icontains=query)
            | Q(content__icontains=query)
        )
        .order_by("-created_at")[:limit]
    )

    achievements_qs = (
        Achievement.objects.filter(is_visible=True)
        .filter(
            Q(title__icontains=query)
            | Q(summary__icontains=query)
            | Q(content__icontains=query)
        )
        .order_by("-year", "-created_at")[:limit]
    )

    documents_qs = (
        ProductCatalogue.objects.filter(is_visible=True, product__is_visible=True)
        .select_related("product")
        .filter(
            Q(title__icontains=query)
            | Q(description__icontains=query)
            | Q(product__name__icontains=query)
        )
        .order_by("title")[:limit]
    )

    products = [
        {
            "id": item.id,
            "name": item.name,
            "slug": item.slug or _safe_slug(item.name, "product"),
            "summary": item.short_summary or "",
            "power_source_name": item.power_source.name if item.power_source else "",
            "power_source_slug": item.power_source.slug if item.power_source else "",
        }
        for item in products_qs
    ]

    news = [
        {
            "id": item.id,
            "title": item.title,
            "slug": item.slug or _safe_slug(item.title, "news"),
            "summary": item.summary or "",
            "created_at": item.created_at,
        }
        for item in news_qs
    ]

    achievements = [
        {
            "id": item.id,
            "title": item.title,
            "slug": item.slug or _safe_slug(item.title, "achievement"),
            "summary": item.summary or "",
            "year": item.year,
            "created_at": item.created_at,
        }
        for item in achievements_qs
    ]

    documents = [
        {
            "id": item.id,
            "title": item.title,
            "description": item.description or "",
            "doc_type": item.doc_type,
            "access_type": item.access_type,
            "product_id": item.product_id,
            "product_name": item.product.name if item.product else "",
            "product_slug": (item.product.slug if item.product else "") or _safe_slug(
                item.product.name if item.product else "",
                "product",
            ),
        }
        for item in documents_qs
    ]

    counts = {
        "products": len(products),
        "news": len(news),
        "achievements": len(achievements),
        "documents": len(documents),
    }
    counts["total"] = counts["products"] + counts["news"] + counts["documents"]

    return Response(
        {
            "query": query,
            "counts": counts,
            "results": {
                "products": products,
                "news": news,
                "achievements": achievements,
                "documents": documents,
            },
        }
    )
