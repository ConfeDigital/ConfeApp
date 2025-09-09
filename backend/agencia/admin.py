from django.contrib import admin
from .models import *

class LocationAdmin(admin.ModelAdmin):
    list_display = ('address_road', 'address_number', 'address_municip', 'address_state', 'address_city', 'company')
    list_filter = ('company', 'address_municip', 'address_state', 'address_city')
    search_fields = ('address_road', 'address_municip', 'address_state', 'address_city')

class JobHabilidadRequeridaInline(admin.TabularInline):
    model = JobHabilidadRequerida
    extra = 1
    autocomplete_fields = ('habilidad',)

class JobAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'location', 'vacancies', 'sueldo_base', 'horario')
    list_filter = ('company',)
    search_fields = ('name', 'company__name', 'location__address_municip')
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'company', 'location', 'job_description', 'vacancies')
        }),
        ('Detalles del Empleo', {
            'fields': ('horario', 'sueldo_base', 'prestaciones')
        }),
    )
    inlines = [JobHabilidadRequeridaInline]

class EmployerAdmin(admin.ModelAdmin):
    list_display = ('user', 'company')
    list_filter = ('company',)
    search_fields = ('user__email', 'company__name')

class HabilidadAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'categoria', 'es_activa', 'fecha_creacion')
    list_filter = ('categoria', 'es_activa')
    search_fields = ('nombre', 'descripcion')
    list_editable = ('es_activa',)
    ordering = ('categoria', 'nombre')
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'descripcion', 'categoria', 'es_activa')
        }),
    )

class JobHabilidadRequeridaAdmin(admin.ModelAdmin):
    list_display = ('job', 'habilidad', 'nivel_importancia', 'fecha_asignacion')
    list_filter = ('nivel_importancia', 'fecha_asignacion', 'habilidad__categoria')
    search_fields = ('job__name', 'habilidad__nombre')
    autocomplete_fields = ('job', 'habilidad')

admin.site.register(Location, LocationAdmin)
admin.site.register(Company)
admin.site.register(Job, JobAdmin)
admin.site.register(Employer, EmployerAdmin)
admin.site.register(Habilidad, HabilidadAdmin)
admin.site.register(JobHabilidadRequerida, JobHabilidadRequeridaAdmin)
