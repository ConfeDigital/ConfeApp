from django.contrib import admin
from .models import *

class SettingsAdmin(admin.ModelAdmin):
    list_display = ('user', 'receive_notifications', 'receive_forum_notifications', 'receive_announcement_notifications', 'receive_emails')
    search_fields = ('user__username',)  

# Register your models here.
admin.site.register(Notification)
admin.site.register(Settings, SettingsAdmin)