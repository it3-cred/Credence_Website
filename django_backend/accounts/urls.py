from django.urls import path

from . import views

urlpatterns = [
    path("api/auth/signup", views.signup, name="signup"),
    path("api/auth/login", views.login, name="login"),
    path("api/auth/logout", views.logout, name="logout"),
]
