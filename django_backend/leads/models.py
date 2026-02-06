from django.core.validators import MinLengthValidator, RegexValidator
from django.db import models


class CatalogueEmailRequest(models.Model):
    STATUS_PENDING = "PENDING"
    STATUS_SENT = "SENT"
    STATUS_FAILED = "FAILED"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_SENT, "Sent"),
        (STATUS_FAILED, "Failed"),
    ]

    catalogue = models.ForeignKey(
        "products.ProductCatalogue",
        on_delete=models.CASCADE,
        related_name="email_requests",
    )
    email = models.EmailField()
    company_name = models.CharField(
        max_length=200,
        blank=True,
        validators=[RegexValidator(r".*\S.*", "Company name cannot be blank.")],
    )
    request_ip = models.GenericIPAddressField(null=True, blank=True)
    request_location = models.JSONField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "catalogue_email_requests"

    def __str__(self):
        return f"{self.email} -> {self.catalogue_id}"
