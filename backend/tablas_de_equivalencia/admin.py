from django.contrib import admin
from .models import (
    PercentilesPorCuestionario,
    SeccionDePercentilesPorGrupo,
    RelacionDePuntuacionesYPercentiles,
    CalculoDeIndiceDeNecesidadesDeApoyo
)


@admin.register(PercentilesPorCuestionario)
class PercentilesPorCuestionarioAdmin(admin.ModelAdmin):
    list_display = ('id', 'base_cuestionario')
    search_fields = ('base_cuestionario__nombre',)
    list_filter = ('base_cuestionario',)


@admin.register(SeccionDePercentilesPorGrupo)
class SeccionDePercentilesPorGrupoAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre_seccion', 'grupo', 'percentiles_cuestionario')
    search_fields = ('nombre_seccion', 'grupo', 'percentiles_cuestionario__base_cuestionario__nombre')
    list_filter = ('grupo',)


@admin.register(RelacionDePuntuacionesYPercentiles)
class RelacionDePuntuacionesYPercentilesAdmin(admin.ModelAdmin):
    list_display = ('id', 'seccion', 'puntuacion_directa', 'puntuacion_estandar', 'percentil')
    search_fields = ('seccion__nombre_seccion', 'puntuacion_directa', 'percentil')
    list_filter = ('seccion',)


@admin.register(CalculoDeIndiceDeNecesidadesDeApoyo)
class CalculoDeIndiceDeNecesidadesDeApoyoAdmin(admin.ModelAdmin):
    list_display = ('id', 'percentiles_por_cuestionario', 'total_suma_estandar', 'percentil', 'indice_de_necesidades_de_apoyo')
    search_fields = ('percentiles_por_cuestionario__base_cuestionario__nombre', 'percentil')
    list_filter = ('percentil',)
