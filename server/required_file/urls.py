from .views import ListOrCreateRequiredFiles
from .views import RetrieveUpdateDestroyRequiredFile
from django.urls import path

app_name = "required_file"

urlpatterns = [
    path("", ListOrCreateRequiredFiles.as_view(), name="list-create"),
    path("<int:pk>", RetrieveUpdateDestroyRequiredFile.as_view(), name="get-update-destroy")
]