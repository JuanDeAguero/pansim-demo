# Generated by Django 5.0 on 2024-02-13 18:03

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='JobConfiguration',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name='Job',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('status', models.CharField(choices=[('QUEUED', 'QUEUED'), ('RUNNING', 'RUNNING'), ('FINISHED', 'FINISHED'), ('FAILED', 'FAILED')], default='QUEUED', max_length=10)),
                ('queue_time', models.DateTimeField(default=None, null=True)),
                ('start_time', models.DateTimeField(default=None, null=True)),
                ('end_time', models.DateTimeField(default=None, null=True)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('job_configuration', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='job.jobconfiguration')),
            ],
        ),
    ]
