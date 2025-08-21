from django.contrib import admin
from .models import *
from simple_history.admin import SimpleHistoryAdmin # type: ignore

# Register your models here.
class CycleAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']

class CandidateAdmin(admin.ModelAdmin):
    list_display = ['user.id', 'user.email', 'user.username']

class UserProfileInline(admin.TabularInline):
    model = EmergencyContact.userprofile_set.through
    extra = 1
    verbose_name = "Related User"
    verbose_name_plural = "Related Users"

class EmergencyContactAdmin(admin.ModelAdmin):
    list_display = ['id', 'first_name', 'last_name', 'second_last_name']
    inlines = [UserProfileInline] # Add the inline here

class DomicileAdmin(admin.ModelAdmin):
    list_display = ['id', 'address_road', 'address_number']

@admin.register(SISAidCandidateHistory)
class SISAidCandidateHistoryAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'candidate',
        'aid',
        'seccion',
        'item',
        'subitem',
        'is_active',
        'start_date',
        'end_date',
        'is_successful',
    )
    list_filter = ('is_active', 'is_successful', 'seccion')
    search_fields = ('candidate__user__email', 'item', 'subitem', 'aid__sis_aid__descripcion')
    ordering = ('-start_date',)

admin.site.register(Cycle, CycleAdmin)
admin.site.register(UserProfile, SimpleHistoryAdmin)
admin.site.register(EmergencyContact, EmergencyContactAdmin)
admin.site.register(Domicile, DomicileAdmin)
admin.site.register(TAidCandidateHistory)
admin.site.register(CHAidCandidateHistory)
admin.site.register(JobHistory)