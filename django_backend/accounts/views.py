import ipaddress
import os
import random
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import EmailOTP, User


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


def _get_session_user(request):
    user_id = request.session.get("account_user_id")
    if not user_id:
        return None
    return User.objects.filter(id=user_id, is_active=True).first()


def _get_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


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


def _derive_location_from_ip(ip_value, request_headers):
    if not ip_value:
        return {"nation": None, "state": None, "source": "unavailable"}

    try:
        ip_obj = ipaddress.ip_address(ip_value)
    except ValueError:
        return {"nation": None, "state": None, "source": "invalid_ip"}

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


def _generate_otp():
    return f"{random.randint(0, 999999):06d}"


def _otp_expiry_minutes():
    return int(getattr(settings, "EMAIL_OTP_EXPIRY_MINUTES", 10))


def _find_active_otp(email, purpose):
    return (
        EmailOTP.objects.filter(
            email=email,
            purpose=purpose,
            is_used=False,
            expires_at__gte=timezone.now(),
        )
        .order_by("-created_at")
        .first()
    )


def _consume_otp(email, purpose, otp):
    otp_record = _find_active_otp(email=email, purpose=purpose)
    if not otp_record:
        return None, "OTP_NOT_FOUND"

    otp_record.attempts += 1
    if otp_record.attempts > 5:
        otp_record.is_used = True
        otp_record.save(update_fields=["attempts", "is_used"])
        return None, "OTP_EXHAUSTED"

    if otp_record.is_expired():
        otp_record.is_used = True
        otp_record.save(update_fields=["attempts", "is_used"])
        return None, "OTP_EXPIRED"

    if not otp_record.verify_otp(otp):
        otp_record.save(update_fields=["attempts"])
        return None, "OTP_INVALID"

    otp_record.is_used = True
    otp_record.save(update_fields=["attempts", "is_used"])
    return otp_record, None


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def send_otp(request):
    email = str(request.data.get("email", "")).strip().lower()
    purpose = str(request.data.get("purpose", "")).strip().upper()

    if purpose not in [EmailOTP.PURPOSE_SIGNUP, EmailOTP.PURPOSE_LOGIN]:
        return _error_response(
            code="VALIDATION_ERROR",
            message="Purpose must be SIGNUP or LOGIN.",
            errors={"purpose": ["Invalid purpose."]},
            http_status=status.HTTP_400_BAD_REQUEST,
        )

    if not email:
        return _error_response(
            code="VALIDATION_ERROR",
            message="Email is required.",
            errors={"email": ["Email is required."]},
            http_status=status.HTTP_400_BAD_REQUEST,
        )

    user_exists = User.objects.filter(email=email).exists()
    if purpose == EmailOTP.PURPOSE_SIGNUP and user_exists:
        return _error_response(
            code="EMAIL_ALREADY_EXISTS",
            message="A user with this email already exists.",
            errors={"email": ["Email is already registered."]},
            http_status=status.HTTP_409_CONFLICT,
        )
    if purpose == EmailOTP.PURPOSE_LOGIN and not user_exists:
        return _error_response(
            code="USER_NOT_FOUND",
            message="No active account found for this email.",
            errors={"email": ["Account does not exist."]},
            http_status=status.HTTP_404_NOT_FOUND,
        )

    EmailOTP.objects.filter(email=email, purpose=purpose, is_used=False).update(is_used=True)

    otp = _generate_otp()
    expires_at = timezone.now() + timedelta(minutes=_otp_expiry_minutes())
    otp_record = EmailOTP(email=email, purpose=purpose, expires_at=expires_at)
    otp_record.set_otp(otp)
    otp_record.save()

    subject = f"Your Credence {purpose.title()} OTP"
    message = f"Your OTP is {otp}. It expires in {_otp_expiry_minutes()} minutes."
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )

    data = {
        "email": email,
        "purpose": purpose,
        "expires_in_minutes": _otp_expiry_minutes(),
    }
    if settings.DEBUG:
        data["otp_debug"] = otp

    return _success_response(data=data)


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def me(request):
    user = _get_session_user(request)
    if not user:
        return _success_response(data={"authenticated": False, "user": None})

    return _success_response(
        data={
            "authenticated": True,
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
def signup(request):
    name = str(request.data.get("name", "")).strip()
    email = str(request.data.get("email", "")).strip().lower()
    company_name = str(request.data.get("company_name", "")).strip()
    password = str(request.data.get("password", ""))
    otp = str(request.data.get("otp", "")).strip()

    field_errors = {}
    if not name:
        field_errors["name"] = ["Name is required."]
    if not email:
        field_errors["email"] = ["Email is required."]
    if not company_name:
        field_errors["company_name"] = ["Company name is required."]

    if not password and not otp:
        field_errors["auth"] = ["Provide either password or otp for signup."]
    if password and len(password) < 8:
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

    if otp and not password:
        _, otp_error = _consume_otp(email=email, purpose=EmailOTP.PURPOSE_SIGNUP, otp=otp)
        if otp_error:
            return _error_response(
                code=otp_error,
                message="Invalid or expired OTP.",
                errors={"otp": ["Please request a new OTP and try again."]},
                http_status=status.HTTP_400_BAD_REQUEST,
            )

    with transaction.atomic():
        user = User(
            name=name,
            email=email,
            company_name=company_name,
            is_active=True,
        )
        if password:
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
    otp = str(request.data.get("otp", "")).strip()

    if not email:
        return _error_response(
            code="VALIDATION_ERROR",
            message="Email is required.",
            errors={"email": ["Email is required."]},
            http_status=status.HTTP_400_BAD_REQUEST,
        )
    if not password and not otp:
        return _error_response(
            code="VALIDATION_ERROR",
            message="Provide either password or otp for login.",
            errors={"auth": ["Password or OTP is required."]},
            http_status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.filter(email=email, is_active=True).first()
    if not user:
        return _error_response(
            code="USER_NOT_FOUND",
            message="No active account found for this email.",
            errors={"email": ["Account does not exist."]},
            http_status=status.HTTP_404_NOT_FOUND,
        )

    if password:
        if not user.password_hash:
            return _error_response(
                code="PASSWORD_NOT_SET",
                message="Password is not set for this account. Use OTP login.",
                http_status=status.HTTP_400_BAD_REQUEST,
            )
        if not user.check_password(password):
            return _error_response(
                code="INVALID_CREDENTIALS",
                message="Invalid email or password.",
                http_status=status.HTTP_401_UNAUTHORIZED,
            )
    else:
        _, otp_error = _consume_otp(email=email, purpose=EmailOTP.PURPOSE_LOGIN, otp=otp)
        if otp_error:
            return _error_response(
                code=otp_error,
                message="Invalid or expired OTP.",
                errors={"otp": ["Please request a new OTP and try again."]},
                http_status=status.HTTP_400_BAD_REQUEST,
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
