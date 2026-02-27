from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email", "auth_preference", "company_name", "is_active", "last_login_at", "created_at")
    search_fields = ("name", "email", "company_name")
    list_filter = ("auth_preference", "is_active", "last_login_at", "created_at")
    readonly_fields = ("last_login_at", "last_login_location", "created_at", "updated_at")
