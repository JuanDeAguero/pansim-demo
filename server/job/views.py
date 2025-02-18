from .models import Job
from .permissions import IsEditor
from .permissions import IsOwner
from .permissions import IsReader
from .permissions import permissions
from .serializers import JobPermissionsSerializer
from .serializers import JobSerializer
from .serializers import JobStatusChangeSerializer
from datetime import datetime
from django.db import transaction
from django.db.models import Avg, F
from django.shortcuts import get_object_or_404
from django.utils.timezone import make_aware
from job.serializers import serializers
from morpop import settings
from rest_framework import generics, filters
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from rest_framework.views import APIView
from simulation.models import SimulationResult, AggregatePopulationData, HealthAuthorityData, HomeCommunityData
from simulation.serializers import SimulationResultSerializer
from users.models import User
import boto3
import logging
import numpy as np
import os
import sys
import sys

class JobSimulationResultsView(APIView):
    permission_classes = [IsAuthenticated]

class JobSimulationResultsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, pk, format=None):

        instance_number = request.query_params.get("instance_number")
        health_authority_id = request.query_params.get("health_authority_id")
        home_community_id = request.query_params.get("home_community_id")
        include_population = request.query_params.get("include_population")
        simulation_results = SimulationResult.objects.filter(job_id=pk)

        if instance_number in ["average", "median", "percentile25", "percentile75"]:

            population_data = []
            health_authority_data = []
            home_community_data = []

            if include_population == "1":
                population_data = AggregatePopulationData.objects.filter(simulation_result__in=simulation_results).values(
                    "population_hazard_rates_data__day",
                    "population_hazard_rates_data__susceptible",
                    "population_hazard_rates_data__infectious",
                    "population_hazard_rates_data__dead",
                    "population_hazard_rates_data__vaccinated",
                    "population_hazard_rates_data__hospitalized",
                    "population_hazard_rates_data__removed").order_by("population_hazard_rates_data__day")

            if health_authority_id:
                health_authority_data = HealthAuthorityData.objects.filter(simulation_result__in=simulation_results).values(
                    "hazard_rates_data__day",
                    "hazard_rates_data__susceptible",
                    "hazard_rates_data__infectious",
                    "hazard_rates_data__dead",
                    "hazard_rates_data__vaccinated",
                    "hazard_rates_data__hospitalized",
                    "hazard_rates_data__recovered",
                    "hazard_rates_data__removed").order_by("hazard_rates_data__day")

            if home_community_id:
                community_ids = home_community_id.split(",")[:10]
                home_community_data = HomeCommunityData.objects.filter(simulation_result__in=simulation_results, sim_home_community_id__in=community_ids).values(
                    "hazard_rates_data__day",
                    "hazard_rates_data__susceptible",
                    "hazard_rates_data__infectious",
                    "hazard_rates_data__dead",
                    "hazard_rates_data__vaccinated",
                    "hazard_rates_data__hospitalized",
                    "hazard_rates_data__recovered",
                    "hazard_rates_data__removed").order_by("hazard_rates_data__day")

            def calculate_statistics(data, stat_func):
                days = list(set(data["population_hazard_rates_data__day"] for data in data))
                days.sort()
                statistics_data = []
                for day in days:
                    day_data = [data for data in data if data["population_hazard_rates_data__day"] == day]
                    statistics_data.append({
                        "day": day,
                        "susceptible": stat_func([data["population_hazard_rates_data__susceptible"] for data in day_data]),
                        "infectious": stat_func([data["population_hazard_rates_data__infectious"] for data in day_data]),
                        "dead": stat_func([data["population_hazard_rates_data__dead"] for data in day_data]),
                        "vaccinated": stat_func([data["population_hazard_rates_data__vaccinated"] for data in day_data]),
                        "hospitalized": stat_func([data["population_hazard_rates_data__hospitalized"] for data in day_data]),
                        "removed": stat_func([data["population_hazard_rates_data__removed"] for data in day_data]),
                    })
                return statistics_data

            def stat_func_factory(stat):
                if stat == "average":
                    return np.mean
                elif stat == "median":
                    return np.median
                elif stat == "percentile25":
                    return lambda x: np.percentile(x, 25)
                elif stat == "percentile75":
                    return lambda x: np.percentile(x, 75)

            stat_func = stat_func_factory(instance_number)

            average_population_data = calculate_statistics(population_data, stat_func) if include_population == "1" else []
            average_health_authority_data = calculate_statistics(health_authority_data, stat_func) if health_authority_id else []
            average_home_community_data = calculate_statistics(home_community_data, stat_func) if home_community_id else []

            average_data = {
                "average_population_data": average_population_data,
                "average_health_authority_data": average_health_authority_data,
                "average_home_community_data": average_home_community_data,
            }
            serializer = SimulationResultSerializer(simulation_results, many=True, context={
                "is_average": True,
                **average_data
            })
            return Response(serializer.data)

        else:
            if instance_number != "all":
                simulation_results = [simulation_results[int(instance_number)]]
            serializer = SimulationResultSerializer(simulation_results, many=True, context={
                "health_authority_id": health_authority_id,
                "home_community_id": home_community_id,
                "include_population": True if include_population == "1" else False,
                "is_average": False
            })
            return Response(serializer.data)

