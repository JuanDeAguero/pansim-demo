from required_file.models import RequiredFile
from rest_framework import serializers

class RequiredFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequiredFile
        fields = [
            "id",
            "name",
            "description",
            "created_at"
        ]
        read_only_fields = [
            "id",
            "created_at"
        ]