# Generated by Django 5.0 on 2024-03-08 21:39

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('job', '0008_alter_job_job_configuration'),
        ('job_configuration', '0009_remove_jobconfiguration_input_dir_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='job',
            name='job_configuration',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.PROTECT, to='job_configuration.jobconfiguration'),
            preserve_default=False,
        ),
    ]
