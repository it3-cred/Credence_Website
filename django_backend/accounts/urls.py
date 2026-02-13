from django.urls import path

from . import views

urlpatterns = [
    path("api/auth/me", views.me, name="me"),
    path("api/auth/otp/send", views.send_otp, name="send_otp"),
    path("api/auth/signup", views.signup, name="signup"),
    path("api/auth/login", views.login, name="login"),
    path("api/auth/logout", views.logout, name="logout"),
]
