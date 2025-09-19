# agencia/signals.py

import os
from django.db.models.signals import pre_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from .models import Company

@receiver(post_delete, sender=Company)
def delete_logo_on_delete(sender, instance, **kwargs):
    if instance.logo:
        # Check if we're using cloud storage (Azure)
        using_cloud_storage = (
            hasattr(settings, "STORAGES")
            and settings.STORAGES.get("default", {}).get("BACKEND")
               == "storages.backends.azure_storage.AzureStorage"
        )
        
        if using_cloud_storage:
            # For cloud storage, use the storage's delete method
            try:
                instance.logo.delete(save=False)
            except Exception as e:
                # Log the error but don't raise it to avoid breaking the deletion
                print(f"Error deleting company logo from cloud storage: {e}")
        else:
            # For local storage, use the traditional file system approach
            try:
                if os.path.isfile(instance.logo.path):
                    os.remove(instance.logo.path)
            except (NotImplementedError, AttributeError):
                # If path is not available, try using the storage's delete method
                try:
                    instance.logo.delete(save=False)
                except Exception as e:
                    print(f"Error deleting company logo: {e}")

@receiver(pre_save, sender=Company)
def delete_old_logo_on_update(sender, instance, **kwargs):
    if not instance.pk:
        return  # Skip on creation

    try:
        old_instance = Company.objects.get(pk=instance.pk)
    except Company.DoesNotExist:
        return

    old_file = old_instance.logo
    new_file = instance.logo

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
                print(f"Error deleting old company logo from cloud storage: {e}")
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
                    print(f"Error deleting old company logo: {e}")
