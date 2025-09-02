"""
Utility functions for UserProfile field updates through questionnaires.
"""

from django.db import transaction
from candidatos.models import UserProfile
from api.models import CustomUser
from .profile_fields import get_field_metadata
import logging

logger = logging.getLogger(__name__)


def update_user_profile_field(user_id, field_path, value):
    """
    Update a specific UserProfile field.
    
    Args:
        user_id (int): The user ID
        field_path (str): The field path (e.g., 'personal_info.first_name')
        value: The new value for the field
    
    Returns:
        dict: Result with success status and message
    """
    try:
        with transaction.atomic():
            user = CustomUser.objects.get(id=user_id)
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            metadata = get_field_metadata(field_path)
            if not metadata:
                return {
                    'success': False,
                    'message': f'Invalid field path: {field_path}'
                }
            
            field_name = metadata['field_name']
            
            # Handle nested field access (e.g., user.first_name)
            if '.' in field_name:
                obj_name, attr_name = field_name.split('.', 1)
                if obj_name == 'user':
                    target_obj = user
                else:
                    return {
                        'success': False,
                        'message': f'Unsupported nested field: {field_name}'
                    }
            else:
                target_obj = profile
                attr_name = field_name
            
            # Convert value based on field type
            converted_value = convert_value_by_type(value, metadata['type'])
            
            # Set the field value
            setattr(target_obj, attr_name, converted_value)
            target_obj.save()
            
            logger.info(f"Updated {field_path} for user {user_id} to {converted_value}")
            
            return {
                'success': True,
                'message': f'{metadata["label"]} se actualizo exitosamente'
            }
            
    except CustomUser.DoesNotExist:
        return {
            'success': False,
            'message': f'User with ID {user_id} not found'
        }
    except Exception as e:
        logger.error(f"Error updating field {field_path} for user {user_id}: {str(e)}")
        return {
            'success': False,
            'message': f'Error updating field: {str(e)}'
        }


def bulk_update_user_profile_fields(user_id, field_updates):
    """
    Update multiple UserProfile fields at once.
    
    Args:
        user_id (int): The user ID
        field_updates (list): List of dicts with 'field_path' and 'value' keys
    
    Returns:
        dict: Result with success status, message, and details
    """
    results = []
    successful_updates = 0
    
    try:
        with transaction.atomic():
            for update in field_updates:
                field_path = update['field_path']
                value = update['value']
                
                result = update_user_profile_field(user_id, field_path, value)
                results.append({
                    'field_path': field_path,
                    'success': result['success'],
                    'message': result['message']
                })
                
                if result['success']:
                    successful_updates += 1
            
            return {
                'success': successful_updates == len(field_updates),
                'message': f'Updated {successful_updates} of {len(field_updates)} fields',
                'results': results,
                'successful_updates': successful_updates,
                'total_updates': len(field_updates)
            }
            
    except Exception as e:
        logger.error(f"Error in bulk update for user {user_id}: {str(e)}")
        return {
            'success': False,
            'message': f'Bulk update failed: {str(e)}',
            'results': results,
            'successful_updates': successful_updates,
            'total_updates': len(field_updates)
        }


def convert_value_by_type(value, field_type):
    """
    Convert a value to the appropriate type based on field metadata.
    
    Args:
        value: The raw value
        field_type (str): The field type ('text', 'choice', 'boolean', 'date', 'phonenumber' etc.)
    
    Returns:
        The converted value
    """
    if value is None or value == '':
        return None if field_type != 'boolean' else False
    
    if field_type == 'boolean':
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in ['true', '1', 'yes', 'sí']
        return bool(value)
    
    if field_type == 'date':
        from datetime import datetime
        if isinstance(value, str):
            try:
                # Try different date formats
                for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y']:
                    try:
                        return datetime.strptime(value, fmt).date()
                    except ValueError:
                        continue
                raise ValueError(f"Unable to parse date: {value}")
            except ValueError:
                raise ValueError(f"Invalid date format: {value}")
        return value
    
    # For text, choice, and textarea fields, return as string
    return str(value) if value is not None else None


def get_user_profile_field_value(user_id, field_path):
    """
    Get the current value of a UserProfile field.
    
    Args:
        user_id (int): The user ID
        field_path (str): The field path
    
    Returns:
        dict: Result with success status and value
    """
    try:
        user = CustomUser.objects.get(id=user_id)
        profile = UserProfile.objects.get(user=user)
        
        metadata = get_field_metadata(field_path)
        if not metadata:
            return {
                'success': False,
                'message': f'Invalid field path: {field_path}',
                'value': None
            }
        
        field_name = metadata['field_name']
        
        # Handle nested field access
        if '.' in field_name:
            obj_name, attr_name = field_name.split('.', 1)
            if obj_name == 'user':
                target_obj = user
            else:
                return {
                    'success': False,
                    'message': f'Unsupported nested field: {field_name}',
                    'value': None
                }
        else:
            target_obj = profile
            attr_name = field_name
        
        value = getattr(target_obj, attr_name, None)
        
        return {
            'success': True,
            'message': 'Field value retrieved successfully',
            'value': value
        }
        
    except (CustomUser.DoesNotExist, UserProfile.DoesNotExist):
        return {
            'success': False,
            'message': f'User or profile not found for ID {user_id}',
            'value': None
        }
    except Exception as e:
        logger.error(f"Error getting field {field_path} for user {user_id}: {str(e)}")
        return {
            'success': False,
            'message': f'Error retrieving field: {str(e)}',
            'value': None
        }