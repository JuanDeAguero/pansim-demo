from .views import CommandAPIView
from .views import JobGrantEditAccessView
from .views import JobGrantNoAccessView
from .views import JobGrantViewAccessView
from .views import JobListCreateAPIView
from .views import JobPermissionsView
from .views import JobRetrieveDestroyAPIView
from .views import JobSimulationResultsView
from .views import JobStatusChangeView
from .views import StreamAPIView
from django.urls import path

app_name = "job"

urlpatterns = [
    path("", JobListCreateAPIView.as_view(), name="job-list-create"),
    path("<int:pk>", JobRetrieveDestroyAPIView.as_view(), name="job-retrieve-destroy"),
    path("<int:pk>/stream", StreamAPIView.as_view(), name="stream"),
    path("<int:pk>/command", CommandAPIView.as_view(), name="command"),
    path("<int:pk>/permissions", JobPermissionsView.as_view(), name="permissions"),
    path("<int:pk>/results", JobSimulationResultsView.as_view(), name="results"),
    path("<int:pk>/status/change", JobStatusChangeView.as_view(), name="status-change"),
    path("<int:pk>/grant/view", JobGrantViewAccessView.as_view(), name="grant-view-access"),
    path("<int:pk>/grant/edit", JobGrantEditAccessView.as_view(), name="grant-edit-access"),
    path("<int:pk>/grant/none", JobGrantNoAccessView.as_view(), name="grant-no-access")
]