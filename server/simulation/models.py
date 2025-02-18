from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.fields import GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.db import models
from job.models import Job

class AggregatePopulationData(models.Model):
    simulation_result = models.ForeignKey("SimulationResult", on_delete=models.CASCADE,
        related_name="aggregate_population_data")

class HazardRatesData(models.Model):
    day = models.IntegerField()
    susceptible = models.IntegerField()
    infectious = models.IntegerField()
    recovered = models.IntegerField()
    dead = models.IntegerField()
    vaccinated = models.IntegerField()
    hospitalized = models.IntegerField()
    removed = models.IntegerField()
    associated_data_type = models.ForeignKey(ContentType, on_delete=models.CASCADE,
        limit_choices_to=models.Q(app_label="simulation", model="healthauthoritydata")
            | models.Q(app_label="simulation", model="homecommunitydata"))
    associated_data_id = models.PositiveIntegerField()
    associated_data = GenericForeignKey("associated_data_type", "associated_data_id")

class HealthAuthorityData(models.Model):
    simulation_result = models.ForeignKey("SimulationResult", on_delete=models.CASCADE,
        related_name="health_authority_data")
    sim_health_authority_id = models.IntegerField()
    hazard_rates_data = GenericRelation(HazardRatesData, content_type_field="associated_data_type",
        object_id_field="associated_data_id", related_query_name="health_authority_data")

class HomeCommunityData(models.Model):
    simulation_result = models.ForeignKey("SimulationResult", on_delete=models.CASCADE,
        related_name="home_community_data")
    sim_home_community_id = models.IntegerField()
    hazard_rates_data = GenericRelation(HazardRatesData, content_type_field="associated_data_type",
        object_id_field="associated_data_id", related_query_name="home_community_data")

class PopulationHazardRatesData(models.Model):
    aggregate_population_data = models.ForeignKey(AggregatePopulationData, on_delete=models.CASCADE,
        related_name="population_hazard_rates_data")
    day = models.IntegerField()
    susceptible = models.IntegerField()
    infectious = models.IntegerField()
    dead = models.IntegerField()
    vaccinated = models.IntegerField()
    hospitalized = models.IntegerField()
    removed = models.IntegerField()

class SimulationResult(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE)