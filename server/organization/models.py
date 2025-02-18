from django.db import models
from users.models import User

class Organization(models.Model):
    name = models.CharField(max_length=200)

class OrganizationMembership(models.Model):
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="organizations")
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="members")
    is_admin = models.BooleanField(default=False)

    class Meta:
        unique_together = ("user", "organization")
        verbose_name = "Organization Memberships"