from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0009_blackoutdate_maintenance_type_blackoutdate_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='facility',
            name='image',
            field=models.FileField(blank=True, null=True, upload_to='facilities/'),
        ),
    ]
