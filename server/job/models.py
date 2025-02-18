from django.db import models
from job_configuration.models import JobConfiguration
from users.models import User

class Job(models.Model):

    NOT_QUEUED = "NOT_QUEUED"
    QUEUED = "QUEUED"
    FINISHED = "FINISHED"

    SUBMITTED = "SUBMITTED"
    PENDING = "PENDING"
    RUNNABLE = "RUNNABLE"
    STARTING = "STARTING"
    RUNNING = "RUNNING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"

    JOB_STATUS_CHOICES = [
        (NOT_QUEUED, "NOT_QUEUED"),
        (QUEUED, "QUEUED"),
        (FINISHED, "FINISHED"),
        
        (SUBMITTED, "SUBMITTED"),
        (PENDING, "PENDING"),
        (RUNNABLE, "RUNNABLE"),
        (STARTING, "STARTING"),
        (RUNNING, "RUNNING"),
        (SUCCEEDED, "SUCCEEDED"),
        (FAILED, "FAILED")
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    readers = models.ManyToManyField(User, related_name="readable_jobs", blank=True)
    editors = models.ManyToManyField(User, related_name="editable_jobs", blank=True)
    status = models.CharField(choices=JOB_STATUS_CHOICES, default=NOT_QUEUED, max_length=10)
    start_time = models.DateTimeField(null=True, default=None)
    end_time = models.DateTimeField(null=True, default=None)
    job_configuration = models.ForeignKey(JobConfiguration, on_delete=models.PROTECT)
    batch_job_id = models.CharField(max_length=200, blank=True, null=True)
    log_stream_name = models.CharField(max_length=200, blank=True, null=True)
    number_of_simulations = models.IntegerField(default=0)