from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator, MaxLengthValidator, MinLengthValidator, RegexValidator
from django.db import models

MAX_IMAGE_FILE_SIZE_BYTES = 2 * 1024 * 1024  # 2 MB
ANNOUNCEMENT_TEXT_MAX_LENGTH = 60
SUMMARY_MAX_LENGTH = 500


def validate_image_file_size(value):
    if not value:
        return
    if value.size > MAX_IMAGE_FILE_SIZE_BYTES:
        raise ValidationError("Image file size must be 2 MB or less.")


class AnnouncementRibbon(models.Model):
    is_enabled = models.BooleanField(default=False)
    message = models.TextField(
        validators=[MinLengthValidator(1), RegexValidator(r".*\S.*", "Message cannot be blank.")],
    )
    text = models.TextField(
        max_length=ANNOUNCEMENT_TEXT_MAX_LENGTH,
        validators=[
            MinLengthValidator(1),
            MaxLengthValidator(ANNOUNCEMENT_TEXT_MAX_LENGTH),
            RegexValidator(r".*\S.*", "Text cannot be blank."),
        ],
    )
    link_url = models.URLField(max_length=500, blank=True)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "announcement_ribbon"


class Achievement(models.Model):
    title = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(2), RegexValidator(r".*\S.*", "Title cannot be blank.")],
    )
    slug = models.SlugField(max_length=220, unique=True, null=True, blank=True)
    summary = models.TextField(
        validators=[
            MinLengthValidator(1),
            MaxLengthValidator(SUMMARY_MAX_LENGTH),
            RegexValidator(r".*\S.*", "Summary cannot be blank."),
        ],
    )
    content = models.TextField(
        validators=[MinLengthValidator(1), RegexValidator(r".*\S.*", "Content cannot be blank.")],
    )
    year = models.PositiveIntegerField()
    image_url = models.ImageField(
        upload_to="achievements/",
        max_length=500,
        blank=True,
        validators=[
            FileExtensionValidator(allowed_extensions=["png", "webp"]),
            validate_image_file_size,
        ],
    )
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "achievements"


class News(models.Model):
    title = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(2), RegexValidator(r".*\S.*", "Title cannot be blank.")],
    )
    slug = models.SlugField(max_length=220, unique=True, null=True, blank=True)
    summary = models.TextField(
        validators=[
            MinLengthValidator(1),
            MaxLengthValidator(SUMMARY_MAX_LENGTH),
            RegexValidator(r".*\S.*", "Summary cannot be blank."),
        ],
    )
    content = models.TextField(
        validators=[MinLengthValidator(1), RegexValidator(r".*\S.*", "Content cannot be blank.")],
    )
    cover_image_url = models.ImageField(
        upload_to="news/",
        max_length=500,
        blank=True,
        validators=[
            FileExtensionValidator(allowed_extensions=["png", "webp"]),
            validate_image_file_size,
        ],
    )
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "news"


class NewsImage(models.Model):
    news = models.ForeignKey(News, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(
        upload_to="news/",
        max_length=500,
        validators=[
            FileExtensionValidator(allowed_extensions=["png", "webp"]),
            validate_image_file_size,
        ],
    )
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "news_images"
        ordering = ("display_order", "id")


class AchievementImage(models.Model):
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(
        upload_to="achievements/",
        max_length=500,
        validators=[
            FileExtensionValidator(allowed_extensions=["png", "webp"]),
            validate_image_file_size,
        ],
    )
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "achievement_images"
        ordering = ("display_order", "id")
