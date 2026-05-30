from django.urls import path

from . import views

urlpatterns = [
    path("public/", views.PublicJobListView.as_view(), name="public-job-list"),
    path("public/<slug:slug>/", views.PublicJobDetailView.as_view(), name="public-job-detail"),
    path("", views.JobListCreateView.as_view(), name="job-list"),
    path("<uuid:pk>/", views.JobDetailView.as_view(), name="job-detail"),
    path("<uuid:pk>/apply/", views.PublicJobApplyView.as_view(), name="job-apply"),
    path("<uuid:pk>/publish/", views.JobPublishView.as_view(), name="job-publish"),
    path("<uuid:pk>/unpublish/", views.JobUnpublishView.as_view(), name="job-unpublish"),
    path("<uuid:pk>/close/", views.JobCloseView.as_view(), name="job-close"),
    path("<uuid:pk>/archive/", views.JobArchiveView.as_view(), name="job-archive"),
]
