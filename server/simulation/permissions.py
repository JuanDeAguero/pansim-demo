from rest_framework.permissions import BasePermission
from organization.models import OrganizationMembership

class HasAccessToViewSimulationResults(BasePermission):

    def has_object_permission(self, request, view, obj):
        user = request.user
        job = obj.job
        owner_membership = OrganizationMembership.objects.filter(user=job.owner,
            is_admin=True).first()
        if owner_membership:
            organization = owner_membership.organization
            user_is_admin = OrganizationMembership.objects.filter(user=user,
                organization=organization, is_admin=True).exists()
        else:
            user_is_admin = False
        return (job.owner == user or user in job.readers.all() or user in job.editors.all() or
            user_is_admin)