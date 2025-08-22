from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import *
# Register your models here.

class CustomUserAdmin(UserAdmin):
    list_display = ['id', 'email', 'first_name', 'last_name', 'groups_list']
    list_filter = ['center', 'groups']

    def groups_list(self, obj):
        return ", ".join([group.name for group in obj.groups.all()])

    groups_list.short_description = 'Groups'

admin.site.register(CustomUser, CustomUserAdmin)
