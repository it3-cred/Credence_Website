from django.contrib.auth.hashers import check_password, identify_hasher, make_password
from django.core.validators import MinLengthValidator, RegexValidator
from django.db import models
from django.utils import timezone


class User(models.Model):
    AUTH_PASSWORD = "PASSWORD"
    AUTH_OTP = "OTP"
    AUTH_PREFERENCE_CHOICES = [
        (AUTH_PASSWORD, "Password"),
        (AUTH_OTP, "OTP"),
    ]

    name = models.CharField(
        max_length=150,
        validators=[
            MinLengthValidator(2),
            RegexValidator(r".*\S.*", "Name must contain non-whitespace characters."),
        ],
    )
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=128, blank=True, default="")
    auth_preference = models.CharField(
        max_length=16,
        choices=AUTH_PREFERENCE_CHOICES,
        default=AUTH_PASSWORD,
    )
    company_name = models.CharField(
        max_length=200,
        blank=True,
        validators=[RegexValidator(r".*\S.*", "Company name must contain non-whitespace characters.")],
    )
    last_login_at = models.DateTimeField(null=True, blank=True)
    last_login_location = models.JSONField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.email

    def set_password(self, raw_password):
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password_hash)

    def record_login(self, location):
        self.last_login_at = timezone.now()
        self.last_login_location = location
        self.save(update_fields=["last_login_at", "last_login_location", "updated_at"])

    def save(self, *args, **kwargs):
        if self.password_hash:
            try:
                identify_hasher(self.password_hash)
            except Exception:
                self.password_hash = make_password(self.password_hash)
        super().save(*args, **kwargs)


class EmailOTP(models.Model):
    PURPOSE_SIGNUP = "SIGNUP"
    PURPOSE_LOGIN = "LOGIN"
    PURPOSE_PASSWORD_RESET = "PASSWORD_RESET"
    PURPOSE_CHOICES = [
        (PURPOSE_SIGNUP, "Signup"),
        (PURPOSE_LOGIN, "Login"),
        (PURPOSE_PASSWORD_RESET, "Password Reset"),
    ]

    email = models.EmailField()
    purpose = models.CharField(max_length=16, choices=PURPOSE_CHOICES)
    otp_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "email_otps"
        indexes = [
            models.Index(fields=["email", "purpose", "is_used", "expires_at"]),
        ]

    def set_otp(self, raw_otp):
        self.otp_hash = make_password(raw_otp)

    def verify_otp(self, raw_otp):
        return check_password(raw_otp, self.otp_hash)

    def is_expired(self):
        return timezone.now() > self.expires_at
