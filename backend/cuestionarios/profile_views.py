"""
Views for UserProfile field management in questionnaires.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404

from .profile_serializers import (
    AvailableProfileFieldsSerializer,
    ProfileFieldUpdateSerializer,
    BulkProfileFieldUpdateSerializer
)
from .profile_utils import (
    update_user_profile_field,
    bulk_update_user_profile_fields,
    get_user_profile_field_value
)
from api.models import CustomUser


class AvailableProfileFieldsView(APIView):
    """
    Get all available UserProfile fields that can be used in questionnaires.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Return all available profile fields organized by groups."""
        serializer = AvailableProfileFieldsSerializer({})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProfileFieldUpdateView(APIView):
    """
    Update a single UserProfile field for a specific user.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, user_id):
        """Update a single profile field."""
        serializer = ProfileFieldUpdateSerializer(data=request.data)
        if serializer.is_valid():
            field_path = serializer.validated_data['field_path']
            value = serializer.validated_data['value']
            
            result = update_user_profile_field(user_id, field_path, value)
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BulkProfileFieldUpdateView(APIView):
    """
    Update multiple UserProfile fields for a specific user.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, user_id):
        """Update multiple profile fields at once."""
        serializer = BulkProfileFieldUpdateSerializer(data=request.data)
        if serializer.is_valid():
            updates = serializer.validated_data['updates']
            
            result = bulk_update_user_profile_fields(user_id, updates)
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_207_MULTI_STATUS)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileFieldValueView(APIView):
    """
    Get the current value of a UserProfile field for a specific user.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, user_id, field_path):
        """Get the current value of a profile field."""
        result = get_user_profile_field_value(user_id, field_path)
        
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_profile_fields_summary(request, user_id):
    """
    Get a summary of all profile fields and their current values for a user.
    """
    try:
        user = get_object_or_404(CustomUser, id=user_id)
        
        from .profile_fields import get_all_available_fields
        from .profile_utils import get_user_profile_field_value
        
        field_groups = get_all_available_fields()
        summary = {}
        
        for group_name, group_data in field_groups.items():
            summary[group_name] = {
                'name': group_data['name'],
                'description': group_data['description'],
                'fields': {}
            }
            
            for field_name, field_metadata in group_data['fields'].items():
                field_path = f"{group_name}.{field_name}"
                result = get_user_profile_field_value(user_id, field_path)
                
                summary[group_name]['fields'][field_name] = {
                    'metadata': field_metadata,
                    'current_value': result.get('value') if result['success'] else None,
                    'error': result.get('message') if not result['success'] else None
                }
        
        return Response({
            'user_id': user_id,
            'user_email': user.email,
            'field_groups': summary
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Error retrieving profile fields summary: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)