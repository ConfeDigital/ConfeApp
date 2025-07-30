import os
from django.db.models.signals import pre_save, post_delete
from django.dispatch import receiver
from .models import CommunicationPost

@receiver(post_delete, sender=CommunicationPost)
def delete_attachment_on_delete(sender, instance, **kwargs):
    if instance.attachment and os.path.isfile(instance.attachment.path):
        os.remove(instance.attachment.path)

@receiver(pre_save, sender=CommunicationPost)
def delete_old_attachment_on_update(sender, instance, **kwargs):
    if not instance.pk:
        return  # Skip on creation

    try:
        old_instance = CommunicationPost.objects.get(pk=instance.pk)
    except CommunicationPost.DoesNotExist:
        return

    old_file = old_instance.attachment
    new_file = instance.attachment

    if old_file and old_file != new_file and os.path.isfile(old_file.path):
        os.remove(old_file.path)
