from django.contrib import admin
from .models import *

class ForumTopicAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'created_at', 'updated_at', 'is_pinned', 'is_locked', 'views')
    search_fields = ('title', 'author__username', 'author__first_name', 'author__last_name')
    list_filter = ('is_pinned', 'is_locked', 'created_at', 'updated_at', 'author__center')
    readonly_fields = ('created_at', 'updated_at', 'views')

class ForumReplyAdmin(admin.ModelAdmin):
    list_display = ('topic', 'author', 'created_at', 'updated_at', 'is_edited')
    search_fields = ('topic__title', 'author__username', 'author__first_name', 'author__last_name')
    list_filter = ('created_at', 'updated_at', 'is_edited', 'topic__author__center')
    readonly_fields = ('created_at', 'updated_at')


admin.site.register(ForumTopic, ForumTopicAdmin)
admin.site.register(ForumReply, ForumReplyAdmin)
admin.site.register(CommunicationPost)
admin.site.register(CenterMessage)