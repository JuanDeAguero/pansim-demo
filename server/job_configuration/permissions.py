from rest_framework import permissions
import logging

class IsOwnerOrReaderOrEditor(permissions.BasePermission):
    
    def has_object_permission(self, request, view, obj):
        logger = logging.getLogger(__name__)
        logger.debug(request.user, obj.owner)
        if request.method in permissions.SAFE_METHODS:
            has_access = obj.owner == request.user or obj.job_set.filter(readers=request.user).exists() or obj.job_set.filter(editors=request.user).exists()
            return has_access
        return obj.owner == request.user or obj.job_set.filter(editors=request.user).exists()