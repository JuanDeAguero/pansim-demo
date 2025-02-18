from django.db import models
from morpop import settings
from users.models import User
import boto3
import sys

class JobConfiguration(models.Model):
    
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    number_of_simulations = models.IntegerField(default=0)
    scenario_name = models.CharField(max_length=200, default="")
    root_file = models.ForeignKey("File", on_delete=models.CASCADE, related_name="root_file",
        null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    description = models.CharField(max_length=800, default="job configuration description")

    def delete(self, using=None, keep_parents=False):
        # If testing, bypass S3
        if not "test" in sys.argv:
            s3 = boto3.resource("s3")
            bucket = s3.Bucket(name=settings.AWS_STORAGE_BUCKET_NAME)
            prefix = "parameters/{}/".format(self.id)
            for obj in bucket.objects.filter(Prefix=prefix):
                obj.delete()
        self.job_set.all().delete()
        super().delete(using=using, keep_parents=keep_parents)

class File(models.Model):

    def upload_file_path(instance, filename):
        return "/".join(["parameters", str(instance.job_configuration.id), filename])

    file = models.FileField(upload_to=upload_file_path)
    name = models.CharField(max_length=1000)
    job_configuration = models.ForeignKey(JobConfiguration, on_delete=models.CASCADE,
        related_name="files")
    created_at = models.DateTimeField(auto_now_add=True)