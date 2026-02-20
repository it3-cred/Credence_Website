from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_email as django_validate_email
from django.shortcuts import get_object_or_404
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


def _validate_email_address(raw_email):
    normalized = str(raw_email or "").strip().lower()
    if not normalized:
        return None, "email is required."

    try:
        django_validate_email(normalized)
    except ValidationError:
        return None, "Enter a valid email address."

    try:
        from email_validator import EmailNotValidError, validate_email as lib_validate_email
    except Exception:
        return normalized, None

    try:
        result = lib_validate_email(
            normalized,
            check_deliverability=bool(getattr(settings, "EMAIL_VALIDATION_CHECK_DELIVERABILITY", True)),
        )
    except EmailNotValidError as exc:
        return None, str(exc)

    return result.normalized, None


@api_view(["POST"])
def create_catalogue_email_request(request):
    catalogue_id = request.data.get("catalogue_id")
    email, email_error = _validate_email_address(request.data.get("email"))
    company_name = (request.data.get("company_name") or "").strip()

    if not catalogue_id:
        return Response({"detail": "catalogue_id is required."}, status=status.HTTP_400_BAD_REQUEST)
    if email_error:
        return Response({"detail": email_error}, status=status.HTTP_400_BAD_REQUEST)

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


def _to_bool(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


@api_view(["POST"])
def create_inquiry_request(request):
    email, email_error = _validate_email_address(request.data.get("email"))
    payload = {
        "email": email or "",
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

    if email_error:
        return Response({"detail": email_error}, status=status.HTTP_400_BAD_REQUEST)
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