class JobListCreateAPIView(generics.ListCreateAPIView):

    permission_classes = [IsAuthenticated]
    serializer_class = JobSerializer
    pagination_class = PageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    ordering_fields = ["id"]

    def get_queryset(self):
        if self.request.query_params["shared"] == "1":
            queryset = self.request.user.readable_jobs.all()
        elif self.request.query_params["shared"] == "2":
            queryset = self.request.user.editable_jobs.all()
        else:
            queryset = Job.objects.filter(owner=self.request.user)
        queryset = queryset.filter(status__in=self.request.query_params["statuses"].split(","))
            
        #statuses = self.request.GET.get("include", None)
        #if statuses is not None:
        #    statuses = statuses.split(",")
        #    queryset = queryset.filter(status__in=statuses)
        #exclude_statuses = self.request.GET.get("exclude", None)
        #if exclude_statuses is not None:
        #    exclude_statuses = exclude_statuses.split(",")
        #    queryset = queryset.exclude(status__in=exclude_statuses)

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        if not "test" in sys.argv:
            job_ids = [job.batch_job_id for job in queryset if job.batch_job_id]
            if job_ids:  # Check if job_ids is not empty
                batch = boto3.client("batch")
                response = batch.describe_jobs(jobs=job_ids)
                job_status = {
                    job["jobId"]: {
                        "status": job["status"],
                        "start_time": (
                            make_aware(datetime.fromtimestamp(job.get("startedAt", None) / 1000))
                            if "startedAt" in job
                            else None
                        ),
                        "end_time": (
                            make_aware(datetime.fromtimestamp(job.get("stoppedAt", None) / 1000))
                            if "stoppedAt" in job
                            else None
                        )
                    }
                    for job in response["jobs"]
                }
                with transaction.atomic():
                    for job in queryset:
                        if job.batch_job_id and job.batch_job_id in job_status:
                            job.status = job_status[job.batch_job_id]["status"]
                            job.start_time = job_status[job.batch_job_id]["start_time"]
                            job.end_time = job_status[job.batch_job_id]["end_time"]
                            job.save(update_fields=["status", "start_time", "end_time"])
        return super().list(request, *args, **kwargs)

    def perform_create(self, serializer):
        number_of_simulations = self.request.data.get("number_of_simulations")
        if number_of_simulations is None:
            raise ValidationError("number_of_simulations is required")
        
        vcpus = 4
        memory_mb = 8192
        
        if int(number_of_simulations) <= 50:
            vcpus = 4
            memory_mb = 8192  # 8 GB in MB
        elif int(number_of_simulations) <= 100:
            vcpus = 8
            memory_mb = 16384  # 16 GB in MB
        else:
            vcpus = 16  # Maximum vCPUs allowed by environment
            memory_mb = 32768  # 32 GB in MB
    
        job = serializer.save(owner=self.request.user, number_of_simulations=number_of_simulations)
    
        if not "test" in sys.argv:
            batch = boto3.client("batch")
            overrrides = {
                "environment": [
                    {
                        "name": "BUCKET_NAME",
                        "value": settings.AWS_STORAGE_BUCKET_NAME
                    },
                    {
                        "name": "JOB_CONFIG_ID",
                        "value": str(job.job_configuration_id)
                    },
                    {
                        "name": "JOB_ID",
                        "value": str(job.id)
                    },
                    {
                        "name": "NUMBER_OF_SIMULATIONS",
                        "value": str(job.number_of_simulations)
                    },
                    {
                        "name": "ROOT_FILE",
                        "value": str(job.job_configuration.root_file.name)
                    }
                ],
                "resourceRequirements": [
                    {
                        "value": str(vcpus),
                        "type": "VCPU"
                    },
                    {
                        "value": str(memory_mb),
                        "type": "MEMORY"
                    }
                ]
            }
            env = os.getenv("env")
            response = batch.submit_job(jobName=job.name, jobQueue=f"pansim-{env}-job-queue",
                jobDefinition=f"pansim-{env}-simulation-job-definition", containerOverrides=overrrides)
            job.batch_job_id = response["jobId"]
        else:
            job.batch_job_id = "test aws batch id"
        job.save()
        logging.debug("Batch job submitted. Id: %s", job.batch_job_id)

