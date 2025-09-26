"""
Custom error handling utilities for consistent Spanish error messages
"""
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

# Field name translations to Spanish
FIELD_TRANSLATIONS = {
    # User fields
    'email': 'Correo electrónico',
    'first_name': 'Nombre',
    'last_name': 'Apellido paterno',
    'second_last_name': 'Apellido materno',
    'password': 'Contraseña',
    
    # Profile fields
    'birth_date': 'Fecha de nacimiento',
    'gender': 'Género',
    'phone_number': 'Número de teléfono',
    'curp': 'CURP',
    'rfc': 'RFC',
    'nss': 'NSS',
    'blood_type': 'Tipo de sangre',
    'stage': 'Etapa',
    'cycle': 'Ciclo',
    
    # Address fields
    'address_road': 'Calle',
    'address_number': 'Número exterior',
    'address_number_int': 'Número interior',
    'address_PC': 'Código postal',
    'address_municip': 'Municipio',
    'address_col': 'Colonia',
    'address_state': 'Estado',
    'address_city': 'Ciudad',
    'address_lat': 'Latitud',
    'address_lng': 'Longitud',
    'residence_type': 'Tipo de residencia',
    
    # Medical fields
    'has_disability_certificate': 'Certificado de discapacidad',
    'has_interdiction_judgment': 'Sentencia de interdicción',
    'receives_pension': 'Recibe pensión',
    'social_security': 'Seguridad social',
    'receives_psychological_care': 'Recibe atención psicológica',
    'receives_psychiatric_care': 'Recibe atención psiquiátrica',
    'has_seizures': 'Tiene convulsiones',
    'medications': 'Medicamentos',
    'allergies': 'Alergias',
    'dietary_restrictions': 'Restricciones dietéticas',
    'physical_restrictions': 'Restricciones físicas',
    'disability': 'Discapacidad',
    
    # Emergency contact fields
    'emergency_contacts': 'Contactos de emergencia',
    'emergency_first_name': 'Nombre del contacto',
    'emergency_last_name': 'Apellido del contacto',
    'emergency_second_last_name': 'Segundo apellido del contacto',
    'emergency_relationship': 'Parentesco',
    'emergency_phone': 'Teléfono del contacto',
    'emergency_email': 'Correo del contacto',
    
    # Agency fields
    'agency_state': 'Estado de agencia',
    'current_job': 'Empleo actual',
    
    # Photo
    'photo': 'Foto',
}

# Error message translations
ERROR_MESSAGES = {
    'required': 'Este campo es obligatorio',
    'invalid': 'El valor ingresado no es válido',
    'blank': 'Este campo no puede estar vacío',
    'null': 'Este campo no puede ser nulo',
    'unique': 'Este valor ya existe',
    'max_length': 'Este campo es demasiado largo',
    'min_length': 'Este campo es demasiado corto',
    'invalid_choice': 'Seleccione una opción válida',
    'invalid_date': 'Ingrese una fecha válida',
    'invalid_email': 'Ingrese un correo electrónico válido',
    'invalid_phone': 'Ingrese un número de teléfono válido',
    'invalid_curp': 'Ingrese un CURP válido',
    'invalid_rfc': 'Ingrese un RFC válido',
    'invalid_nss': 'Ingrese un NSS válido',
    'file_too_large': 'El archivo es demasiado grande',
    'invalid_file_type': 'Tipo de archivo no válido',
}

def translate_field_name(field_name):
    """Translate field name to Spanish"""
    return FIELD_TRANSLATIONS.get(field_name, field_name.replace('_', ' ').title())

def translate_error_message(error_code, field_name=None):
    """Translate error code to Spanish message"""
    base_message = ERROR_MESSAGES.get(error_code, 'Error de validación')
    
    if field_name:
        field_translation = translate_field_name(field_name)
        return f"{field_translation}: {base_message}"
    
    return base_message

