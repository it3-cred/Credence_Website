import ipaddress
import os
import random
import re
from datetime import timedelta
from smtplib import SMTPAuthenticationError, SMTPException

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import EmailOTP, User


WEAK_PASSWORDS = {
    "password",
    "password123",
    "admin123",
    "qwerty123",
    "12345678",
    "123456789",
    "1234567890",
}


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


def _password_min_length():
    return int(getattr(settings, "AUTH_MIN_PASSWORD_LENGTH", 10))


def _validate_password_strength(password, *, name="", email=""):
    password_value = str(password or "")
    if len(password_value) < _password_min_length():
        return f"Password must be at least {_password_min_length()} characters."
    if re.search(r"\s", password_value):
        return "Password cannot contain spaces."
    if not re.search(r"[a-z]", password_value):
        return "Password must include at least one lowercase letter."
    if not re.search(r"[A-Z]", password_value):
        return "Password must include at least one uppercase letter."
    if not re.search(r"[0-9]", password_value):
        return "Password must include at least one number."
    if not re.search(r"[^A-Za-z0-9\s]", password_value):
        return "Password must include at least one special character."

    lowered_password = password_value.lower()
    if lowered_password in WEAK_PASSWORDS:
        return "This password is too common. Please choose a stronger password."

    email_local = str(email or "").split("@")[0].lower()
    if email_local and len(email_local) >= 3 and email_local in lowered_password:
        return "Password should not contain your email username."

    compact_name = str(name or "").lower().replace(" ", "")
    if compact_name and len(compact_name) >= 3 and compact_name in lowered_password:
        return "Password should not contain your name."

    return ""


def _is_password_auth_user(user):
    return user.auth_preference == User.AUTH_PASSWORD


def _is_otp_auth_user(user):
    return user.auth_preference == User.AUTH_OTP


