from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_payment_payment_method'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='facility',
            options={'ordering': ['room_type', 'name'], 'verbose_name_plural': 'Facilities'},
        ),
        migrations.AlterField(
            model_name='reservation',
            name='valid_id',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
    ]
