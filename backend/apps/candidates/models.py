
import uuid

from django.conf import settings
from django.db import models


class Candidate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="candidates",
    )
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True)
    linkedin_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["last_name", "first_name", "email"]
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "email"],
                name="unique_candidate_email_per_organization",
            )
        ]
        indexes = [
            models.Index(fields=["organization", "email"]),
        ]

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}".strip() or self.email

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()


class Resume(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        ERROR = "error", "Error"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name="resumes",
    )
    application = models.ForeignKey(
        "candidates.Application",
        on_delete=models.CASCADE,
        related_name="resumes",
        null=True,
        blank=True,
    )
    file_url = models.URLField(max_length=500, blank=True, help_text="Supabase storage path")
    file_name = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(help_text="File size in bytes")
    mime_type = models.CharField(max_length=100)
    file_hash = models.CharField(
        max_length=64,
        blank=True,
        help_text="SHA-256 hash for deduplication",
    )
    raw_text = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_resumes",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["candidate"]),
            models.Index(fields=["file_hash"]),
        ]

    def __str__(self) -> str:
        return f"Resume {self.file_name} for {self.candidate}"



class Application(models.Model):
    class Status(models.TextChoices):
        APPLIED = "applied", "Applied"
        UNDER_REVIEW = "under_review", "Under Review"
        SHORTLISTED = "shortlisted", "Shortlisted"
        TECHNICAL_ROUND = "technical_round", "Technical Round"
        HR_ROUND = "hr_round", "HR Round"
        OFFER = "offer", "Offer"
        REJECTED = "rejected", "Rejected"
        HIRED = "hired", "Hired"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name="applications",
    )
    job = models.ForeignKey(
        "jobs.Job",
        on_delete=models.CASCADE,
        related_name="applications",
    )
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="applications",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.APPLIED,
        db_index=True,
    )
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-applied_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["candidate", "job"],
                name="unique_application_candidate_job",
            )
        ]
        indexes = [
            models.Index(fields=["organization", "job"]),
            models.Index(fields=["organization", "status"]),
            models.Index(fields=["applied_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.candidate} -> {self.job}"

    def transition_status(self, new_status: str, changed_by=None, notes: str = "") -> None:
        """Change status and record the transition in ApplicationHistory."""
        old_status = self.status
        self.status = new_status
        self.save(update_fields=["status", "updated_at"])
        ApplicationHistory.objects.create(
            application=self,
            from_status=old_status,
            to_status=new_status,
            changed_by=changed_by,
            notes=notes,
        )


class ApplicationHistory(models.Model):
    """Immutable audit log of every application status transition."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name="history",
    )
    from_status = models.CharField(max_length=20, blank=True)
    to_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="application_transitions",
    )
    notes = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["changed_at"]

    def __str__(self) -> str:
        return f"{self.application_id}: {self.from_status} -> {self.to_status}"
