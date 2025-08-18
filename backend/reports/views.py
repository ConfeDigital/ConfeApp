# views.py

from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404
from .legacy.report_dispatcher import generate_report_pdf
from .report_plan_apoyos import PlanApoyosReport
from candidatos.models import UserProfile

def report_pdf_view(request, uid, report_type):
    return generate_report_pdf(request, uid, report_type)

def plan_apoyos_pdf_view(request, uid):
    """Generate Plan de Apoyos PDF report for a specific user."""
    try:
        # Verify user exists
        get_object_or_404(UserProfile, user__id=uid)
        
        # Generate report
        report_generator = PlanApoyosReport()
        response = report_generator.generate(uid)
        
        return response
        
    except ValueError as e:
        raise Http404(f"Error generating report: {e}")
    except Exception as e:
        raise Http404(f"Unexpected error: {e}")

