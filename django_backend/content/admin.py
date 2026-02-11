from django.contrib import admin
from .models import Achievement, AchievementImage, AnnouncementRibbon, News, NewsImage


class NewsImageInline(admin.TabularInline):
    model = NewsImage
    extra = 1


class AchievementImageInline(admin.TabularInline):
    model = AchievementImage
    extra = 1


@admin.register(AnnouncementRibbon)
class AnnouncementRibbonAdmin(admin.ModelAdmin):
    list_display = ("id", "is_enabled", "starts_at", "ends_at", "updated_at")
    list_filter = ("is_enabled",)
    search_fields = ("message", "text", "link_url")


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "year", "is_visible", "created_at")
    list_filter = ("is_visible", "year")
    search_fields = ("title", "summary", "content")
    inlines = [AchievementImageInline]


@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "is_visible", "created_at")
    list_filter = ("is_visible", "created_at")
    search_fields = ("title", "summary", "content")
    inlines = [NewsImageInline]
