from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Product


def _build_file_url(request, file_field):
    if not file_field:
        return ""
    return request.build_absolute_uri(file_field.url)


@api_view(["GET"])
def get_products(request):
    products_qs = Product.objects.filter(is_visible=True).select_related("category").order_by("id")
    data = [
        {
            "id": item.id,
            "category_id": item.category_id,
            "category_name": item.category.name,
            "name": item.name,
            "slug": item.slug,
            "short_description": item.short_description,
            "image_url": _build_file_url(request, item.image),
            "is_visible": item.is_visible,
            "features": item.features,
            "operating_conditions": item.operating_conditions,
            "output_torque": item.output_torque,
            "temperature_range": item.temperature_range,
            "max_allowable_operating_pressure": item.max_allowable_operating_pressure,
            "mounting_certifications": item.mounting_certifications,
            "options": item.options,
            "applications": item.applications,
            "control_options": item.control_options,
            "power_source": item.power_source,
            "enclosure_ratings": item.enclosure_ratings,
            "supply_media": item.supply_media,
            "testing_standards": item.testing_standards,
            "valve_compatibility": item.valve_compatibility,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
        }
        for item in products_qs
    ]
    return Response({"count": len(data), "results": data})