def _build_otp_email_content(purpose, otp):
    expiry_minutes = _otp_expiry_minutes()
    purpose_context = {
        EmailOTP.PURPOSE_LOGIN: {
            "label": "login",
            "subject": "Your Credence Login OTP",
            "heading": "Login verification",
            "instruction": "Use the OTP below to complete your login.",
        },
        EmailOTP.PURPOSE_SIGNUP: {
            "label": "signup",
            "subject": "Your Credence Signup OTP",
            "heading": "Signup verification",
            "instruction": "Use the OTP below to complete your signup.",
        },
        EmailOTP.PURPOSE_PASSWORD_RESET: {
            "label": "password reset",
            "subject": "Your Credence Password Reset OTP",
            "heading": "Password reset verification",
            "instruction": "Use the OTP below to reset your password.",
        },
    }.get(
        purpose,
        {
            "label": "verification",
            "subject": "Your Credence Verification OTP",
            "heading": "Verification",
            "instruction": "Use the OTP below to continue.",
        },
    )

    purpose_label = purpose_context["label"]
    subject = purpose_context["subject"]
    text_message = (
        f"Your one-time password (OTP) for {purpose_label} is: {otp}\n"
        f"This OTP expires in {expiry_minutes} minutes.\n\n"
        "If you did not request this OTP, you can ignore this email."
    )
    html_message = f"""
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f6f7f9;padding:24px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;padding:16px;">
        <div style="padding:16px 20px;background:#111827;color:#ffffff;">
          <h2 style="margin:0;font-size:18px;font-weight:700;">Credence Automation</h2>
          <p style="margin:6px 0 0;font-size:12px;color:#d1d5db;">{purpose_context["heading"]}</p>
        </div>
        <div style="padding:20px;">
          <p style="margin:0 0 12px;font-size:14px;color:#111827;">
            {purpose_context["instruction"]}
          </p>
          <div style="margin:14px 0;padding:14px;border:1px dashed #d1d5db;border-radius:10px;background:#f9fafb;text-align:center;">
            <span style="font-size:30px;letter-spacing:8px;font-weight:700;color:#111827;">{otp}</span>
          </div>
          <p style="margin:0 0 8px;font-size:13px;color:#374151;">
            This OTP expires in <strong>{expiry_minutes} minutes</strong>.
          </p>
          <p style="margin:0;font-size:12px;color:#6b7280;">
            If you did not request this OTP, you can safely ignore this email.
          </p>
        </div>
      </div>
    </div>
    """
    return subject, text_message, html_message


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

    user = User.objects.filter(email=email).first()
    if purpose == EmailOTP.PURPOSE_SIGNUP and user:
        return _error_response(
            code="EMAIL_ALREADY_EXISTS",
            message="A user with this email already exists.",
            errors={"email": ["Email is already registered."]},
            http_status=status.HTTP_409_CONFLICT,
        )
    if purpose == EmailOTP.PURPOSE_LOGIN and (not user or not user.is_active):
        return _error_response(
            code="USER_NOT_FOUND",
            message="No active account found for this email.",
            errors={"email": ["Account does not exist."]},
            http_status=status.HTTP_404_NOT_FOUND,
        )
    if purpose == EmailOTP.PURPOSE_LOGIN and _is_password_auth_user(user):
        return _error_response(
            code="AUTH_METHOD_NOT_ALLOWED",
            message="You have opted for password-based login. OTP login is not enabled for this account.",
            errors={"auth": ["Use password login for this account."]},
            http_status=status.HTTP_400_BAD_REQUEST,
        )

    EmailOTP.objects.filter(email=email, purpose=purpose, is_used=False).update(is_used=True)

    otp = _generate_otp()
    expires_at = timezone.now() + timedelta(minutes=_otp_expiry_minutes())
    otp_record = EmailOTP(email=email, purpose=purpose, expires_at=expires_at)
    otp_record.set_otp(otp)
    otp_record.save()

    subject, message, html_message = _build_otp_email_content(purpose=purpose, otp=otp)
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
    except SMTPAuthenticationError:
        EmailOTP.objects.filter(id=otp_record.id).update(is_used=True)
        return _error_response(
            code="EMAIL_AUTH_FAILED",
            message="Unable to send OTP email right now. Mail server authentication failed.",
            http_status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except (SMTPException, OSError, TimeoutError):
        EmailOTP.objects.filter(id=otp_record.id).update(is_used=True)
        return _error_response(
            code="EMAIL_SEND_FAILED",
            message="Unable to send OTP email right now. Please try again in a moment.",
            http_status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    data = {
        "email": email,
        "purpose": purpose,
        "expires_in_minutes": _otp_expiry_minutes(),
    }
    if settings.DEBUG:
        data["otp_debug"] = otp

    return _success_response(data=data)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def forgot_password(request):
    email = str(request.data.get("email", "")).strip().lower()

    if not email:
        return _error_response(
            code="VALIDATION_ERROR",
            message="Email is required.",
            errors={"email": ["Email is required."]},
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
    if _is_otp_auth_user(user):
        return _error_response(
            code="AUTH_METHOD_NOT_ALLOWED",
            message="Password reset is not required for OTP-based accounts.",
            errors={"auth": ["You have opted for OTP login. Use OTP to sign in."]},
            http_status=status.HTTP_400_BAD_REQUEST,
        )

    purpose = EmailOTP.PURPOSE_PASSWORD_RESET
    EmailOTP.objects.filter(email=email, purpose=purpose, is_used=False).update(is_used=True)

    otp = _generate_otp()
    expires_at = timezone.now() + timedelta(minutes=_otp_expiry_minutes())
    otp_record = EmailOTP(email=email, purpose=purpose, expires_at=expires_at)
    otp_record.set_otp(otp)
    otp_record.save()

    subject, message, html_message = _build_otp_email_content(purpose=purpose, otp=otp)
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
    except SMTPAuthenticationError:
        EmailOTP.objects.filter(id=otp_record.id).update(is_used=True)
        return _error_response(
            code="EMAIL_AUTH_FAILED",
            message="Unable to send OTP email right now. Mail server authentication failed.",
            http_status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except (SMTPException, OSError, TimeoutError):
        EmailOTP.objects.filter(id=otp_record.id).update(is_used=True)
        return _error_response(
            code="EMAIL_SEND_FAILED",
            message="Unable to send OTP email right now. Please try again in a moment.",
            http_status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    data = {
        "email": email,
        "purpose": purpose,
        "expires_in_minutes": _otp_expiry_minutes(),
    }
    if settings.DEBUG:
        data["otp_debug"] = otp

    return _success_response(data=data)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def reset_password(request):
    email = str(request.data.get("email", "")).strip().lower()
    otp = str(request.data.get("otp", "")).strip()
    new_password = str(request.data.get("new_password", ""))

    field_errors = {}
    if not email:
        field_errors["email"] = ["Email is required."]
    if not otp:
        field_errors["otp"] = ["OTP is required."]
    if not new_password:
        field_errors["new_password"] = ["New password is required."]

    if field_errors:
        return _error_response(
            code="VALIDATION_ERROR",
            message="Invalid password reset payload.",
            errors=field_errors,
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
    if _is_otp_auth_user(user):
        return _error_response(
            code="AUTH_METHOD_NOT_ALLOWED",
            message="Password reset is not required for OTP-based accounts.",
            errors={"auth": ["You have opted for OTP login. Use OTP to sign in."]},
            http_status=status.HTTP_400_BAD_REQUEST,
        )

    password_error = _validate_password_strength(new_password, name=user.name, email=user.email)
    if password_error:
        return _error_response(
            code="VALIDATION_ERROR",
            message="Password does not meet policy requirements.",
            errors={"new_password": [password_error]},
            http_status=status.HTTP_400_BAD_REQUEST,
        )

    _, otp_error = _consume_otp(email=email, purpose=EmailOTP.PURPOSE_PASSWORD_RESET, otp=otp)
    if otp_error:
        return _error_response(
            code=otp_error,
            message="Invalid or expired OTP.",
            errors={"otp": ["Please request a new OTP and try again."]},
            http_status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(new_password)
    user.save(update_fields=["password_hash", "updated_at"])

    return _success_response(data={"message": "Password updated successfully."})


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
                "auth_preference": user.auth_preference,
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
    if password and otp:
        field_errors["auth"] = ["Choose one signup method: password or otp."]
    if password:
        password_error = _validate_password_strength(password, name=name, email=email)
        if password_error:
            field_errors["password"] = [password_error]

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
        auth_preference = User.AUTH_PASSWORD if password else User.AUTH_OTP
        user = User(
            name=name,
            email=email,
            company_name=company_name,
            auth_preference=auth_preference,
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
                "auth_preference": user.auth_preference,
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
    if password and otp:
        return _error_response(
            code="VALIDATION_ERROR",
            message="Choose one login method.",
            errors={"auth": ["Use either password or otp."]},
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
        if _is_otp_auth_user(user):
            return _error_response(
                code="AUTH_METHOD_NOT_ALLOWED",
                message="You have opted for OTP-based login.",
                errors={"auth": ["Use OTP login for this account."]},
                http_status=status.HTTP_400_BAD_REQUEST,
            )
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
        if _is_password_auth_user(user):
            return _error_response(
                code="AUTH_METHOD_NOT_ALLOWED",
                message="You have opted for password-based login.",
                errors={"auth": ["Use password login for this account."]},
                http_status=status.HTTP_400_BAD_REQUEST,
            )
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
                "auth_preference": user.auth_preference,
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
