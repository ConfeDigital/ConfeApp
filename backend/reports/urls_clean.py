"""
Clean URL configuration for reports.
"""
from django.urls import path
from .views_clean import generate_report

urlpatterns = [
    path('generate/<int:uid>/<str:report_type>/', generate_report, name='generate_report'),
]