from .models import RequiredFile
from .serializers import RequiredFileSerializer
from django.shortcuts import render
from morpop.settings import DEBUG
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

class ListOrCreateRequiredFiles(generics.ListCreateAPIView):
    serializer_class = RequiredFileSerializer
    queryset = RequiredFile.objects.all()
    permission_classes = [IsAuthenticated]

class RetrieveUpdateDestroyRequiredFile(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RequiredFileSerializer
    queryset = RequiredFile.objects.all()
    permission_classes = [IsAuthenticated]