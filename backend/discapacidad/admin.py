from django.contrib import admin
from .models import DisabilityGroup, Disability, TechnicalAid, Impediment, SISGroup, SISItem, SISAid, SISHelp, CHGroup, CHItem

class DisabilityAdmin(admin.ModelAdmin):
    list_display = ('name', 'group')
    list_filter = ('group',)
    search_fields = ('name',)

class TechnicalAidAdmin(admin.ModelAdmin):
    list_display = ('name', 'impediment_list')
    list_filter = ('impediments',)
    search_fields = ('name',)

    def impediment_list(self, obj):
        if obj.impediments:
            return ", ".join([impediment.name for impediment in obj.impediments.all()])
        return "N/A"

    impediment_list.short_description = "Related Impediments"

class SISItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'group')
    list_filter = ('group',)
    search_fields = ('name',)

class SISAidAdmin(admin.ModelAdmin):
    list_display = ('sub_item', 'item')
    list_filter = ('item__group',)
    search_fields = ('item__name', 'sub_item')

class SISHelpAdmin(admin.ModelAdmin):
    list_display = ('sis_aid', 'descripcion')
    list_filter = ('sis_aid__item__group',)
    search_fields = ('sis_aid__item__name', 'sis_aid__sub_item')

class CHItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'group', 'aid')
    list_filter = ('group',)
    search_fields = ('name',)


admin.site.register(DisabilityGroup)
admin.site.register(Disability, DisabilityAdmin)
admin.site.register(Impediment)
admin.site.register(TechnicalAid, TechnicalAidAdmin)
admin.site.register(SISGroup)
admin.site.register(SISItem, SISItemAdmin)
admin.site.register(SISAid, SISAidAdmin)
admin.site.register(SISHelp, SISHelpAdmin)
admin.site.register(CHGroup)
admin.site.register(CHItem, CHItemAdmin)

