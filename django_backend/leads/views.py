from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from products.models import ProductCatalogue
from .models import CatalogueEmailRequest, InquiryRequest


def _get_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _enqueue_catalogue_email_dispatch(email_request_id):
    try:
        from .tasks import send_catalogue_email_request

        send_catalogue_email_request.delay(email_request_id)
        return None
    except Exception as exc:
        CatalogueEmailRequest.objects.filter(id=email_request_id).update(
            status=CatalogueEmailRequest.STATUS_FAILED,
            failure_reason=f"Queue dispatch failed: {str(exc)[:1800]}",
        )
        return str(exc)


@api_view(["POST"])
def create_catalogue_email_request(request):
    catalogue_id = request.data.get("catalogue_id")
    email = (request.data.get("email") or "").strip()
    company_name = (request.data.get("company_name") or "").strip()

    if not catalogue_id:
        return Response({"detail": "catalogue_id is required."}, status=status.HTTP_400_BAD_REQUEST)
    if not email:
        return Response({"detail": "email is required."}, status=status.HTTP_400_BAD_REQUEST)

    catalogue = get_object_or_404(
        ProductCatalogue.objects.filter(is_visible=True).select_related("product"),
        id=catalogue_id,
    )
    if catalogue.access_type != ProductCatalogue.ACCESS_EMAIL_VALIDATED:
        return Response(
            {"detail": "This document does not require email validation."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    lead_request = CatalogueEmailRequest.objects.create(
        catalogue=catalogue,
        email=email,
        product_name=(catalogue.product.name if getattr(catalogue, "product", None) else ""),
        company_name=company_name,
        request_ip=_get_client_ip(request),
        status=CatalogueEmailRequest.STATUS_PENDING,
    )

    transaction.on_commit(lambda: _enqueue_catalogue_email_dispatch(lead_request.id))

    return Response(
        {
            "id": lead_request.id,
            "catalogue_id": lead_request.catalogue_id,
            "product_name": lead_request.product_name,
            "email": lead_request.email,
            "company_name": lead_request.company_name,
            "status": lead_request.status,
            "created_at": lead_request.created_at,
            "message": "Request submitted. Document email dispatch is queued.",
        },
        status=status.HTTP_201_CREATED,
    )


def _to_bool(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


@api_view(["POST"])
def create_inquiry_request(request):
    payload = {
        "email": (request.data.get("email") or "").strip(),
        "first_name": (request.data.get("first_name") or "").strip(),
        "last_name": (request.data.get("last_name") or "").strip(),
        "inquiry_reason": (request.data.get("inquiry_reason") or "").strip(),
        "preferred_language": (request.data.get("preferred_language") or "").strip(),
        "company_name": (request.data.get("company_name") or "").strip(),
        "request_details": (request.data.get("request_details") or "").strip(),
        "country": (request.data.get("country") or "").strip(),
        "business_address": (request.data.get("business_address") or "").strip(),
        "phone_number": (request.data.get("phone_number") or "").strip(),
        "state": (request.data.get("state") or "").strip(),
        "city": (request.data.get("city") or "").strip(),
        "postal_code": (request.data.get("postal_code") or "").strip(),
        "subscribe_updates": _to_bool(request.data.get("subscribe_updates")),
    }

    missing_fields = [key for key in ("email", "first_name", "last_name", "inquiry_reason") if not payload[key]]
    if missing_fields:
        return Response(
            {"detail": f"Missing required fields: {', '.join(missing_fields)}."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    inquiry = InquiryRequest.objects.create(
        **payload,
        request_ip=_get_client_ip(request),
    )

    return Response(
        {
            "id": inquiry.id,
            "message": "Inquiry submitted successfully.",
            "created_at": inquiry.created_at,
        },
        status=status.HTTP_201_CREATED,
    )
