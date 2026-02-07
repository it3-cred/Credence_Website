from django.urls import path

from . import views

urlpatterns = [
    path("api/products", views.get_products, name="get_products"),
]
