#!/usr/bin/env python
"""
Script para probar la selección de subitems y verificar que se guarden con texto.
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

def test_subitem_structure():
    """Prueba la estructura de subitems en respuestas SIS"""
    
    print("🔍 Verificando estructura de subitems en respuestas SIS...")
    
    # Obtener algunas respuestas SIS
    respuestas_sis = Respuesta.objects.filter(
        pregunta__tipo__in=['sis', 'sis2']
    ).exclude(respuesta__isnull=True)[:5]
    
    for respuesta in respuestas_sis:
        print(f"\n📋 Respuesta ID: {respuesta.id}")
        print(f"   Usuario: {respuesta.usuario_id}")
        print(f"   Pregunta: {respuesta.pregunta_id}")
        print(f"   Tipo pregunta: {respuesta.pregunta.tipo}")
        
        # Parsear la respuesta
        if isinstance(respuesta.respuesta, str):
            respuesta_data = json.loads(respuesta.respuesta)
        else:
            respuesta_data = respuesta.respuesta
        
        subitems = respuesta_data.get('subitems', [])
        print(f"   Subitems encontrados: {len(subitems)}")
        
        for i, subitem in enumerate(subitems):
            if isinstance(subitem, dict):
                print(f"     Subitem {i+1}: ID={subitem.get('id')}, Texto='{subitem.get('texto')}'")
            else:
                print(f"     Subitem {i+1}: ID={subitem} (formato antiguo)")
    
    print("\n✅ Verificación completada")

def test_subitem_database():
    """Prueba la base de datos de subitems"""
    
    print("\n🔍 Verificando base de datos de subitems...")
    
    # Obtener algunos subitems de ejemplo
    subitems = SISAid.objects.all()[:10]
    
    print(f"📊 Total de subitems en BD: {SISAid.objects.count()}")
    print("\n📋 Ejemplos de subitems:")
    
    for subitem in subitems:
        print(f"   ID: {subitem.id}, Texto: '{subitem.sub_item}'")
    
    print("\n✅ Verificación de BD completada")

if __name__ == "__main__":
    test_subitem_structure()
    test_subitem_database() 