import os
from django.db.models.signals import pre_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from .models import CommunicationPost, ForumFile

@receiver(post_delete, sender=CommunicationPost)
def delete_attachment_on_delete(sender, instance, **kwargs):
    if instance.attachment:
        # Check if we're using cloud storage (Azure)
        using_cloud_storage = (
            hasattr(settings, "STORAGES")
            and settings.STORAGES.get("default", {}).get("BACKEND")
               == "storages.backends.azure_storage.AzureStorage"
        )
        
        if using_cloud_storage:
            # For cloud storage, use the storage's delete method
            try:
                instance.attachment.delete(save=False)
            except Exception as e:
                # Log the error but don't raise it to avoid breaking the deletion
                print(f"Error deleting attachment from cloud storage: {e}")
        else:
            # For local storage, use the traditional file system approach
            try:
                if os.path.isfile(instance.attachment.path):
                    os.remove(instance.attachment.path)
            except (NotImplementedError, AttributeError):
                # If path is not available, try using the storage's delete method
                try:
                    instance.attachment.delete(save=False)
                except Exception as e:
                    print(f"Error deleting attachment: {e}")

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

    if old_file and old_file != new_file:
        # Check if we're using cloud storage (Azure)
        using_cloud_storage = (
            hasattr(settings, "STORAGES")
            and settings.STORAGES.get("default", {}).get("BACKEND")
               == "storages.backends.azure_storage.AzureStorage"
        )
        
        if using_cloud_storage:
            # For cloud storage, use the storage's delete method
            try:
                old_file.delete(save=False)
            except Exception as e:
                # Log the error but don't raise it to avoid breaking the update
                print(f"Error deleting old attachment from cloud storage: {e}")
        else:
            # For local storage, use the traditional file system approach
            try:
                if os.path.isfile(old_file.path):
                    os.remove(old_file.path)
            except (NotImplementedError, AttributeError):
                # If path is not available, try using the storage's delete method
                try:
                    old_file.delete(save=False)
                except Exception as e:
                    print(f"Error deleting old attachment: {e}")

@receiver(post_delete, sender=ForumFile)
def delete_forum_file_on_delete(sender, instance, **kwargs):
    if instance.file:
        # Check if we're using cloud storage (Azure)
        using_cloud_storage = (
            hasattr(settings, "STORAGES")
            and settings.STORAGES.get("default", {}).get("BACKEND")
               == "storages.backends.azure_storage.AzureStorage"
        )
        
        if using_cloud_storage:
            # For cloud storage, use the storage's delete method
            try:
                instance.file.delete(save=False)
            except Exception as e:
                # Log the error but don't raise it to avoid breaking the deletion
                print(f"Error deleting forum file from cloud storage: {e}")
        else:
            # For local storage, use the traditional file system approach
            try:
                if os.path.isfile(instance.file.path):
                    os.remove(instance.file.path)
            except (NotImplementedError, AttributeError):
                # If path is not available, try using the storage's delete method
                try:
                    instance.file.delete(save=False)
                except Exception as e:
                    print(f"Error deleting forum file: {e}")

@receiver(pre_save, sender=ForumFile)
def delete_old_forum_file_on_update(sender, instance, **kwargs):
    if not instance.pk:
        return  # Skip on creation

    try:
        old_instance = ForumFile.objects.get(pk=instance.pk)
    except ForumFile.DoesNotExist:
        return

    old_file = old_instance.file
    new_file = instance.file

    if old_file and old_file != new_file:
        # Check if we're using cloud storage (Azure)
        using_cloud_storage = (
            hasattr(settings, "STORAGES")
            and settings.STORAGES.get("default", {}).get("BACKEND")
               == "storages.backends.azure_storage.AzureStorage"
        )
        
        if using_cloud_storage:
            # For cloud storage, use the storage's delete method
            try:
                old_file.delete(save=False)
            except Exception as e:
                # Log the error but don't raise it to avoid breaking the update
                print(f"Error deleting old forum file from cloud storage: {e}")
        else:
            # For local storage, use the traditional file system approach
            try:
                if os.path.isfile(old_file.path):
                    os.remove(old_file.path)
            except (NotImplementedError, AttributeError):
                # If path is not available, try using the storage's delete method
                try:
                    old_file.delete(save=False)
                except Exception as e:
                    print(f"Error deleting old forum file: {e}")
