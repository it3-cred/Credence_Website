from django.http import JsonResponse
from django.db import connection

# Create your views here.
def healthCheck(request):
    server_status = "ok"
    db_status = "ok"

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception:
        db_status = "error"

    return JsonResponse(
        {
            "server_status": server_status,
            "db_status": db_status,
        },
        status=200 if db_status == "ok" else 503,
    )
