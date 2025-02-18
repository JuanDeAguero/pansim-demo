from .models import JobConfiguration
from .serializers import JobConfigurationSerializer
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client
from django.test import TestCase
from django.urls import reverse
from required_file.models import RequiredFile
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from rest_framework.test import force_authenticate
from users.models import User
import copy

class JobConfigurationTestCase(APITestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="testuser", password="testpassword")
        self.client.force_authenticate(self.user)
        self.list_create_url = reverse("job_configuration:list-create")
        self.get_update_destroy_url = lambda id: reverse("job_configuration:get-update-destroy",
            args=[id])
        self.required_file = RequiredFile.objects.create(name="test.txt", description="A test file")
        file = SimpleUploadedFile("test.txt", b"file_content", content_type="text/plain")
        root_file = SimpleUploadedFile("root_file.txt", b"file_content", content_type="text/plain")
        self.job_configuration_data = {
            "number_of_simulations": 10,
            "scenario_name": "Test Scenario",
            "files": [file],
            "root_file": root_file,
        }

    #def test_create_job_configuration(self):
    #    response = self.client.post(self.list_create_url, self.job_configuration_data)
    #    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    #    self.assertEqual(JobConfiguration.objects.count(), 1)
    #    self.assertEqual(JobConfiguration.objects.get().number_of_simulations,
    #        self.job_configuration_data["number_of_simulations"])
    #    self.assertEqual(response.data["root_file"]["name"],
    #        self.job_configuration_data["root_file"].name)

    def test_get_job_configuration(self):
        response = self.client.post(self.list_create_url, self.job_configuration_data)
        job_configuration = JobConfiguration.objects.get()
        response = self.client.get(self.get_update_destroy_url(job_configuration.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["owner"], job_configuration.owner.id)
        self.assertEqual(response.data["scenario_name"], job_configuration.scenario_name)
        self.assertEqual(response.data["number_of_simulations"],
            job_configuration.number_of_simulations)
        response_files = response.data["files"]
        job_configuration_files = job_configuration.files.all()
        self.assertEqual(len(response_files), job_configuration_files.count())
        for response_file, job_configuration_file in zip(response_files, job_configuration_files):
            self.assertEqual(response_file["name"], job_configuration_file.name)

    def test_delete_job_configuration(self):
        self.client.post(self.list_create_url, self.job_configuration_data)
        job_configuration = JobConfiguration.objects.get()
        new_user = User.objects.create_user(username="newuser", password="newpassword")
        self.client.force_authenticate(new_user)
        response = self.client.delete(self.get_update_destroy_url(job_configuration.id))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(self.user)
        response = self.client.delete(self.get_update_destroy_url(job_configuration.id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    #def test_update_job_configuration(self):
    #    # Create a JobConfiguration instance
    #    self.client.post(self.list_create_url, self.job_configuration_data)
    #    job_configuration = JobConfiguration.objects.get()
    #    updated_data = copy.deepcopy(self.job_configuration_data)
    #    updated_data["number_of_simulations"] = 200
    #    updated_data["scenario_name"] = "Updated Scenario"
    #    updated_data["files"] = [
    #        SimpleUploadedFile("test.txt", b"file_content", content_type="text/plain")
    #    ]
    #    updated_data["root_file"] = SimpleUploadedFile("root_file.txt", b"file_content",
    #        content_type="text/plain")
    #    response = self.client.put(self.get_update_destroy_url(job_configuration.id), updated_data)
    #    if response.status_code >= 400:
    #        print(response.data)
    #    self.assertEqual(response.status_code, status.HTTP_200_OK)
    #    self.assertEqual(response.data["number_of_simulations"],
    #        updated_data["number_of_simulations"])
    #    self.assertEqual(response.data["scenario_name"], updated_data["scenario_name"])
    #    response_files = response.data["files"]
    #    job_configuration_files = job_configuration.files.all()
    #    self.assertEqual(len(response_files), job_configuration_files.count())
    #    for response_file, job_configuration_file in zip(response_files, job_configuration_files):
    #        self.assertEqual(response_file["name"], job_configuration_file.name)
    #    self.assertEqual(response.data["root_file"]["name"], updated_data["root_file"].name)

    #def test_create_job_configuration_with_invalid_data(self):
    #    invalid_data = {
    #        "number_of_simulations": "invalid",  # Invalid data
    #        "scenario_name": "Test Scenario",
    #    }
    #    response = self.client.post(self.list_create_url, invalid_data)
    #    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    #    self.assertEqual(response.data["number_of_simulations"][0].code, "invalid")
    #    self.assertEqual(response.data["files"][0].code, "required")

    #def test_update_job_configuration_with_invalid_data(self):
    #    self.client.post(self.list_create_url, self.job_configuration_data)
    #    job_configuration = JobConfiguration.objects.get()
    #    invalid_data = copy.deepcopy(self.job_configuration_data)
    #    invalid_data["number_of_simulations"] = "invalid"  # Invalid data
    #    response = self.client.put(self.get_update_destroy_url(job_configuration.id), invalid_data)
    #    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    #    self.assertEqual(response.data["number_of_simulations"][0].code, "invalid")
    #    self.assertEqual(response.data["files"][0][0].code, "empty")

    #def test_update_job_configuration_without_required_data(self):
    #    self.client.post(self.list_create_url, self.job_configuration_data)
    #    job_configuration = JobConfiguration.objects.get()
    #    required_data = copy.deepcopy(self.job_configuration_data)
    #    del required_data["files"]  # Remove required data
    #    response = self.client.put(self.get_update_destroy_url(job_configuration.id), required_data)
    #    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    #    self.assertEqual(response.data["files"][0].code, "required")