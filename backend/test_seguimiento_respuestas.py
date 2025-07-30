#!/usr/bin/env python
"""
Script para probar que el seguimiento pueda leer correctamente las respuestas 
sin stringify (objetos JSON nativos).
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

def test_respuestas_seguimiento():
    """Prueba que las respuestas se puedan leer correctamente para seguimiento"""
    
    print("🔍 Verificando respuestas para seguimiento...")
    
    # Obtener respuestas de tipo meta
    respuestas_meta = Respuesta.objects.filter(
        pregunta__tipo='meta'
    ).exclude(respuesta__isnull=True)[:5]
    
    print(f"📊 Total de respuestas meta encontradas: {respuestas_meta.count()}")
    
    for respuesta in respuestas_meta:
        print(f"\n📋 Respuesta ID: {respuesta.id}")
        print(f"   Usuario: {respuesta.usuario_id}")
        print(f"   Pregunta: {respuesta.pregunta_id}")
        print(f"   Tipo respuesta: {type(respuesta.respuesta)}")
        
        # Probar parsing como en el frontend
        try:
            if isinstance(respuesta.respuesta, str):
                respuesta_data = json.loads(respuesta.respuesta)
                print(f"   ✅ Parseado desde string JSON")
            else:
                respuesta_data = respuesta.respuesta
                print(f"   ✅ Objeto JSON nativo")
            
            # Extraer información de meta
            if isinstance(respuesta_data, dict):
                meta = respuesta_data.get('meta', 'Sin meta')
                pasos = respuesta_data.get('pasos', [])
                print(f"   Meta: {meta}")
                print(f"   Pasos: {len(pasos)}")
                
                for i, paso in enumerate(pasos):
                    descripcion = paso.get('descripcion', 'Sin descripción')
                    encargado = paso.get('encargado', 'Sin encargado')
                    print(f"     Paso {i+1}: {descripcion} (Encargado: {encargado})")
            else:
                print(f"   ❌ Formato inesperado: {respuesta_data}")
                
        except Exception as e:
            print(f"   ❌ Error parsing: {str(e)}")
    
    print("\n✅ Verificación de respuestas meta completada")

def test_respuestas_sis():
    """Prueba que las respuestas SIS se puedan leer correctamente"""
    
    print("\n🔍 Verificando respuestas SIS...")
    
    # Obtener respuestas SIS
    respuestas_sis = Respuesta.objects.filter(
        pregunta__tipo__in=['sis', 'sis2']
    ).exclude(respuesta__isnull=True)[:3]
    
    print(f"📊 Total de respuestas SIS encontradas: {respuestas_sis.count()}")
    
    for respuesta in respuestas_sis:
        print(f"\n📋 Respuesta SIS ID: {respuesta.id}")
        print(f"   Usuario: {respuesta.usuario_id}")
        print(f"   Pregunta: {respuesta.pregunta_id}")
        print(f"   Tipo respuesta: {type(respuesta.respuesta)}")
        
        # Probar parsing como en el frontend
        try:
            if isinstance(respuesta.respuesta, str):
                respuesta_data = json.loads(respuesta.respuesta)
                print(f"   ✅ Parseado desde string JSON")
            else:
                respuesta_data = respuesta.respuesta
                print(f"   ✅ Objeto JSON nativo")
            
            # Extraer información SIS
            if isinstance(respuesta_data, dict):
                frecuencia = respuesta_data.get('frecuencia', 'N/A')
                tiempo_apoyo = respuesta_data.get('tiempo_apoyo', 'N/A')
                tipo_apoyo = respuesta_data.get('tipo_apoyo', 'N/A')
                observaciones = respuesta_data.get('observaciones', 'N/A')
                subitems = respuesta_data.get('subitems', [])
                
                print(f"   Frecuencia: {frecuencia}")
                print(f"   Tiempo apoyo: {tiempo_apoyo}")
                print(f"   Tipo apoyo: {tipo_apoyo}")
                print(f"   Observaciones: {observaciones}")
                print(f"   Subitems: {len(subitems)}")
                
                for i, subitem in enumerate(subitems):
                    if isinstance(subitem, dict):
                        subitem_id = subitem.get('id', 'N/A')
                        subitem_texto = subitem.get('texto', 'N/A')
                        print(f"     Subitem {i+1}: ID={subitem_id}, Texto='{subitem_texto}'")
                    else:
                        print(f"     Subitem {i+1}: {subitem}")
            else:
                print(f"   ❌ Formato inesperado: {respuesta_data}")
                
        except Exception as e:
            print(f"   ❌ Error parsing: {str(e)}")
    
    print("\n✅ Verificación de respuestas SIS completada")

if __name__ == "__main__":
    test_respuestas_seguimiento()
    test_respuestas_sis() 