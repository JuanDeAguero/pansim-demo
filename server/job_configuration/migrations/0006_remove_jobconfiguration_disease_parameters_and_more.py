# Generated by Django 5.0 on 2024-02-12 01:26

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("job_configuration", "0005_jobconfiguration_test_file_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="jobconfiguration",
            name="disease_parameters",
        ),
        migrations.RemoveField(
            model_name="jobconfiguration",
            name="test_file",
        ),
        migrations.RemoveField(
            model_name="jobconfiguration",
            name="test_file2",
        ),
    ]
