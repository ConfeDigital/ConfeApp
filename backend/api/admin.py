from django.contrib import admin
from .models import *
# Register your models here.

class CustomUserAdmin(admin.ModelAdmin):
    list_display = ['id', 'email', 'username']

admin.site.register(CustomUser, )
