from django.db import models
from django.conf import settings
from django.core.files.base import ContentFile
import requests
import json
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

class FichaTecnica(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    bio = models.TextField(blank=True, null=True)
    timeline = models.JSONField(default=list)
    pdf_generated_at = models.DateTimeField(auto_now=True)
    pdf_file = models.FileField(upload_to='pdf_reports/', blank=True, null=True)

def generate_pdf(self, report_type):
    """
    Generates a PDF using ReportLab and returns it dynamically,
    with a happy face if the report type is 'proyecto_vida'.
    """
    from candidatos.models import UserProfile, TAidCandidateHistory, SISAidCandidateHistory  # Adjust import as needed
    try:
        profile = UserProfile.objects.get(user=self.user)
    except UserProfile.DoesNotExist:
        raise ValueError("UserProfile does not exist for this user.")
    
    # Create the PDF buffer
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    p.setFont("Helvetica", 12)

    # Report Title
    p.drawString(100, 750, f"{report_type} Report")
    p.drawString(100, 730, f"User: {self.user.username}")

    y = 710

    # If the report type is "proyecto_vida", draw a happy face
    if report_type == "proyecto_vida":
        # Draw a happy face using circles and a smile
        p.circle(300, 600, 50)  # Face
        p.circle(280, 620, 5)   # Left Eye
        p.circle(320, 620, 5)   # Right Eye
        p.arc(280, 580, 320, 600, start=0, extent=180)  # Smile

        p.drawString(260, 550, "¡Felicidades! 😊")  # Add a friendly message

    else:
        # Standard report content for other types
        p.drawString(100, y, f"CURP: {profile.curp or 'N/A'}")
        y -= 20
        p.drawString(100, y, f"Birth Date: {profile.birth_date or 'N/A'}")
        y -= 20
        gender = profile.get_gender_display() if profile.gender else 'N/A'
        p.drawString(100, y, f"Gender: {gender}")
        y -= 20
        stage = profile.get_stage_display() if profile.stage else 'N/A'
        p.drawString(100, y, f"Stage: {stage}")
        y -= 30

    # Finalize PDF
    p.showPage()
    p.save()

    # Return the generated PDF content
    buffer.seek(0)
    return buffer