from django.urls import path
# from .views import generate_report_pdf
from .report_dispatcher import generate_report_pdf

urlpatterns = [
    path("generate/<int:uid>/<str:report_type>/", generate_report_pdf, name="generate_report"),
    path("download/<int:uid>/<str:report_type>/", generate_report_pdf, name="download_report"),
]