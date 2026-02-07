import ipaddress
import os

from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import User


def _error_response(code, message, errors=None, http_status=status.HTTP_400_BAD_REQUEST):
    payload = {
        "ok": False,
        "error": {
            "code": code,
            "message": message,
            "errors": errors or {},
        },
    }
    return Response(payload, status=http_status)


def _success_response(data=None, http_status=status.HTTP_200_OK):
    return Response({"ok": True, "data": data or {}}, status=http_status)


def _get_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _derive_location_from_ip(ip_value, request_headers):
    if not ip_value:
        return {"nation": None, "state": None, "source": "unavailable"}

    try:
        ip_obj = ipaddress.ip_address(ip_value)
    except ValueError:
        return {"nation": None, "state": None, "source": "invalid_ip"}

    # Prefer proxy/CDN headers when available (e.g., Cloudflare).
    # Only location is stored, never the raw IP.
    # Header values are optional and may be absent in local/dev environments.
    country_code = None
    state_name = None

    if ip_obj.is_loopback:
        return {"nation": "LOCAL", "state": "LOCAL", "source": "loopback"}
    if ip_obj.is_private:
        return {"nation": "PRIVATE_NETWORK", "state": "PRIVATE_NETWORK", "source": "private"}

    ipinfo_location = _resolve_location_with_ipinfo(ip_value)
    if ipinfo_location:
        return ipinfo_location

    country_code = (
        request_headers.get("HTTP_CF_IPCOUNTRY")
        or request_headers.get("HTTP_X_COUNTRY_CODE")
        or request_headers.get("HTTP_X_APPENGINE_COUNTRY")
    )
    state_name = request_headers.get("HTTP_CF_REGION") or request_headers.get("HTTP_X_APPENGINE_REGION")

    return {
        "nation": country_code if country_code else None,
        "state": state_name if state_name else None,
        "source": "headers" if (country_code or state_name) else "public_ip_unresolved",
    }


def _resolve_location_with_ipinfo(ip_value):
    token = os.getenv("IPINFO_TOKEN")
    if not token:
        return None

    try:
        import ipinfo
    except Exception:
        return None

    try:
        handler = ipinfo.getHandler(token)
        details = handler.getDetails(ip_value)
    except Exception:
        return None

    nation = getattr(details, "country", None)
    state = getattr(details, "region", None)
    if not nation and not state:
        return None

    return {
        "nation": nation,
        "state": state,
        "source": "ipinfo",
    }


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def signup(request):
    name = str(request.data.get("name", "")).strip()
    email = str(request.data.get("email", "")).strip().lower()
    password = str(request.data.get("password", ""))
    company_name = str(request.data.get("company_name", "")).strip()

    field_errors = {}
    if not name:
        field_errors["name"] = ["Name is required."]
    if not email:
        field_errors["email"] = ["Email is required."]
    if not password:
        field_errors["password"] = ["Password is required."]
    elif len(password) < 8:
        field_errors["password"] = ["Password must be at least 8 characters."]

    if field_errors:
        return _error_response(
            code="VALIDATION_ERROR",
            message="Invalid signup payload.",
            errors=field_errors,
            http_status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(email=email).exists():
        return _error_response(
            code="EMAIL_ALREADY_EXISTS",
            message="A user with this email already exists.",
            errors={"email": ["Email is already registered."]},
            http_status=status.HTTP_409_CONFLICT,
        )

    user = User(
        name=name,
        email=email,
        company_name=company_name,
        is_active=True,
    )
    user.set_password(password)
    user.save()

    request.session["account_user_id"] = user.id

    return _success_response(
        data={
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "company_name": user.company_name,
            }
        },
        http_status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def login(request):
    email = str(request.data.get("email", "")).strip().lower()
    password = str(request.data.get("password", ""))

    if not email or not password:
        return _error_response(
            code="VALIDATION_ERROR",
            message="Email and password are required.",
            errors={
                "email": ["Email is required."] if not email else [],
                "password": ["Password is required."] if not password else [],
            },
            http_status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.filter(email=email, is_active=True).first()
    if not user or not user.check_password(password):
        return _error_response(
            code="INVALID_CREDENTIALS",
            message="Invalid email or password.",
            http_status=status.HTTP_401_UNAUTHORIZED,
        )

    ip_value = _get_client_ip(request)
    user.record_login(_derive_location_from_ip(ip_value, request.META))

    request.session["account_user_id"] = user.id

    return _success_response(
        data={
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "company_name": user.company_name,
                "last_login_at": user.last_login_at,
                "last_login_location": user.last_login_location,
            }
        }
    )


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def logout(request):
    request.session.pop("account_user_id", None)
    request.session.flush()
    return _success_response(data={"message": "Logged out successfully."})
