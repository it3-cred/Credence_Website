from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from products.models import ProductCatalogue
from .models import CatalogueEmailRequest


def _get_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


@api_view(["POST"])
def create_catalogue_email_request(request):
    catalogue_id = request.data.get("catalogue_id")
    email = (request.data.get("email") or "").strip()
    company_name = (request.data.get("company_name") or "").strip()

    if not catalogue_id:
        return Response({"detail": "catalogue_id is required."}, status=status.HTTP_400_BAD_REQUEST)
    if not email:
        return Response({"detail": "email is required."}, status=status.HTTP_400_BAD_REQUEST)

    catalogue = get_object_or_404(ProductCatalogue.objects.filter(is_visible=True), id=catalogue_id)
    if catalogue.access_type != ProductCatalogue.ACCESS_EMAIL_VALIDATED:
        return Response(
            {"detail": "This document does not require email validation."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    lead_request = CatalogueEmailRequest.objects.create(
        catalogue=catalogue,
        email=email,
        company_name=company_name,
        request_ip=_get_client_ip(request),
        status=CatalogueEmailRequest.STATUS_PENDING,
    )

    return Response(
        {
            "id": lead_request.id,
            "catalogue_id": lead_request.catalogue_id,
            "email": lead_request.email,
            "company_name": lead_request.company_name,
            "status": lead_request.status,
            "created_at": lead_request.created_at,
            "message": "Request submitted. Document email dispatch will be processed later.",
        },
        status=status.HTTP_201_CREATED,
    )
