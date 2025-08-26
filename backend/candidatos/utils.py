import pandas as pd 
import math 
import random
import string
from candidatos.models import Cycle

def normalize_value(val):
    """Normaliza valores, convierte NULL/NaN a None o valores genéricos apropiados"""
    # Manejar valores NULL/NaN
    if pd.isna(val) or val is None:
        return None
    
    # Convertir a string para procesamiento
    if isinstance(val, str):
        val = val.strip()
        # Manejar strings vacíos o que representan NULL
        if val == '' or val.lower() in ['null', 'nan', 'none', 'n/a', 'no aplica', 'na', '-', '--']:
            return None
    
    # Manejar floats problemáticos
    if isinstance(val, float):
        if math.isinf(val) or math.isnan(val):
            return None
        # Convertir floats muy grandes o muy pequeños a None
        if abs(val) > 1e308 or (val != 0 and abs(val) < 1e-308):
            return None
        # Convertir floats enteros a int
        if val.is_integer():
            return int(val)
    
    return val

def generate_generic_value(field_name, field_type='string'):
    """Genera valores genéricos para campos requeridos que están NULL"""
    if field_type == 'phone':
        return "Sin especificar"
    elif field_type == 'email':
        # Generar email único
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
        return f"usuario.{random_suffix}@placeholder.com"
    elif field_type == 'name':
        return "Sin especificar"
    elif field_type == 'date':
        return None  # Las fechas pueden ser None
    elif field_type == 'boolean':
        return False
    elif field_type == 'number':
        return 0
    else:
        return "Sin especificar"

