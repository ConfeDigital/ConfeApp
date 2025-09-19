from django.urls import path
from .views import (
    CandidateListAPIView,
    CandidateProfileRetrieveAPIView,
    CandidateCreateAPIView,
    CandidateUpdateAPIView,
    CycleListViewSet,
    CurrentUserProfileAPIView,
    CandidateRegisterView,
    CandidatePhotoUploadAPIView,
    TAidCandidateHistoryViewSet,
    SISAidCandidateHistoryViewSet,
    CHAidCandidateHistoryViewSet,
    CandidateDomicileUpdateAPIView,
    CandidateDomicileMeAPIView,
    EmergencyContactUpdateAPIView,
    EmergencyContactMeAPIView,
    DatosMedicosAPIView,
    DatosMedicosMeAPIView,
    JobHistoryViewSet,
    CandidateEmploymentUpdateView,
    CandidateEmploymentRemovalUpdateView,
    JobHistoryCommentCreateView,
    CandidateListAgencyAPIView,
    CandidateAgencyProfileRetrieveAPIView,
    BulkCandidateUploadView,
    CandidateAppointmentsView,
    CandidateCentroAPIView,
    SISAidCandidateHistoryCreateAPIView,
    SISAidCandidateHistoryListAPIView,
    SISAidCandidateHistoryListAPIViewMe,
    SISAidCandidateHistoryDetailAPIView,
    SISAidCandidateHistoryHistoryAPIView,

    CHAidCandidateHistoryCreateAPIView, 
    CHAidCandidateHistoryListAPIView,   
    CHAidCandidateHistoryHistoryAPIView,    
    TAidCandidateHistoryCreateAPIView,  
    TAidCandidateHistoryListAPIView,    
    TAidCandidateHistoryHistoryAPIView, 
)
from .dashboard_views import (
    DashboardStatsView,
    CandidateListDashboardView,
)
from .statistics_views import (
    StatisticsView,
    CentersListAPIView,
)
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'ciclos', CycleListViewSet, basename='cycle')
router.register(r'historial-apoyos', TAidCandidateHistoryViewSet, basename='aid_history')
router.register(r'historial-apoyos-sis', SISAidCandidateHistoryViewSet, basename='sis_aid_history')
router.register(r'historial-apoyos-ch', CHAidCandidateHistoryViewSet, basename='ch_aid_history')
router.register(r'historial-empleos', JobHistoryViewSet, basename='job_history')

urlpatterns = [
    path('lista/', CandidateListAPIView.as_view(), name='candidate-list'),
    path('profiles/<uuid:uid>/', CandidateProfileRetrieveAPIView.as_view(), name='candidate-profile'),
    path('profiles/me/', CurrentUserProfileAPIView.as_view(), name='my-candidate-profile'),
    path('crear/', CandidateCreateAPIView.as_view(), name='candidate-create'),
    path('registrar/', CandidateRegisterView.as_view(), name='candidate-register'),
    path('editar/<uuid:uid>/', CandidateUpdateAPIView.as_view(), name='candidate-update'),
    path('upload-photo/<uuid:uid>/', CandidatePhotoUploadAPIView.as_view(), name='candidate-upload-photo'),
    path('crear_masiva/', BulkCandidateUploadView.as_view(), name='bulk-candidate-upload'),

    path('employment/<uuid:pk>/', CandidateEmploymentUpdateView.as_view(), name='candidate-employment-update'),
    path('employment/remove/<uuid:pk>/', CandidateEmploymentRemovalUpdateView.as_view(), name='candidate-employment-remove'),
    path('employment/comments/<int:job_history_pk>/', JobHistoryCommentCreateView.as_view(), name='jobhistory-comment-create'),

    path('lista-agencia/', CandidateListAgencyAPIView.as_view(), name='candidate-agency-list'),
    path('profile-agencia/<uuid:uid>/', CandidateAgencyProfileRetrieveAPIView.as_view(), name='candidate-agency-profile'),

    path('appointments/<uuid:uid>/', CandidateAppointmentsView.as_view(), name='candidate-appointments'),

    path("<uuid:uid>/editar-domicilio/", CandidateDomicileUpdateAPIView.as_view(), name="editar-domicilio"),
    path("me/editar-domicilio/", CandidateDomicileMeAPIView.as_view(), name="editar-mi-domicilio"),
    path('<uuid:uid>/editar-contactos/', EmergencyContactUpdateAPIView.as_view(), name='editar-contactos'),
    path('me/editar-contactos/', EmergencyContactMeAPIView.as_view(), name='editar-mis-contactos'),
    path('<uuid:uid>/datos-medicos/', DatosMedicosAPIView.as_view(), name='datos-medicos'),
    path('me/datos-medicos/', DatosMedicosMeAPIView.as_view(), name='datos-mis-medicos'),

    path('<uuid:uid>/canalizar-centro/', CandidateCentroAPIView.as_view(), name='canalizar-centro'),

    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard'),
    path('dashboard-list/', CandidateListDashboardView.as_view(), name='dashboard-list'),
    
    # Statistics endpoints
    path('statistics/', StatisticsView.as_view(), name='statistics'),
    path('centers-list/', CentersListAPIView.as_view(), name='centers-list'),

    path('seguimiento/sis-aid/', SISAidCandidateHistoryCreateAPIView.as_view(), name='sis-aid-create'),
    path('seguimiento/sis-aid/<uuid:candidate_id>/', SISAidCandidateHistoryListAPIView.as_view(), name='sis-aid-list'),
    path('seguimiento/sis-aid/me/', SISAidCandidateHistoryListAPIViewMe.as_view(), name='sis-aid-list'),
    path('seguimiento/sis-aid/detail/<int:pk>/', SISAidCandidateHistoryDetailAPIView.as_view(), name='sid-aid-detail'),
    path('seguimiento/sis-aid/<uuid:candidate_id>/history/', SISAidCandidateHistoryHistoryAPIView.as_view(), name='sis-aid-history'),

    path('seguimiento/ch-aid/', CHAidCandidateHistoryCreateAPIView.as_view(), name='ch-aid-create'),
    path('seguimiento/ch-aid/<uuid:candidate_id>/', CHAidCandidateHistoryListAPIView.as_view(), name='ch-aid-list'),
    path('seguimiento/ch-aid/<uuid:candidate_id>/history/', CHAidCandidateHistoryHistoryAPIView.as_view(), name='ch-aid-history'),

    path('seguimiento/ed-aid/', TAidCandidateHistoryCreateAPIView.as_view(), name='taid-create'),
    path('seguimiento/ed-aid/<uuid:candidate_id>/', TAidCandidateHistoryListAPIView.as_view(), name='taid-list'),
    path('seguimiento/ed-aid/<uuid:candidate_id>/history/', TAidCandidateHistoryHistoryAPIView.as_view(), name='taid-history'),
]

urlpatterns += router.urls