"""
Utility functions for API operations
"""
import os
from datetime import datetime, timedelta
from azure.storage.blob import generate_blob_sas, BlobSasPermissions
from django.conf import settings


def generate_media_sas_url(blob_path, expiry_hours=1):
    """
    Generate a SAS URL for a media file in Azure Storage
    Only works when using Azure Storage (deployment environment)
    
    Args:
        blob_path (str): Path to the blob in the container (e.g., "uploads/image.jpg")
        expiry_hours (int): Hours until the SAS token expires (default: 1)
    
    Returns:
        str: Full URL with SAS token, or None if not using Azure Storage or configuration is missing
    """
    # Check if we're using Azure Storage
    using_azure_storage = (
        hasattr(settings, 'STORAGES') and 
        settings.STORAGES.get('default', {}).get('BACKEND') == 'storages.backends.azure_storage.AzureStorage'
    )
    
    if not using_azure_storage:
        return None
    
    try:
        account_name = "saconfevm"
        account_key = os.getenv('AZURE_STORAGE_KEY')
        container_name = os.getenv('AZURE_CONTAINER', 'media')

        if not account_key:
            return None

        # Generate SAS token
        sas_token = generate_blob_sas(
            account_name=account_name,
            container_name=container_name,
            blob_name=blob_path,
            account_key=account_key,
            permission=BlobSasPermissions(read=True),
            expiry=datetime.utcnow() + timedelta(hours=expiry_hours)
        )

        # Return full URL with SAS token
        return f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_path}?{sas_token}"

    except Exception as e:
        print(f"Error generating SAS URL: {e}")
        return None


def get_media_url_with_sas(file_field):
    """
    Helper function to get SAS URL from a Django FileField/ImageField
    
    Args:
        file_field: Django FileField or ImageField instance
    
    Returns:
        str: SAS URL or None if file doesn't exist
    """
    if not file_field or not file_field.name:
        return None
    
    return generate_media_sas_url(file_field.name)