class JobRetrieveDestroyAPIView(generics.RetrieveDestroyAPIView):

    permission_classes = [IsAuthenticated]
    serializer_class = JobSerializer

    def get_queryset(self):
        owned_jobs = Job.objects.filter(owner=self.request.user)
        readable_jobs = self.request.user.readable_jobs.all()
        queryset = (owned_jobs | readable_jobs).distinct()
        return queryset

    def retrieve(self, request, *args, **kwargs):
        job = self.get_object()
        if not "test" in sys.argv:
            try:
                batch = boto3.client("batch")
                response = batch.describe_jobs(jobs=[job.batch_job_id])
                job.start_time = (
                    make_aware(datetime.fromtimestamp(response["jobs"][0].get("startedAt") / 1000))
                    if "startedAt" in response["jobs"][0]
                    else None
                )
                job.end_time = (
                    make_aware(
                        datetime.fromtimestamp(response["jobs"][0].get("stoppedAt", None) / 1000))
                    if "stoppedAt" in response["jobs"][0]
                    else None
                )
                job.status = response["jobs"][0]["status"]
                job.log_stream_name = response["jobs"][0]["container"]["logStreamName"]
                job.save()
            except:
                print("Error retrieving job") 
        return super().retrieve(request, *args, **kwargs)

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated(), IsReader()]
        else:
            return [IsAuthenticated(), IsEditor()]

class StreamAPIView(generics.GenericAPIView):
    
    permission_classes = [IsAuthenticated, IsReader]
    queryset = Job.objects.all()

    def get(self, request, *args, **kwargs):
        job = self.get_object()
        return Response({ "message": "Placeholder for the stream route" })

class CommandAPIView(generics.GenericAPIView):

    permission_classes = [IsAuthenticated, IsEditor]
    queryset = Job.objects.all()

    def post(self, request, *args, **kwargs):
        job = self.get_object()
        serializer = serializers.JobCommandSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            serializer.update(job, serializer.validated_data)
            return Response({
                "message": "Placeholder for the command route",
                "updated job status": job.status
            })
        except ValidationError as error:
            return Response({ "message": str(error.detail) }, status=400)

class JobPermissionsView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsEditor]
    queryset = Job.objects.all()
    serializer_class = JobPermissionsSerializer

class JobStatusChangeView(generics.GenericAPIView):

    #permission_classes = [IsAuthenticated, IsEditor]
    queryset = Job.objects.all()
    serializer_class = JobStatusChangeSerializer

    def patch(self, request, *args, **kwargs):
        job = self.get_object()
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            serializer.update(job, serializer.validated_data)
            return Response({
                "message": "Job status updated successfully",
                "status": job.status
            })
        except ValidationError as error:
            return Response({ "message": str(error.detail) }, status=400)
        
class JobGrantViewAccessView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, pk, format=None):
        job = get_object_or_404(Job, pk=pk)
        user_id = request.data.get("user_id")

        if not user_id:
            return Response({"detail": "user_id is required"}, status=400)

        if int(user_id) == int(job.owner.id):
            return Response({"detail": "User is owner"}, status=400)
        
        if not (job.owner.pk == request.user.pk or job.editors.filter(pk=request.user.pk).exists()):
            return Response({"detail": "User is not editor"}, status=400)
        
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)
        if user not in job.readers.all():
            job.readers.add(user)
            job.editors.remove(user)
            job.save()
            return Response({"detail": "View access granted"}, status=200)
        else:
            return Response({"detail": "User already has view access"}, status=400)
        
class JobGrantEditAccessView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, pk, format=None):
        job = get_object_or_404(Job, pk=pk)
        user_id = request.data.get("user_id")

        if not user_id:
            return Response({"detail": "user_id is required"}, status=400)
        
        if int(user_id) == int(job.owner.id):
            return Response({"detail": "User is owner"}, status=400)
        
        if not (job.owner.pk == request.user.pk or job.editors.filter(pk=request.user.pk).exists()):
            return Response({"detail": "User is not editor"}, status=400)
        
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)
        if user not in job.editors.all():
            job.editors.add(user)
            job.readers.remove(user)
            job.save()
            return Response({"detail": "Edit access granted"}, status=200)
        else:
            return Response({"detail": "User already has edit access"}, status=400)
        
class JobGrantNoAccessView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, pk, format=None):
        job = get_object_or_404(Job, pk=pk)
        user_id = request.data.get("user_id")
        
        if not user_id:
            return Response({"detail": "user_id is required"}, status=400)
        
        if int(user_id) == int(job.owner.id):
            return Response({"detail": "User is owner"}, status=400)

        if not (job.owner.pk == request.user.pk or job.editors.filter(pk=request.user.pk).exists()):
            return Response({"detail": "User is not editor"}, status=400)
        
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)
        job.readers.remove(user)
        job.editors.remove(user)
        job.save()
        return Response({"detail": "Access removed"}, status=200)