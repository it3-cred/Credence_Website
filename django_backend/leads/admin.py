from django.contrib import admin
from .models import CatalogueEmailRequest, InquiryRequest


@admin.register(CatalogueEmailRequest)
class CatalogueEmailRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "catalogue", "email", "status", "sent_at", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("email", "company_name")


@admin.register(InquiryRequest)
class InquiryRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "first_name",
        "last_name",
        "email",
        "inquiry_reason",
        "company_name",
        "created_at",
    )
    list_filter = ("inquiry_reason", "preferred_language", "subscribe_updates", "created_at")
    search_fields = ("first_name", "last_name", "email", "company_name", "city", "state", "country")
