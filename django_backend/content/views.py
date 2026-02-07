from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Achievement, News


def _build_file_url(request, file_field):
    if not file_field:
        return ""
    return request.build_absolute_uri(file_field.url)


@api_view(["GET"])
def get_news(request):
    news_qs = News.objects.filter(is_visible=True).order_by("-created_at")
    data = [
        {
            "id": item.id,
            "title": item.title,
            "summary": item.summary,
            "content": item.content,
            "cover_image_url": _build_file_url(request, item.cover_image_url),
            "is_visible": item.is_visible,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
        }
        for item in news_qs
    ]
    return Response({"count": len(data), "results": data})


@api_view(["GET"])
def get_achievements(request):
    achievements_qs = Achievement.objects.filter(is_visible=True).order_by("-year", "-created_at")
    data = [
        {
            "id": item.id,
            "title": item.title,
            "summary": item.summary,
            "content": item.content,
            "year": item.year,
            "image_url": _build_file_url(request, item.image_url),
            "is_visible": item.is_visible,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
        }
        for item in achievements_qs
    ]
    return Response({"count": len(data), "results": data})