def process_excel_file(file):
    try:
        df = pd.read_excel(file)
        df = df.rename(columns=lambda col: col.strip())

        column_mapping = {
            # Campos del usuario
            "first_name": "first_name",
            "last_name": "last_name",
            "second_last_name": "second_last_name",
            "email": "email",
            "password": "password",
            
            # Campos del perfil
            "birth_date": "birth_date",
            "gender": "gender",
            "curp": "curp",
            "phone_number": "phone_number",
            "stage": "stage",
            "disability": "disability",
            "cycle": "cycle",
            
            # Campos booleanos (solo los que existen en el modelo)
            "has_disability_certificate": "has_disability_certificate",
            "has_interdiction_judgment": "has_interdiction_judgment",
            "receives_psychological_care": "receives_psychological_care",
            "receives_psychiatric_care": "receives_psychiatric_care",
            "has_seizures": "has_seizures",
            
            # Campos de pensiones y seguridad social
            "receives_pension": "receives_pension",
            "social_security": "social_security",
            
            # Campos médicos
            "blood_type": "blood_type",
            "allergies": "allergies",
            "dietary_restrictions": "dietary_restrictions",
            "physical_restrictions": "physical_restrictions",
            "medications": "medications",
            
            # Campos de agencia
            "agency_state": "agency_state",
            "current_job": "current_job",
            
            # Campos de domicilio (usando exactamente los campos del DomicileSerializer)
            "address_road": "address_road",
            "address_number": "address_number",
            "address_number_int": "address_number_int",
            "address_PC": "address_PC",
            "address_municip": "address_municip",
            "address_col": "address_col",
            "address_state": "address_state",
            "address_city": "address_city",
            "address_lat": "address_lat",
            "address_lng": "address_lng",
            "residence_type": "residence_type",
            
            # Campos de contacto de emergencia (usando exactamente los campos del EmergencyContactSerializer)
            "emergency_first_name": "emergency_first_name",
            "emergency_last_name": "emergency_last_name",
            "emergency_second_last_name": "emergency_second_last_name",
            "emergency_relationship": "emergency_relationship",
            "emergency_phone": "emergency_phone",
            "emergency_email": "emergency_email",
            
            # Campos legacy (mantener compatibilidad)
            "Generación": "cycle",
            "Nombre tutor / Institución": "emergency_first_name",
            "relationship": "emergency_relationship",
            "municipio": "address_municip"
        }

        # Agregar mapeo para múltiples contactos de emergencia (hasta 5 contactos)
        for i in range(1, 6):  # 1, 2, 3, 4, 5
            column_mapping.update({
                f"emergency_first_name_{i}": f"emergency_first_name_{i}",
                f"emergency_last_name_{i}": f"emergency_last_name_{i}",
                f"emergency_second_last_name_{i}": f"emergency_second_last_name_{i}",
                f"emergency_relationship_{i}": f"emergency_relationship_{i}",
                f"emergency_phone_{i}": f"emergency_phone_{i}",
                f"emergency_email_{i}": f"emergency_email_{i}",
            })

        valid_columns = {k: v for k, v in column_mapping.items() if k in df.columns}
        
        df = df[list(valid_columns.keys())]
        df = df.rename(columns=valid_columns)

        df = df.applymap(normalize_value)

        candidate_data_list = df.to_dict(orient="records")
        errors = []

        stage_mapping = {
            "registro": "Reg",
            "preentrevista": "Pre",
            "entrevista": "Ent",
            "capacitación": "Cap",
            "agencia": "Agn",
            "canalización": "Can"
        }

        for i, candidate in enumerate(candidate_data_list):
            try:
                # Limpiar valores problemáticos antes de procesar
                for key, value in candidate.items():
                    if isinstance(value, float):
                        if math.isinf(value) or math.isnan(value) or abs(value) > 1e308:
                            candidate[key] = None
                        elif value.is_integer():
                            candidate[key] = int(value)
                
                # Procesar fecha de nacimiento
                birth_date = candidate.get("birth_date")
                if birth_date:
                    try:
                        # Si es un objeto datetime de pandas, convertir a string YYYY-MM-DD
                        if hasattr(birth_date, 'strftime'):
                            candidate["birth_date"] = birth_date.strftime('%Y-%m-%d')
                        # Si es string, verificar formato
                        elif isinstance(birth_date, str):
                            birth_date = birth_date.strip()
                            # Si ya está en formato YYYY-MM-DD, dejarlo así
                            if len(birth_date) == 10 and birth_date[4] == '-' and birth_date[7] == '-':
                                candidate["birth_date"] = birth_date
                            # Si está en formato DD/MM/YYYY, convertir
                            elif '/' in birth_date:
                                parts = birth_date.split('/')
                                if len(parts) == 3:
                                    day, month, year = parts
                                    candidate["birth_date"] = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                            # Si está en formato MM/DD/YYYY, convertir
                            elif len(birth_date) == 10 and birth_date[2] == '/' and birth_date[5] == '/':
                                month, day, year = birth_date.split('/')
                                candidate["birth_date"] = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                            else:
                                # Si no se puede convertir, establecer como None
                                candidate["birth_date"] = None
                        else:
                            candidate["birth_date"] = None
                    except Exception:
                        candidate["birth_date"] = None
                else:
                    candidate["birth_date"] = None

                # Booleanos (solo los campos que existen en el modelo)
                for field in ['has_disability_certificate', 'has_interdiction_judgment',
                              'receives_psychological_care', 'receives_psychiatric_care',
                              'has_seizures']:
                    val = candidate.get(field, '')
                    if val is None:
                        candidate[field] = False
                    else:
                        val = str(val).strip().lower()
                        candidate[field] = val in ['true', 'si', 'sí', '1', 'x', 'en trámite']

                # Etapa - ASIGNAR AUTOMÁTICAMENTE "ENTREVISTA"
                candidate["stage"] = "Ent"

                # Ciclo
                ciclo_val = candidate.get("cycle", "")
                if ciclo_val is None:
                    candidate["cycle"] = None
                elif isinstance(ciclo_val, (int, float)):
                    if isinstance(ciclo_val, float) and ciclo_val.is_integer():
                        ciclo_val = int(ciclo_val)
                    candidate["cycle"] = ciclo_val
                else:
                    ciclo_val = str(ciclo_val).strip()
                    if ciclo_val.isdigit():
                        candidate["cycle"] = int(ciclo_val)
                    elif ciclo_val:
                        match = Cycle.objects.filter(name__icontains=ciclo_val).first()
                        if match:
                            candidate["cycle"] = match.id
                        else:
                            candidate["cycle"] = None
                    else:
                        candidate["cycle"] = None

                # Discapacidad - convertir nombres a IDs
                disability = candidate.get("disability", "")
                disability_ids = []
                
                if disability:
                    if isinstance(disability, str):
                        disability_names = [disability.strip()]
                    elif isinstance(disability, list):
                        disability_names = [d.strip() for d in disability]
                    else:
                        disability_names = []
                    
                    # Buscar IDs de discapacidades por nombre
                    from discapacidad.models import Disability
                    for name in disability_names:
                        if name:
                            # Buscar por nombre exacto o similar
                            disability_obj = Disability.objects.filter(name__icontains=name).first()
                            if disability_obj:
                                disability_ids.append(disability_obj.id)
                            else:
                                # Si no se encuentra, crear la discapacidad
                                try:
                                    # Obtener o crear un grupo por defecto
                                    from discapacidad.models import DisabilityGroup
                                    default_group, _ = DisabilityGroup.objects.get_or_create(name="General")
                                    
                                    disability_obj = Disability.objects.create(name=name, group=default_group)
                                    disability_ids.append(disability_obj.id)
                                except Exception as e:
                                    # Si hay error al crear (por ejemplo, nombre duplicado), ignorar
                                    pass
                
                candidate["disability"] = disability_ids
                    
                # Medicamentos - convertir nombres a objetos
                medications = candidate.get("medications", "")
                medication_data = []
                
                if medications:
                    if isinstance(medications, str):
                        medication_names = [medications.strip()]
                    elif isinstance(medications, list):
                        medication_names = [m.strip() for m in medications]
                    else:
                        medication_names = []
                    
                    # Crear datos de medicamentos
                    for name in medication_names:
                        if name:
                            medication_data.append({"name": name})
                
                candidate["medications"] = medication_data
                
                                # Procesar múltiples contactos de emergencia
                emergency_contacts = []
                
                # Debug: mostrar todos los campos del candidato para ver qué hay
                all_fields = list(candidate.keys())
                emergency_related_fields = [field for field in all_fields if 'emergency' in field.lower()]
                if emergency_related_fields:
                    print(f"DEBUG: Candidato {candidate.get('first_name', 'N/A')} - Campos de emergencia encontrados: {emergency_related_fields}")
                    for field in emergency_related_fields:
                        print(f"DEBUG:   {field}: '{candidate.get(field)}'")
                else:
                    print(f"DEBUG: Candidato {candidate.get('first_name', 'N/A')} - NO tiene campos de emergencia")
                
                # Procesar contactos individuales (legacy)
                if any(candidate.get(field) for field in ['emergency_first_name', 'emergency_last_name', 'emergency_relationship']):
                    print(f"DEBUG: Procesando contacto legacy para {candidate.get('first_name', 'N/A')}")
                    emergency_contacts.append({
                        'first_name': candidate.get('emergency_first_name'),
                        'last_name': candidate.get('emergency_last_name'),
                        'second_last_name': candidate.get('emergency_second_last_name'),
                        'relationship': normalize_relationship(candidate.get('emergency_relationship')),
                        'phone_number': normalize_phone(candidate.get('emergency_phone')),
                        'email': normalize_email(candidate.get('emergency_email')),
                        'lives_at_same_address': False  # Valor por defecto
                    })
                
                # Procesar múltiples contactos (nuevo formato)
                for contact_num in range(1, 6):  # 1, 2, 3, 4, 5
                    first_name = candidate.get(f'emergency_first_name_{contact_num}')
                    last_name = candidate.get(f'emergency_last_name_{contact_num}')
                    relationship = candidate.get(f'emergency_relationship_{contact_num}')
                    
                    print(f"DEBUG: Procesando contacto {contact_num} para {candidate.get('first_name', 'N/A')}: first_name='{first_name}', last_name='{last_name}', relationship='{relationship}'")
                    
                    if first_name and last_name and relationship:
                        contact_data = {
                            'first_name': first_name,
                            'last_name': last_name,
                            'second_last_name': candidate.get(f'emergency_second_last_name_{contact_num}'),
                            'relationship': normalize_relationship(relationship),
                            'phone_number': normalize_phone(candidate.get(f'emergency_phone_{contact_num}')),
                            'email': normalize_email(candidate.get(f'emergency_email_{contact_num}')),
                            'lives_at_same_address': False  # Valor por defecto
                        }
                        emergency_contacts.append(contact_data)
                        print(f"DEBUG: Contacto {contact_num} agregado: {contact_data}")
                    else:
                        print(f"DEBUG: Contacto {contact_num} NO cumple requisitos mínimos")
                
                # NO procesar contactos de emergencia aquí - se procesarán en el serializer
                print(f"DEBUG: Contactos de emergencia se procesarán en el serializer para {candidate.get('first_name', 'N/A')}")
                
                # Normalizar campos con opciones predefinidas
                candidate['gender'] = normalize_gender(candidate.get('gender'), candidate.get('first_name'))
                candidate['blood_type'] = normalize_blood_type(candidate.get('blood_type'))
                candidate['residence_type'] = normalize_residence_type(candidate.get('residence_type'))
                
                # Debug: mostrar campos de domicilio
                domicile_fields = ['address_road', 'address_number', 'address_number_int', 'address_PC', 
                                   'address_municip', 'address_col', 'address_state', 'address_city', 'address_lat', 'address_lng']
                domicile_available = [field for field in domicile_fields if field in candidate]
                if domicile_available:
                    print(f"DEBUG: Candidato {candidate.get('first_name', 'N/A')} - Campos de domicilio encontrados: {domicile_available}")
                    for field in domicile_available:
                        print(f"DEBUG:   {field}: '{candidate.get(field)}'")
                else:
                    print(f"DEBUG: Candidato {candidate.get('first_name', 'N/A')} - NO tiene campos de domicilio")
                
                # Asignar valores por defecto para campos que podrían ser None
                if not candidate.get('phone_number'):
                    candidate['phone_number'] = 'Sin especificar'
                
                if not candidate.get('curp'):
                    candidate['curp'] = None  # Permitir null
                
                if not candidate.get('blood_type'):
                    candidate['blood_type'] = None  # Permitir null
                
                if not candidate.get('allergies'):
                    candidate['allergies'] = None  # Permitir null
                
                if not candidate.get('dietary_restrictions'):
                    candidate['dietary_restrictions'] = None  # Permitir null
                
                if not candidate.get('physical_restrictions'):
                    candidate['physical_restrictions'] = None  # Permitir null
                
                if not candidate.get('agency_state'):
                    candidate['agency_state'] = None  # Permitir null
                
                if not candidate.get('current_job'):
                    candidate['current_job'] = None  # Permitir null
                
                print(f"DEBUG: Campos normalizados para {candidate.get('first_name', 'N/A')}: gender={candidate.get('gender')}, blood_type={candidate.get('blood_type')}, residence_type={candidate.get('residence_type')}")
                    
            except Exception as e:
                errors.append({ "row": i + 2, "error": str(e) })  # +2 para considerar encabezado y base 1

        return candidate_data_list, errors

    except Exception as e:
        raise ValueError(f"Error processing Excel file: {str(e)}")

