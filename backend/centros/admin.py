from django.contrib import admin
from simple_history.admin import SimpleHistoryAdmin
from .models import *

admin.site.register(Location)
admin.site.register(Center, SimpleHistoryAdmin)
admin.site.register(TransferRequest)