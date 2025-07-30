#!/usr/bin/env python
"""
Script para migrar respuestas SIS que solo tienen IDs de subitems 
para que incluyan también el texto del subitem.
"""

import os
import sys
import django
import json

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from cuestionarios.models import Respuesta
from discapacidad.models import SISAid
from django.db import transaction

def migrar_subitems_con_texto():
    """Migra las respuestas SIS para incluir texto de subitems"""
    
    print("🔄 Iniciando migración de subitems con texto...")
    
    # Obtener todas las respuestas SIS
    respuestas_sis = Respuesta.objects.filter(
        pregunta__tipo__in=['sis', 'sis2']
    ).exclude(respuesta__isnull=True)
    
    print(f"📊 Total de respuestas SIS encontradas: {respuestas_sis.count()}")
    
    migradas = 0
    errores = 0
    ya_migradas = 0
    
    for respuesta in respuestas_sis:
        try:
            # Parsear la respuesta JSON
            if isinstance(respuesta.respuesta, str):
                respuesta_data = json.loads(respuesta.respuesta)
            else:
                respuesta_data = respuesta.respuesta
            
            # Verificar si ya tiene subitems con texto
            subitems = respuesta_data.get('subitems', [])
            if not subitems:
                continue
                
            # Verificar si ya están migrados (tienen estructura de objeto)
            primer_subitem = subitems[0] if subitems else None
            if primer_subitem and isinstance(primer_subitem, dict) and 'texto' in primer_subitem:
                ya_migradas += 1
                continue
            
            # Migrar subitems que solo tienen IDs
            subitems_migrados = []
            for subitem_id in subitems:
                if isinstance(subitem_id, (int, str)):
                    # Buscar el subitem en la base de datos
                    try:
                        subitem_obj = SISAid.objects.get(id=subitem_id)
                        subitems_migrados.append({
                            'id': subitem_id,
                            'texto': subitem_obj.sub_item or f"Subitem {subitem_id}"
                        })
                    except SISAid.DoesNotExist:
                        # Si no existe, mantener solo el ID
                        subitems_migrados.append({
                            'id': subitem_id,
                            'texto': f"Subitem {subitem_id} (no encontrado)"
                        })
                elif isinstance(subitem_id, dict):
                    # Ya está migrado
                    subitems_migrados.append(subitem_id)
                else:
                    # Tipo desconocido, mantener como está
                    subitems_migrados.append(subitem_id)
            
            # Actualizar la respuesta
            respuesta_data['subitems'] = subitems_migrados
            
            # Guardar la respuesta actualizada
            respuesta.respuesta = respuesta_data
            respuesta.save()
            
            migradas += 1
            print(f"✅ Migrada respuesta {respuesta.id} - Usuario: {respuesta.usuario_id}, Pregunta: {respuesta.pregunta_id}")
            
        except Exception as e:
            errores += 1
            print(f"❌ Error migrando respuesta {respuesta.id}: {str(e)}")
    
    print("\n" + "="*50)
    print("📋 RESUMEN DE MIGRACIÓN")
    print("="*50)
    print(f"✅ Respuestas migradas: {migradas}")
    print(f"⏭️ Ya migradas: {ya_migradas}")
    print(f"❌ Errores: {errores}")
    print(f"📊 Total procesadas: {migradas + ya_migradas + errores}")
    
    if errores == 0:
        print("\n🎉 ¡Migración completada exitosamente!")
    else:
        print(f"\n⚠️ Migración completada con {errores} errores.")

if __name__ == "__main__":
    migrar_subitems_con_texto() 