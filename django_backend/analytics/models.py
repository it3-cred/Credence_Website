from django.db import models


class AnalyticsEvent(models.Model):
    EVENT_PAGE_VIEW = "page_view"
    EVENT_PAGE_ENGAGEMENT = "page_engagement"
    EVENT_NAV_CLICK = "nav_click"
    EVENT_POWER_SOURCE_CARD_CLICK = "power_source_card_click"
    EVENT_PRODUCT_FILTERS_APPLIED = "product_filters_applied"
    EVENT_PRODUCT_CLICK = "product_click"
    EVENT_PRODUCT_DETAIL_VIEW = "product_detail_view"
    EVENT_PRODUCT_DETAIL_TAB_CLICK = "product_detail_tab_click"
    EVENT_REQUEST_QUOTE_CLICK = "request_quote_click"
    EVENT_DOCUMENT_DOWNLOAD_CLICK = "document_download_click"
    EVENT_DOCUMENT_EMAIL_REQUEST_OPEN = "document_email_request_open"
    EVENT_DOCUMENT_EMAIL_REQUEST_SUBMIT = "document_email_request_submit"
    EVENT_DOCUMENT_EMAIL_REQUEST_SUBMIT_FAILED = "document_email_request_submit_failed"

    EVENT_CHOICES = [
        (EVENT_PAGE_VIEW, "Page View"),
        (EVENT_PAGE_ENGAGEMENT, "Page Engagement"),
        (EVENT_NAV_CLICK, "Nav Click"),
        (EVENT_POWER_SOURCE_CARD_CLICK, "Power Source Card Click"),
        (EVENT_PRODUCT_FILTERS_APPLIED, "Product Filters Applied"),
        (EVENT_PRODUCT_CLICK, "Product Click"),
        (EVENT_PRODUCT_DETAIL_VIEW, "Product Detail View"),
        (EVENT_PRODUCT_DETAIL_TAB_CLICK, "Product Detail Tab Click"),
        (EVENT_REQUEST_QUOTE_CLICK, "Request Quote Click"),
        (EVENT_DOCUMENT_DOWNLOAD_CLICK, "Document Download Click"),
        (EVENT_DOCUMENT_EMAIL_REQUEST_OPEN, "Document Email Request Open"),
        (EVENT_DOCUMENT_EMAIL_REQUEST_SUBMIT, "Document Email Request Submit"),
        (EVENT_DOCUMENT_EMAIL_REQUEST_SUBMIT_FAILED, "Document Email Request Submit Failed"),
    ]

    event_name = models.CharField(max_length=64, choices=EVENT_CHOICES)
    event_time = models.DateTimeField()
    session_id = models.CharField(max_length=128)
    anon_id = models.CharField(max_length=128)
    user = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="analytics_events",
    )
    page_path = models.CharField(max_length=500)
    page_title = models.CharField(max_length=255, blank=True, default="")
    referrer = models.CharField(max_length=500, blank=True, default="")
    properties = models.JSONField(default=dict, blank=True)
    user_agent = models.TextField(blank=True, default="")
    device_type = models.CharField(max_length=32, blank=True, default="")
    request_location = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "analytics_events"
        indexes = [
            models.Index(fields=["event_name"]),
            models.Index(fields=["event_time"]),
            models.Index(fields=["session_id"]),
            models.Index(fields=["anon_id"]),
            models.Index(fields=["event_name", "event_time"]),
        ]

    def __str__(self):
        return f"{self.event_name} @ {self.event_time.isoformat()}"
