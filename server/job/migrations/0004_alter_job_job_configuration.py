# Generated by Django 5.0 on 2024-02-13 19:00

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('job', '0003_alter_job_job_configuration'),
    ]

    operations = [
        migrations.AlterField(
            model_name='job',
            name='job_configuration',
            field=models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.PROTECT, to='job.jobconfiguration'),
        ),
    ]
