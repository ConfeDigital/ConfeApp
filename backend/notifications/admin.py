from django.contrib import admin
from .models import *

class SettingsAdmin(admin.ModelAdmin):
    list_display = ('user', 'receive_notifications', 'receive_forum_notifications', 'receive_announcement_notifications', 'receive_emails')
    search_fields = ('user__username',)  

class BimonthlyCommentReminderAdmin(admin.ModelAdmin):
    list_display = ('employer', 'candidate', 'job', 'period_start', 'period_end', 'notification_sent', 'comment_provided', 'reminder_count', 'is_overdue')
    list_filter = ('notification_sent', 'comment_provided', 'period_start', 'period_end', 'employer__company')
    search_fields = ('employer__user__first_name', 'employer__user__last_name', 'candidate__user__first_name', 'candidate__user__last_name', 'job__name')
    readonly_fields = ('created_at', 'updated_at', 'notification_sent_at', 'comment_provided_at', 'last_reminder_sent', 'is_overdue', 'days_until_due')
    ordering = ['-period_start', 'employer', 'candidate']
    
    def is_overdue(self, obj):
        return obj.is_overdue
    is_overdue.boolean = True
    is_overdue.short_description = 'Overdue'

# Register your models here.
admin.site.register(Notification)
admin.site.register(Settings, SettingsAdmin)
admin.site.register(BimonthlyCommentReminder, BimonthlyCommentReminderAdmin)