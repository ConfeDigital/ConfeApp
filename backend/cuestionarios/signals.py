# cuestionarios/signals.py

import os
from django.db.models.signals import pre_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from .models import ImagenOpcion

@receiver(post_delete, sender=ImagenOpcion)
def delete_imagen_on_delete(sender, instance, **kwargs):
    if instance.imagen:
        # Check if we're using cloud storage (Azure)
        using_cloud_storage = (
            hasattr(settings, "STORAGES")
            and settings.STORAGES.get("default", {}).get("BACKEND")
               == "storages.backends.azure_storage.AzureStorage"
        )
        
        if using_cloud_storage:
            # For cloud storage, use the storage's delete method
            try:
                instance.imagen.delete(save=False)
            except Exception as e:
                # Log the error but don't raise it to avoid breaking the deletion
                print(f"Error deleting imagen from cloud storage: {e}")
        else:
            # For local storage, use the traditional file system approach
            try:
                if os.path.isfile(instance.imagen.path):
                    os.remove(instance.imagen.path)
            except (NotImplementedError, AttributeError):
                # If path is not available, try using the storage's delete method
                try:
                    instance.imagen.delete(save=False)
                except Exception as e:
                    print(f"Error deleting imagen: {e}")

@receiver(pre_save, sender=ImagenOpcion)
def delete_old_imagen_on_update(sender, instance, **kwargs):
    if not instance.pk:
        return  # Skip on creation

    try:
        old_instance = ImagenOpcion.objects.get(pk=instance.pk)
    except ImagenOpcion.DoesNotExist:
        return

    old_file = old_instance.imagen
    new_file = instance.imagen

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
                print(f"Error deleting old imagen from cloud storage: {e}")
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
                    print(f"Error deleting old imagen: {e}")
