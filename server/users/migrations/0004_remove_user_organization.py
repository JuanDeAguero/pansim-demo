# Generated by Django 5.0 on 2024-03-04 20:36

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_alter_user_groups_alter_user_user_permissions'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='organization',
        ),
    ]
