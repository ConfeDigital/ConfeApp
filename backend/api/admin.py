from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser
from .forms import CustomUserChangeForm # <-- Import your new form

class CustomUserAdmin(UserAdmin):
    # Use the custom form for the change view
    form = CustomUserChangeForm
    
    list_display = ['id', 'email', 'first_name', 'last_name', 'groups_list']
    list_filter = ['center', 'groups']
    ordering = ('date_joined',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('second_last_name', 'center')}),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Custom Fields', {'fields': ('second_last_name', 'center')}),
    )
    
    def groups_list(self, obj):
        return ", ".join([group.name for group in obj.groups.all()])

    groups_list.short_description = 'Groups'

admin.site.register(CustomUser, CustomUserAdmin)