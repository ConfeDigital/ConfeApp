"""
Custom serializer fields for API
"""
from rest_framework import serializers
from django.conf import settings
from .utils import get_media_url_with_sas


class SASFileField(serializers.FileField):
    """
    Custom FileField that returns SAS URLs for Azure Storage files in production,
    regular URLs in development
    """
    
    def to_representation(self, value):
        if not value:
            return None
        
        # Only use SAS tokens in production (when using deployment settings)
        # Check if we're using Azure Storage (deployment environment)
        using_azure_storage = (
            hasattr(settings, 'STORAGES') and 
            settings.STORAGES.get('default', {}).get('BACKEND') == 'storages.backends.azure_storage.AzureStorage'
        )
        
        if using_azure_storage:
            # Generate SAS URL for the file
            sas_url = get_media_url_with_sas(value)
            
            # Return SAS URL if generation succeeds, otherwise fallback
            if sas_url:
                return sas_url
        
        # Return the regular URL (development or fallback)
        return value.url if hasattr(value, 'url') else str(value)


class SASImageField(serializers.ImageField):
    """
    Custom ImageField that returns SAS URLs for Azure Storage images in production,
    regular URLs in development
    """
    
    def to_representation(self, value):
        if not value:
            return None
        
        # Only use SAS tokens in production (when using deployment settings)
        # Check if we're using Azure Storage (deployment environment)
        using_azure_storage = (
            hasattr(settings, 'STORAGES') and 
            settings.STORAGES.get('default', {}).get('BACKEND') == 'storages.backends.azure_storage.AzureStorage'
        )
        
        if using_azure_storage:
            # Generate SAS URL for the image
            sas_url = get_media_url_with_sas(value)
            
            # Return SAS URL if generation succeeds, otherwise fallback
            if sas_url:
                return sas_url
        
        # Return the regular URL (development or fallback)
        return value.url if hasattr(value, 'url') else str(value)