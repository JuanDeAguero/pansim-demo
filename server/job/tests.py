from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from job_configuration.models import JobConfiguration
from job.models import Job
from required_file.models import RequiredFile
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase

User = get_user_model()

class JobNameValidationTests(APITestCase):

    def setUp(self):

        self.client = APIClient()
        self.user = User.objects.create_user(username="testuser", password="testpassword123")
        self.client.force_authenticate(user=self.user)

        # Create test job configuration
        self.required_file = RequiredFile.objects.create(name="test.txt", description="A test file")
        file = SimpleUploadedFile("test.txt", b"file_content", content_type="text/plain")
        self.job_config = JobConfiguration.objects.create(owner=self.user, number_of_simulations=10,
            scenario_name="Test Scenario")
        self.create_job_url = reverse("job:job-list-create")

    def test_create_job_with_spaces_in_name_fails(self):
        """ Ensure job cannot be created with spaces in the name. """
        job = {
            "name": "Invalid Name",
            "job_configuration": self.job_config.pk
        }
        response = self.client.post(self.create_job_url, job, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data)

    #def test_create_job_with_valid_name_passes(self):
    #    """ Ensure creating a job with a valid name succeeds. """
    #    job = {
    #        "name": "ValidJobName",
    #        "job_configuration": self.job_config.pk
    #    }
    #    response = self.client.post(self.create_job_url, job, format="json")
    #    self.assertEqual(response.status_code, status.HTTP_201_CREATED)