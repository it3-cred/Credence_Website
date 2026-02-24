from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator, MinLengthValidator, RegexValidator
from django.db import models

MAX_PRODUCT_IMAGE_FILE_SIZE_BYTES = 6 * 1024 * 1024  # 6 MB
MAX_PRODUCT_DOCUMENT_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB


def validate_product_image_file_size(value):
    if not value:
        return
    if value.size > MAX_PRODUCT_IMAGE_FILE_SIZE_BYTES:
        raise ValidationError("Product image file size must be 6 MB or less.")


def validate_product_document_file_size(value):
    if not value:
        return
    if value.size > MAX_PRODUCT_DOCUMENT_FILE_SIZE_BYTES:
        raise ValidationError("Product document file size must be 20 MB or less.")


class PowerSource(models.Model):
    name = models.CharField(
        max_length=150,
        unique=True,
        validators=[MinLengthValidator(2), RegexValidator(r".*\S.*", "Name cannot be blank.")],
    )
    slug = models.SlugField(max_length=200, unique=True, null=True, blank=True)
    short_description = models.TextField(
        blank=True,
        validators=[RegexValidator(r".*\S.*", "Short description cannot be blank.")],
    )
    image_url = models.ImageField(
        upload_to="power_sources/",
        max_length=500,
        blank=True,
        validators=[
            FileExtensionValidator(allowed_extensions=["png", "webp"]),
            validate_product_image_file_size,
        ],
    )
    sort_order = models.IntegerField(default=0)
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "power_sources"
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class Industry(models.Model):
    name = models.CharField(
        max_length=150,
        unique=True,
        validators=[MinLengthValidator(2), RegexValidator(r".*\S.*", "Name cannot be blank.")],
    )
    slug = models.SlugField(max_length=200, unique=True)
    image_url = models.ImageField(
        upload_to="industries/",
        max_length=500,
        blank=True,
        validators=[
            FileExtensionValidator(allowed_extensions=["png", "webp"]),
            validate_product_image_file_size,
        ],
    )
    accent_color = models.CharField(
        max_length=16,
        default="#FFFFFF",
        validators=[
            RegexValidator(
                r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$",
                "Accent color must be a valid hex color (e.g. #FFF or #FFFFFF).",
            )
        ],
    )
    sort_order = models.IntegerField(default=0)
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "industries"
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class Product(models.Model):
    power_source = models.ForeignKey(
        PowerSource,
        on_delete=models.PROTECT,
        related_name="products",
        null=True,
        blank=True,
    )
    industries = models.ManyToManyField(Industry, through="ProductIndustry", related_name="products")
    name = models.CharField(
        max_length=200,
        unique=True,
        validators=[MinLengthValidator(2), RegexValidator(r".*\S.*", "Name cannot be blank.")],
    )
    slug = models.SlugField(max_length=200, unique=True)
    short_summary = models.TextField(
        blank=True,
        validators=[RegexValidator(r".*\S.*", "Short summary cannot be blank.")],
    )
    description = models.TextField(
        blank=True,
        validators=[RegexValidator(r".*\S.*", "Description cannot be blank.")],
    )
    is_visible = models.BooleanField(default=True)
    torque_min_nm = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    torque_max_nm = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    thrust_min_n = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    thrust_max_n = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    specification = models.JSONField(null=True, blank=True)
    features = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "products"
        indexes = [
            models.Index(fields=["is_visible", "power_source"], name="prod_vis_pow_idx"),
            models.Index(fields=["created_at"], name="prod_created_idx"),
            models.Index(fields=["is_visible", "-created_at"], name="prod_vis_created_idx"),
            models.Index(fields=["torque_min_nm"], name="prod_torque_min_idx"),
            models.Index(fields=["torque_max_nm"], name="prod_torque_max_idx"),
            models.Index(fields=["thrust_min_n"], name="prod_thrust_min_idx"),
            models.Index(fields=["thrust_max_n"], name="prod_thrust_max_idx"),
        ]

    def __str__(self):
        return self.name


class ProductCatalogue(models.Model):
    DOC_CATALOGUE = "CATALOGUE"
    DOC_DATASHEET = "DATASHEET"
    DOC_MANUAL = "MANUAL"
    DOC_CERTIFICATE = "CERTIFICATE"
    DOC_DRAWING = "DRAWING"
    DOC_OTHER = "OTHER"
    DOC_TYPE_CHOICES = [
        (DOC_CATALOGUE, "Catalogue"),
        (DOC_DATASHEET, "Datasheet"),
        (DOC_MANUAL, "Manual"),
        (DOC_CERTIFICATE, "Certificate"),
        (DOC_DRAWING, "Drawing"),
        (DOC_OTHER, "Other"),
    ]

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
    doc_type = models.CharField(max_length=32, choices=DOC_TYPE_CHOICES, default=DOC_CATALOGUE)
    title = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(2), RegexValidator(r".*\S.*", "Title cannot be blank.")],
    )
    description = models.TextField(
        blank=True,
        validators=[RegexValidator(r".*\S.*", "Description cannot be blank.")],
    )
    file = models.FileField(
        upload_to="product_catalogues/",
        max_length=500,
        blank=True,
        null=True,
        validators=[
            FileExtensionValidator(allowed_extensions=["pdf"]),
            validate_product_document_file_size,
        ],
    )
    access_type = models.CharField(max_length=32, choices=ACCESS_TYPE_CHOICES, default=ACCESS_DIRECT)
    is_visible = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "product_documents"
        ordering = ["sort_order", "title"]

    def __str__(self):
        return self.title


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(
        upload_to="products/",
        max_length=500,
        validators=[
            FileExtensionValidator(allowed_extensions=["png", "webp"]),
            validate_product_image_file_size,
        ],
    )
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "product_images"
        ordering = ("display_order", "id")


class ProductIndustry(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    industry = models.ForeignKey(Industry, on_delete=models.CASCADE)

    class Meta:
        db_table = "product_industries"
        constraints = [
            models.UniqueConstraint(fields=["product", "industry"], name="uniq_product_industry"),
        ]
