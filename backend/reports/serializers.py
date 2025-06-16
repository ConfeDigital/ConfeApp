from rest_framework import serializers
from .models import FichaTecnica

class FTSerializer(serializers.ModelSerializer):
    class Meta:
        model = FichaTecnica
        fields = '__all__'