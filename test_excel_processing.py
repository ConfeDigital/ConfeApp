#!/usr/bin/env python3
"""
Script de prueba para verificar el procesamiento del Excel
"""

import pandas as pd
import sys
import os

# Agregar el directorio del proyecto al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_excel_processing():
    """Prueba el procesamiento del Excel sin Django"""
    
    # Simular datos del Excel
    data = {
        'Nombre': ['Enrique', 'Iñaki'],
        'Apellido': ['Jiménez', 'Guerrero']
    }
    
    df = pd.DataFrame(data)
    print("🔍 DataFrame creado:")
    print(f"📊 Shape: {df.shape}")
    print(f"📋 Columnas: {list(df.columns)}")
    print(f"📄 Datos:")
    print(df)
    
    # Simular field mappings
    field_mappings = {
        'Nombre': 'first_name',
        'Apellido': 'last_name'
    }
    
    print(f"\n🗺️ Field mappings: {field_mappings}")
    
    # Simular procesamiento
    candidate_data_list = []
    
    for index, row in df.iterrows():
        candidate_data = {}
        candidate_name = row['Nombre']
        
        print(f"\n👤 Procesando candidato: {candidate_name}")
        print(f"📋 Fila completa: {row.to_dict()}")
        
        # Procesar cada pregunta/respuesta
        for question in df.columns:
            answer = row[question]
            print(f"  🔍 Procesando pregunta: '{question}' = '{answer}'")
            
            # Si la pregunta está mapeada
            if question in field_mappings:
                field_name = field_mappings[question]
                print(f"  🗺️ Pregunta '{question}' mapeada a campo '{field_name}'")
                if field_name:
                    candidate_data[field_name] = answer
                    print(f"  ✅ Mapeado '{question}' → '{field_name}': {answer}")
                else:
                    print(f"  ⚠️ Campo mapeado vacío para '{question}'")
            else:
                print(f"  ❌ Pregunta '{question}' NO está mapeada")
        
        print(f"  📊 Datos finales del candidato: {candidate_data}")
        candidate_data_list.append(candidate_data)
    
    print(f"\n📊 Resumen final:")
    print(f"  - Candidatos procesados: {len(candidate_data_list)}")
    for i, candidate in enumerate(candidate_data_list):
        print(f"  - Candidato {i+1}: {candidate}")

if __name__ == "__main__":
    test_excel_processing() 