from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

User = get_user_model()

class UserTests(APITestCase):

    def setUp(self):
        self.test_user = User.objects.create_user(username="testuser", email="test@example.com",
            password="testpassword")
        self.create_url = reverse("users:user-create") 
        self.me_url = reverse("users:user-profile") 
        self.change_password_url = reverse("users:user-change-password") 

    def test_create_user(self):
        """ Ensure we can create a new user. """
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "newpassword123",
            "password2": "newpassword123"
        }
        response = self.client.post(self.create_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 2)
        self.assertEqual(User.objects.latest("id").username, "newuser")

    def test_user_retrieve_update_delete_profile(self):
        """ Ensure user can retrieve, update, and delete their profile. """
        self.client.force_authenticate(user=self.test_user)
        # Retrieve profile
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], self.test_user.username)
        # Update profile
        new_email = "updated@example.com"
        response = self.client.patch(self.me_url, {"email": new_email}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(User.objects.get(username="testuser").email, new_email)        
        # Delete profile
        response = self.client.delete(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(User.objects.filter(username="testuser").count(), 0)

    def test_change_password(self):
        """ Ensure user can change their password. """
        self.client.force_authenticate(user=self.test_user)
        data = {
            "password": "newpassword123",
            "password2": "newpassword123"
        }
        response = self.client.put(self.change_password_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(self.client.login(username="testuser", password="newpassword123"))

    def test_retrieve_user_profile_unauthenticated(self):
        """ Ensure unauthenticated users cannot retrieve a user profile. """
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED) 

    def test_delete_user_profile_unauthenticated(self):
        """ Ensure unauthenticated users cannot delete a user profile. """
        response = self.client.delete(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)  

    def test_create_user_with_mismatched_passwords(self):
        """ Ensure we cannot create a user with invalid data (mismatched passwords). """
        data = {
            "username": "userwithbaddata",
            "email": "user@example.com",
            "password": "ComplexPassword123!",
            "password2": "DifferentComplexPassword123!" 
        }
        response = self.client.post(self.create_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Passwords must match", response.data["non_field_errors"])

    def test_create_user_with_missing_fields(self):
        """ Ensure we cannot create a user with missing fields. """
        data = { "username": "incompleteuser" }
        response = self.client.post(self.create_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)
        self.assertIn("password", response.data)

class ViewUserTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@example.com",
            password="testpassword")
        self.another_user = User.objects.create_user(username="anotheruser",
            email="another@example.com", password="anotherpassword")
        self.user_detail_url = lambda pk: reverse("users:user-detail", kwargs={"pk": pk})

    def test_view_user_details_authenticated(self):
        """ Ensure an authenticated user can view another user"s details. """
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.user_detail_url(self.another_user.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], self.another_user.username)

    def test_view_user_details_unauthenticated(self):
        """ Ensure an unauthenticated user cannot view user details. """
        response = self.client.get(self.user_detail_url(self.another_user.pk))
        # Adjust the expected status code based on your permission settings
        self.assertIn(response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_view_nonexistent_user(self):
        """ Ensure that the request for a nonexistent user"s details fails. """
        self.client.force_authenticate(user=self.user)
        # Assuming the next pk in sequence does not exist
        nonexistent_user_pk = max(self.user.pk, self.another_user.pk) + 1
        response = self.client.get(self.user_detail_url(nonexistent_user_pk))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)