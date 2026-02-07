from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator, MinLengthValidator, RegexValidator
from django.db import models

MAX_PRODUCT_IMAGE_FILE_SIZE_BYTES = 2 * 1024 * 1024  # 2 MB


def validate_product_image_file_size(value):
    if not value:
        return
    if value.size > MAX_PRODUCT_IMAGE_FILE_SIZE_BYTES:
        raise ValidationError("Product image file size must be 2 MB or less.")


class ProductCategory(models.Model):
    name = models.CharField(
        max_length=150,
        validators=[MinLengthValidator(2), RegexValidator(r".*\S.*", "Name cannot be blank.")],
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
    )
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = "product_categories"

    def __str__(self):
        return self.name


class Product(models.Model):
    category = models.ForeignKey(
        ProductCategory,
        on_delete=models.PROTECT,
        related_name="products",
    )
    name = models.CharField(
        max_length=200,
        unique=True,
        validators=[MinLengthValidator(2), RegexValidator(r".*\S.*", "Name cannot be blank.")],
    )
    slug = models.SlugField(max_length=200, unique=True,)
    short_description = models.TextField(
        blank=True,
        validators=[RegexValidator(r".*\S.*", "Short description cannot be blank.")],
    )
    image = models.ImageField(
        upload_to="products/",
        max_length=500,
        blank=True,
        validators=[
            FileExtensionValidator(allowed_extensions=["png", "webp"]),
            validate_product_image_file_size,
        ],
    )
    is_visible = models.BooleanField(default=True)

    features = models.JSONField(null=True, blank=True)
    operating_conditions = models.JSONField(null=True, blank=True)
    output_torque = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    temperature_range = models.JSONField(null=True, blank=True)
    max_allowable_operating_pressure = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        null=True,
        blank=True,
    )

    mounting_certifications = models.JSONField(null=True, blank=True)
    options = models.JSONField(null=True, blank=True)
    applications = models.JSONField(null=True, blank=True)
    control_options = models.JSONField(null=True, blank=True)

    power_source = models.TextField(blank=True, validators=[RegexValidator(r".*\S.*", "Power source cannot be blank.")])
    enclosure_ratings = models.JSONField(null=True, blank=True)
    supply_media = models.JSONField(null=True, blank=True)
    testing_standards = models.JSONField(null=True, blank=True)
    valve_compatibility = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "products"

    def __str__(self):
        return self.name


class ProductCatalogue(models.Model):
    ACCESS_DIRECT = "DIRECT"
    ACCESS_EMAIL_VALIDATED = "EMAIL_VALIDATED"
    ACCESS_TYPE_CHOICES = [
        (ACCESS_DIRECT, "Direct"),
        (ACCESS_EMAIL_VALIDATED, "Email Validated"),
    ]

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="catalogues",
    )
    title = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(2), RegexValidator(r".*\S.*", "Title cannot be blank.")],
    )
    description = models.TextField(
        blank=True,
        validators=[RegexValidator(r".*\S.*", "Description cannot be blank.")],
    )
    file_url = models.URLField(max_length=500)
    access_type = models.CharField(max_length=32, choices=ACCESS_TYPE_CHOICES, default=ACCESS_DIRECT)
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "product_catalogues"

    def __str__(self):
        return self.title
