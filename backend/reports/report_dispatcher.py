# report_dispatcher.py

from io import BytesIO
from django.http import HttpResponse
from .pdf_generators import generate_ficha_tecnica, generate_proyecto_vida_pdf, generate_cuadro_de_habilidades_pdf, generate_plan_apoyos

def generate_report_pdf(request, uid, report_type, *args, **kwargs):
    from candidatos.models import UserProfile
    try:
        profile = UserProfile.objects.get(user_id=uid)
    except UserProfile.DoesNotExist:
        return HttpResponse("User profile not found", status=404)

    from cuestionarios.models import Respuesta
    respuestas = Respuesta.objects.filter(usuario_id=uid).select_related("pregunta", "cuestionario")

    if report_type == "proyecto_vida":
       return generate_proyecto_vida_pdf(profile)

    elif report_type == "ficha_tecnica":
        return generate_ficha_tecnica(uid, profile, respuestas)

    elif report_type == "habilidades":
        return generate_cuadro_de_habilidades_pdf(profile)

    elif report_type == "plan_apoyos":
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        p = generate_plan_apoyos(p, profile)
        p.save()
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="plan_apoyos_{uid}.pdf"'
        return response

    else:
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        p.setFont("Helvetica-Bold", 16)
        p.drawString(200, 700, "Invalid Report Type")
        p.showPage()
        p.save()
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{report_type}_{uid}.pdf"'
        return response