def format_validation_errors(errors):
    """
    Format Django REST Framework validation errors into a structured Spanish response
    """
    formatted_errors = {}
    
    for field, field_errors in errors.items():
        field_translation = translate_field_name(field)
        
        if isinstance(field_errors, list):
            # Handle list of errors
            translated_errors = []
            for error in field_errors:
                if isinstance(error, dict):
                    # Handle nested errors (like emergency_contacts)
                    nested_errors = {}
                    for nested_field, nested_error in error.items():
                        nested_field_translation = translate_field_name(nested_field)
                        if isinstance(nested_error, list):
                            nested_errors[nested_field_translation] = [
                                translate_error_message(str(err), nested_field) for err in nested_error
                            ]
                        else:
                            nested_errors[nested_field_translation] = translate_error_message(str(nested_error), nested_field)
                    translated_errors.append(nested_errors)
                else:
                    # Handle simple string errors
                    error_str = str(error)
                    if error_str in ERROR_MESSAGES:
                        translated_errors.append(translate_error_message(error_str, field))
                    else:
                        translated_errors.append(f"{field_translation}: {error_str}")
            
            formatted_errors[field_translation] = translated_errors
        else:
            # Handle single error
            error_str = str(field_errors)
            if error_str in ERROR_MESSAGES:
                formatted_errors[field_translation] = translate_error_message(error_str, field)
            else:
                formatted_errors[field_translation] = f"{field_translation}: {error_str}"
    
    return formatted_errors

def create_error_response(errors, status_code=status.HTTP_400_BAD_REQUEST, message="Error de validación"):
    """
    Create a structured error response with Spanish translations
    """
    formatted_errors = format_validation_errors(errors)
    
    return Response({
        'success': False,
        'message': message,
        'errors': formatted_errors,
        'error_count': sum(len(err) if isinstance(err, list) else 1 for err in formatted_errors.values())
    }, status=status_code)

def handle_serializer_errors(serializer_errors, custom_message="Error de validación"):
    """
    Handle serializer validation errors and return formatted response
    """
    logger.error(f"Serializer validation errors: {serializer_errors}")
    return create_error_response(serializer_errors, message=custom_message)

def handle_exception_errors(exception, custom_message="Error interno del servidor"):
    """
    Handle general exceptions and return formatted response
    """
    logger.error(f"Exception occurred: {str(exception)}")
    
    # Handle specific exception types
    if isinstance(exception, ValidationError):
        return create_error_response(exception.message_dict if hasattr(exception, 'message_dict') else {'non_field_errors': [str(exception)]})
    
    return Response({
        'success': False,
        'message': custom_message,
        'errors': {'general': [str(exception)]},
        'error_count': 1
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SpanishValidationError(serializers.ValidationError):
    """
    Custom validation error that automatically translates field names and messages
    """
    def __init__(self, message, field=None):
        if field:
            field_translation = translate_field_name(field)
            if isinstance(message, dict):
                # Handle nested errors
                translated_message = {}
                for key, value in message:
                    translated_key = translate_field_name(key)
                    if isinstance(value, list):
                        translated_message[translated_key] = [
                            translate_error_message(str(err), key) for err in value
                        ]
                    else:
                        translated_message[translated_key] = translate_error_message(str(value), key)
                super().__init__(translated_message)
            else:
                super().__init__({field_translation: [translate_error_message(str(message), field)]})
        else:
            super().__init__(message)

def validate_required_fields(data, required_fields):
    """
    Validate required fields and raise SpanishValidationError if missing
    """
    missing_fields = []
    for field in required_fields:
        if field not in data or not data[field]:
            missing_fields.append(translate_field_name(field))
    
    if missing_fields:
        raise SpanishValidationError({
            field: [ERROR_MESSAGES['required']] for field in missing_fields
        })

def validate_field_format(field_name, value, validation_type):
    """
    Validate field format and raise appropriate error
    """
    if not value:
        return
    
    field_translation = translate_field_name(field_name)
    
    if validation_type == 'email':
        if '@' not in value or '.' not in value.split('@')[-1]:
            raise SpanishValidationError(ERROR_MESSAGES['invalid_email'], field_name)
    
    elif validation_type == 'phone':
        if not value.replace('+', '').replace('-', '').replace(' ', '').replace('(', '').replace(')', '').isdigit():
            raise SpanishValidationError(ERROR_MESSAGES['invalid_phone'], field_name)
    
    elif validation_type == 'curp':
        if len(value) != 18 or not value.isalnum():
            raise SpanishValidationError(ERROR_MESSAGES['invalid_curp'], field_name)
    
    elif validation_type == 'rfc':
        if len(value) < 10 or len(value) > 13:
            raise SpanishValidationError(ERROR_MESSAGES['invalid_rfc'], field_name)
    
    elif validation_type == 'nss':
        if not value.isdigit() or len(value) != 11:
            raise SpanishValidationError(ERROR_MESSAGES['invalid_nss'], field_name)
