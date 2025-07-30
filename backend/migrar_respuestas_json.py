#!/usr/bin/env python
"""
Script para migrar respuestas que están guardadas como strings JSON 
a objetos JSON nativos en la base de datos.
"""

import os
import sys
import django
import json
from decimal import Decimal

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from cuestionarios.models import Respuesta
from django.db import transaction

def is_json_string(value):
    """Verifica si un valor es un string JSON válido"""
    if not isinstance(value, str):
        return False
    
    # Verificar si parece ser JSON
    if not (value.startswith('{') and value.endswith('}')) and \
       not (value.startswith('[') and value.endswith(']')):
        return False
    
    try:
        json.loads(value)
        return True
    except (json.JSONDecodeError, ValueError):
        return False

def migrate_json_responses():
    """Migra respuestas de strings JSON a objetos JSON nativos"""
    
    print("🔍 Iniciando migración de respuestas JSON...")
    
    # Obtener todas las respuestas
    respuestas = Respuesta.objects.all()
    total_respuestas = respuestas.count()
    
    print(f"📊 Total de respuestas encontradas: {total_respuestas}")
    
    # Contadores
    migradas = 0
    ya_migradas = 0
    errores = 0
    
    with transaction.atomic():
        for i, respuesta in enumerate(respuestas, 1):
            try:
                # Verificar si la respuesta es un string JSON
                if is_json_string(respuesta.respuesta):
                    print(f"🔄 Procesando respuesta {i}/{total_respuestas} (ID: {respuesta.id})")
                    print(f"   String original: {respuesta.respuesta[:100]}...")
                    
                    # Parsear el JSON
                    json_obj = json.loads(respuesta.respuesta)
                    
                    # Guardar como objeto JSON nativo
                    respuesta.respuesta = json_obj
                    respuesta.save()
                    
                    print(f"   ✅ Migrada exitosamente")
                    migradas += 1
                    
                else:
                    # Ya es un objeto JSON o no es JSON
                    if isinstance(respuesta.respuesta, (dict, list)):
                        ya_migradas += 1
                    else:
                        # Es un string normal, no JSON
                        ya_migradas += 1
                        
            except Exception as e:
                print(f"   ❌ Error migrando respuesta {respuesta.id}: {str(e)}")
                errores += 1
    
    # Resumen final
    print("\n" + "="*50)
    print("📋 RESUMEN DE MIGRACIÓN")
    print("="*50)
    print(f"✅ Respuestas migradas: {migradas}")
    print(f"⏭️  Ya migradas o no JSON: {ya_migradas}")
    print(f"❌ Errores: {errores}")
    print(f"📊 Total procesadas: {migradas + ya_migradas + errores}")
    
    if errores > 0:
        print("\n⚠️  Se encontraron errores durante la migración.")
        print("   Revisa los logs anteriores para más detalles.")
    
    return migradas, ya_migradas, errores

def verify_migration():
    """Verifica que la migración fue exitosa"""
    
    print("\n🔍 Verificando migración...")
    
    respuestas = Respuesta.objects.all()
    string_count = 0
    object_count = 0
    
    for respuesta in respuestas:
        if isinstance(respuesta.respuesta, str):
            string_count += 1
        elif isinstance(respuesta.respuesta, (dict, list)):
            object_count += 1
    
    print(f"📊 Respuestas como strings: {string_count}")
    print(f"📊 Respuestas como objetos: {object_count}")
    
    if string_count == 0:
        print("✅ ¡Migración exitosa! Todas las respuestas JSON están como objetos.")
    else:
        print(f"⚠️  Aún hay {string_count} respuestas como strings.")

if __name__ == "__main__":
    print("🚀 Iniciando migración de respuestas JSON...")
    
    # Ejecutar migración
    migradas, ya_migradas, errores = migrate_json_responses()
    
    # Verificar resultado
    verify_migration()
    
    print("\n🎉 ¡Proceso completado!") 