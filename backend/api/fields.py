"""
Custom serializer fields for API
"""
from rest_framework import serializers
from django.conf import settings
from .utils import get_media_url_with_sas


class SASFileField(serializers.FileField):
    def to_representation(self, value):
        if not value:
            return None

        using_azure_storage = (
            hasattr(settings, "STORAGES")
            and settings.STORAGES.get("default", {}).get("BACKEND")
               == "storages.backends.azure_storage.AzureStorage"
        )

        if using_azure_storage:
            sas_url = get_media_url_with_sas(value)
            if sas_url:
                return sas_url

        request = self.context.get("request") if hasattr(self, "context") else None
        if hasattr(value, "url"):
            if request:
                return request.build_absolute_uri(value.url)
            return value.url  # fallback if no request
        return str(value)


class SASImageField(serializers.ImageField):
    def to_representation(self, value):
        if not value:
            return None

        using_azure_storage = (
            hasattr(settings, "STORAGES")
            and settings.STORAGES.get("default", {}).get("BACKEND")
               == "storages.backends.azure_storage.AzureStorage"
        )

        if using_azure_storage:
            sas_url = get_media_url_with_sas(value)
            if sas_url:
                return sas_url

        request = self.context.get("request") if hasattr(self, "context") else None
        if hasattr(value, "url"):
            if request:
                return request.build_absolute_uri(value.url)
            return value.url  # fallback if no request
        return str(value)
