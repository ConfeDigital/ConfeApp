from django.contrib import admin
from .models import *
from simple_history.admin import SimpleHistoryAdmin # type: ignore

# Register your models here.
class CycleAdmin(admin.ModelAdmin):
    list_display = ['name', 'start_date', 'end_date', 'center']
    list_filter = ['center']

class CandidateAdmin(SimpleHistoryAdmin):
    list_display = [
        'user_id', 
        'user_email', 
        'full_name', 
        'cycle',
    ]
    list_filter = ['user__center', 'cycle'] # Corrected: use a double-underscore lookup
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'user__second_last_name',)
    ordering = ('user__date_joined',)

    def user_id(self, obj):
        return obj.user.id
    user_id.short_description = 'User ID'

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Email'

    def full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name} {obj.user.second_last_name or ''}".strip()
    full_name.short_description = 'Full Name'

class UserProfileInline(admin.TabularInline):
    model = EmergencyContact.userprofile_set.through
    extra = 1
    verbose_name = "Related User"
    verbose_name_plural = "Related Users"

class EmergencyContactAdmin(admin.ModelAdmin):
    list_display = ['id', 'full_name', 'candidate_list', 'relationship']
    list_filter = []
    inlines = [UserProfileInline]

    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name} {obj.second_last_name or ''}".strip()
    full_name.short_description = 'Full Name'

    def candidate_list(self, obj):
        return ", ".join([profile.user.email for profile in obj.userprofile_set.all()])
    candidate_list.short_description = "Related Candidates"

class DomicileAdmin(admin.ModelAdmin):
    list_display = ['id', 'address_road', 'address_number', 'address_municip', 'address_city', 'user_email']

    def user_email(self, obj):
        return obj.userprofile.user.email
    user_email.short_description = 'Candidate'

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

class TAidCandidateHistoryAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'candidate',
        'aid',
        'impediment_list',
        'is_active',
        'start_date',
        'end_date',
        'is_successful',
    )
    list_filter = ('is_active', 'is_successful')
    search_fields = ('candidate__user__email', 'aid')
    ordering = ('-start_date',)

    def impediment_list(self, obj):
        if obj.aid:
            return ", ".join([impediment.name for impediment in obj.aid.impediments.all()])
        return "N/A"
    
    impediment_list.short_description = "Related Impediments"

class JobHistoryAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'job', 'start_date', 'end_date')
    list_filter = ('job', 'start_date', 'end_date')
    search_fields = ('candidate__user__email', 'candidate__user__first_name', 'candidate__user__last_name', 'candidate__user__second_last_name', 'job__name')

admin.site.register(Cycle, CycleAdmin)
admin.site.register(UserProfile, CandidateAdmin)
admin.site.register(EmergencyContact, EmergencyContactAdmin)
admin.site.register(Domicile, DomicileAdmin)
admin.site.register(TAidCandidateHistory, TAidCandidateHistoryAdmin)
admin.site.register(CHAidCandidateHistory)
admin.site.register(JobHistory, JobHistoryAdmin)