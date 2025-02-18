from rest_framework import serializers
from simulation.models import AggregatePopulationData
from simulation.models import HazardRatesData
from simulation.models import HealthAuthorityData
from simulation.models import HomeCommunityData
from simulation.models import PopulationHazardRatesData
from simulation.models import SimulationResult

class PopulationHazardRatesDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = PopulationHazardRatesData
        fields = [
            "day",
            "susceptible",
            "infectious",
            "dead",
            "vaccinated",
            "hospitalized",
            "removed"
        ]

class AggregatePopulationDataSerializer(serializers.ModelSerializer):

    population_hazard_rates_data = PopulationHazardRatesDataSerializer(many=True, read_only=True)

    class Meta:
        model = AggregatePopulationData
        fields = [
            "id",
            "population_hazard_rates_data"
        ]

class HazardRatesDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = HazardRatesData
        fields = [
            "day",
            "susceptible",
            "infectious",
            "recovered",
            "dead",
            "vaccinated",
            "hospitalized",
            "removed"
        ]

class HealthAuthorityDataSerializer(serializers.ModelSerializer):

    hazard_rates_data = HazardRatesDataSerializer(many=True, read_only=True)

    class Meta:
        model = HealthAuthorityData
        fields = [
            "sim_health_authority_id",
            "hazard_rates_data"
        ]

class HomeCommunityDataSerializer(serializers.ModelSerializer):

    hazard_rates_data = HazardRatesDataSerializer(many=True, read_only=True)

    class Meta:
        model = HomeCommunityData
        fields = [
            "sim_home_community_id",
            "hazard_rates_data"
        ]

class SimulationResultPopulationDataSerializer(serializers.ModelSerializer):

    aggregate_population_data = AggregatePopulationDataSerializer(many=True, read_only=True)

    class Meta:
        model = SimulationResult
        fields = [
            "id",
            "job",
            "aggregate_population_data",
        ]

class SimulationResultSerializer(serializers.ModelSerializer):
    
    health_authority_data = serializers.SerializerMethodField()
    home_community_data = serializers.SerializerMethodField()
    aggregate_population_data = serializers.SerializerMethodField()
    is_average = serializers.SerializerMethodField()

    class Meta:
        model = SimulationResult
        fields = [
            "id",
            "job",
            "health_authority_data",
            "home_community_data",
            "aggregate_population_data",
            "is_average"
        ]

    def get_is_average(self, instance):
        return self.context.get("is_average", False)

    def get_health_authority_data(self, instance):
        if self.get_is_average(instance):
            return self.context.get("average_health_authority_data", [])
        else:
            health_authority_id = self.context.get("health_authority_id")
            if health_authority_id:
                if health_authority_id == "all":
                    return HealthAuthorityDataSerializer(instance.health_authority_data.all(), many=True, read_only=True).data
                return HealthAuthorityDataSerializer(instance.health_authority_data.filter(sim_health_authority_id=health_authority_id), many=True, read_only=True).data
            return []

    def get_home_community_data(self, instance):
        if self.get_is_average(instance):
            return self.context.get("average_home_community_data", [])
        else:
            home_community_id = self.context.get("home_community_id")
            if home_community_id:
                return HomeCommunityDataSerializer(instance.home_community_data.filter(sim_home_community_id=home_community_id), many=True, read_only=True).data
            return []

    def get_aggregate_population_data(self, instance):
        if self.get_is_average(instance):
            return self.context.get("average_population_data", [])
        else:
            include_population = self.context.get("include_population")
            if include_population:
                return AggregatePopulationDataSerializer(instance.aggregate_population_data.all(), many=True, read_only=True).data
            return []