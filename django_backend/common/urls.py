from django.urls import path
from . import views

urlpatterns = [
    path("api/healthcheck", views.healthCheck, name="healthCheck"),
]
