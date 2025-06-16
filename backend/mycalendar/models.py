from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.conf import settings
from simple_history.models import HistoricalRecords

User = settings.AUTH_USER_MODEL

class Appointment(models.Model):
    """
    Represents an appointment, mirroring relevant fields from Outlook Calendar.
    """
    subject = models.CharField(max_length=255, verbose_name="Subject")
    location = models.CharField(max_length=255, blank=True, null=True, verbose_name="Location")
    start_time = models.DateTimeField(verbose_name="Start Time")
    end_time = models.DateTimeField(verbose_name="End Time")
    is_all_day = models.BooleanField(default=False, verbose_name="All Day Event")
    body = models.TextField(blank=True, null=True, verbose_name="Body")
    sensitivity = models.CharField(
        max_length=20,
        choices=[
            ('normal', 'Normal'),
            ('personal', 'Personal'),
            ('private', 'Private'),
            ('confidential', 'Confidential'),
        ],
        default='normal',
        verbose_name="Sensitivity"
    )
    importance = models.CharField(
        max_length=10,
        choices=[
            ('low', 'Low'),
            ('normal', 'Normal'),
            ('high', 'High'),
        ],
        default='normal',
        verbose_name="Importance"
    )
    reminder_is_set = models.BooleanField(default=False, verbose_name="Reminder Set")
    reminder_minutes_before_start = models.IntegerField(blank=True, null=True, verbose_name="Reminder (Minutes Before)")
    show_as = models.CharField(
        max_length=20,
        choices=[
            ('free', 'Free'),
            ('tentative', 'Tentative'),
            ('busy', 'Busy'),
            ('oof', 'Out of Office'),
            ('workingelsewhere', 'Working Elsewhere'),
        ],
        default='busy',
        verbose_name="Show As"
    )
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='organized_appointments', verbose_name="Organizer")
    attendees = models.ManyToManyField(User, related_name='attended_appointments', blank=True, verbose_name="Attendees")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    category = models.CharField(max_length=100, blank=True, null=True, verbose_name="Category")  # Added category field

    history = HistoricalRecords()

    class Meta:
        verbose_name = "Appointment"
        verbose_name_plural = "Appointments"
        ordering = ['start_time']

    def __str__(self):
        return self.subject

    def clean(self):
        super().clean()
        if self.end_time <= self.start_time:
            raise ValidationError("End time must be after start time.")
        if self.reminder_is_set and self.reminder_minutes_before_start is None:
            raise ValidationError("If reminder is set, you must specify reminder minutes before start.")
        elif not self.reminder_is_set:
            self.reminder_minutes_before_start = None

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)