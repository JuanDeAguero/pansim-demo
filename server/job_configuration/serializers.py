from django.core.files.base import ContentFile
from django.db import models
from io import BytesIO
from job_configuration.models import File
from job_configuration.models import JobConfiguration
from required_file.models import RequiredFile
from rest_framework import serializers
from zipfile import ZipFile

class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = [
            "id",
            "file",
            "name",
            "job_configuration",
            "created_at"
        ]
        read_only_fields = fields

def match_actual_and_expected_files(actual_files, expected_files):
    diff = expected_files.difference(actual_files)
    if len(diff) > 0:
        raise serializers.ValidationError(
            f"Please include all required files in the 'files' field! Missing: {diff}")
    diff = actual_files.difference(expected_files)
    if len(diff) > 0:
        raise serializers.ValidationError(f"Please remove files {diff} from the 'files' filed.")

class MultipleFilesSerializer(serializers.ListField):
    child = serializers.FileField(required=True)

class JobConfigurationDetailsSerializer(serializers.ModelSerializer):

    files = FileSerializer(many=True, required=True)
    root_file = FileSerializer(required=True)

    class Meta:
        model = JobConfiguration
        fields = [
            "id",
            "number_of_simulations",
            "root_file",
            "scenario_name",
            "description",
            "files",
            "owner",
            "last_updated",
            "created_at",
        ]
        read_only_fields = fields

class JobConfigurationSerializer(serializers.ModelSerializer):

    files = MultipleFilesSerializer(required=True, write_only=True)
    root_file = serializers.FileField(required=True)

    class Meta:
        model = JobConfiguration
        fields = [
            "id",
            "scenario_name",
            "description",
            "root_file",
            "number_of_simulations",
            "files",
            "owner",
            "last_updated",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "owner",
            "last_updated",
            "created_at"
        ]
        extra_kwargs = {
            #"number_of_simulations": { "required": True },
            "scenario_name": { "required": True }
        }

    def validate_files(self, files):
        if not files:
            raise serializers.ValidationError("No files provided")
        return files

    def create(self, validated_data):
        files = validated_data.pop("files")
        root_file = validated_data.pop("root_file")
        job_configuration = JobConfiguration.objects.create(**validated_data,
            owner=self.context["request"].user)
        root_file_obj = File.objects.create(file=root_file, name=root_file.name,
            job_configuration=job_configuration)
        job_configuration.root_file = root_file_obj
        job_configuration.save()
        for file in files:
            File.objects.create(file=file, name=file.name, job_configuration=job_configuration)

        try:
            files_zip = self.context["request"].data.get("files_zip")
            with ZipFile(files_zip, 'r') as zf:
                for file_info in zf.infolist():
                    file_name = file_info.filename.split('/').pop()
                    if not file_info.is_dir() and not file_name.startswith("._"):
                        with zf.open(file_info) as file_data:
                            file_bytes = file_data.read()
                            file_obj = File(file=ContentFile(file_bytes, name=file_name), name=file_name, job_configuration=job_configuration)
                            file_obj.save()
        except Exception as e:
            print(f"Error processing ZIP file: {e}")
            raise serializers.ValidationError("Error processing ZIP file")
    
        return job_configuration

    def update(self, instance, validated_data):
        return instance
        files = validated_data.pop("files")
        root_file = validated_data.pop("root_file")
        instance = super().update(instance, validated_data)
        instance.files.all().delete()
        File.objects.bulk_create([
            File(file=file, name=file.name, job_configuration=instance)
            for file in files
        ])
        root_file_obj = File.objects.create(file=root_file, name=root_file.name,
            job_configuration=instance)
        instance.root_file = root_file_obj
        instance.save()
        return instance

    def to_representation(self, instance):
        ret = {
            "id": instance.id,
            "owner": instance.owner.id,
            "number_of_simulations": instance.number_of_simulations,
            "scenario_name": instance.scenario_name,
            "description": instance.description,
            "root_file": FileSerializer(instance.root_file).data,
            "files": FileSerializer(instance.files.all(), many=True).data,
            "created_at": instance.created_at,
            "last_updated": instance.last_updated
        }
        return ret

class JobConfigurationBasicDetailsSerializer(serializers.ModelSerializer):

    class Meta:
        model = JobConfiguration
        fields = [
            "id",
            "scenario_name",
            "description"
        ]
        read_only_fields = ["id"]
    
    def update(self, instance, validated_data):
        scenario_name = validated_data.get("scenario_name", instance.scenario_name)
        instance.scenario_name = scenario_name
        instance.save()
        return instance