try:
    from .celery import app as celery_app
except Exception:  # pragma: no cover - keep Django importable before Celery is installed/configured
    celery_app = None

__all__ = ("celery_app",)
