from django.urls import path
from . import views

urlpatterns = [
    path('percentiles/', views.PercentilesPorCuestionarioView.as_view(), name='percentiles-list-create'),
    path('percentiles/<int:pk>/', views.PercentilesPorCuestionarioDetailView.as_view(), name='percentiles-detail'),
    path('percentiles/<int:tabla_id>/secciones/', views.SeccionDePercentilesPorGrupoCreateView.as_view(), name='secciones-percentiles'),
    path('secciones/<int:seccion_id>/puntuaciones/', views.PuntuacionesPorSeccionCrearView.as_view(), name='puntuaciones-seccion'),
    path('puntuaciones/<int:pk>/delete/', views.EliminarPuntuacionView.as_view(), name='eliminar-puntuacion'),

    path('puntuaciones/', views.PuntuacionesPorSeccionView.as_view(), name='puntuaciones-list'),

    path('indice-apoyo/carga-masiva/', views.CargaMasivaIndiceApoyoView.as_view(), name='carga-masiva-indice-apoyo'),
    path('indice-apoyo/', views.IndiceApoyoListView.as_view(), name='indice-apoyo-list'),
    path("indice-apoyo/<int:pk>/", views.IndiceApoyoRetrieveUpdateDestroyView.as_view(), name="indice-apoyo-detail"),


]
