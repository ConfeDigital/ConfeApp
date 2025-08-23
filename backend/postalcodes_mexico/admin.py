# -*- coding: utf-8 -*-

from django.contrib import admin

from .models import (
   PostalCode,
)


@admin.register(PostalCode)
class PostalCodeAdmin(admin.ModelAdmin):
   search_fields = (
      'd_codigo',
      'd_asenta',
      'D_mnpio',
      'd_ciudad',
      'd_CP',
      'c_estado',
      'c_oficina',
      'c_tipo_asenta',
      'c_mnpio',
      'id_asenta_cpcons',
      'd_zona',
      'c_cve_ciudad',
   )
   list_filter = ('c_estado',)
   pass



