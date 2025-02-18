from rest_framework.permissions import BasePermission

def IsAdminOfOrganization(BasePermission):

    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        organization = view.kwargs.get("organization")
        return (organization != None and
            organization.members.filter(user=request.user, is_admin=True).exists())