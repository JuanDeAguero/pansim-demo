from .views import FileDeleteView
from .views import FileUploadView
from .views import GetOrUpdateOrDestroyJobConfiguration
from .views import ListOrCreateJobConfiguration
from django.urls import path

app_name = "job_configuration"

urlpatterns = [
    path("", ListOrCreateJobConfiguration.as_view(), name="list-create"),
    path("<int:id>", GetOrUpdateOrDestroyJobConfiguration.as_view(), name="get-update-destroy"),
    path("<int:id>/upload", FileUploadView.as_view(), name="file-upload"),
    path("file/<int:file_id>/delete", FileDeleteView.as_view(), name="file-delete")
]