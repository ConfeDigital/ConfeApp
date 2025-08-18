from django.http import HttpResponse, Http404
from candidatos.models import UserProfile
from .report_ficha_tecnica import FichaTecnicaReport
from .report_proyecto_vida import ProyectoVidaReport
from .report_cuadro_habilidades import CuadroHabilidadesReport
from .report_plan_apoyos import PlanApoyosReport
from api.permissions import PersonalPermission, GerentePermission
from rest_framework.views import APIView
from rest_framework import permissions

class GenerateReportView(APIView):
    """
    API view to generate reports.
    """
    # Apply the permission class here. DRF automatically runs
    # the has_permission() method before dispatching the request.
    permission_classes = [PersonalPermission]

    def get(self, request, uid, report_type):
        """
        Handles the GET request to generate a report.
        """
        # Validate that the profile exists
        try:
            profile = UserProfile.objects.get(user__id=uid)
        except UserProfile.DoesNotExist:
            raise Http404(f"Profile not found for user ID: {uid}")

        # The permission classes handle the initial check, but for
        # object-level permissions, you must manually run it here.
        if not self.has_object_permission(request, self, profile):
            return HttpResponseForbidden("You do not have permission to access this profile's reports.")

        # Route to the appropriate report generator
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
            import traceback
            error_details = traceback.format_exc()
            print(f"Error generating {report_type} report for user {uid}: {str(e)}")
            print(f"Full traceback: {error_details}")
            return HttpResponse(f"Error generating report: {str(e)}", status=500)

    def has_object_permission(self, request, view, obj):
        # A staff member can access any profile.
        if request.user.is_staff:
            return True

        # A "gerente" can access profiles within their center.
        if request.user.groups.filter(name='gerente').exists():
            return obj.user.center == request.user.center
        
        # A "personal" can access their own profile.
        if request.user.groups.filter(name='personal').exists():
            return obj.user == request.user
            
        return False
