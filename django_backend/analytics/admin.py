from django.contrib import admin
from django.template.response import TemplateResponse
from django.urls import path

from .models import AnalyticsEvent
from .views import (
    build_anonymous_popularity_summary,
    build_logged_in_document_activity_summary,
    build_user_interest_leaderboard,
)


@admin.register(AnalyticsEvent)
class AnalyticsEventAdmin(admin.ModelAdmin):
    list_display = ("id", "event_name", "page_path", "user", "session_id", "event_time", "created_at")
    list_filter = ("event_name", "device_type", "event_time", "created_at")
    search_fields = ("page_path", "page_title", "session_id", "anon_id", "referrer")
    readonly_fields = ("created_at",)
    change_list_template = "admin/analytics/analyticsevent/change_list.html"

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path("insights/", self.admin_site.admin_view(self.analytics_insights_view), name="analytics_analyticsevent_insights"),
        ]
        return custom + urls

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context["analytics_insights_url"] = "insights/"
        return super().changelist_view(request, extra_context=extra_context)

    def analytics_insights_view(self, request):
        days = request.GET.get("days", 30)
        user_limit = request.GET.get("user_limit", 20)
        anon_limit = request.GET.get("anon_limit", 10)

        user_summary = build_user_interest_leaderboard(days=days, limit=user_limit, per_user_top_limit=3)
        anonymous_summary = build_anonymous_popularity_summary(days=days, limit=anon_limit)
        logged_in_documents_summary = build_logged_in_document_activity_summary(days=days, limit=anon_limit)

        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "title": "Analytics Insights",
            "days_options": [7, 14, 30, 60, 90],
            "limit_options": [5, 10, 20, 50],
            "selected_days": int(user_summary["window_days"]),
            "selected_user_limit": max(1, int(user_limit)) if str(user_limit).isdigit() else 20,
            "selected_anon_limit": max(1, int(anon_limit)) if str(anon_limit).isdigit() else 10,
            "user_summary": user_summary,
            "anonymous_summary": anonymous_summary,
            "logged_in_documents_summary": logged_in_documents_summary,
        }
        return TemplateResponse(request, "admin/analytics/analyticsevent/insights.html", context)
