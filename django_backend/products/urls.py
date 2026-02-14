from django.urls import path

from . import views

urlpatterns = [
    path("api/products", views.get_products, name="get_products"),
    path("api/power-sources", views.get_power_sources, name="get_power_sources"),
]
