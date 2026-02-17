from django.contrib import admin
from .models import Industry, PowerSource, Product, ProductCatalogue, ProductImage, ProductIndustry


class ProductIndustryInline(admin.TabularInline):
    model = ProductIndustry
    extra = 1


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


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
    list_display = ("id", "name", "power_source", "slug", "is_visible", "created_at")
    list_filter = ("is_visible", "power_source", "created_at")
    search_fields = ("name", "slug", "short_summary", "description")
    prepopulated_fields = {"slug": ("name",)}
    fields = (
        "power_source",
        "name",
        "slug",
        "short_summary",
        "description",
        "is_visible",
        "torque_min_nm",
        "torque_max_nm",
        "thrust_min_n",
        "thrust_max_n",
        "specification",
        "features",
    )
    inlines = [ProductImageInline, ProductIndustryInline]


@admin.register(ProductCatalogue)
class ProductCatalogueAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "doc_type", "product", "access_type", "is_visible", "sort_order", "created_at")
    list_filter = ("doc_type", "access_type", "is_visible", "created_at")
    search_fields = ("title", "description", "file")


@admin.register(ProductIndustry)
class ProductIndustryAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "industry")
    search_fields = ("product__name", "industry__name")


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "display_order", "created_at")
    list_filter = ("product",)
    search_fields = ("product__name",)
