"""
Plan de Apoyos report generator.
Handles the complete generation of support plan reports.
"""
from io import BytesIO
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from candidatos.models import UserProfile


class PlanApoyosReport:
    """Generator for Plan de Apoyos reports."""
    
    def __init__(self):
        pass
    
    def get_profile(self, uid):
        """Get user profile."""
        try:
            return UserProfile.objects.get(user__id=uid)
        except UserProfile.DoesNotExist:
            raise ValueError(f"Profile not found for user ID: {uid}")
    
    def generate(self, uid):
        """Generate the complete Plan de Apoyos report."""
        # Get profile
        profile = self.get_profile(uid)
        
        # Create PDF
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        
        # Title
        p.setTitle("Plan Personalizado de Apoyos")
        p.setFont("Helvetica-Bold", 18)
        p.drawString(200, 750, "Plan Personalizado de Apoyos")
        
        # User information
        full_name = f"{profile.user.first_name} {profile.user.last_name}"
        if hasattr(profile.user, 'second_last_name') and profile.user.second_last_name:
            full_name += f" {profile.user.second_last_name}"
        
        p.setFont("Helvetica", 12)
        p.drawString(100, 700, f"Nombre: {full_name}")
        p.drawString(100, 680, f"Usuario ID: {uid}")
        
        # Support plan sections
        y_position = 640
        sections = [
            "Necesidades de apoyo en casa",
            "Necesidades de apoyo en la escuela", 
            "Necesidades de apoyo en el trabajo",
            "Necesidades de apoyo en la comunidad",
            "Estrategias recomendadas para el hogar",
            "Estrategias recomendadas para la escuela",
            "Estrategias recomendadas para el trabajo", 
            "Estrategias recomendadas para la comunidad",
            "Recursos necesarios para el apoyo",
            "Personas clave en mi plan",
            "Plan de seguimiento y evaluación"
        ]
        
        for section in sections:
            p.setFont("Helvetica-Bold", 10)
            p.drawString(100, y_position, f"{section}:")
            p.setFont("Helvetica", 9)
            p.drawString(120, y_position - 15, "Por definir")
            y_position -= 40
            
            if y_position < 100:  # Start new page if needed
                p.showPage()
                y_position = 750
        
        # Save PDF
        p.save()
        buffer.seek(0)
        
        # Create response
        response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
        response['Content-Disposition'] = f'attachment; filename="plan_apoyos_{uid}.pdf"'
        
        return response