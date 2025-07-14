# Create this as middleware/dynamic_host.py in your Django project

import re
import logging
from django.conf import settings
from django.core.exceptions import DisallowedHost
from django.http import HttpResponseBadRequest

logger = logging.getLogger(__name__)

class DynamicHostMiddleware:
    """
    Middleware to handle dynamic internal IP addresses in Azure App Service
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        # Azure App Service typically uses 169.254.x.x for internal communication
        self.azure_internal_ip_pattern = re.compile(r'^169\.254\.\d{1,3}\.\d{1,3}$')
        
    def __call__(self, request):
        # Check if the host is an Azure internal IP
        host = request.get_host().split(':')[0]  # Remove port if present
        
        if self.azure_internal_ip_pattern.match(host):
            # This is an Azure internal IP, allow it
            logger.info(f"Allowing Azure internal IP: {host}")
            # Temporarily add to ALLOWED_HOSTS if not already there
            if host not in settings.ALLOWED_HOSTS:
                settings.ALLOWED_HOSTS.append(host)
        
        response = self.get_response(request)
        return response