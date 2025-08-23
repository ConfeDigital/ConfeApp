from django.contrib import admin
from simple_history.admin import SimpleHistoryAdmin
from .models import *

class LocationAdmin(admin.ModelAdmin):
    list_display = ['address_road', 'address_number', 'address_municip', 'address_city', 'address_state', 'center']
    search_fields = ['center__name', 'address_municip', 'address_city', 'address_state']

admin.site.register(Location, LocationAdmin)
admin.site.register(Center, SimpleHistoryAdmin)
admin.site.register(TransferRequest)