from django.contrib import admin
from django.utils.html import format_html
from .models import Industry, PowerSource, Product, ProductCatalogue, ProductCategory, ProductIndustry


class ProductIndustryInline(admin.TabularInline):
    model = ProductIndustry
    extra = 1


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug", "parent", "sort_order", "is_visible")
    list_filter = ("parent", "is_visible")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(PowerSource)
class PowerSourceAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug", "sort_order", "is_visible")
    list_filter = ("is_visible",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Industry)
class IndustryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug", "sort_order", "is_visible")
    list_filter = ("is_visible",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "power_source", "category", "slug", "has_image", "is_visible", "created_at")
    list_filter = ("is_visible", "power_source", "category", "created_at")
    search_fields = ("name", "slug", "short_summary", "description")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("image_preview",)
    fields = (
        "power_source",
        "category",
        "name",
        "slug",
        "short_summary",
        "description",
        "image",
        "image_preview",
        "is_visible",
        "output_torque_min",
        "output_torque_max",
        "thrust_min",
        "thrust_max",
        "spring_return_torque",
        "double_acting_torque",
        "operating_pressure_max",
        "temperature_standard_min",
        "temperature_standard_max",
        "temperature_high_max",
        "temperature_low_min",
        "product_type",
        "actuation_type",
        "control_type",
        "mounting_standard",
        "valve_compatibility",
        "accessories_mounting",
        "certifications",
        "enclosure_rating",
        "testing_standard",
        "applications",
        "features",
    )
    inlines = [ProductIndustryInline]

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
    list_display = ("id", "title", "doc_type", "product", "access_type", "is_visible", "sort_order", "created_at")
    list_filter = ("doc_type", "access_type", "is_visible", "created_at")
    search_fields = ("title", "description", "file")


@admin.register(ProductIndustry)
class ProductIndustryAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "industry")
    search_fields = ("product__name", "industry__name")
