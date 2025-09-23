from django.http import HttpResponse, Http404
from rest_framework.views import APIView
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from candidatos.models import UserProfile
from .report_ficha_tecnica import FichaTecnicaReport
from .report_proyecto_vida import ProyectoVidaReport
from .report_cuadro_habilidades import CuadroHabilidadesReport
from .report_plan_apoyos import PlanApoyosReport
from api.permissions import PersonalPermission, GerentePermission

class ReportAccessPermission(BasePermission):
    """
    Custom permission to control access to different report types
    based on the user's group and the profile being accessed.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True

        if request.user.groups.filter(name='personal').exists():
            return obj.user.center == request.user.center
        
        if request.user.groups.filter(name='empleador').exists():
            report_type = view.kwargs.get('report_type')
            if report_type == 'habilidades':
                return obj.user.current_job.company == request.user.employer.company
            
        return False

class GenerateReportView(APIView):
    """
    API view to generate reports for a specific user.
    """
    permission_classes = [IsAuthenticated, ReportAccessPermission]

    REPORT_MAPPING = {
        'ficha_tecnica': FichaTecnicaReport,
        'proyecto_vida': ProyectoVidaReport,
        'habilidades': CuadroHabilidadesReport,
        'plan_apoyos': PlanApoyosReport,
    }

    def get(self, request, uid, report_type):
        """
        Handles the GET request to generate a report.
        """
        try:
            profile = UserProfile.objects.get(user__id=uid)
        except UserProfile.DoesNotExist:
            raise Http404(f"Profile not found for user ID: {uid}")

        self.check_object_permissions(request, profile)

        ReportClass = self.REPORT_MAPPING.get(report_type)
        if not ReportClass:
            return HttpResponse(f"Unknown report type: {report_type}", status=400)

        try:
            report_generator = ReportClass()
            return report_generator.generate(uid)
        except Exception as e:
            print(f"Error generating {report_type} report for user {uid}: {e}")
            return HttpResponse("Error generating report.", status=500)
