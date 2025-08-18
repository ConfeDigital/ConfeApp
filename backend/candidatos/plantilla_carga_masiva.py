import pandas as pd
import os
from datetime import datetime

def crear_plantilla_excel():
    """Crea una plantilla de Excel con todos los campos disponibles para carga masiva"""
    
    # Datos de ejemplo para la plantilla
    datos_ejemplo = {
        # Campos básicos del usuario
        'first_name': ['Juan', 'María', 'Carlos'],
        'last_name': ['Pérez', 'García', 'López'],
        'second_last_name': ['González', 'Martínez', 'Rodríguez'],
        'email': ['juan.perez@email.com', 'maria.garcia@email.com', 'carlos.lopez@email.com'],
        'password': ['password123', 'password123', 'password123'],
        
        # Campos del perfil
        'birth_date': ['1990-01-15', '1985-05-20', '1992-12-10'],
        'gender': ['M', 'F', 'M'],
        'curp': ['PERG900115HDFXXX01', 'GARM850520MDFXXX02', 'LORC921210HDFXXX03'],
        'phone_number': ['5551234567', '5559876543', '5554567890'],
        'stage': ['Reg', 'Pre', 'Ent'],
        'disability': ['Intelectual', 'Física', 'Visual'],
        'cycle': [1, 1, 1],
        
        # Campos booleanos
        'has_disability_certificate': [True, False, True],
        'has_interdiction_judgment': [False, False, False],
        'has_documentation_list': [True, True, False],
        'has_socioeconomic_study': [False, True, True],
        'receives_psychological_care': [False, True, False],
        'receives_psychiatric_care': [False, False, False],
        'has_seizures': [False, False, True],
        
        # Campos de pensiones y seguridad social
        'receives_pension': ['No', 'Bie', 'Orf'],
        'social_security': ['IMSS', 'ISSSTE', 'NINGUNO'],
        
        # Campos médicos
        'blood_type': ['A+', 'O+', 'B+'],
        'allergies': ['Polen', 'Ninguna', 'Penicilina'],
        'dietary_restrictions': ['Sin gluten', 'Ninguna', 'Sin lactosa'],
        'physical_restrictions': ['No puede levantar peso', 'Ninguna', 'Movilidad reducida'],
        
        # Campos de agencia
        'agency_state': ['Bol', 'Emp', 'Des'],
        'current_job': [None, 1, None],
        
        # Campos de domicilio
        'address_road': ['Av. Principal', 'Calle Secundaria', 'Boulevard Central'],
        'address_number': ['123', '456', '789'],
        'address_number_int': ['A', 'B', 'C'],
        'address_PC': ['12345', '54321', '98765'],
        'address_municip': ['Cuauhtémoc', 'Miguel Hidalgo', 'Coyoacán'],
        'address_col': ['Centro', 'Polanco', 'Del Valle'],
        'address_state': ['Ciudad de México', 'Ciudad de México', 'Ciudad de México'],
        'address_city': ['CDMX', 'CDMX', 'CDMX'],
        'address_lat': [19.4326, 19.4326, 19.4326],
        'address_lng': [-99.1332, -99.1332, -99.1332],
        'residence_type': ['CASA', 'DEPARTAMENTO', 'CASA'],
        
        # Campos de contacto de emergencia
        'emergency_first_name': ['María', 'José', 'Ana'],
        'emergency_last_name': ['Pérez', 'García', 'López'],
        'emergency_second_last_name': ['González', 'Martínez', 'Rodríguez'],
        'emergency_relationship': ['MADRE', 'PADRE', 'HERMANA'],
        'emergency_phone': ['5559876543', '5551234567', '5554567890'],
        'emergency_email': ['maria@email.com', 'jose@email.com', 'ana@email.com'],
        'emergency_lives_same_address': [True, False, True],
        
        # Campos de medicamentos (JSON string)
        'medications': [
            '[{"name": "Paracetamol", "dose": "500mg cada 8 horas", "reason": "Dolor de cabeza"}]',
            '[]',
            '[{"name": "Ibuprofeno", "dose": "400mg cada 6 horas", "reason": "Inflamación"}]'
        ],
    }
    
    # Crear DataFrame
    df = pd.DataFrame(datos_ejemplo)
    
    # Crear directorio si no existe
    os.makedirs('plantillas', exist_ok=True)
    
    # Generar nombre de archivo con timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'plantillas/plantilla_carga_masiva_candidatos_{timestamp}.xlsx'
    
    # Crear archivo Excel con formato
    with pd.ExcelWriter(filename, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Candidatos', index=False)
        
        # Obtener el workbook y worksheet
        workbook = writer.book
        worksheet = writer.sheets['Candidatos']
        
        # Ajustar ancho de columnas
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            
            adjusted_width = min(max_length + 2, 50)
            worksheet.column_dimensions[column_letter].width = adjusted_width
    
    print(f"✅ Plantilla creada exitosamente: {filename}")
    print("\n📋 INSTRUCCIONES DE USO:")
    print("1. Abre el archivo Excel generado")
    print("2. Completa los datos de tus candidatos en las filas correspondientes")
    print("3. Guarda el archivo")
    print("4. Sube el archivo en la aplicación web")
    print("\n📝 NOTAS IMPORTANTES:")
    print("- Los campos booleanos aceptan: true, si, sí, 1, x, en trámite, yes")
    print("- Las fechas deben estar en formato YYYY-MM-DD")
    print("- Los medicamentos deben estar en formato JSON válido")
    print("- Los campos de discapacidad deben coincidir con los nombres en la base de datos")
    
    return filename

if __name__ == "__main__":
    crear_plantilla_excel() 