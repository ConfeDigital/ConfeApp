from django.db.models.signals import pre_save, post_save, m2m_changed
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .serializers import UserSerializer
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

@receiver(pre_save, sender=User)
def lowercase_email(sender, instance, **kwargs):
    if instance.email:
        instance.email = instance.email.lower()

@receiver(pre_save, sender=User)
def deactivate_staff_on_inactivity(sender, instance, **kwargs):
    if not instance.is_active:
        if instance.is_staff:
            instance.is_staff = False
        try:
            gerente_group = Group.objects.get(name='gerente')
            if instance.groups.filter(name='gerente').exists():
                instance.groups.remove(gerente_group)
        except Group.DoesNotExist:
            pass

@receiver(pre_save, sender=User)
def broadcast_user_update(sender, instance, **kwargs):
    try:
        # Get the existing user from the database
        db_user = User.objects.get(pk=instance.pk)
    except User.DoesNotExist:
        return  # Skip for new users (no existing user to compare against)

    fields_to_watch = ['email', 'is_active', 'is_staff', 'first_name', 'last_name', 'center']
    
    # Check if any of the watched fields have changed
    if not any(
        getattr(db_user, field) != getattr(instance, field)
        for field in fields_to_watch
    ):
        # If no significant changes, no need to broadcast
        return

    # If there are significant changes, flag the instance for broadcasting in post_save
    instance._should_broadcast = True

@receiver(m2m_changed, sender=User.groups.through)
def mark_user_for_broadcast_on_groups_change(sender, instance, action, **kwargs):
    # Only trigger if groups are added, removed, or cleared
    if action in ['post_add', 'post_remove', 'post_clear']:
        instance._should_broadcast = True

@receiver(post_save, sender=User)
def finalize_broadcast(sender, instance, **kwargs):
    # Check the flag set in pre_save or m2m_changed
    if getattr(instance, "_should_broadcast", False):
        channel_layer = get_channel_layer()

        # --- NEW VALIDATION LOGIC ---
        if channel_layer is None:
            logger.warning(
                "Channel layer is not configured. User update broadcast skipped for user ID %s.",
                instance.id
            )
            return

        group_name = f"user_{instance.id}_updates"
        
        try:
            from api.serializers import UserSerializer # Example if UserSerializer is in api app
            data = UserSerializer(instance).data
        except ImportError:
            logger.error("UserSerializer not found. Cannot serialize user data for broadcast.")
            # Fallback to simple data if serializer is crucial and not found
            data = {
                'id': instance.id,
                'email': instance.email,
                'first_name': instance.first_name,
                'last_name': instance.last_name,
                'is_active': instance.is_active,
                'is_staff': instance.is_staff,
                'groups': [group.name for group in instance.groups.all()],
            }
        except Exception as e:
            logger.error(f"Error serializing user data for broadcast: {e}")
            data = {'id': instance.id, 'error': 'Serialization failed'}


        try:
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "send_user_update",
                    "data": data
                }
            )
            logger.info("SIGNALS API ENCONTRO CAMBIOS y el broadcast fue enviado correctamente")
        except Exception as e:
            logger.error(f"Failed to send user update broadcast for user ID {instance.id}: {e}")

@receiver(pre_save, sender=User)
def debug_user_signal(sender, instance, **kwargs):
    logger.info(f"pre_save triggered for {instance.email}")
