from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    message = models.TextField()
    type = models.CharField(
        max_length=50,
        choices=(("info", "Info"), ("warning", "Warning"), ("success", "Success"))
    )
    link = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text="Ruta interna o URL a la que navegar al hacer clic"
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification({self.id}) → {self.user}"


class Settings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="notification_settings")

    receive_notifications = models.BooleanField(default=True)
    receive_forum_notifications = models.BooleanField(default=True)
    receive_announcement_notifications = models.BooleanField(default=True)

    receive_emails = models.BooleanField(default=True)

    def __str__(self):
        return f"Settings({self.id}) → {self.user}"