from django.contrib import admin
from .models import Cuestionario, Pregunta, Opcion, Respuesta, DesbloqueoPregunta, BaseCuestionarios, ImagenOpcion, EstadoCuestionario
from .forms import DesbloqueoPreguntaForm
# from .models import (
#     PercentilesPorCuestionario,
#     SeccionDePercentilesPorGrupo,
#     RelacionDePuntuacionesYPercentiles,
#     CalculoDeIndiceDeNecesidadesDeApoyo
# )


class PreguntaInline(admin.TabularInline):
    model = Pregunta
    extra = 1

class OpcionInline(admin.TabularInline):
    model = Opcion
    extra = 1

class ImagenOpcionInline(admin.TabularInline):
    model = ImagenOpcion
    extra = 1

class ImagenOpcionAdmin(admin.ModelAdmin):
    list_display = ['id', 'pregunta', 'descripcion', 'imagen']
    list_filter = ['pregunta']
    search_fields = ['descripcion', 'pregunta__texto']



class DesbloqueoPreguntaInline(admin.TabularInline):
    model = DesbloqueoPregunta
    extra = 1
    fk_name = 'pregunta_origen'  # Especifica la ForeignKey que debe usar

class RespuestaInline(admin.TabularInline):
    model = Respuesta
    extra = 1

class CuestionarioAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre', 'version', 'activo', 'fecha_creacion', 'base_cuestionario']
    list_filter = ['base_cuestionario']
    inlines = [PreguntaInline]

class PreguntaAdmin(admin.ModelAdmin):
    list_display = ['id', 'texto', 'tipo', 'cuestionario']
    list_filter = ['cuestionario']
    search_fields = ['texto',]
    inlines = [OpcionInline,ImagenOpcionInline, DesbloqueoPreguntaInline]

class OpcionAdmin(admin.ModelAdmin):
    list_display = ['id', 'texto', 'valor', 'pregunta']

class RespuestaAdmin(admin.ModelAdmin):
    list_display = ['id', 'cuestionario', 'pregunta', 'usuario', 'respuesta']
    list_filter = ['cuestionario']
    search_fields = ['respuesta', 'pregunta__texto', 'usuario__email']

class DesbloqueoPreguntaAdmin(admin.ModelAdmin):
    form = DesbloqueoPreguntaForm
    list_display = ['cuestionario', 'pregunta_origen', 'opcion_desbloqueadora', 'pregunta_desbloqueada']

class BaseCuestionariosAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre', 'estado_desbloqueo']

class EstadoCuestionarioAdmin(admin.ModelAdmin):
    list_display = ['id', 'usuario', 'cuestionario', 'estado', 'fecha_finalizado']
    list_filter = ['cuestionario']
    search_fields = ['usuario__email', 'cuestionario__nombre']  # Ajusta según tus necesidades
    readonly_fields = ('fecha_finalizado',)

admin.site.register(Cuestionario, CuestionarioAdmin)
admin.site.register(Pregunta, PreguntaAdmin)
admin.site.register(Opcion, OpcionAdmin)
admin.site.register(ImagenOpcion, ImagenOpcionAdmin)
admin.site.register(Respuesta, RespuestaAdmin)
admin.site.register(DesbloqueoPregunta, DesbloqueoPreguntaAdmin)
admin.site.register(BaseCuestionarios, BaseCuestionariosAdmin)

admin.site.register(EstadoCuestionario, EstadoCuestionarioAdmin)



