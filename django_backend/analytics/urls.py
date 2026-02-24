from django.urls import path

from . import views

urlpatterns = [
    path("api/analytics/events", views.ingest_events, name="analytics_ingest_events"),
    path("api/analytics/me/interest-summary", views.my_interest_summary, name="analytics_my_interest_summary"),
    path(
        "api/analytics/anonymous/popularity-summary",
        views.anonymous_popularity_summary,
        name="analytics_anonymous_popularity_summary",
    ),
]
