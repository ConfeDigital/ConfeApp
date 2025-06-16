from rest_framework import serializers
from tablas_de_equivalencia.models import (  # Cambio en la importación
    PercentilesPorCuestionario,
    SeccionDePercentilesPorGrupo,
    RelacionDePuntuacionesYPercentiles,
    CalculoDeIndiceDeNecesidadesDeApoyo
)

class RelacionDePuntuacionesYPercentilesSerializer(serializers.ModelSerializer):
    class Meta:
        model = RelacionDePuntuacionesYPercentiles
        fields = '__all__'  # Incluir todos los campos

class SeccionDePercentilesPorGrupoSerializer(serializers.ModelSerializer):
    puntuaciones = RelacionDePuntuacionesYPercentilesSerializer(many=True, read_only=True)

    class Meta:
        model = SeccionDePercentilesPorGrupo
        fields = '__all__'




class CalculoDeIndiceDeNecesidadesDeApoyoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalculoDeIndiceDeNecesidadesDeApoyo
        fields = [
            "id",
            "total_suma_estandar",
            "indice_de_necesidades_de_apoyo",
            "percentil",
        ]


class PercentilesPorCuestionarioSerializer(serializers.ModelSerializer):
    base_cuestionario = serializers.CharField(source='base_cuestionario.nombre', read_only=True)
    secciones_percentiles = SeccionDePercentilesPorGrupoSerializer(many=True, read_only=True)

    class Meta:
        model = PercentilesPorCuestionario
        fields = '__all__'

