# communications/signals.py

import os
from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver
from .models import UserProfile	

@receiver(post_delete, sender=UserProfile)
def delete_photo_on_delete(sender, instance, **kwargs):
    if instance.photo and os.path.isfile(instance.photo.path):
        os.remove(instance.photo.path)

@receiver(pre_save, sender=UserProfile)
def delete_old_photo_on_update(sender, instance, **kwargs):
    if not instance.pk:
        return  # Skip on creation

    try:
        old_instance = UserProfile.objects.get(pk=instance.pk)
    except UserProfile.DoesNotExist:
        return

    old_file = old_instance.photo
    new_file = instance.photo

    if old_file and old_file != new_file and os.path.isfile(old_file.path):
        os.remove(old_file.path)