# Generated by Django 5.0 on 2024-03-23 20:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("job", "0011_delete_jobconfiguration"),
    ]

    operations = [
        migrations.AddField(
            model_name="job",
            name="log_stream_name",
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
    ]
