from job_configuration.serializers import JobConfigurationBasicDetailsSerializer
from job.models import Job
from rest_framework import serializers
from rest_framework.serializers import ValidationError
from users.models import User
from users.serializers import UserSerializer

class JobSerializer(serializers.ModelSerializer):

    class Meta:
        model = Job
        fields = "__all__"
        read_only_fields = [
            "id",
            "readers",
            "editors",
            "status",
            "log_stream_name",
            "queue_time",
            "start_time",
            "owner",
            "end_time",
            "batch_job_id"
        ]

    def validate_name(self, value):
        if " " in value:
            raise ValidationError("Job name cannot contain spaces")
        return value

    def create(self, validated_data):
        return Job.objects.create(**validated_data)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get("request")
        if request and request.method == "GET":
            representation["owner"] = UserSerializer(instance.owner).data
            representation["job_configuration"] = (
                JobConfigurationBasicDetailsSerializer(instance.job_configuration).data)
        return representation

class JobPermissionsSerializer(serializers.Serializer):

    user_id = serializers.IntegerField(write_only=True)
    permission_level = serializers.ChoiceField(choices=["none", "read", "edit"], write_only=True)
    readers = UserSerializer(many=True, read_only=True)
    editors = UserSerializer(many=True, read_only=True)

    def update(self, instance, validated_data):
        user_id = validated_data.get("user_id")
        permission_level = validated_data.get("permission_level")
        user = User.objects.get(id=user_id)
        if permission_level == "none":
            instance.readers.remove(user)
            instance.editors.remove(user)
        elif permission_level == "read":
            instance.readers.add(user)
            instance.editors.remove(user)
        elif permission_level == "edit":
            instance.readers.add(user)
            instance.editors.add(user)
        instance.save()
        return instance


class JobCommandSerializer(serializers.Serializer):

    COMMAND_CHOICES = ["START", "STOP"]
    command = serializers.ChoiceField(choices=COMMAND_CHOICES)

    def update(self, instance, validated_data):
        command = validated_data.get("command")
        if command == "START":
            instance.status = Job.QUEUED
        elif command == "STOP":
            instance.status = Job.NOT_QUEUED
        else:
            raise ValidationError("Invalid command. Command must be START or STOP")
        instance.save()
        return instance
    
class JobStatusChangeSerializer(serializers.ModelSerializer):

    details = serializers.DictField()

    class Meta:
        model = Job
        fields = ["details"]
        
    def validate_status(self, value):
        #if value not in [choice[0] for choice in Job.JOB_STATUS_CHOICES]:
        #    raise serializers.ValidationError("Invalid status")
        return value
    
    def update(self, instance, validated_data):
        instance.status = validated_data["details"]["status"]
        instance.save(update_fields=["status"])
        return instance