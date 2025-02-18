from .models import File
from .models import JobConfiguration
from .permissions import IsOwnerOrReaderOrEditor
from .serializers import JobConfigurationBasicDetailsSerializer
from .serializers import JobConfigurationDetailsSerializer
from .serializers import JobConfigurationSerializer
from django.db.models import Q
from django.shortcuts import render
from morpop.settings import DEBUG
from rest_framework import generics
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.generics import ListCreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

class ListOrCreateJobConfiguration(ListCreateAPIView):

    serializer_class = JobConfigurationSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return JobConfigurationDetailsSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        user = self.request.user
        return JobConfiguration.objects.filter(Q(owner=user)).distinct()

class GetOrUpdateOrDestroyJobConfiguration(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = JobConfigurationBasicDetailsSerializer
    queryset = JobConfiguration.objects.all()
    permission_classes = [IsAuthenticated, IsOwnerOrReaderOrEditor]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return JobConfigurationDetailsSerializer
        return super().get_serializer_class()

    def get_object(self):
        obj = get_object_or_404(JobConfiguration, id=self.kwargs["id"])
        self.check_object_permissions(self.request, obj)
        return obj
    
class FileUploadView(APIView):

    permission_classes = [IsAuthenticated, IsOwnerOrReaderOrEditor]

    def post(self, request, id):
        job_configuration = self.get_object(id)
        root_file = request.FILES.get("root_file")
        if root_file:
            new_root_file = File.objects.create(file=root_file, name=root_file.name, job_configuration=job_configuration)
            job_configuration.root_file = new_root_file
            job_configuration.save()
        files = request.FILES.getlist("files")
        if files:
            for file in files:
                File.objects.create(file=file, name=file.name, job_configuration=job_configuration)
        return Response("Files uploaded successfully", status=status.HTTP_201_CREATED)

    def get_object(self, id):
        return get_object_or_404(JobConfiguration, id=id)
    
class FileDeleteView(APIView):

    permission_classes = [IsAuthenticated, IsOwnerOrReaderOrEditor]

    def delete(self, request, file_id):
        file_instance = get_object_or_404(File, id=file_id)
        file_instance.delete()
        return Response("File deleted successfully", status=status.HTTP_204_NO_CONTENT)