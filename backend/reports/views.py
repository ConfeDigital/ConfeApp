# views.py

from django.http import HttpResponse
from .report_dispatcher import generate_report_pdf

def report_pdf_view(request, uid, report_type):
    return generate_report_pdf(request, uid, report_type)

