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
    path('obtener-seguimiento-apoyos-ultimo/<int:usuario_id>/', ObtenerUltimosSeguimientosApoyos.as_view(), name='obtener_ultimo_seguimiento_apoyos'),
    path('obtener-seguimiento-apoyos-actual/<int:usuario_id>/', ObtenerSeguimientoApoyosActual.as_view(), name='obtener_seguimiento_apoyos_actual'),

    # Proyecto de Vida
    path('guardar-seguimiento-proyecto-vida/', GuardarSeguimientoProyectoVida.as_view(), name='guardar_seguimiento_proyecto_vida'),
    path('obtener-seguimiento-proyecto-vida-todos/<int:usuario_id>/', ObtenerSeguimientoProyectoVida.as_view(), name='obtener_todos_seguimientos_proyecto_vida'),
    path('obtener-seguimiento-proyecto-vida-ultimo/<int:usuario_id>/', ObtenerUltimoSeguimientoProyectoVida.as_view(), name='obtener_ultimo_seguimiento_proyecto_vida'),

    path('recomendaciones-apoyos/<int:usuario_id>/', recommended_technical_aids_grouped, name='recommended_aids'),
]