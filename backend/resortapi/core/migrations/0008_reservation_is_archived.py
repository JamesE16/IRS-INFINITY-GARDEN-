from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_feedback_unique_feedback_per_reservation'),
    ]

    operations = [
        migrations.AddField(
            model_name='reservation',
            name='is_archived',
            field=models.BooleanField(default=False),
        ),
    ]
