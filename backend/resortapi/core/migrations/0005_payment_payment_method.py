import uuid
from django.db import migrations, models


def backfill_missing_payments(apps, schema_editor):
    Reservation = apps.get_model('core', 'Reservation')
    Payment = apps.get_model('core', 'Payment')

    for reservation in Reservation.objects.all():
        if Payment.objects.filter(reservation=reservation).exists():
            continue

        Payment.objects.create(
            reservation=reservation,
            amount=reservation.total_amount,
            payment_method='bank_transfer',
            reference_number=f"PAY-{reservation.reservation_id}-{uuid.uuid4().hex[:6].upper()}",
            verification_status='pending',
        )


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_roomtype_alter_facility_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='payment',
            name='payment_method',
            field=models.CharField(
                choices=[
                    ('gcash', 'GCash'),
                    ('bank_transfer', 'Bank Transfer'),
                    ('cash', 'Cash'),
                    ('card', 'Card'),
                ],
                default='bank_transfer',
                max_length=30,
            ),
        ),
        migrations.RunPython(backfill_missing_payments, migrations.RunPython.noop),
    ]
