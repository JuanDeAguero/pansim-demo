from django.shortcuts import get_object_or_404
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from simulation.models import SimulationResult
from simulation.permissions import HasAccessToViewSimulationResults
from simulation.serializers import SimulationResultPopulationDataSerializer
from simulation.serializers import SimulationResultSerializer

class GetSimulationResult(RetrieveAPIView):

    serializer_class = SimulationResultSerializer
    queryset = SimulationResult.objects.all()
    permission_classes = [IsAuthenticated, HasAccessToViewSimulationResults]

    def get_object(self):
        obj = get_object_or_404(SimulationResult, id=self.kwargs["id"])
        self.check_object_permissions(self.request, obj)
        return obj

class GetSimulationResultAggregate(RetrieveAPIView):

    serializer_class = SimulationResultPopulationDataSerializer
    queryset = SimulationResult.objects.all()
    permission_classes = [IsAuthenticated, HasAccessToViewSimulationResults]

    def get_object(self):
        obj = get_object_or_404(SimulationResult, id=self.kwargs["id"])
        self.check_object_permissions(self.request, obj)
        return obj