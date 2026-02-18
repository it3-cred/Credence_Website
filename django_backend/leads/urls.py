from django.urls import path

from . import views

urlpatterns = [
    path("api/leads/catalogue-email-request", views.create_catalogue_email_request, name="create_catalogue_email_request"),
    path("api/leads/request-quote", views.create_inquiry_request, name="create_inquiry_request"),
]
