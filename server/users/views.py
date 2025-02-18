from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from users.models import User
from users.permissions import IsNotAuthenticated
from users.permissions import IsOwner
from users.serializers import ChangePasswordSerializer
from users.serializers import UpdateUserSerializer
from users.serializers import UserCreationSerializer
from users.serializers import UserSerializer

class CreateUser(generics.CreateAPIView):
    serializer_class = UserCreationSerializer
    permission_classes = [IsNotAuthenticated]

class RetrieveOrUpdateOrDestroyUser(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = UserSerializer
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated, IsOwner]

    def get_object(self):
        return self.request.user

class ViewUser(generics.RetrieveAPIView):

    serializer_class = UserSerializer
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]

    def get_object(self):
        self.check_object_permissions(self.request, self.request.user)
        return get_object_or_404(User, id=self.kwargs["pk"])

class ChangePassword(generics.UpdateAPIView):
    
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_object(self):
        return self.request.user
    
class CustomPagination(PageNumberPagination):
    page_size = 100
    
class ListUsers(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPagination 

class UpdateUser(generics.UpdateAPIView):

    queryset = User.objects.all()
    serializer_class = UpdateUserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user