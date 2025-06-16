from django.contrib import admin
from .models import SeguimientoApoyos, SeguimientoProyectoVida

@admin.register(SeguimientoApoyos)
class SeguimientoApoyosAdmin(admin.ModelAdmin):
    list_display = (
        'usuario', 'seccion', 'item', 'subitem', 'ayuda_id',
        'resultado', 'comentario', 'sesion_seguimiento', 'fecha_sesion'
    )
    list_filter = ('usuario', 'seccion', 'item', 'resultado')
    search_fields = ('usuario__username', 'seccion', 'item', 'subitem', 'comentario')
    ordering = ('-fecha_sesion',)

@admin.register(SeguimientoProyectoVida)
class SeguimientoProyectoVidaAdmin(admin.ModelAdmin):
    list_display = (
        'usuario', 'fecha_creacion', 'fecha_actualizacion'
    )
    search_fields = ('usuario__username', 'comentarios')
    ordering = ('-fecha_actualizacion',)
