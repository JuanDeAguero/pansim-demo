# Generated by Django 5.0 on 2024-03-23 20:11

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("job_configuration", "0009_remove_jobconfiguration_input_dir_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RenameField(
            model_name="jobconfiguration",
            old_name="simulation_days",
            new_name="number_of_simulations",
        ),
        migrations.AddField(
            model_name="jobconfiguration",
            name="root_file",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="root_file",
                to="job_configuration.file",
            ),
        ),
        migrations.AlterField(
            model_name="jobconfiguration",
            name="owner",
            field=models.ForeignKey(
                default=1,
                on_delete=django.db.models.deletion.CASCADE,
                to=settings.AUTH_USER_MODEL,
            ),
            preserve_default=False,
        ),
    ]
