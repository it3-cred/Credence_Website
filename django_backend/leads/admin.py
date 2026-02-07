from django.contrib import admin
from .models import CatalogueEmailRequest


@admin.register(CatalogueEmailRequest)
class CatalogueEmailRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "catalogue", "email", "status", "sent_at", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("email", "company_name")
