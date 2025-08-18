from django.urls import path
# from .views import generate_report_pdf
from .legacy.report_dispatcher import generate_report_pdf
from .views_clean import GenerateReportView
from .views import plan_apoyos_pdf_view

urlpatterns = [
    # path("generate/<int:uid>/<str:report_type>/", generate_report_pdf, name="generate_report"),
    # path("download/<int:uid>/<str:report_type>/", generate_report_pdf, name="download_report"),
    path('download/<int:uid>/<str:report_type>/', GenerateReportView.as_view(), name='generate_report'),
    path('plan-apoyos/<int:uid>/', plan_apoyos_pdf_view, name='plan_apoyos_pdf'),
]