def normalize_relationship(value):
    """
    Normaliza valores de relationship para que coincidan con las opciones válidas del modelo EmergencyContact
    """
    if not value:
        return None
    
    # Convertir a string y limpiar
    value = str(value).strip().upper()
    
    # Mapeo de valores comunes a opciones válidas
    relationship_mapping = {
        # Valores exactos
        'PADRE': 'PADRE',
        'MADRE': 'MADRE',
        'HERMANO': 'HERMANO',
        'HERMANA': 'HERMANA',
        'PAREJA': 'PAREJA',
        'ABUELO': 'ABUELO',
        'ABUELA': 'ABUELA',
        'HIJO': 'HIJO',
        'HIJA': 'HIJA',
        'OTRO FAM': 'OTRO FAM',
        'AMIGO': 'AMIGO',
        'AMIGA': 'AMIGA',
        'OTRO': 'OTRO',
        
        # Variaciones comunes
        'MAMA': 'MADRE',
        'MAMÁ': 'MADRE',
        'PAPA': 'PADRE',
        'PAPÁ': 'PADRE',
        'HERMANO/A': 'HERMANO',
        'HERMANA/O': 'HERMANA',
        'NOVIO': 'PAREJA',
        'NOVIA': 'PAREJA',
        'ESPOSO': 'PAREJA',
        'ESPOSA': 'PAREJA',
        'ABUELOS': 'ABUELO',
        'ABUELAS': 'ABUELA',
        'FAMILIAR': 'OTRO FAM',
        'FAMILIA': 'OTRO FAM',
        'TIO': 'OTRO FAM',
        'TÍA': 'OTRO FAM',
        'TIA': 'OTRO FAM',
        'PRIMO': 'OTRO FAM',
        'PRIMA': 'OTRO FAM',
        'SOBRINO': 'OTRO FAM',
        'SOBRINA': 'OTRO FAM',
        'AMIGOS': 'AMIGO',
        'COMPAÑERO': 'AMIGO',
        'COMPAÑERA': 'AMIGA',
        'VECINO': 'AMIGO',
        'VECINA': 'AMIGA',
        'CONOCIDO': 'AMIGO',
        'CONOCIDA': 'AMIGA',
    }
    
    return relationship_mapping.get(value, 'OTRO')

