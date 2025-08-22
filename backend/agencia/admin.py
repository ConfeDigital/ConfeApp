from django.contrib import admin
from .models import *

class LocationAdmin(admin.ModelAdmin):
    list_display = ('address_road', 'address_number', 'address_municip', 'address_state', 'address_city', 'company')
    list_filter = ('company', 'address_municip', 'address_state', 'address_city')
    search_fields = ('address_road', 'address_municip', 'address_state', 'address_city')

class JobAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'location', 'vacancies')
    list_filter = ('company',)
    search_fields = ('name', 'company__name', 'location__address_municip')

class EmployerAdmin(admin.ModelAdmin):
    list_display = ('user', 'company')
    list_filter = ('company',)
    search_fields = ('user__email', 'company__name')

admin.site.register(Location, LocationAdmin)
admin.site.register(Company)
admin.site.register(Job, JobAdmin)
admin.site.register(Employer, EmployerAdmin)
