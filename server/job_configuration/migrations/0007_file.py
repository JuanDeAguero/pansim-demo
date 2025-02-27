# Generated by Django 5.0 on 2024-02-12 01:35

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        (
            "job_configuration",
            "0006_remove_jobconfiguration_disease_parameters_and_more",
        ),
    ]

    operations = [
        migrations.CreateModel(
            name="File",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("file", models.FileField(upload_to="files/")),
                ("name", models.CharField(max_length=1000)),
                (
                    "job_configuration",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="job_configuration.jobconfiguration",
                    ),
                ),
            ],
        ),
    ]
