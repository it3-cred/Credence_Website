from django.urls import path
from . import views

urlpatterns = [
    path("api/healthcheck", views.healthCheck, name="healthCheck"),
    path("api/search", views.global_search, name="global_search"),
]
