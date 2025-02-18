from django.urls import path
from simulation.views import GetSimulationResult
from simulation.views import GetSimulationResultAggregate

app_name = "simulation"

urlpatterns = [
    path("<int:id>/results", GetSimulationResult.as_view(), name="simulation-result-detail"),
    path("<int:id>/results/aggregate", GetSimulationResultAggregate.as_view(),
        name="simulation-result-detail-aggregate")
]