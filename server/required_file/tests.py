from .models import RequiredFile
from .serializers import RequiredFileSerializer
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from users.models import User

class RequiredFilesTestCase(APITestCase):

    def setUp(self):
        self.client = APIClient()
        self.list_create_url = reverse("required_file:list-create")
        self.user = User.objects.create_user(username="testuser", password="testpassword")
        self.client.force_authenticate(self.user)
        self.get_update_destroy_url = lambda id: reverse("required_file:get-update-destroy",
            args=[id])
        self.required_file_data = {
            "name": "test.txt",
            "description": "Test file is absolutely required!"
        }

    def test_create_required_file(self):
        response = self.client.post(self.list_create_url, self.required_file_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(RequiredFile.objects.count(), 1)
        self.assertEqual(RequiredFile.objects.get().name, self.required_file_data["name"])

    def test_get_required_file(self):
        response = self.client.post(self.list_create_url, self.required_file_data)
        required_file = RequiredFile.objects.get()
        response = self.client.get(self.get_update_destroy_url(required_file.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data, RequiredFileSerializer(required_file).data)

    def test_update_required_file(self):
        response = self.client.post(self.list_create_url, self.required_file_data)
        required_file = RequiredFile.objects.get()
        updated_data = {
            "name": "updated.txt",
            "description": "A new description"
        }
        response = self.client.put(self.get_update_destroy_url(required_file.id), updated_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["name"], updated_data["name"])

    def test_delete_required_file(self):
        response = self.client.post(self.list_create_url, self.required_file_data)
        required_file = RequiredFile.objects.get()
        response = self.client.delete(self.get_update_destroy_url(required_file.id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT, response.data)

    def test_create_required_file_with_invalid_data(self):
        invalid_data = {
            "name": "",
            "description": ""
        }
        response = self.client.post(self.list_create_url, invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertEqual(response.data["name"][0].code, "blank")
        self.assertEqual(response.data["description"][0].code, "blank")

    def test_create_required_file_with_missing_field(self):
        invalid_data = { "name": "hello" }
        response = self.client.post(self.list_create_url, invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertEqual(response.data["description"][0].code, "required")

    def test_required_file_permissions(self):
        self.client.post(self.list_create_url, self.required_file_data)
        required_file = RequiredFile.objects.get()
        self.client.logout()
        response = self.client.post(self.list_create_url, self.required_file_data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, response.data)
        response = self.client.get(self.get_update_destroy_url(required_file.id))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        response = self.client.put(self.get_update_destroy_url(required_file.id),
            self.required_file_data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        response = self.client.delete(self.get_update_destroy_url(required_file.id))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)