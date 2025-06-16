from rest_framework import serializers
from .models import Notification
    
    
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'message', 'type', 'link', 'is_read', 'created_at']
        read_only_fields = ['id', 'user', 'is_read', 'created_at']
