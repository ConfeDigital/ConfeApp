from rest_framework import serializers
from .models import Location, Center

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = '__all__'

class CenterSerializer(serializers.ModelSerializer):
    location_details = LocationSerializer(source='location', read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        source='location',
        queryset=Location.objects.all(),
        allow_null=True,
        required=False
    )

    class Meta:
        model = Center
        fields = ['id', 'name', 'location_details', 'location_id', 'center_type', 'is_active']
