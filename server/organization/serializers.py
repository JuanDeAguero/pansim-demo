from organization.models import Organization
from rest_framework import serializers

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = [
            "id",
            "name"
        ]
        read_only_fields = ["id"]