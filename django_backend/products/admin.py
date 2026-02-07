from django.contrib import admin
from django.utils.html import format_html
from .models import Product, ProductCatalogue, ProductCategory


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "parent", "sort_order")
    list_filter = ("parent",)
    search_fields = ("name",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category", "slug", "has_image", "is_visible", "created_at")
    list_filter = ("is_visible", "category", "created_at")
    search_fields = ("name", "slug", "short_description")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("image_preview",)
    fields = (
        "category",
        "name",
        "slug",
        "short_description",
        "image",
        "image_preview",
        "is_visible",
        "features",
        "operating_conditions",
        "output_torque",
        "temperature_range",
        "max_allowable_operating_pressure",
        "mounting_certifications",
        "options",
        "applications",
        "control_options",
        "power_source",
        "enclosure_ratings",
        "supply_media",
        "testing_standards",
        "valve_compatibility",
    )

    @admin.display(boolean=True, description="Has Image")
    def has_image(self, obj):
        return bool(obj.image)

    @admin.display(description="Image Preview")
    def image_preview(self, obj):
        if not obj.image:
            return "No image uploaded."
        return format_html('<img src="{}" style="max-height: 120px; width: auto;" />', obj.image.url)


@admin.register(ProductCatalogue)
class ProductCatalogueAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "product", "access_type", "is_visible", "created_at")
    list_filter = ("access_type", "is_visible", "created_at")
    search_fields = ("title", "description", "file_url")
