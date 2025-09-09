from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification, Settings, BimonthlyCommentReminder
from .serializers import NotificationSerializer, SettingsSerializer
from rest_framework.exceptions import NotFound
from django.core.exceptions import ObjectDoesNotExist
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from django.utils import timezone
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


def mark_bimonthly_reminder_completed(job_history, employer_user):
    """
    Mark bimonthly comment reminders as completed when an employer provides a comment.
    This function should be called when a JobHistoryComment is created by an employer.
    """
    try:
        # Get current date to determine which bimonthly period we're in
        today = timezone.now().date()
        current_month = today.month
        current_year = today.year
        
        # Determine current bimonthly period
        if current_month in [1, 2]:
            period_start = timezone.datetime(current_year, 1, 1).date()
        elif current_month in [3, 4]:
            period_start = timezone.datetime(current_year, 3, 1).date()
        elif current_month in [5, 6]:
            period_start = timezone.datetime(current_year, 5, 1).date()
        elif current_month in [7, 8]:
            period_start = timezone.datetime(current_year, 7, 1).date()
        elif current_month in [9, 10]:
            period_start = timezone.datetime(current_year, 9, 1).date()
        else:  # Nov-Dec
            period_start = timezone.datetime(current_year, 11, 1).date()
        
        # Find and mark the corresponding reminder as completed
        try:
            from agencia.models import Employer
            employer = Employer.objects.get(user=employer_user)
            
            reminder = BimonthlyCommentReminder.objects.get(
                employer=employer,
                candidate=job_history.candidate,
                job=job_history.job,
                period_start=period_start,
                comment_provided=False
            )
            
            reminder.mark_comment_provided()
            
            # Send a success notification to the employer
            send_notification_to_user(
                user_id=employer_user.id,
                message=f"✅ Evaluación completada para {job_history.candidate.user.get_full_name()} en '{job_history.job.name}'. ¡Gracias por su retroalimentación!",
                link=f"/empleador/empleo/{job_history.job.id}",
                notification_type="success"
            )
            
            logger.info(f"Marked bimonthly reminder as completed for employer {employer_user.get_full_name()}")
            
        except Employer.DoesNotExist:
            logger.warning(f"No employer profile found for user {employer_user.get_full_name()}")
        except BimonthlyCommentReminder.DoesNotExist:
            logger.info(f"No active bimonthly reminder found for this period")
        
    except Exception as e:
        logger.error(f"Error marking bimonthly reminder as completed: {str(e)}")