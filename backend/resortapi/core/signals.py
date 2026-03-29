from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import UserProfile


@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    role = 'admin' if instance.is_superuser else 'staff' if instance.is_staff else 'client'
    profile, profile_created = UserProfile.objects.get_or_create(
        user=instance,
        defaults={
            'role': role,
            'phone': '',
            'address': ''
        }
    )

    if not profile_created and instance.is_superuser and profile.role != 'admin':
        profile.role = 'admin'
        profile.save()
