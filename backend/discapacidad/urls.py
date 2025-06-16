from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DisabilityGroupViewSet, DisabilityViewSet, UploadDisabilitiesViewSet
from .views import ImpedimentViewSet, TechnicalAidViewSet, UploadTechnicalAidsViewSet
from .views import SISGroupViewSet, SISItemViewSet, SISAidViewSet, SISHelpViewSet, UploadSISAidsViewSet, SISAidViewCOMPLETOSet
from .views import CHGroupViewSet, CHItemViewSet, UploadCHAidsViewSet
from .views import TechnicalAidViewReadOnly, CHItemViewReadOnly

router = DefaultRouter()

router.register(r'disability-groups', DisabilityGroupViewSet)
router.register(r'disabilities', DisabilityViewSet)

router.register(r'impediments', ImpedimentViewSet)
router.register(r'technical-aids', TechnicalAidViewSet)
router.register(r'technical-aids-view', TechnicalAidViewReadOnly, basename='technical-aids-view')
router.register(r'ch-items-view', CHItemViewReadOnly, basename='ch-items-view')

router.register(r'sis-groups', SISGroupViewSet)
router.register(r'sis-items', SISItemViewSet)
router.register(r'sis-aids', SISAidViewSet, basename='sis-aids')
router.register(r'sis-aids-view', SISAidViewCOMPLETOSet, basename='sis-aids-view')
router.register(r'sis-helps', SISHelpViewSet, basename='sis-helps')

router.register(r'ch-groups', CHGroupViewSet, basename='ch-groups')
router.register(r'ch-items', CHItemViewSet, basename='ch-items')

urlpatterns = [
    path('', include(router.urls)),
    path('upload/disabilities/', UploadDisabilitiesViewSet.as_view({'post': 'create'}), name='upload-disabilities'),
    path('upload/technical-aids/', UploadTechnicalAidsViewSet.as_view({'post': 'create'}), name='upload-technical-aids'),
    path('upload/sis-aids/', UploadSISAidsViewSet.as_view({'post': 'create'}), name='upload-sis-aids'),
    path('upload/ch-aids', UploadCHAidsViewSet.as_view({'post': 'create'}), name='upload-ch-aids'),
]
