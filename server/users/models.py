from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    color_id = models.IntegerField(null=True, blank=True)