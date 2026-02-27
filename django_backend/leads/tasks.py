from pathlib import Path

from django.conf import settings
from django.core.mail import EmailMessage
from django.utils import timezone

from .models import CatalogueEmailRequest

MAX_EMAIL_REQUEST_RETRIES = 3


def _build_email_subject(email_request: CatalogueEmailRequest) -> str:
    product_name = (email_request.product_name or "").strip()
    doc_title = (email_request.catalogue.title or "").strip()
    if product_name and doc_title:
        return f"Requested Document: {product_name} - {doc_title}"
    if doc_title:
        return f"Requested Document: {doc_title}"
    return "Requested Product Document"


def _build_email_body(email_request: CatalogueEmailRequest) -> str:
    lines = [
        "Hello,",
        "",
        "Thank you for your document request.",
    ]
    if email_request.product_name:
        lines.append(f"Product: {email_request.product_name}")
    lines.append(f"Document: {email_request.catalogue.title}")
    lines.extend(
        [
            "",
            "The requested PDF is attached to this email.",
            "",
            "Regards,",
            "Credence Automation & Control Systems",
        ]
    )
    return "\n".join(lines)


def _mark_failure(email_request: CatalogueEmailRequest, exc: Exception):
    email_request.status = CatalogueEmailRequest.STATUS_FAILED
    email_request.failure_reason = str(exc)[:2000]
    email_request.save(update_fields=["status", "failure_reason"])


try:
    from celery import shared_task

    @shared_task(bind=True, max_retries=MAX_EMAIL_REQUEST_RETRIES, default_retry_delay=60)
    def send_catalogue_email_request(self, email_request_id: int):
        email_request = (
            CatalogueEmailRequest.objects.select_related("catalogue", "catalogue__product")
            .filter(id=email_request_id)
            .first()
        )
        if not email_request:
            return {"status": "missing", "id": email_request_id}
        if email_request.status == CatalogueEmailRequest.STATUS_SENT:
            return {"status": "already_sent", "id": email_request_id}

        catalogue_file = email_request.catalogue.file
        if not catalogue_file:
            _mark_failure(email_request, RuntimeError("Catalogue file is missing."))
            return {"status": "failed", "reason": "missing_file_ref", "id": email_request_id}

        file_path = Path(catalogue_file.path)
        if not file_path.exists():
            _mark_failure(email_request, FileNotFoundError(f"Catalogue file not found: {file_path}"))
            return {"status": "failed", "reason": "missing_file_on_disk", "id": email_request_id}

        now = timezone.now()
        email_request.status = CatalogueEmailRequest.STATUS_PROCESSING
        email_request.attempt_count = (email_request.attempt_count or 0) + 1
        email_request.last_attempt_at = now
        email_request.failure_reason = ""
        email_request.save(update_fields=["status", "attempt_count", "last_attempt_at", "failure_reason"])

        try:
            message = EmailMessage(
                subject=_build_email_subject(email_request),
                body=_build_email_body(email_request),
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email_request.email],
            )
            message.attach_file(str(file_path), mimetype="application/pdf")
            message.send(fail_silently=False)

            email_request.status = CatalogueEmailRequest.STATUS_SENT
            email_request.sent_at = timezone.now()
            email_request.failure_reason = ""
            email_request.save(update_fields=["status", "sent_at", "failure_reason"])
            return {"status": "sent", "id": email_request_id}
        except Exception as exc:
            _mark_failure(email_request, exc)
            if self.request.retries < MAX_EMAIL_REQUEST_RETRIES:
                countdown = 60 * (2 ** self.request.retries)
                raise self.retry(exc=exc, countdown=countdown)
            raise

except Exception:
    # Celery may not be installed in local setup yet. Keep module importable.
    def send_catalogue_email_request(*args, **kwargs):  # type: ignore[no-redef]
        raise RuntimeError("Celery is not installed/configured. Install celery and run a worker.")

