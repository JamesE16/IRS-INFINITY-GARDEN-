from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_reservation_is_archived'),
    ]

    operations = [
        migrations.AddField(
            model_name='blackoutdate',
            name='maintenance_type',
            field=models.CharField(
                choices=[
                    ('maintenance', 'Maintenance'),
                    ('deep_cleaning', 'Deep Cleaning'),
                    ('general_cleaning', 'General Cleaning'),
                    ('repair', 'Repair'),
                    ('inspection', 'Inspection'),
                    ('renovation', 'Renovation'),
                ],
                default='maintenance',
                max_length=40,
            ),
        ),
        migrations.AddField(
            model_name='blackoutdate',
            name='status',
            field=models.CharField(
                choices=[
                    ('scheduled', 'Scheduled'),
                    ('in_progress', 'In Progress'),
                    ('finished', 'Finished'),
                ],
                default='scheduled',
                max_length=20,
            ),
        ),
    ]
