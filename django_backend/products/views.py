from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q
from decimal import Decimal, InvalidOperation
from django.shortcuts import get_object_or_404

from .models import Industry, PowerSource, Product, ProductCatalogue


def _build_file_url(request, file_field):
    if not file_field:
        return ""
    return request.build_absolute_uri(file_field.url)


def _normalize_specification_items(specification_value):
    items = []

    if isinstance(specification_value, dict):
        for key, value in specification_value.items():
            key_text = str(key).strip()
            if not key_text:
                continue
            items.append({"key": key_text, "value": value})
        return items

    if not isinstance(specification_value, list):
        return items

    for entry in specification_value:
        if isinstance(entry, dict):
            if "key" in entry and "value" in entry:
                key_text = str(entry.get("key", "")).strip()
                if key_text:
                    items.append({"key": key_text, "value": entry.get("value")})
                continue

            for key, value in entry.items():
                key_text = str(key).strip()
                if not key_text:
                    continue
                items.append({"key": key_text, "value": value})
            continue

        if isinstance(entry, (list, tuple)) and len(entry) >= 2:
            key_text = str(entry[0]).strip()
            if key_text:
                items.append({"key": key_text, "value": entry[1]})

    return items


@api_view(["GET"])
def get_products(request):
    power_source_slug = request.GET.get("power_source", "").strip()
    industry_slugs = [slug.strip() for slug in request.GET.get("industries", "").split(",") if slug.strip()]
    torque_min_raw = request.GET.get("torque_min", "").strip()
    torque_max_raw = request.GET.get("torque_max", "").strip()
    thrust_min_raw = request.GET.get("thrust_min", "").strip()
    thrust_max_raw = request.GET.get("thrust_max", "").strip()

    torque_min = None
    torque_max = None
    thrust_min = None
    thrust_max = None
    try:
        if torque_min_raw:
            torque_min = Decimal(torque_min_raw)
    except (InvalidOperation, ValueError):
        torque_min = None
    try:
        if torque_max_raw:
            torque_max = Decimal(torque_max_raw)
    except (InvalidOperation, ValueError):
        torque_max = None
    try:
        if thrust_min_raw:
            thrust_min = Decimal(thrust_min_raw)
    except (InvalidOperation, ValueError):
        thrust_min = None
    try:
        if thrust_max_raw:
            thrust_max = Decimal(thrust_max_raw)
    except (InvalidOperation, ValueError):
        thrust_max = None

    if torque_min is not None and torque_max is not None and torque_min > torque_max:
        torque_min, torque_max = torque_max, torque_min
    if thrust_min is not None and thrust_max is not None and thrust_min > thrust_max:
        thrust_min, thrust_max = thrust_max, thrust_min

    products_qs = (
        Product.objects.filter(is_visible=True)
        .select_related("power_source")
        .prefetch_related("industries", "images")
        .order_by("id")
    )

    if power_source_slug:
        products_qs = products_qs.filter(power_source__slug=power_source_slug)

    if industry_slugs:
        products_qs = products_qs.filter(industries__slug__in=industry_slugs)

    torque_q = Q()
    thrust_q = Q()
    has_torque_filter = torque_min is not None or torque_max is not None
    has_thrust_filter = thrust_min is not None or thrust_max is not None

    if torque_min is not None and torque_max is not None:
        torque_q = (
            Q(torque_min_nm__isnull=False)
            & Q(torque_max_nm__isnull=False)
            & Q(torque_min_nm__lte=torque_min)
            & Q(torque_max_nm__gte=torque_max)
        )
    elif torque_min is not None:
        torque_q = (
            Q(torque_min_nm__isnull=False)
            & Q(torque_max_nm__isnull=False)
            & Q(torque_min_nm__lte=torque_min)
            & Q(torque_max_nm__gte=torque_min)
        )
    elif torque_max is not None:
        torque_q = (
            Q(torque_min_nm__isnull=False)
            & Q(torque_max_nm__isnull=False)
            & Q(torque_min_nm__lte=torque_max)
            & Q(torque_max_nm__gte=torque_max)
        )

    if thrust_min is not None and thrust_max is not None:
        thrust_q = (
            Q(thrust_min_n__isnull=False)
            & Q(thrust_max_n__isnull=False)
            & Q(thrust_min_n__lte=thrust_min)
            & Q(thrust_max_n__gte=thrust_max)
        )
    elif thrust_min is not None:
        thrust_q = (
            Q(thrust_min_n__isnull=False)
            & Q(thrust_max_n__isnull=False)
            & Q(thrust_min_n__lte=thrust_min)
            & Q(thrust_max_n__gte=thrust_min)
        )
    elif thrust_max is not None:
        thrust_q = (
            Q(thrust_min_n__isnull=False)
            & Q(thrust_max_n__isnull=False)
            & Q(thrust_min_n__lte=thrust_max)
            & Q(thrust_max_n__gte=thrust_max)
        )

    if has_torque_filter and has_thrust_filter:
        products_qs = products_qs.filter(torque_q | thrust_q)
    elif has_torque_filter:
        products_qs = products_qs.filter(torque_q)
    elif has_thrust_filter:
        products_qs = products_qs.filter(thrust_q)

    products_qs = products_qs.distinct()
    data = []
    for item in products_qs:
        image_urls = [_build_file_url(request, image.image) for image in item.images.all() if image.image]
        data.append(
            {
                "id": item.id,
                "power_source": {
                    "id": item.power_source_id,
                    "name": item.power_source.name,
                    "slug": item.power_source.slug,
                },
                "industries": [{"id": ind.id, "name": ind.name, "slug": ind.slug} for ind in item.industries.all()],
                "name": item.name,
                "slug": item.slug,
                "short_summary": item.short_summary,
                "description": item.description,
                "image_url": image_urls[0] if image_urls else "",
                "image_urls": image_urls,
                "is_visible": item.is_visible,
                "torque_min_nm": item.torque_min_nm,
                "torque_max_nm": item.torque_max_nm,
                "thrust_min_n": item.thrust_min_n,
                "thrust_max_n": item.thrust_max_n,
                "specification": item.specification,
                "specification_items": _normalize_specification_items(item.specification),
                "features": item.features,
                "created_at": item.created_at,
                "updated_at": item.updated_at,
            }
        )
    return Response({"count": len(data), "results": data})


