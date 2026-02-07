from django.urls import path

from . import views

urlpatterns = [
    path("api/content/news", views.get_news, name="get_news"),
    path("api/content/achievements", views.get_achievements, name="get_achievements"),
]
