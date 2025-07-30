# communications/serializers.py
from rest_framework import serializers
from .models import CenterMessage, CommunicationPost
from django.contrib.auth import get_user_model

User = get_user_model()

class CreatedBySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email']

class CommunicationPostSerializer(serializers.ModelSerializer):
    created_by = CreatedBySerializer(read_only=True)

    class Meta:
        model = CommunicationPost
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']

class CenterMessageSerializer(serializers.ModelSerializer):
    center = serializers.SerializerMethodField()
    sender_name = serializers.SerializerMethodField()
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)

    class Meta:
        model = CenterMessage
        fields = ['id', 'sender_id', 'sender_name', 'center', 'text', 'sent_at']

    def get_center(self, obj):
        return obj.sender.center.name if obj.sender.center else "Sin centro"

    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}"