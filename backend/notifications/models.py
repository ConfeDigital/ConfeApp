from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

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


class BimonthlyCommentReminder(models.Model):
    """
    Model to track bimonthly comment reminders for employers about their candidates.
    """
    employer = models.ForeignKey(
        'agencia.Employer', 
        on_delete=models.CASCADE,
        help_text="The employer who needs to provide comments"
    )
    candidate = models.ForeignKey(
        'candidatos.UserProfile',
        on_delete=models.CASCADE,
        help_text="The candidate who needs evaluation"
    )
    job = models.ForeignKey(
        'agencia.Job',
        on_delete=models.CASCADE,
        help_text="The job the candidate is currently assigned to"
    )
    
    # Tracking dates
    period_start = models.DateField(
        help_text="Start date of the bimonthly period"
    )
    period_end = models.DateField(
        help_text="End date of the bimonthly period"
    )
    
    # Status tracking
    notification_sent = models.BooleanField(
        default=False,
        help_text="Whether the notification has been sent to the employer"
    )
    notification_sent_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="When the notification was sent"
    )
    
    comment_provided = models.BooleanField(
        default=False,
        help_text="Whether the employer has provided a comment for this period"
    )
    comment_provided_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the comment was provided"
    )
    
    # Reminder tracking
    reminder_count = models.IntegerField(
        default=0,
        help_text="Number of reminders sent"
    )
    last_reminder_sent = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the last reminder was sent"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['employer', 'candidate', 'job', 'period_start']
        verbose_name = 'Bimonthly Comment Reminder'
        verbose_name_plural = 'Bimonthly Comment Reminders'
        ordering = ['-period_start', 'employer', 'candidate']
    
    def __str__(self):
        return f"Reminder for {self.employer.user.get_full_name()} about {self.candidate.user.get_full_name()} ({self.period_start} - {self.period_end})"
    
    @property
    def is_overdue(self):
        """Check if the comment period is overdue"""
        return timezone.now().date() > self.period_end and not self.comment_provided
    
    @property
    def days_until_due(self):
        """Calculate days until the comment is due"""
        return (self.period_end - timezone.now().date()).days
    
    def mark_comment_provided(self):
        """Mark that a comment has been provided for this period"""
        self.comment_provided = True
        self.comment_provided_at = timezone.now()
        self.save()
    
    def send_reminder(self):
        """Send a reminder notification to the employer"""
        from .views import send_notification_to_user
        
        days_left = self.days_until_due
        if days_left < 0:
            message = f"⚠️ Evaluación VENCIDA: Debe proporcionar observaciones sobre {self.candidate.user.get_full_name()} en el empleo '{self.job.name}'. Vencimiento: {self.period_end.strftime('%d/%m/%Y')}"
            notification_type = "warning"
        elif days_left <= 3:
            message = f"🔔 Recordatorio URGENTE: Debe evaluar a {self.candidate.user.get_full_name()} en '{self.job.name}' antes del {self.period_end.strftime('%d/%m/%Y')} ({days_left} días restantes)"
            notification_type = "warning"
        else:
            message = f"📝 Recordatorio: Es momento de evaluar a {self.candidate.user.get_full_name()} en el empleo '{self.job.name}'. Fecha límite: {self.period_end.strftime('%d/%m/%Y')}"
            notification_type = "info"
        
        # Send notification with link to the job candidates page
        link = f"/empleador/empleo/{self.job.id}"
        
        send_notification_to_user(
            user_id=self.employer.user.id,
            message=message,
            link=link,
            notification_type=notification_type
        )
        
        # Update tracking
        self.reminder_count += 1
        self.last_reminder_sent = timezone.now()
        if not self.notification_sent:
            self.notification_sent = True
            self.notification_sent_at = timezone.now()
        self.save()