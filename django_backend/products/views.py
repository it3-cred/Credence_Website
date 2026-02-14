from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import PowerSource, Product


def _build_file_url(request, file_field):
    if not file_field:
        return ""
    return request.build_absolute_uri(file_field.url)


@api_view(["GET"])
def get_products(request):
    products_qs = Product.objects.filter(is_visible=True).select_related("category", "power_source").prefetch_related("industries").order_by("id")
    data = [
        {
            "id": item.id,
            "category_id": item.category_id,
            "category_name": item.category.name if item.category else None,
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
            "image_url": _build_file_url(request, item.image),
            "is_visible": item.is_visible,
            "output_torque_min": item.output_torque_min,
            "output_torque_max": item.output_torque_max,
            "thrust_min": item.thrust_min,
            "thrust_max": item.thrust_max,
            "spring_return_torque": item.spring_return_torque,
            "double_acting_torque": item.double_acting_torque,
            "operating_pressure_max": item.operating_pressure_max,
            "temperature_standard_min": item.temperature_standard_min,
            "temperature_standard_max": item.temperature_standard_max,
            "temperature_high_max": item.temperature_high_max,
            "temperature_low_min": item.temperature_low_min,
            "product_type": item.product_type,
            "actuation_type": item.actuation_type,
            "control_type": item.control_type,
            "mounting_standard": item.mounting_standard,
            "accessories_mounting": item.accessories_mounting,
            "certifications": item.certifications,
            "enclosure_rating": item.enclosure_rating,
            "testing_standard": item.testing_standard,
            "features": item.features,
            "applications": item.applications,
            "valve_compatibility": item.valve_compatibility,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
        }
        for item in products_qs
    ]
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