def detect_gender_from_name(first_name):
    """
    Detecta el género basado en el nombre usando patrones comunes en español
    """
    if not first_name:
        return None
    
    first_name = str(first_name).strip().lower()
    
    # Nombres típicamente femeninos
    female_names = [
        'maria', 'ana', 'carmen', 'isabel', 'josefina', 'dolores', 'pilar', 'teresa', 'rosario', 'concepcion',
        'lucia', 'angela', 'cristina', 'marta', 'julia', 'beatriz', 'elena', 'silvia', 'monica', 'patricia',
        'laura', 'sara', 'claudia', 'andrea', 'natalia', 'paula', 'carla', 'sofia', 'valeria', 'camila',
        'daniela', 'gabriela', 'alejandra', 'veronica', 'melissa', 'carolina', 'adriana', 'vanessa', 'diana',
        'mariana', 'luz', 'noemi', 'anahi', 'jenifer', 'carolina', 'melissa', 'maria fernanda', 'luz maria'
    ]
    
    # Nombres típicamente masculinos
    male_names = [
        'jose', 'juan', 'antonio', 'francisco', 'manuel', 'david', 'jose antonio', 'jose luis', 'francisco javier',
        'daniel', 'jose manuel', 'carlos', 'jesus', 'alejandro', 'miguel', 'jose maria', 'fernando', 'luis',
        'pablo', 'javier', 'alberto', 'carlos', 'adrian', 'diego', 'raul', 'eduardo', 'jorge', 'alberto',
        'miguel angel', 'angel', 'gabriel', 'manuel', 'eduardo', 'luis antonio', 'juan pablo', 'pablo ulises',
        'angel gabriel', 'angel alejandro', 'gabriel armando', 'rene', 'roman', 'ramon jesus', 'roman',
        'ruben', 'adrian', 'guillermo', 'luis enrique', 'leonardo', 'eder ibrahim', 'angel alejandro', 'eduardo saul'
    ]
    
    # Verificar si el nombre está en las listas
    if first_name in female_names:
        return 'F'
    elif first_name in male_names:
        return 'M'
    
    # Verificar patrones comunes
    if first_name.endswith('a') and not first_name.endswith('ia'):  # Nombres que terminan en 'a' suelen ser femeninos
        return 'F'
    elif first_name.endswith('o'):  # Nombres que terminan en 'o' suelen ser masculinos
        return 'M'
    
    # Si no se puede determinar, retornar None
    return None

