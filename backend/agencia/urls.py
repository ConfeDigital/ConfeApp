from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobAssignedCandidatesView, LocationViewSet, CompanyViewSet, JobViewSet, EmployerViewSet, CurrentEmployerAPIView

router = DefaultRouter()
router.register(r'locations', LocationViewSet)
router.register(r'companies', CompanyViewSet,    basename='company')
router.register(r'jobs',      JobViewSet,        basename='job')
router.register(r'employers', EmployerViewSet,   basename='employer')

urlpatterns = [
    path('', include(router.urls)),
    path('employer/me/', CurrentEmployerAPIView.as_view(), name='my-employer-profile'),
    path('jobs/<int:pk>/assigned-candidates/', JobAssignedCandidatesView.as_view(), name='job-assigned-candidates'),
]