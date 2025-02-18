from rest_framework.permissions import BasePermission

class IsOwner(BasePermission):
    
    message = "Forbidden Access"

    def has_object_permission(self, request, view, obj):
        return request.user == obj

class IsNotAuthenticated(BasePermission):

    message = "You are already logged in"

    def has_permission(self, request, view):
        return not request.user.is_authenticated