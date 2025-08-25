from rest_framework import serializers
from .models import Notification, Settings
    
    
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'message', 'type', 'link', 'is_read', 'created_at']
        read_only_fields = ['id', 'user', 'is_read', 'created_at']

class SettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Settings
        fields = ['id', 'user', 'receive_notifications', 'receive_forum_notifications', 'receive_announcement_notifications', 'receive_emails']
        read_only_fields = ['id', 'user']