from rest_framework import serializers
from .models import SeguimientoApoyos, SeguimientoProyectoVida


class SeguimientoApoyosSerializer(serializers.ModelSerializer):
    usuario = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = SeguimientoApoyos
        fields = '__all__'
        read_only_fields = ('fecha_sesion', 'ultima_actualizacion')


class SeguimientoProyectoVidaSerializer(serializers.ModelSerializer):
    usuario = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = SeguimientoProyectoVida
        fields = '__all__'
        read_only_fields = ('fecha_creacion', 'fecha_actualizacion')