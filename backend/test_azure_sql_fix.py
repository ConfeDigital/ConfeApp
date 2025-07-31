#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from cuestionarios.models import Respuesta, Pregunta, Cuestionario
from api.models import CustomUser
from cuestionarios.views import procesar_respuesta_para_tipo
import json

def test_azure_sql_fix():
    """Prueba que el fix de Azure SQL funciona correctamente"""
    
    # Obtener datos de prueba
    try:
        usuario = CustomUser.objects.first()
        cuestionario = Cuestionario.objects.first()
        pregunta_numero = Pregunta.objects.filter(tipo='numero').first()
        
        if not usuario or not cuestionario or not pregunta_numero:
            print("❌ No se encontraron datos de prueba necesarios")
            return
            
        print(f"✅ Usuario: {usuario.email}")
        print(f"✅ Cuestionario: {cuestionario.nombre}")
        print(f"✅ Pregunta numérica: {pregunta_numero.texto}")
        
        # Probar diferentes tipos de respuesta numérica
        respuestas_prueba = [
            "4",
            "123",
            "0",
            "-5",
            "3.14",
            42,
            0,
            -10
        ]
        
        for i, respuesta in enumerate(respuestas_prueba):
            print(f"\n--- Prueba {i+1}: {type(respuesta)} ---")
            print(f"Respuesta: {respuesta}")
            
            try:
                # Procesar la respuesta
                respuesta_procesada = procesar_respuesta_para_tipo(respuesta, 'numero')
                print(f"✅ Respuesta procesada: {respuesta_procesada}")
                print(f"✅ Tipo procesado: {type(respuesta_procesada)}")
                
                # Verificar que es un JSON válido
                json_str = json.dumps(respuesta_procesada)
                print(f"✅ JSON válido: {json_str}")
                
                # Intentar guardar en la base de datos
                respuesta_obj, created = Respuesta.objects.update_or_create(
                    usuario=usuario,
                    cuestionario=cuestionario,
                    pregunta=pregunta_numero,
                    defaults={'respuesta': respuesta_procesada}
                )
                
                print(f"✅ Respuesta guardada exitosamente: {created}")
                print(f"✅ Valor en BD: {respuesta_obj.respuesta}")
                
            except Exception as e:
                print(f"❌ Error: {e}")
                
    except Exception as e:
        print(f"❌ Error en la prueba: {e}")

if __name__ == "__main__":
    test_azure_sql_fix() 