import os
from django.shortcuts import render

def home_view(request):
    """
    Home page view that shows redirect buttons to admin and frontend
    """
    # Determine if we're in production based on environment variable
    is_production = 'WEBSITE_HOSTNAME' in os.environ
    
    # Set frontend URL based on environment
    if is_production:
        frontend_url = 'https://ceil.institucionconfe.org.mx'
    else:
        frontend_url = 'http://localhost:5173'
    
    context = {
        'is_production': is_production,
        'frontend_url': frontend_url,
        'admin_url': '/admin/',
    }
    
    return render(request, 'home.html', context)