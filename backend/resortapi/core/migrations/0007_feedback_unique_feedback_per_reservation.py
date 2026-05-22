from django.db import migrations, models


def detach_duplicate_feedback_reservations(apps, schema_editor):
    Feedback = apps.get_model('core', 'Feedback')

    duplicate_reservation_ids = (
        Feedback.objects
        .exclude(reservation__isnull=True)
        .values_list('reservation_id', flat=True)
        .distinct()
    )

    for reservation_id in duplicate_reservation_ids:
        linked_feedback = list(
            Feedback.objects
            .filter(reservation_id=reservation_id)
            .order_by('submitted_at', 'id')
            .values_list('id', flat=True)
        )

        if len(linked_feedback) <= 1:
            continue

        Feedback.objects.filter(id__in=linked_feedback[1:]).update(reservation=None)


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_alter_facility_options_alter_reservation_valid_id'),
    ]

    operations = [
        migrations.RunPython(detach_duplicate_feedback_reservations, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name='feedback',
            constraint=models.UniqueConstraint(condition=models.Q(('reservation__isnull', False)), fields=('reservation',), name='unique_feedback_per_reservation'),
        ),
    ]
