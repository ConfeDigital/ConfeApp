from rest_framework import viewsets
from rest_framework.response import Response
from .serializers import UserSerializer
from .models import *
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from .permissions import IsInSameCenter, GerentePermission
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework import status, generics
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.db.models import Q
from django.conf import settings
from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions
from datetime import datetime, timedelta
import os

User = get_user_model()

class VerUsuarios(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id=None):  # Añadimos user_id como parámetro opcional
        if user_id:
            try:
                usuario = User.objects.get(id=user_id)  # Obtenemos el usuario por ID
                serializer = UserSerializer(usuario)
                return Response(serializer.data)
            except User.DoesNotExist:
                return Response({"error": "Usuario no encontrado"}, status=404)
        else:
            usuarios = User.objects.all()  # Obtenemos todos los usuarios si no hay ID
            serializer = UserSerializer(usuarios, many=True)
            return Response(serializer.data)

@login_required
def get_current_user(request):
    user = request.user
    return JsonResponse({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        # Add any other user information you need
    })

class UserViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for User: create, list (staff/personal), retrieve, update, delete.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsInSameCenter, GerentePermission]

    def get_queryset(self):
        """
        Optionally filters users based on group and center for non-admin users.
        """
        user = self.request.user
        if user.is_staff:
            return User.objects.all()
        elif user.groups.filter(name='gerente').exists():
            try:
                personal_group = Group.objects.get(name='personal')
                return User.objects.filter((Q(groups=personal_group) | Q(id=user.id)) & Q(center=user.center)).distinct()
            except Group.DoesNotExist:
                return User.objects.filter(id=user.id, center=user.center)
        return User.objects.none()

    def create(self, request, *args, **kwargs):
        if not request.user.is_staff and not request.user.groups.filter(name='gerente').exists():
            return Response(status=status.HTTP_403_FORBIDDEN)

        is_staff_requested = request.data.get('is_staff', False)
        if is_staff_requested and not request.user.is_staff:
            return Response({"detail": "Only administrators can create staff users."}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Assign groups
        group_names = request.data.get('groups_names', ['personal'])
        for name in group_names:
            grp, _ = Group.objects.get_or_create(name=name.lower())
            user.groups.add(grp)
        user.refresh_from_db()

        center_id = request.data.get('center_id')
        if center_id:
            if request.user.is_staff:
                try:
                    center = Center.objects.get(pk=center_id)
                    user.center = center
                    user.save()
                except Center.DoesNotExist:
                    return Response({"detail": "Centro especificado no encontrado."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                user.center = self.request.user.center if hasattr(self.request.user, 'center') else None
                user.save()
        elif hasattr(self.request.user, 'center'):
            user.center = self.request.user.center
            user.save()

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        user_to_update = self.get_object()

        if not request.user.is_staff and request.user.groups.filter(name='gerente').exists():
            # Gerentes can only update 'personal' users in their center
            if not user_to_update.groups.filter(name='personal').exists() or getattr(user_to_update, 'center') != getattr(request.user, 'center'):
                return Response(status=status.HTTP_403_FORBIDDEN)
            # Gerentes cannot change the is_staff status
            if 'is_staff' in request.data and request.data['is_staff'] != user_to_update.is_staff:
                return Response({"detail": "Gerentes cannot change the staff status of a user."}, status=status.HTTP_403_FORBIDDEN)

        elif not request.user.is_staff:
            return Response(status=status.HTTP_403_FORBIDDEN)

        is_staff_requested = request.data.get('is_staff')
        if is_staff_requested is True and not request.user.is_staff:
            return Response({"detail": "Only administrators can make a user a staff member."}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(user_to_update, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        center_id = request.data.get('center_id')
        if center_id:
            if request.user.is_staff:
                try:
                    center = Center.objects.get(pk=center_id)
                    user_to_update.center = center
                    user_to_update.save()
                except Center.DoesNotExist:
                    return Response({"detail": "Centro especificado no encontrado."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({"detail": "Solo administradores pueden cambiar el centro de un usuario."}, status=status.HTTP_403_FORBIDDEN)

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response(status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def staff(self, request):
        # GET /api/users/staff/ to list personal group or staff within the user's center
        try:
            personal = Group.objects.get(name='personal')
            qs = User.objects.filter((Q(groups=personal) | Q(is_staff=True)) & Q(center=self.request.user.center)).distinct()
        except Group.DoesNotExist:
            qs = User.objects.filter(is_staff=True, center=self.request.user.center)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def users_by_center(self, request):
        """
        GET /api/users/users_by_center/?center_id=<center_id> to list all users in a specific center.
        Requires admin user.
        """
        personal = Group.objects.get(name='personal')
        center_id = request.query_params.get('center_id')
        if not center_id:
            queryset = User.objects.filter(groups=personal) # Admins can see all users if no center is specified
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

        try:
            queryset = User.objects.filter(groups=personal, center_id=center_id)
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response({"error": "El ID del centro debe ser un entero."}, status=status.HTTP_400_BAD_REQUEST)
        except Center.DoesNotExist:
            return Response({"error": "Centro no encontrado."}, status=status.HTTP_404_NOT_FOUND)


class MediaSASTokenView(APIView):
    """
    Generate SAS tokens for accessing private Azure Storage media files
    Only works when using Azure Storage (deployment environment)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Generate a SAS token for a specific blob path
        Expected payload: {"blob_path": "path/to/file.jpg"}
        """
        # Check if we're using Azure Storage
        using_azure_storage = (
            hasattr(settings, 'STORAGES') and 
            settings.STORAGES.get('default', {}).get('BACKEND') == 'storages.backends.azure_storage.AzureStorage'
        )
        
        if not using_azure_storage:
            return Response(
                {"error": "SAS tokens are only available when using Azure Storage"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        blob_path = request.data.get('blob_path')
        if not blob_path:
            return Response(
                {"error": "blob_path is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get Azure Storage configuration from settings
            account_name = "saconfevm"
            account_key = os.getenv('AZURE_STORAGE_KEY')
            container_name = os.getenv('AZURE_CONTAINER', 'media')

            if not account_key:
                return Response(
                    {"error": "Azure Storage configuration not found"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Generate SAS token for the specific blob
            sas_token = generate_blob_sas(
                account_name=account_name,
                container_name=container_name,
                blob_name=blob_path,
                account_key=account_key,
                permission=BlobSasPermissions(read=True),
                expiry=datetime.utcnow() + timedelta(hours=1)  # Token expires in 1 hour
            )

            # Construct the full URL with SAS token
            blob_url = f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_path}?{sas_token}"

            return Response({
                "blob_url": blob_url,
                "sas_token": sas_token,
                "expires_at": (datetime.utcnow() + timedelta(hours=1)).isoformat()
            })

        except Exception as e:
            return Response(
                {"error": f"Failed to generate SAS token: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get(self, request):
        """
        Generate SAS token for blob path provided as query parameter
        Usage: GET /api/media-sas/?blob_path=path/to/file.jpg
        """
        blob_path = request.query_params.get('blob_path')
        if not blob_path:
            return Response(
                {"error": "blob_path query parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Reuse the POST logic
        request.data = {'blob_path': blob_path}
        return self.post(request)