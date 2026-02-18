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


class InquiryRequest(models.Model):
    email = models.EmailField()
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    inquiry_reason = models.CharField(max_length=120)
    preferred_language = models.CharField(max_length=80, blank=True)
    company_name = models.CharField(max_length=200, blank=True)
    request_details = models.TextField(
        blank=True,
        validators=[MinLengthValidator(10, "Please add at least 10 characters.")],
    )
    country = models.CharField(max_length=100, blank=True)
    business_address = models.CharField(max_length=255, blank=True)
    phone_number = models.CharField(
        max_length=40,
        blank=True,
        validators=[RegexValidator(r"^[0-9+\-\s()]*$", "Invalid phone number format.")],
    )
    state = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    subscribe_updates = models.BooleanField(default=False)
    request_ip = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "inquiry_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.first_name} {self.last_name} <{self.email}>"
