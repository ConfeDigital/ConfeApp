from django.contrib import admin
from .models import DisabilityGroup, Disability, TechnicalAid, Impediment, SISGroup, SISItem, SISAid, SISHelp, CHGroup, CHItem

admin.site.register(DisabilityGroup)
admin.site.register(Disability)
admin.site.register(Impediment)
admin.site.register(TechnicalAid)
admin.site.register(SISGroup)
admin.site.register(SISItem)
admin.site.register(SISAid)
admin.site.register(SISHelp)
admin.site.register(CHGroup)
admin.site.register(CHItem)

