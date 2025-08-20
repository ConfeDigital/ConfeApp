from django.urls import path
from .views import (
    GuardarSeguimientoApoyos,
    GuardarSeguimientoProyectoVida,
    ObtenerSeguimientoProyectoVida,
    ObtenerUltimoSeguimientoProyectoVida,
    ObtenerUltimosSeguimientosApoyos,
    ObtenerSeguimientoApoyosActual,
    recommended_technical_aids_grouped
)

urlpatterns = [
    # Apoyos
    path('guardar-seguimiento-apoyos/', GuardarSeguimientoApoyos.as_view(), name='guardar_seguimiento_apoyos'),
    path('obtener-seguimiento-apoyos-ultimo/<uuid:usuario_id>/', ObtenerUltimosSeguimientosApoyos.as_view(), name='obtener_ultimo_seguimiento_apoyos'),
    path('obtener-seguimiento-apoyos-actual/<uuid:usuario_id>/', ObtenerSeguimientoApoyosActual.as_view(), name='obtener_seguimiento_apoyos_actual'),

    # Proyecto de Vida
    path('guardar-seguimiento-proyecto-vida/', GuardarSeguimientoProyectoVida.as_view(), name='guardar_seguimiento_proyecto_vida'),
    path('obtener-seguimiento-proyecto-vida-todos/<uuid:usuario_id>/', ObtenerSeguimientoProyectoVida.as_view(), name='obtener_todos_seguimientos_proyecto_vida'),
    path('obtener-seguimiento-proyecto-vida-ultimo/<uuid:usuario_id>/', ObtenerUltimoSeguimientoProyectoVida.as_view(), name='obtener_ultimo_seguimiento_proyecto_vida'),

    path('recomendaciones-apoyos/<uuid:usuario_id>/', recommended_technical_aids_grouped, name='recommended_aids'),
]