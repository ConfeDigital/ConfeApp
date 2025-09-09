from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    JobAssignedCandidatesView, LocationViewSet, CompanyViewSet, JobViewSet, 
    EmployerViewSet, CurrentEmployerAPIView, HabilidadViewSet, 
    JobHabilidadRequeridaViewSet, CandidatoHabilidadEvaluadaViewSet,
    JobMatchingView, CandidatoMatchingView
)

router = DefaultRouter()
router.register(r'locations', LocationViewSet)
router.register(r'companies', CompanyViewSet,    basename='company')
router.register(r'jobs',      JobViewSet,        basename='job')
router.register(r'employers', EmployerViewSet,   basename='employer')
router.register(r'habilidades', HabilidadViewSet, basename='habilidad')
router.register(r'job-habilidades', JobHabilidadRequeridaViewSet, basename='job-habilidad')
router.register(r'candidato-habilidades', CandidatoHabilidadEvaluadaViewSet, basename='candidato-habilidad')

urlpatterns = [
    path('', include(router.urls)),
    path('employer/me/', CurrentEmployerAPIView.as_view(), name='my-employer-profile'),
    path('jobs/<int:pk>/assigned-candidates/', JobAssignedCandidatesView.as_view(), name='job-assigned-candidates'),
    path('jobs/<int:job_id>/matching-candidates/', JobMatchingView.as_view(), name='job-matching-candidates'),
    path('candidatos/<uuid:candidato_id>/matching-jobs/', CandidatoMatchingView.as_view(), name='candidato-matching-jobs'),
]