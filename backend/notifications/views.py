from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification, Settings
from .serializers import NotificationSerializer, SettingsSerializer
from rest_framework.exceptions import NotFound
from django.core.exceptions import ObjectDoesNotExist
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

def send_notification_to_user(user_id, message, link=None, notification_type="info"):
    try:
        user = User.objects.get(id=user_id)

        if hasattr(user, 'notification_settings') and not user.notification_settings.receive_notifications:
            return

        notification = Notification.objects.create(
            user=user,
            message=message,
            link=link,
            type=notification_type
        )

        channel_layer = get_channel_layer()

        if channel_layer is None:
            logger.warning("Channel layer is not configured.")
            return

        try:
            async_to_sync(channel_layer.group_send)(
                f"user_{user.id}_notifications",
                {
                    'type': 'send_notification',
                    'notification': {
                        'id': notification.id,
                        'message': notification.message,
                        'link': notification.link,
                        'type': notification.type,
                        'created_at': notification.created_at.isoformat(),
                    }
                }
            )
        except Exception as e:
            # El consumidor puede no estar activo
            logger.info(f"No WebSocket connection open for user_{user.id}: {e}")

    except ObjectDoesNotExist:
        logger.warning(f"User with ID {user_id} not found when trying to send notification.")

class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = request.user.notifications.all()
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)

    def patch(self, request, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
        except Notification.DoesNotExist:
            raise NotFound("Notification not found.")
        
        notification.is_read = True
        notification.save()  # Mark it as read
        
        # Delete the notification after it's marked as read
        notification.delete()

        return Response({"success": True})

class SettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings, created = Settings.objects.get_or_create(user=request.user)
        serializer = SettingsSerializer(settings)
        return Response(serializer.data)

    def patch(self, request):
        settings, created = Settings.objects.get_or_create(user=request.user)
        serializer = SettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)