@api_view(["GET"])
def get_power_sources(request):
    power_sources_qs = PowerSource.objects.filter(is_visible=True).order_by("sort_order", "name")
    data = [
        {
            "id": item.id,
            "name": item.name,
            "slug": item.slug,
            "summary": item.short_description,
            "image_url": _build_file_url(request, item.image_url),
            "sort_order": item.sort_order,
            "is_visible": item.is_visible,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
        }
        for item in power_sources_qs
    ]
    return Response({"count": len(data), "results": data})


@api_view(["GET"])
def get_industries(request):
    industries_qs = Industry.objects.filter(is_visible=True).order_by("sort_order", "name")
    data = [
        {
            "id": item.id,
            "name": item.name,
            "slug": item.slug,
            "image_url": _build_file_url(request, item.image_url),
            "accent_color": item.accent_color,
            "sort_order": item.sort_order,
            "is_visible": item.is_visible,
        }
        for item in industries_qs
    ]
    return Response({"count": len(data), "results": data})


@api_view(["GET"])
def get_product_detail(request, slug, product_id):
    product = get_object_or_404(
        Product.objects.filter(is_visible=True).select_related("power_source").prefetch_related("industries", "images"),
        id=product_id,
        slug=slug,
    )

    image_urls = [_build_file_url(request, image.image) for image in product.images.all() if image.image]
    documents = ProductCatalogue.objects.filter(product_id=product.id, is_visible=True).order_by("sort_order", "title")
    documents_data = [
        {
            "id": document.id,
            "doc_type": document.doc_type,
            "title": document.title,
            "description": document.description,
            "access_type": document.access_type,
            "file_url": _build_file_url(request, document.file),
            "sort_order": document.sort_order,
            "created_at": document.created_at,
            "updated_at": document.updated_at,
        }
        for document in documents
    ]

    return Response(
        {
            "id": product.id,
            "power_source": {
                "id": product.power_source_id,
                "name": product.power_source.name if product.power_source else "",
                "slug": product.power_source.slug if product.power_source else "",
            },
            "industries": [{"id": ind.id, "name": ind.name, "slug": ind.slug} for ind in product.industries.all()],
            "name": product.name,
            "slug": product.slug,
            "short_summary": product.short_summary,
            "description": product.description,
            "image_url": image_urls[0] if image_urls else "",
            "image_urls": image_urls,
            "torque_min_nm": product.torque_min_nm,
            "torque_max_nm": product.torque_max_nm,
            "thrust_min_n": product.thrust_min_n,
            "thrust_max_n": product.thrust_max_n,
            "specification": product.specification,
            "specification_items": _normalize_specification_items(product.specification),
            "features": product.features,
            "documents": documents_data,
            "created_at": product.created_at,
            "updated_at": product.updated_at,
        }
    )
