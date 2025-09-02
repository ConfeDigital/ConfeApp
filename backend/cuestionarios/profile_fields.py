"""
UserProfile field definitions for dynamic questionnaire generation.
This module defines which UserProfile fields can be edited through questionnaires.
"""

from candidatos.models import UserProfile, Domicile, EmergencyContact, Medication
from django.db import models

# Define field groups and their metadata
PROFILE_FIELD_GROUPS = {
    'personal_info': {
        'name': 'Información Personal',
        'description': 'Campos básicos de información personal',
        'fields': {
            'first_name': {
                'field_name': 'user.first_name',
                'label': 'Nombre',
                'type': 'text',
                'required': True,
                'max_length': 150,
                'help_text': 'Nombre de pila del usuario'
            },
            'last_name': {
                'field_name': 'user.last_name',
                'label': 'Apellido Paterno',
                'type': 'text',
                'required': True,
                'max_length': 150,
                'help_text': 'Apellido paterno del usuario'
            },
            'second_last_name': {
                'field_name': 'user.second_last_name',
                'label': 'Apellido Materno',
                'type': 'text',
                'required': False,
                'max_length': 150,
                'help_text': 'Apellido materno del usuario'
            },
            'birth_date': {
                'field_name': 'birth_date',
                'label': 'Fecha de Nacimiento',
                'type': 'date',
                'required': True,
                'help_text': 'Fecha de nacimiento del usuario'
            },
            'gender': {
                'field_name': 'gender',
                'label': 'Género',
                'type': 'choice',
                'required': False,
                'choices': UserProfile.GENDER_CHOICES,
                'help_text': 'Género del usuario'
            },
            'phone_number': {
                'field_name': 'phone_number',
                'label': 'Número de Teléfono',
                'type': 'phonenumber',
                'required': True,
                'max_length': 15,
                'help_text': 'Número de teléfono del usuario'
            },
            'stage': {
                'field_name': 'stage',
                'label': 'Etapa',
                'type': 'choice',
                'required': False,
                'choices': UserProfile.STAGE_CHOICES,
                'help_text': 'Etapa actual del usuario en el proceso'
            }
        }
    },
    'identification': {
        'name': 'Identificación',
        'description': 'Documentos de identificación y números oficiales',
        'fields': {
            'curp': {
                'field_name': 'curp',
                'label': 'CURP',
                'type': 'text',
                'required': False,
                'max_length': 18,
                'help_text': 'Clave Única de Registro de Población'
            },
            'rfc': {
                'field_name': 'rfc',
                'label': 'RFC',
                'type': 'text',
                'required': False,
                'max_length': 13,
                'help_text': 'Registro Federal de Contribuyentes'
            },
            'nss': {
                'field_name': 'nss',
                'label': 'NSS',
                'type': 'text',
                'required': False,
                'max_length': 11,
                'help_text': 'Número de Seguridad Social'
            }
        }
    },
    'medical_info': {
        'name': 'Información Médica',
        'description': 'Información médica y de salud',
        'fields': {
            'blood_type': {
                'field_name': 'blood_type',
                'label': 'Tipo de Sangre',
                'type': 'choice',
                'required': False,
                'choices': UserProfile.BLOOD_TYPE_CHOICES,
                'help_text': 'Tipo de sangre del usuario'
            },
            'has_disability_certificate': {
                'field_name': 'has_disability_certificate',
                'label': 'Tiene Certificado de Discapacidad',
                'type': 'boolean',
                'required': False,
                'help_text': 'Indica si el usuario tiene certificado de discapacidad'
            },
            'has_interdiction_judgment': {
                'field_name': 'has_interdiction_judgment',
                'label': 'Tiene Juicio de Interdicción',
                'type': 'boolean',
                'required': False,
                'help_text': 'Indica si el usuario tiene juicio de interdicción'
            },
            'receives_pension': {
                'field_name': 'receives_pension',
                'label': 'Recibe Pensión',
                'type': 'choice',
                'required': False,
                'choices': UserProfile.PENSION_CHOICES,
                'help_text': 'Tipo de pensión que recibe'
            },
            'receives_psychological_care': {
                'field_name': 'receives_psychological_care',
                'label': 'Recibe Atención Psicológica',
                'type': 'boolean',
                'required': False,
                'help_text': 'Indica si recibe atención psicológica'
            },
            'receives_psychiatric_care': {
                'field_name': 'receives_psychiatric_care',
                'label': 'Recibe Atención Psiquiátrica',
                'type': 'boolean',
                'required': False,
                'help_text': 'Indica si recibe atención psiquiátrica'
            },
            'social_security': {
                'field_name': 'social_security',
                'label': 'Seguridad Social',
                'type': 'choice',
                'required': False,
                'choices': UserProfile.SOCIAL_SECURITY_CHOICES,
                'help_text': 'Tipo de seguridad social'
            },
            'has_seizures': {
                'field_name': 'has_seizures',
                'label': 'Tiene Convulsiones',
                'type': 'boolean',
                'required': False,
                'help_text': 'Indica si el usuario tiene convulsiones'
            },
            'allergies': {
                'field_name': 'allergies',
                'label': 'Alergias',
                'type': 'textarea',
                'required': False,
                'help_text': 'Alergias conocidas del usuario'
            },
            'dietary_restrictions': {
                'field_name': 'dietary_restrictions',
                'label': 'Restricciones Dietéticas',
                'type': 'textarea',
                'required': False,
                'help_text': 'Restricciones dietéticas del usuario'
            },
            'physical_restrictions': {
                'field_name': 'physical_restrictions',
                'label': 'Restricciones Físicas',
                'type': 'textarea',
                'required': False,
                'help_text': 'Restricciones físicas del usuario'
            }
        }
    },
    'employment': {
        'name': 'Empleo',
        'description': 'Información relacionada con el empleo',
        'fields': {
            'agency_state': {
                'field_name': 'agency_state',
                'label': 'Estado de Agencia',
                'type': 'choice',
                'required': False,
                'choices': UserProfile.AGENCY_STATE_CHOICES,
                'help_text': 'Estado actual en la agencia'
            }
        }
    }
}

def get_field_metadata(field_path):
    """
    Get metadata for a specific field path.
    
    Args:
        field_path (str): The field path (e.g., 'personal_info.first_name')
    
    Returns:
        dict: Field metadata or None if not found
    """
    try:
        group_name, field_name = field_path.split('.', 1)
        return PROFILE_FIELD_GROUPS.get(group_name, {}).get('fields', {}).get(field_name)
    except ValueError:
        return None

def get_all_available_fields():
    """
    Get all available fields organized by groups.
    
    Returns:
        dict: All field groups and their fields
    """
    return PROFILE_FIELD_GROUPS

def get_field_choices(field_path):
    """
    Get choices for a choice field.
    
    Args:
        field_path (str): The field path
    
    Returns:
        list: List of tuples (value, label) or empty list
    """
    metadata = get_field_metadata(field_path)
    if metadata and metadata.get('type') == 'choice':
        return metadata.get('choices', [])
    return []