from django.db import models
from django.core.exceptions import ValidationError
from simple_history.models import HistoricalRecords
from django.conf import settings

User = settings.AUTH_USER_MODEL

class Location(models.Model):
    address_road = models.CharField(max_length=50, null=True, blank=True)
    address_number = models.CharField(max_length=8, null=True, blank=True)
    address_number_int = models.CharField(max_length=8, null=True, blank=True)
    address_PC = models.CharField(max_length=5, null=True, blank=True)
    address_municip = models.CharField(max_length=128, null=True, blank=True)
    address_col = models.CharField(max_length=128, null=True, blank=True)
    address_state = models.CharField(max_length=128, null=True, blank=True)
    address_city = models.CharField(max_length=128, null=True, blank=True)
    address_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    address_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    def __str__(self):
        return f"{self.address_road}, {self.address_number}, {self.address_municip}, {self.address_city}, {self.address_state}"
    
class Center(models.Model):
    name = models.CharField(max_length=255, unique=True)

    location = models.OneToOneField(Location, on_delete=models.SET_NULL, null=True, blank=True)

    CENTER_TYPE_CHOICES = [
        ('Con', 'Confe'),
        ('Cei', 'CEIL'),
    ]
    center_type = models.CharField(max_length=3, choices=CENTER_TYPE_CHOICES, default=None, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    history = HistoricalRecords()

    def __str__(self):
        return self.name


class TransferRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]

    requester = models.ForeignKey(User, related_name='transfer_requests_sent', on_delete=models.CASCADE)
    requested_user = models.ForeignKey(User, related_name='transfer_requests_received', on_delete=models.CASCADE)
    source_center = models.ForeignKey(Center, related_name='transfer_requests_from', on_delete=models.CASCADE)
    destination_center = models.ForeignKey(Center, related_name='transfer_requests_to', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    responder = models.ForeignKey(User, related_name='transfer_requests_responded', null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['requested_user', 'destination_center'], condition=models.Q(status='pending'), name='unique_pending_transfer')
        ]
    
    def clean(self):
        super().clean()
        #Django 4.0 and up automatically prevents saving model with duplicate values in unique constraint
        #This is for versions before 4.0
        if self.status == 'pending':
            existing_pending_request = TransferRequest.objects.filter(
                requested_user=self.requested_user,
                destination_center=self.destination_center,
                status='pending'
            ).exclude(pk=self.pk).exists() #exclude self on update
            if existing_pending_request:
                raise ValidationError("Ya existe una solicitud de traslado par este usuario y centro")

    def save(self, *args, **kwargs):
        self.full_clean()  # Ensure validation runs before saving
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Transfer of {self.requested_user.email} from {self.source_center.name} to {self.destination_center.name} ({self.status})"
