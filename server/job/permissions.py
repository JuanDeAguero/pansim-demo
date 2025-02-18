from rest_framework import permissions

class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user

class IsEditor(IsOwner):
    def has_object_permission(self, request, view, obj):
        return super().has_object_permission(request, view, obj) or \
            obj.editors.filter(pk=request.user.pk).exists()

class IsReader(IsOwner):
    def has_object_permission(self, request, view, obj):
        return super().has_object_permission(request, view, obj) or \
            obj.readers.filter(pk=request.user.pk).exists()