"""
Serializers for UserProfile field management in questionnaires.
"""

from rest_framework import serializers
from .profile_fields import get_all_available_fields, get_field_metadata, get_field_choices


class ProfileFieldMetadataSerializer(serializers.Serializer):
    """Serializer for individual field metadata."""
    field_name = serializers.CharField()
    label = serializers.CharField()
    type = serializers.CharField()
    required = serializers.BooleanField()
    max_length = serializers.IntegerField(required=False)
    help_text = serializers.CharField()
    choices = serializers.ListField(
        child=serializers.ListField(child=serializers.CharField(), min_length=2, max_length=2),
        required=False
    )


class ProfileFieldGroupSerializer(serializers.Serializer):
    """Serializer for field groups."""
    name = serializers.CharField()
    description = serializers.CharField()
    fields = serializers.DictField(child=ProfileFieldMetadataSerializer())


class AvailableProfileFieldsSerializer(serializers.Serializer):
    """Serializer for all available profile fields."""
    field_groups = serializers.DictField(child=ProfileFieldGroupSerializer())
    
    def to_representation(self, instance):
        """Convert the profile fields data to the expected format."""
        return {
            'field_groups': get_all_available_fields()
        }


class ProfileFieldUpdateSerializer(serializers.Serializer):
    """Serializer for updating a specific profile field."""
    field_path = serializers.CharField(help_text="Field path in format 'group.field_name'")
    value = serializers.CharField(allow_blank=True, allow_null=True)
    
    def validate_field_path(self, value):
        """Validate that the field path exists."""
        metadata = get_field_metadata(value)
        if not metadata:
            raise serializers.ValidationError(f"Field path '{value}' is not valid.")
        return value
    
    def validate(self, attrs):
        """Validate the field value based on its metadata."""
        field_path = attrs.get('field_path')
        value = attrs.get('value')
        
        if not field_path:
            return attrs
            
        metadata = get_field_metadata(field_path)
        if not metadata:
            return attrs
        
        # Validate required fields
        if metadata.get('required') and not value:
            raise serializers.ValidationError({
                'value': f"Field '{metadata['label']}' is required."
            })
        
        # Validate max_length for text fields
        if metadata.get('max_length') and value and len(value) > metadata['max_length']:
            raise serializers.ValidationError({
                'value': f"Field '{metadata['label']}' cannot exceed {metadata['max_length']} characters."
            })
        
        # Validate choices for choice fields
        if metadata.get('type') == 'choice' and value:
            valid_choices = [choice[0] for choice in metadata.get('choices', [])]
            if value not in valid_choices:
                raise serializers.ValidationError({
                    'value': f"'{value}' is not a valid choice for field '{metadata['label']}'."
                })
        
        # Validate boolean fields
        if metadata.get('type') == 'boolean' and value is not None:
            if isinstance(value, str):
                if value.lower() in ['true', '1', 'yes', 'sí']:
                    attrs['value'] = True
                elif value.lower() in ['false', '0', 'no']:
                    attrs['value'] = False
                else:
                    raise serializers.ValidationError({
                        'value': f"'{value}' is not a valid boolean value."
                    })
        
        return attrs


class BulkProfileFieldUpdateSerializer(serializers.Serializer):
    """Serializer for updating multiple profile fields at once."""
    updates = serializers.ListField(
        child=ProfileFieldUpdateSerializer(),
        min_length=1,
        help_text="List of field updates"
    )
    
    def validate_updates(self, value):
        """Ensure no duplicate field paths."""
        field_paths = [update['field_path'] for update in value]
        if len(field_paths) != len(set(field_paths)):
            raise serializers.ValidationError("Duplicate field paths are not allowed.")
        return value