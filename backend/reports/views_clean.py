"""
Clean views for report generation.
Simple, focused views that delegate to specific report generators.
"""
from django.http import HttpResponse, Http404
from candidatos.models import UserProfile
from .report_ficha_tecnica import FichaTecnicaReport
from .report_proyecto_vida import ProyectoVidaReport
from .report_cuadro_habilidades import CuadroHabilidadesReport
from .report_plan_apoyos import PlanApoyosReport


def generate_report(request, uid, report_type):
    """
    Generate reports using the clean architecture.
    Each report type has its own dedicated class.
    """
    
    # Validate that profile exists
    try:
        profile = UserProfile.objects.get(user__id=uid)
    except UserProfile.DoesNotExist:
        raise Http404(f"Profile not found for user ID: {uid}")
    
    # Route to appropriate report generator
    try:
        if report_type == 'ficha_tecnica':
            report = FichaTecnicaReport()
            return report.generate(uid)
        
        elif report_type == 'proyecto_vida':
            report = ProyectoVidaReport()
            return report.generate(uid)
        
        elif report_type == 'habilidades':
            report = CuadroHabilidadesReport()
            return report.generate(uid)
        
        elif report_type == 'plan_apoyos':
            report = PlanApoyosReport()
            return report.generate(uid)
        
        else:
            return HttpResponse(f"Unknown report type: {report_type}", status=400)
    
    except Exception as e:
        # Log the error in production with more details
        import traceback
        error_details = traceback.format_exc()
        print(f"Error generating {report_type} report for user {uid}: {str(e)}")
        print(f"Full traceback: {error_details}")
        return HttpResponse(f"Error generating report: {str(e)}", status=500)