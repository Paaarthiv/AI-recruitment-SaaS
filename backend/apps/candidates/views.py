
import hashlib

from rest_framework import generics, status, views
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from apps.accounts.permissions import IsVerifiedRecruiter
from apps.core.models import AuditLog
from apps.core.storage import upload_file

from .models import Application, Candidate, Resume
from .serializers import (
    ApplicationDetailSerializer,
    ApplicationSerializer,
    ApplicationStatusUpdateSerializer,
    CandidateSerializer,
    ResumeSerializer,
    ResumeUploadSerializer,
)
from .tasks import extract_resume_text


def get_recruiter_organization(request):
    return request.user.recruiter_profile.organization


def _dispatch_resume_extraction(resume):
    try:
        extract_resume_text.delay(str(resume.id))
    except Exception:
        # Upload success should not depend on the local Celery worker/broker being online.
        return


class CandidateListView(generics.ListAPIView):
    """
    GET /api/v1/candidates/
    List candidates for the recruiter's organization.
    """
    serializer_class = CandidateSerializer
    permission_classes = [IsVerifiedRecruiter]

    def get_queryset(self):
        organization = get_recruiter_organization(self.request)
        return (
            Candidate.objects.filter(organization=organization)
            .prefetch_related("resumes")
            .order_by("-created_at")
        )

class CandidateDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/candidates/<pk>/
    """
    serializer_class = CandidateSerializer
    permission_classes = [IsVerifiedRecruiter]

    def get_queryset(self):
        organization = get_recruiter_organization(self.request)
        return Candidate.objects.filter(organization=organization).prefetch_related("resumes")

class ResumeUploadView(views.APIView):
    """
    POST /api/v1/candidates/resumes/upload/
    Accepts multipart/form-data.
    """
    permission_classes = [IsVerifiedRecruiter]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        serializer = ResumeUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        organization = get_recruiter_organization(request)
        candidate_id = serializer.validated_data.get("candidate_id")
        application_id = serializer.validated_data.get("application_id")
        email = serializer.validated_data.get("email")
        
        if application_id:
            application = generics.get_object_or_404(
                Application.objects.select_related("candidate"),
                id=application_id,
                organization=organization,
            )
            candidate = application.candidate
        elif candidate_id:
            candidate = generics.get_object_or_404(
                Candidate,
                id=candidate_id,
                organization=organization,
            )
            application = (
                Application.objects.filter(candidate=candidate, organization=organization)
                .order_by("-applied_at")
                .first()
            )
        else:
            candidate, _created = Candidate.objects.get_or_create(
                organization=organization,
                email=email,
                defaults={
                    "first_name": serializer.validated_data.get("first_name", "Unknown"),
                    "last_name": serializer.validated_data.get("last_name", ""),
                }
            )
            application = (
                Application.objects.filter(candidate=candidate, organization=organization)
                .order_by("-applied_at")
                .first()
            )

        if not application:
            return Response(
                {"detail": "Resume uploads must be linked to an application."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        file = serializer.validated_data["file"]
        file_bytes = file.read()
        file_hash = hashlib.sha256(file_bytes).hexdigest()
        
        # Check deduplication
        existing_resume = Resume.objects.filter(
            application=application,
            file_hash=file_hash,
        ).first()
        if existing_resume:
            return Response(ResumeSerializer(existing_resume).data, status=status.HTTP_200_OK)
            
        # Upload to Supabase
        file_ext = file.name.split('.')[-1].lower() if '.' in file.name else 'bin'
        bucket_name = "resumes"
        # Path: org_id/candidate_id/hash.ext
        file_path = f"{organization.id}/{candidate.id}/{file_hash}.{file_ext}"
        
        # Rewind file for upload
        file.seek(0)
        
        try:
            upload_file(bucket_name, file_path, file, file.content_type)
        except Exception as e:
            return Response(
                {"detail": f"Storage error: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        resume = Resume.objects.create(
            candidate=candidate,
            application=application,
            file_url=file_path,
            file_name=file.name,
            file_size=file.size,
            mime_type=file.content_type,
            file_hash=file_hash,
            uploaded_by=request.user,
        )
        
        _dispatch_resume_extraction(resume)
        
        return Response(ResumeSerializer(resume).data, status=status.HTTP_201_CREATED)
class ApplicationListView(generics.ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [IsVerifiedRecruiter]

    def get_queryset(self):
        organization = get_recruiter_organization(self.request)
        queryset = (
            Application.objects.filter(organization=organization)
            .select_related("candidate", "job", "organization")
            .order_by("-applied_at")
        )

        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        job_id = self.request.query_params.get("job")
        if job_id:
            queryset = queryset.filter(job_id=job_id)

        return queryset


class ApplicationDetailView(generics.RetrieveAPIView):
    serializer_class = ApplicationDetailSerializer
    permission_classes = [IsVerifiedRecruiter]

    def get_queryset(self):
        organization = get_recruiter_organization(self.request)
        return (
            Application.objects.filter(organization=organization)
            .select_related("candidate", "job", "organization")
            .prefetch_related("history__changed_by", "resumes")
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["include_resume_download_urls"] = True
        return context


class ApplicationStatusUpdateView(views.APIView):
    """
    PATCH /api/v1/applications/<pk>/status/
    Recruiter moves an application to a new pipeline stage.
    Records an ApplicationHistory entry automatically via transition_status().
    """

    permission_classes = [IsVerifiedRecruiter]

    def patch(self, request, pk, *args, **kwargs):
        organization = get_recruiter_organization(request)
        application = generics.get_object_or_404(
            Application.objects.select_related("candidate", "job", "organization"),
            pk=pk,
            organization=organization,
        )

        serializer = ApplicationStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data["status"]
        notes = serializer.validated_data.get("notes", "")

        application.transition_status(new_status, changed_by=request.user, notes=notes)

        AuditLog.log(
            action="application.status_updated",
            user=request.user,
            entity=application,
            ip_address=request.META.get("REMOTE_ADDR"),
        )

        return Response(ApplicationDetailSerializer(application).data)


class PipelineBoardView(views.APIView):
    """
    GET /api/v1/pipeline/
    Returns applications for the recruiter's org grouped by status (Kanban columns).
    Optional ?job=<uuid> filter.
    """

    permission_classes = [IsVerifiedRecruiter]

    PIPELINE_STAGES = [
        Application.Status.APPLIED,
        Application.Status.UNDER_REVIEW,
        Application.Status.SHORTLISTED,
        Application.Status.TECHNICAL_ROUND,
        Application.Status.HR_ROUND,
        Application.Status.OFFER,
        Application.Status.HIRED,
        Application.Status.REJECTED,
    ]

    def get(self, request, *args, **kwargs):
        organization = get_recruiter_organization(request)
        queryset = (
            Application.objects.filter(organization=organization)
            .select_related("candidate", "job")
            .order_by("-applied_at")
        )

        job_id = request.query_params.get("job")
        if job_id:
            queryset = queryset.filter(job_id=job_id)

        # Build Kanban columns
        columns = []
        for stage in self.PIPELINE_STAGES:
            stage_apps = [app for app in queryset if app.status == stage]
            columns.append(
                {
                    "status": stage,
                    "label": Application.Status(stage).label,
                    "count": len(stage_apps),
                    "applications": ApplicationSerializer(stage_apps, many=True).data,
                }
            )

        return Response({"columns": columns})
