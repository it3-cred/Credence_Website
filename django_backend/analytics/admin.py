from django.contrib import admin
from django.template.response import TemplateResponse
from django.urls import path

from .models import AnalyticsEvent
from .views import build_product_interest_summary


@admin.register(AnalyticsEvent)
class AnalyticsEventAdmin(admin.ModelAdmin):
    list_display = ("id", "event_name", "page_path", "session_id", "user", "event_time", "created_at")
    list_filter = ("event_name", "event_time", "created_at", "device_type")
    search_fields = ("page_path", "session_id", "anon_id", "referrer")
    readonly_fields = ("created_at",)
    change_list_template = "admin/analytics/analyticsevent/change_list.html"

    def get_urls(self):
        urls = super().get_urls()
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
        }
        return TemplateResponse(request, "admin/analytics/analyticsevent/insights.html", context)
