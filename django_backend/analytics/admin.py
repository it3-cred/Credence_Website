from django.contrib import admin
from django.template.response import TemplateResponse
from django.urls import path

from .models import AnalyticsEvent
<<<<<<< HEAD
from .views import build_product_interest_summary
=======
from .views import build_anonymous_popularity_summary, build_user_interest_leaderboard
>>>>>>> 27b5e44 (added analytics for logedin user and anonyms user)


@admin.register(AnalyticsEvent)
class AnalyticsEventAdmin(admin.ModelAdmin):
<<<<<<< HEAD
    list_display = ("id", "event_name", "page_path", "session_id", "user", "event_time", "created_at")
    list_filter = ("event_name", "event_time", "created_at", "device_type")
    search_fields = ("page_path", "session_id", "anon_id", "referrer")
=======
    list_display = ("id", "event_name", "page_path", "user", "session_id", "event_time", "created_at")
    list_filter = ("event_name", "device_type", "event_time", "created_at")
    search_fields = ("page_path", "page_title", "session_id", "anon_id", "referrer")
>>>>>>> 27b5e44 (added analytics for logedin user and anonyms user)
    readonly_fields = ("created_at",)
    change_list_template = "admin/analytics/analyticsevent/change_list.html"

    def get_urls(self):
        urls = super().get_urls()
<<<<<<< HEAD
        custom_urls = [
            path("insights/", self.admin_site.admin_view(self.insights_view), name="analytics_analyticsevent_insights"),
        ]
        return custom_urls + urls

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context["insights_url"] = "insights/"
        return super().changelist_view(request, extra_context=extra_context)

    def insights_view(self, request):
        days = request.GET.get("days", 30)
        limit = request.GET.get("limit", 10)
        summary = build_product_interest_summary(days=days, limit=limit)
        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "title": "Product Interest Insights",
            "summary": summary,
            "selected_days": int(summary["window_days"]),
            "selected_limit": int(summary["limit"]),
            "days_options": [7, 14, 30, 60, 90],
            "limit_options": [5, 10, 20, 50],
=======
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
>>>>>>> 27b5e44 (added analytics for logedin user and anonyms user)
        }
        return TemplateResponse(request, "admin/analytics/analyticsevent/insights.html", context)
