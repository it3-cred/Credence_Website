from django.urls import path

from . import views

urlpatterns = [
    path("api/analytics/events", views.ingest_events, name="analytics_ingest_events"),
    path("api/analytics/product-interest", views.product_interest_summary, name="analytics_product_interest_summary"),
]
