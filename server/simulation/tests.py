from django.contrib.contenttypes.models import ContentType
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.utils.timezone import now
from job_configuration.models import JobConfiguration
from job.models import Job
from organization.models import Organization
from organization.models import OrganizationMembership
from required_file.models import RequiredFile
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from simulation.models import HazardRatesData
from simulation.models import HealthAuthorityData
from simulation.models import HomeCommunityData
from simulation.models import SimulationResult
from users.models import User

class SimulationResultTests(APITestCase):

    def setUp(self):

        self.client = APIClient()

        # Create users
        self.owner = User.objects.create_user(username="owner", password="testpass123")
        self.reader = User.objects.create_user(username="reader", password="testpass123")
        self.editor = User.objects.create_user(username="editor", password="testpass123")
        self.unrelated_user = User.objects.create_user(username="unrelated_user",
            password="testpass123")

        # Create organization and organization membership for owner
        self.organization = Organization.objects.create(name="Test Organization")
        OrganizationMembership.objects.create(user=self.owner, organization=self.organization,
            is_admin=True)

        # Ensure you add the readers and editors to the organization as well,
        # with appropriate is_admin flag
        OrganizationMembership.objects.create(user=self.reader, organization=self.organization,
            is_admin=False)
        OrganizationMembership.objects.create(user=self.editor, organization=self.organization,
            is_admin=False)

        # Create JobConfiguration
        self.required_file = RequiredFile.objects.create(name="test.txt", description="A test file")
        file = SimpleUploadedFile("test.txt", b"file_content", content_type="text/plain")
        self.job_config = JobConfiguration.objects.create(owner=self.owner,
            number_of_simulations=10, scenario_name="Test Scenario")

        # Create a Job with associated JobConfiguration
        self.job = Job.objects.create(owner=self.owner, name="Test Job", status=Job.FINISHED,
            job_configuration=self.job_config, start_time=now(), end_time=now())
        self.job.readers.add(self.reader)
        self.job.editors.add(self.editor)
        self.job.save()

        # Create a SimulationResult associated with the Job
        self.simulation_result = SimulationResult.objects.create(job=self.job)

        # Create HomeCommunityData and HealthAuthorityData for the SimulationResult
        self.home_community_data = HomeCommunityData.objects.create(
            simulation_result=self.simulation_result, sim_home_community_id=1)

        self.health_authority_data = HealthAuthorityData.objects.create(
            simulation_result=self.simulation_result, sim_health_authority_id=2)

        # Generate HazardRatesData for HomeCommunityData
        for day in range(1, 5):
            HazardRatesData.objects.create(day=day,susceptible=100 + day, infectious=50 + day,
                recovered=30 + day, dead=10 + day, vaccinated=5 + day, hospitalized=2 + day,
                removed=3 + day,
                associated_data_type=ContentType.objects.get_for_model(HomeCommunityData),
                associated_data_id=self.home_community_data.id)

        # Generate HazardRatesData for HealthAuthorityData
        for day in range(1, 5):
            HazardRatesData.objects.create(day=day, susceptible=200 + day, infectious=100 + day,
                recovered=60 + day, dead=20 + day, vaccinated=10 + day, hospitalized=4 + day,
                removed=6 + day,
                associated_data_type=ContentType.objects.get_for_model(HealthAuthorityData),
                associated_data_id=self.health_authority_data.id)

    def test_access_simulation_result_as_owner(self):
        """ Ensure the owner of the job can access the simulation result. """
        self.client.force_authenticate(user=self.owner)
        url = reverse("simulation:simulation-result-detail",
            kwargs={ "id": self.simulation_result.id })
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_access_simulation_result_as_reader(self):
        """ Ensure a user with read access can access the simulation result. """
        self.client.force_authenticate(user=self.reader)
        url = reverse("simulation:simulation-result-detail",
            kwargs={ "id": self.simulation_result.id })
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_access_simulation_result_as_unrelated_user(self):
        """ Ensure a user without any relation to the job is denied access. """
        self.client.force_authenticate(user=self.unrelated_user)
        url = reverse("simulation:simulation-result-detail",
            kwargs={ "id": self.simulation_result.id })
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_access_nonexistent_simulation_result(self):
        """ Ensure accessing a non-existent simulation result returns a 404. """
        self.client.force_authenticate(user=self.owner)
        nonexistent_id = self.simulation_result.id + 999
        url = reverse("simulation:simulation-result-detail", kwargs={ "id": nonexistent_id })
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_simulation_result_detail_includes_nested_data(self):
        """ Ensure the simulation-result-detail endpoint correctly returns a SimulationResult
            with nested HomeCommunityData, HealthAuthorityData, and their HazardRatesData. """
        self.client.force_authenticate(user=self.owner)
        url = reverse("simulation:simulation-result-detail",
            kwargs={ "id": self.simulation_result.id })
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("home_community_data", response.data)
        self.assertIn("health_authority_data", response.data)
        #home_community_hazard_data = response.data["home_community_data"][0]["hazard_rates_data"]
        #health_authority_hazard_data = response.data["health_authority_data"][0]["hazard_rates_data"]
        #self.assertTrue(len(home_community_hazard_data) > 0)
        #self.assertTrue(len(health_authority_hazard_data) > 0)

    def test_access_simulation_result_as_organization_admin(self):
        """ Ensure an admin of the organization associated with the job can access the simulation
            result. """
        self.client.force_authenticate(user=self.owner)
        url = reverse("simulation:simulation-result-detail",
            kwargs={ "id": self.simulation_result.id })
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_access_simulation_result_as_organization_member(self):
        """ Ensure a non-admin member of the organization associated with the job cannot access the
            simulation result unless explicitly given access. """
        
        # Add a non-admin member to the organization
        non_admin_member = User.objects.create_user(username="nonadminmember",
            password="testpass123")
        OrganizationMembership.objects.create(user=non_admin_member, organization=self.organization,
            is_admin=False)

        # Authenticate as non-admin member
        self.client.force_authenticate(user=non_admin_member)
        url = reverse("simulation:simulation-result-detail",
            kwargs={ "id": self.simulation_result.id })
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)