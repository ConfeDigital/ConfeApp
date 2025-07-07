from django.urls import path
from . import views

urlpatterns = [
    # Ruta para obtener todos los cuestionarios con preguntas desbloqueadas
    path('', views.CuestionarioSeleccion.as_view(), name='CuestionarioSeleccion'),

    # Ruta para obtener un cuestionario específico con preguntas desbloqueadas
    path('<int:pk>/', views.CuestionarioSeleccionVisualizacion.as_view(), name='CuestionarioSeleccionVisualizacion'),

    # Ruta para obtener todas las preguntas desbloqueadas de un usuario
    path('preguntas/', views.PreguntaSeleccion.as_view(), name='PreguntaSeleccion'),

    # Ruta para obtener las respuestas de un usuario
    path('respuestas/', views.RespuestasGuardadas.as_view(), name='RespuestasGuardadas'),

    path('respuestas/bulk/', views.BulkRespuestasView.as_view(), name='bulk_respuestas'),

    # Ruta para actualizar una respuesta específica
    path('respuestas/<int:pk>/', views.RespuestaActualizacion.as_view(), name='RespuestaActualizacion'),

    # Ruta para cargar datos desde un archivo Excel
    path('upload_excel/', views.upload_excel, name='upload_excel'),

    path('usuario-respuestas/', views.UsuarioRespuestasView.as_view(), name='usuario-respuestas'),

    path('cuestionario-desbloqueos/', views.CuestionarioDesbloqueosView.as_view(), name='cuestionario_desbloqueos'),

    path('finalizar-cuestionario/', views.FinalizarCuestionarioView.as_view(), name='finalizar_cuestionario'),
    path('validar-estado-cuestionario/', views.ValidarEstadoCuestionarioView.as_view() , name='validar_estado_cuestionario'),

    path('crear-cuestionario/', views.CrearCuestionario.as_view(), name='crear_cuestionario'),
    path('crear-cuestionario/<int:cuestionario_id>/nueva-version/', views.CrearNuevaVersionCuestionario.as_view(), name='crear-nueva-version-cuestionario'),
    path('crear-cuestionario/<int:cuestionario_id>/activar/', views.ActivarCuestionarioView.as_view(), name='activar_cuestionario'),

    path('base/<int:id>/', views.CuestionarioSeleccion.as_view(), name='CuestionarioSeleccionVisualizacion'),
    path('<int:cuestionario_id>/preguntas/', views.PreguntasCuestionarioView.as_view(), name='preguntas_cuestionario'),

    path('etapas-cuestionario/', views.EtapaCuestionarioView.as_view(), name='etapas_cuestionario'),


    path('descargar-plantilla/', views.DescargarPlantillaCuestionarios.as_view(), name='descargar_plantilla'),
    path('validar-columnas-excel/', views.validar_columnas_excel_view, name='validar_columnas'),

    path('usuario/<int:usuario_id>/respuestas-desbloqueadas/', views.RespuestasUsuarioDesbloqueadasView.as_view(), name='respuestas_desbloqueadas'),
    path('usuario/respuestas-unlocked-path/', views.RespuestasUnlockedPathView.as_view(), name='respuestas_unlocked_path'),
    path('preentrevista-activo/', views.CuestionarioPreentrevistaActivo.as_view(), name='preentrevista-activo'),
    
    path('editar/<int:pk>/', views.EditarCuestionarioView.as_view(), name='editar-cuestionario'),
    # path('primer-cuestionario/', views.CuestionarioInicioPCDView.as_view(), name = 'primer-cuestionario'),

    path('respuestas-sis/', views.RespuestasSISView.as_view(), name='respuestas-sis'),
    path('resumen-sis/', views.ResumenSISView.as_view(), name='resumen-sis'),
    path("evaluacion-usuario/", views.EvaluacionPorUsuarioView.as_view(), name="evaluacion-usuario"),

    path('resumen-ch/', views.ResumenCHView.as_view(), name='resumen-ch'),

# Para control de versiones de cuestionarios
    path('usuario/<int:usuario_id>/progreso-cuestionarios/', views.CuestionariosPorUsuarioView.as_view(), name='progreso_cuestionarios_usuario'),

    path('ver-imagen-pregunta/<int:pregunta_id>/', views.ver_imagen_pregunta, name='ver_imagen_pregunta'),
    path('precarga-cuestionario/', views.PrecargaCuestionarioView.as_view(), name='precarga_cuestionario'),

    path('guardar-cuestionario/', views.GuardarCuestionarioView.as_view(), name='guardar_cuestionario'),
]
