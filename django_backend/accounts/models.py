from django.core.validators import MinLengthValidator, RegexValidator
from django.db import models


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
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    last_login_location = models.JSONField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.email
