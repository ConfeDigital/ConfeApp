from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

class Company(models.Model):
    name = models.CharField(max_length=255, unique=True)

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
    
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

    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True)
    
    def __str__(self):
        return f"{self.address_road}, {self.address_number}, {self.address_municip}, {self.address_city}, {self.address_state}"
    
class Job(models.Model):
    name = models.CharField(max_length=255, unique=True)

    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True)
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True)

    job_description = models.TextField(null=True, blank=True)

    vacancies = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.company.name} - {self.name}"

class Employer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)

    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True)
    
    def __str__(self):
        company_name_str = f"{self.company.name} - " if self.company else ""
        return f"{company_name_str} - {self.user.first_name} {self.user.last_name}"