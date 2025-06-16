from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LocationViewSet, CenterViewSet, TransferRequestViewSet, CanalizarCandidatoViewSet

router = DefaultRouter()
router.register(r'locations', LocationViewSet)
router.register(r'centers', CenterViewSet)
router.register(r'transfer-requests', TransferRequestViewSet, basename='transfer-request')
router.register(r'canalizar-candidato', CanalizarCandidatoViewSet, basename='canalizar-candidato')

urlpatterns = [
    path('', include(router.urls)),
]