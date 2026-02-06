from django.core.validators import MinLengthValidator, RegexValidator
from django.db import models


class AnnouncementRibbon(models.Model):
    is_enabled = models.BooleanField(default=False)
    message = models.TextField(
        validators=[MinLengthValidator(1), RegexValidator(r".*\S.*", "Message cannot be blank.")],
    )
    text = models.TextField(
        validators=[MinLengthValidator(1), RegexValidator(r".*\S.*", "Text cannot be blank.")],
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
    summary = models.TextField(
        validators=[MinLengthValidator(1), RegexValidator(r".*\S.*", "Summary cannot be blank.")],
    )
    content = models.TextField(
        validators=[MinLengthValidator(1), RegexValidator(r".*\S.*", "Content cannot be blank.")],
    )
    year = models.PositiveIntegerField()
    image_url = models.URLField(max_length=500, blank=True)
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
    summary = models.TextField(
        validators=[MinLengthValidator(1), RegexValidator(r".*\S.*", "Summary cannot be blank.")],
    )
    content = models.TextField(
        validators=[MinLengthValidator(1), RegexValidator(r".*\S.*", "Content cannot be blank.")],
    )
    cover_image_url = models.URLField(max_length=500, blank=True)
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "news"
