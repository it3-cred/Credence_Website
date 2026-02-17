from django.urls import path, re_path

from . import views

urlpatterns = [
    path("api/products", views.get_products, name="get_products"),
    re_path(r"^api/products/(?P<slug>[-a-zA-Z0-9_]+)-(?P<product_id>\d+)$", views.get_product_detail, name="get_product_detail"),
    path("api/power-sources", views.get_power_sources, name="get_power_sources"),
    path("api/industries", views.get_industries, name="get_industries"),
]
