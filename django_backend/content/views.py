from django.db.models import Q
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Achievement, AnnouncementRibbon, News


def _build_file_url(request, file_field):
    if not file_field:
        return ""
    return request.build_absolute_uri(file_field.url)


@api_view(["GET"])
def get_news(request):
    news_qs = News.objects.filter(is_visible=True).prefetch_related("images").order_by("-created_at")
    data = []

    for item in news_qs:
        image_urls = [_build_file_url(request, image.image) for image in item.images.all() if image.image]
        if not image_urls and item.cover_image_url:
            image_urls = [_build_file_url(request, item.cover_image_url)]

        data.append(
            {
                "id": item.id,
                "title": item.title,
                "slug": item.slug,
                "summary": item.summary,
                "content": item.content,
                "cover_image_url": image_urls[0] if image_urls else "",
                "image_urls": image_urls,
                "is_visible": item.is_visible,
                "created_at": item.created_at,
                "updated_at": item.updated_at,
            }
        )

    return Response({"count": len(data), "results": data})


@api_view(["GET"])
def get_achievements(request):
    achievements_qs = Achievement.objects.filter(is_visible=True).prefetch_related("images").order_by("-year", "-created_at")
    data = []

    for item in achievements_qs:
        image_urls = [_build_file_url(request, image.image) for image in item.images.all() if image.image]
        if not image_urls and item.image_url:
            image_urls = [_build_file_url(request, item.image_url)]

        data.append(
            {
                "id": item.id,
                "title": item.title,
                "slug": item.slug,
                "summary": item.summary,
                "content": item.content,
                "year": item.year,
                "image_url": image_urls[0] if image_urls else "",
                "image_urls": image_urls,
                "is_visible": item.is_visible,
                "created_at": item.created_at,
                "updated_at": item.updated_at,
            }
        )

    return Response({"count": len(data), "results": data})


@api_view(["GET"])
def get_latest_announcement(request):
    now = timezone.now()
    announcements_qs = (
        AnnouncementRibbon.objects.filter(is_enabled=True)
        .filter(Q(starts_at__isnull=True) | Q(starts_at__lte=now))
        .filter(Q(ends_at__isnull=True) | Q(ends_at__gte=now))
        .order_by("-updated_at")
    )

    announcements = list(announcements_qs)
    if not announcements:
        return Response({"enabled": False, "result": None})

    latest = announcements[0]
    results = [
        {
            "id": item.id,
            "text": item.text or "",
            "message": item.message or "",
            "link_url": item.link_url or "",
            "starts_at": item.starts_at,
            "ends_at": item.ends_at,
            "updated_at": item.updated_at,
        }
        for item in announcements
    ]

    return Response(
        {
            "enabled": True,
            "count": len(results),
            "results": results,
            "result": {
                "id": latest.id,
                "text": latest.text or "",
                "message": latest.message or "",
                "link_url": latest.link_url or "",
                "starts_at": latest.starts_at,
                "ends_at": latest.ends_at,
                "updated_at": latest.updated_at,
            },
        }
    )
