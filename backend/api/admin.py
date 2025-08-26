from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    list_display = ['id', 'email', 'first_name', 'last_name', 'groups_list']
    list_filter = ['center', 'groups']
    ordering = ('date_joined',)
    
    # Redefine the fieldsets for the change form
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('second_last_name', 'center')}),
    )

    # Redefine add_fieldsets for the user creation form
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Custom Fields', {'fields': ('email', 'first_name', 'last_name', 'second_last_name', 'center')}),
    )
    # Note: UserAdmin's add_fieldsets usually doesn't include name fields, so you should add them explicitly if you want them on creation

    def groups_list(self, obj):
        return ", ".join([group.name for group in obj.groups.all()])

    groups_list.short_description = 'Groups'

admin.site.register(CustomUser, CustomUserAdmin)