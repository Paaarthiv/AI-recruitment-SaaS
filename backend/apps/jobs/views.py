
from django.db.models import Count
from rest_framework import generics, status, views
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.accounts.permissions import IsVerifiedRecruiter
from apps.candidates.serializers import ApplicationSerializer, PublicApplicationCreateSerializer
from apps.core.models import AuditLog

from .models import Job
from .serializers import JobSerializer, PublicJobSerializer


def get_recruiter_organization(request):
    return request.user.recruiter_profile.organization


class JobListCreateView(generics.ListCreateAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsVerifiedRecruiter]

    def get_queryset(self):
        organization = get_recruiter_organization(self.request)
        queryset = (
            Job.objects.filter(organization=organization)
            .annotate(application_count=Count("applications"))
            .select_related("organization", "created_by")
        )

        params = self.request.query_params

        status_param = params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        search = params.get("search")
        if search:
            queryset = queryset.filter(title__icontains=search)

        department = params.get("department")
        if department:
            queryset = queryset.filter(department__icontains=department)

        location = params.get("location")
        if location:
            queryset = queryset.filter(location__icontains=location)

        remote_policy = params.get("remote_policy")
        if remote_policy:
            queryset = queryset.filter(remote_policy=remote_policy)

        return queryset

    def perform_create(self, serializer):
        job = serializer.save(
            organization=get_recruiter_organization(self.request),
            created_by=self.request.user,
        )
        AuditLog.log(
            action="job.created",
            user=self.request.user,
            entity=job,
            ip_address=self.request.META.get("REMOTE_ADDR"),
        )


class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsVerifiedRecruiter]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        organization = get_recruiter_organization(self.request)
        return (
            Job.objects.filter(organization=organization)
            .annotate(application_count=Count("applications"))
            .select_related("organization", "created_by")
        )

    def perform_update(self, serializer):
        job = serializer.save()
        if "status" in serializer.validated_data:
            if job.status == Job.Status.PUBLISHED and not job.published_at:
                job.publish()
            elif job.status == Job.Status.DRAFT:
                job.unpublish()
            elif job.status == Job.Status.CLOSED:
                job.close()
            elif job.status == Job.Status.ARCHIVED:
                job.archive()
        AuditLog.log(
            action="job.updated",
            user=self.request.user,
            entity=job,
            ip_address=self.request.META.get("REMOTE_ADDR"),
        )

    def destroy(self, request, *args, **kwargs):
        job = self.get_object()
        job.archive()
        AuditLog.log(
            action="job.archived",
            user=request.user,
            entity=job,
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class JobPublishView(views.APIView):
    permission_classes = [IsVerifiedRecruiter]

    def post(self, request, pk, *args, **kwargs):
        job = generics.get_object_or_404(
            Job,
            pk=pk,
            organization=get_recruiter_organization(request),
        )
        serializer = JobSerializer(job, data={"status": Job.Status.PUBLISHED}, partial=True)
        serializer.is_valid(raise_exception=True)
        job.publish()
        AuditLog.log(
            action="job.published",
            user=request.user,
            entity=job,
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return Response(JobSerializer(job).data)


class JobUnpublishView(views.APIView):
    permission_classes = [IsVerifiedRecruiter]

    def post(self, request, pk, *args, **kwargs):
        job = generics.get_object_or_404(
            Job,
            pk=pk,
            organization=get_recruiter_organization(request),
        )
        job.unpublish()
        AuditLog.log(
            action="job.unpublished",
            user=request.user,
            entity=job,
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return Response(JobSerializer(job).data)


class JobCloseView(views.APIView):
    permission_classes = [IsVerifiedRecruiter]

    def post(self, request, pk, *args, **kwargs):
        job = generics.get_object_or_404(
            Job,
            pk=pk,
            organization=get_recruiter_organization(request),
        )
        job.close()
        AuditLog.log(
            action="job.closed",
            user=request.user,
            entity=job,
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return Response(JobSerializer(job).data)


class JobArchiveView(views.APIView):
    permission_classes = [IsVerifiedRecruiter]

    def post(self, request, pk, *args, **kwargs):
        job = generics.get_object_or_404(
            Job,
            pk=pk,
            organization=get_recruiter_organization(request),
        )
        job.archive()
        AuditLog.log(
            action="job.archived",
            user=request.user,
            entity=job,
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return Response(JobSerializer(job).data)


class PublicJobListView(generics.ListAPIView):
    serializer_class = PublicJobSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Job.objects.filter(status=Job.Status.PUBLISHED).select_related("organization")
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(title__icontains=search)
        return queryset


class PublicJobDetailView(generics.RetrieveAPIView):
    serializer_class = PublicJobSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return Job.objects.filter(status=Job.Status.PUBLISHED).select_related("organization")


class PublicJobApplyView(generics.CreateAPIView):
    serializer_class = PublicApplicationCreateSerializer
    permission_classes = [AllowAny]

    def dispatch(self, request, *args, **kwargs):
        self.job = generics.get_object_or_404(
            Job.objects.select_related("organization"),
            pk=kwargs["pk"],
            status=Job.Status.PUBLISHED,
        )
        return super().dispatch(request, *args, **kwargs)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["job"] = self.job
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        AuditLog.log(action="application.created", entity=application)
        return Response(
            ApplicationSerializer(application).data,
            status=status.HTTP_201_CREATED,
        )