def normalize_gender(value, first_name=None):
    """
    Normaliza valores de gender para que coincidan con las opciones válidas del modelo UserProfile
    Si no se proporciona un valor, intenta detectarlo del nombre
    """
    if value:
        value = str(value).strip().upper()
        
        gender_mapping = {
            'M': 'M',
            'MASCULINO': 'M',
            'HOMBRE': 'M',
            'MALE': 'M',
            'F': 'F',
            'FEMENINO': 'F',
            'MUJER': 'F',
            'FEMALE': 'F',
        }
        
        normalized = gender_mapping.get(value)
        if normalized:
            return normalized
    
    # Si no se pudo normalizar, intentar detectar del nombre
    if first_name:
        detected = detect_gender_from_name(first_name)
        if detected:
            return detected
    
    # Si todo falla, asignar un valor por defecto
    return 'O'  # 'Otro' como valor por defecto

def normalize_blood_type(value):
    """
    Normaliza valores de blood_type para que coincidan con las opciones válidas del modelo UserProfile
    """
    if not value:
        return None  # Valor por defecto null
    
    value = str(value).strip().upper()
    
    blood_type_mapping = {
        'A+': 'A+',
        'A-': 'A-',
        'B+': 'B+',
        'B-': 'B-',
        'AB+': 'AB+',
        'AB-': 'AB-',
        'O+': 'O+',
        'O-': 'O-',
        'A POSITIVO': 'A+',
        'A NEGATIVO': 'A-',
        'B POSITIVO': 'B+',
        'B NEGATIVO': 'B-',
        'AB POSITIVO': 'AB+',
        'AB NEGATIVO': 'AB-',
        'O POSITIVO': 'O+',
        'O NEGATIVO': 'O-',
    }
    
    return blood_type_mapping.get(value, None)  # Valor por defecto null

