from django.contrib.auth.hashers import check_password, identify_hasher, make_password
from django.core.validators import MinLengthValidator, RegexValidator
from django.db import models
from django.utils import timezone


class User(models.Model):
    name = models.CharField(
        max_length=150,
        validators=[
            MinLengthValidator(2),
            RegexValidator(r".*\S.*", "Name must contain non-whitespace characters."),
        ],
    )
    email = models.EmailField(unique=True)
    password_hash = models.CharField(
        max_length=128,
        validators=[MinLengthValidator(8)],
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