def normalize_residence_type(value):
    """
    Normaliza valores de residence_type para que coincidan con las opciones válidas del modelo Domicile
    """
    if not value:
        return 'CASA'  # Valor por defecto
    
    value = str(value).strip().upper()
    
    residence_mapping = {
        'CASA': 'CASA',
        'DEPARTAMENTO': 'DEPARTAMENTO',
        'ALBERGUE': 'ALBERGUE',
        'INSTITUCION': 'INSTITUCION',
        'OTRO': 'OTRO',
        'DEPTO': 'DEPARTAMENTO',
        'APT': 'DEPARTAMENTO',
        'APARTAMENTO': 'DEPARTAMENTO',
        'INSTITUTO': 'INSTITUCION',
        'ASILO': 'INSTITUCION',
        'CENTRO': 'INSTITUCION',
        'HOGAR': 'CASA',
        'VIVIENDA': 'CASA',
    }
    
    return residence_mapping.get(value, 'CASA')  # Valor por defecto

def normalize_email(value):
    """
    Normaliza y valida emails, retorna None si no es válido
    """
    if not value:
        return None
    
    value = str(value).strip()
    
    # Valores que no son emails válidos
    invalid_values = ['no', 'sin', 'n/a', 'no aplica', 'no tiene', 'no lo se', '0', '-', 'sin especificar']
    if value.lower() in invalid_values:
        return None
    
    # Si el valor no parece un email válido, retornar None
    if '@' not in value or '.' not in value:
        return None
    
    # Si el email es muy corto o muy largo, probablemente no es válido
    if len(value) < 5 or len(value) > 100:
        return None
    
    return value

def normalize_phone(value):
    """
    Normaliza números de teléfono
    """
    if not value:
        return None
    
    value = str(value).strip()
    
    # Valores que no son teléfonos válidos
    invalid_values = ['no', 'sin', 'n/a', 'no aplica', 'no tiene', 'no lo se', '0', '-', 'sin especificar']
    if value.lower() in invalid_values:
        return None
    
    # Si el teléfono es muy corto, probablemente no es válido
    if len(value) < 5:
        return None
    
    return value