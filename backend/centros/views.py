from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Location, Center, TransferRequest
from .serializers import LocationSerializer, CenterSerializer
from .transfer_serializers import TransferRequestSerializer
from api.serializers import UserSerializer
from api.permissions import PersonalPermission, GerentePermission
from django.db.models import Q
from django.utils import timezone
from django.contrib.auth.models import Group
from notifications.views import send_notification_to_user
from django.contrib.auth import get_user_model

User = get_user_model()

class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAdminUser]

class CenterViewSet(viewsets.ModelViewSet):
    queryset = Center.objects.all()
    serializer_class = CenterSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated, PersonalPermission]
        else:
            permission_classes = [permissions.IsAdminUser]
        return [permission() for permission in permission_classes]

class TransferRequestViewSet(viewsets.ModelViewSet):
    serializer_class = TransferRequestSerializer
    permission_classes = [permissions.IsAuthenticated, PersonalPermission, GerentePermission]

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name='gerente').exists() or user.is_staff:
            # Gerentes can see requests they sent or requests for users in their center
            personal_group = Group.objects.get(name='personal')
            return TransferRequest.objects.filter(
                (Q(source_center=user.center) | Q(destination_center=user.center)) & Q(requested_user__groups=personal_group)
            ).order_by('-requested_at')
        return TransferRequest.objects.none()

    def create(self, request, *args, **kwargs):
        if not request.user.groups.filter(name='gerente').exists() and not request.user.is_staff:
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        requested_user = serializer.validated_data['requested_user']
        if not requested_user.groups.filter(name='personal').exists():
            return Response({"detail": "Solo puedes canalizar a personal del sistema."}, status=status.HTTP_403_FORBIDDEN)
        
        self.perform_create(serializer)
        transfer_request = serializer.instance

        # --- NUEVO BLOQUE PARA ENVIAR LAS NOTIFICACIONES ---
        # Obtenemos todos los usuarios cuyo .center coincide con el centro de destino
        gerente_group = Group.objects.get(name='gerente')
        destinatarios = User.objects.filter( Q(center=transfer_request.destination_center) & (Q(groups=gerente_group) | Q(is_staff=True)) ).distinct()

        # Construimos un mensaje (puedes personalizar el texto)
        usuario = transfer_request.requested_user
        mensaje = (
            f"Nueva solicitud de traslado: "
            f"{usuario.first_name} {usuario.last_name} → "
            f"Desde: {transfer_request.source_center.name} → "
            f"Para: {transfer_request.destination_center.name}"
        )

        # Enviamos notificación a cada uno
        for u in destinatarios:
            send_notification_to_user(u.id, mensaje, link='/configuracion-del-centro')
        # ----------------------------------------------------
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept a transfer request and reject other pending requests for the user."""
        transfer_request = self.get_object()
        user = request.user

        if not user.groups.filter(name='gerente').exists() and not user.is_staff:
            return Response({"detail": "Solo gerentes pueden responder a una solicitud de traslado."}, status=status.HTTP_403_FORBIDDEN)

        if transfer_request.status != 'pending':
            return Response({"detail": "Esta solicitud ya no está en espera."}, status=status.HTTP_400_BAD_REQUEST)

        if transfer_request.destination_center != user.center:
            return Response({"detail": "Solo puedes aceptar solicitudes de usuarios trasladados a tu centro."}, status=status.HTTP_403_FORBIDDEN)

        requested_user = transfer_request.requested_user
        if not requested_user.groups.filter(name='personal').exists():
            return Response({"detail": "Solo puedes canalizar a personal del sistema."}, status=status.HTTP_403_FORBIDDEN)
        
        destination_center = transfer_request.destination_center

        # Update the requested user's center
        requested_user.center = destination_center
        requested_user.save()

        # Update the accepted transfer request
        transfer_request.status = 'accepted'
        transfer_request.responded_at = timezone.now()
        transfer_request.responder = user
        transfer_request.save()

        # Reject all other pending requests for the same user
        TransferRequest.objects.filter(
            requested_user=requested_user,
            status='pending'
        ).exclude(pk=transfer_request.pk).update(
            status='declined',
            responded_at=timezone.now(),
            responder=user  # Optionally set the responder
        )
        # Serialize the requested user data
        user_serializer = UserSerializer(requested_user)

        return Response(
            {
                "detail": f"Traslado de {requested_user.email} a {destination_center.name} aceptada. Otras solicitudes pendientes han sido rechazadas.",
                "user": user_serializer.data,
            },
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        """Decline a transfer request."""
        transfer_request = self.get_object()
        user = request.user

        if not user.groups.filter(name='gerente').exists() and not user.is_staff:
            return Response({"detail": "Solo gerentes pueden responder a una solicitud de traslado."}, status=status.HTTP_403_FORBIDDEN)

        if transfer_request.status != 'pending':
            return Response({"detail": "Esta solicitud ya no está en espera."}, status=status.HTTP_400_BAD_REQUEST)

        if transfer_request.destination_center != user.center and transfer_request.source_center != user.center:
            return Response({"detail": "Solo puedes aceptar solicitudes de usuarios trasladados desde o hacia tu centro."}, status=status.HTTP_403_FORBIDDEN)

        requested_user = transfer_request.requested_user
        if not requested_user.groups.filter(name='personal').exists():
            return Response({"detail": "Solo puedes canalizar a personal del sistema."}, status=status.HTTP_403_FORBIDDEN)
        
        transfer_request.status = 'declined'
        transfer_request.responded_at = timezone.now()
        transfer_request.responder = user
        transfer_request.save()
        return Response({"detail": f"Traslado de {transfer_request.requested_user.email} a {transfer_request.destination_center.name} rechazada."}, status=status.HTTP_200_OK)

class CanalizarCandidatoViewSet(viewsets.ModelViewSet):
    serializer_class = TransferRequestSerializer
    permission_classes = [permissions.IsAuthenticated, PersonalPermission]

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name='personal').exists() or user.is_staff:
            # Get direction parameter (incoming or outgoing)
            direction = self.request.query_params.get('direction', None)
            
            candidato_group = Group.objects.get(name='candidatos')
            base_query = TransferRequest.objects.filter(
                requested_user__groups=candidato_group
            )
            
            if direction == 'incoming':
                # Incoming requests - to user's center
                return base_query.filter(
                    destination_center=user.center
                ).order_by('-requested_at')
            elif direction == 'outgoing':
                # Outgoing requests - from user's center
                return base_query.filter(
                    source_center=user.center
                ).order_by('-requested_at')
            else:
                # If no direction specified, return all requests related to user's center
                return base_query.filter(
                    Q(source_center=user.center) | Q(destination_center=user.center)
                ).order_by('-requested_at')
                
        return TransferRequest.objects.none()

    def create(self, request, *args, **kwargs):
        if not request.user.groups.filter(name='personal').exists() and not request.user.is_staff:
            return Response(status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # guardamos la nueva TransferRequest
        self.perform_create(serializer)
        transfer_request = serializer.instance

        # --- NUEVO BLOQUE PARA ENVIAR LAS NOTIFICACIONES ---
        # Obtenemos todos los usuarios cuyo .center coincide con el centro de destino
        personal_group = Group.objects.get(name='personal')
        destinatarios = User.objects.filter(center=transfer_request.destination_center, groups=personal_group).distinct()

        # Construimos un mensaje (puedes personalizar el texto)
        candidato = transfer_request.requested_user
        mensaje = (
            f"Nueva solicitud de canalización: "
            f"{candidato.first_name} {candidato.last_name} → "
            f"Desde: {transfer_request.source_center.name} → "
            f"Para: {transfer_request.destination_center.name}"
        )

        link = f"/candidatos/visualizar/{candidato.id}/"
        # Enviamos notificación a cada uno
        for u in destinatarios:
            send_notification_to_user(u.id, mensaje, link=link)
        # ----------------------------------------------------

        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept a transfer request and reject other pending requests for the user."""
        transfer_request = self.get_object()
        user = request.user

        if not user.groups.filter(name='personal').exists() and not user.is_staff:
            return Response({"detail": "Solo personal del sistema puede responder a una canalización."}, status=status.HTTP_403_FORBIDDEN)

        if transfer_request.status != 'pending':
            return Response({"detail": "Esta solicitud ya no está en espera."}, status=status.HTTP_400_BAD_REQUEST)

        if transfer_request.destination_center != user.center:
            return Response({"detail": "Solo puedes aceptar solicitudes de candidatos canalizados a tu centro."}, status=status.HTTP_403_FORBIDDEN)

        requested_user = transfer_request.requested_user
        if not requested_user.groups.filter(name='candidatos').exists():
            return Response({"detail": "Solo puedes canalizar a candidatos."}, status=status.HTTP_403_FORBIDDEN)
        
        destination_center = transfer_request.destination_center

        # Update the requested user's center
        requested_user.center = destination_center
        requested_user.save()

        # Update the accepted transfer request
        transfer_request.status = 'accepted'
        transfer_request.responded_at = timezone.now()
        transfer_request.responder = user
        transfer_request.save()

        # Reject all other pending requests for the same user
        TransferRequest.objects.filter(
            requested_user=requested_user,
            status='pending'
        ).exclude(pk=transfer_request.pk).update(
            status='declined',
            responded_at=timezone.now(),
            responder=user  # Optionally set the responder
        )
        # Serialize the requested user data
        user_serializer = UserSerializer(requested_user)

        return Response(
            {
                "detail": f"Traslado de {requested_user.first_name} {requested_user.last_name} {requested_user.second_last_name} a {destination_center.name} aceptada. Otras solicitudes pendientes han sido rechazadas.",
                "user": user_serializer.data,
            },
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        """Decline a transfer request."""
        transfer_request = self.get_object()
        user = request.user

        if not user.groups.filter(name='personal').exists() and not user.is_staff:
            return Response({"detail": "Solo personal del sistema puede responder a una canalización."}, status=status.HTTP_403_FORBIDDEN)

        if transfer_request.status != 'pending':
            return Response({"detail": "Esta solicitud ya no está en espera."}, status=status.HTTP_400_BAD_REQUEST)

        if transfer_request.destination_center != user.center and transfer_request.source_center != user.center:
            return Response({"detail": "Solo puedes rechazar solicitudes de candidatos canalizados desde o hacia tu centro"}, status=status.HTTP_403_FORBIDDEN)

        requested_user = transfer_request.requested_user
        if not requested_user.groups.filter(name='candidatos').exists():
            return Response({"detail": "Solo puedes canalizar a candidatos."}, status=status.HTTP_403_FORBIDDEN)
        
        transfer_request.status = 'declined'
        transfer_request.responded_at = timezone.now()
        transfer_request.responder = user
        transfer_request.save()
        return Response({"detail": f"Traslado de {transfer_request.requested_user.first_name} {transfer_request.requested_user.last_name} {transfer_request.requested_user.second_last_name} a {transfer_request.destination_center.name} rechazada."}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], url_path='incoming-for-candidate/(?P<candidate_uid>[^/.]+)')
    def incoming_for_candidate(self, request, candidate_uid=None):
        user = request.user
        if not (user.groups.filter(name='personal').exists() or user.is_staff):
            return Response({"detail": "Permiso denegado."}, status=status.HTTP_403_FORBIDDEN)

        try:
            # Assuming 'User' model has a 'pk' that matches candidate_uid from the URL
            # and that 'UserProfile' is linked to 'User'
            # You might need to adjust `user__id` if `candidate_uid` refers to `UserProfile.id`
            # or some other unique identifier for a candidate.
            candidate_user = User.objects.get(pk=candidate_uid)
            candidato_group = Group.objects.get(name='candidatos')
            if not candidate_user.groups.filter(name='candidatos').exists():
                return Response({"detail": "El UID proporcionado no corresponde a un candidato."}, status=status.HTTP_404_NOT_FOUND)

        except User.DoesNotExist:
            return Response({"detail": "Candidato no encontrado."}, status=status.HTTP_404_NOT_FOUND)
        except Group.DoesNotExist:
            return Response({"detail": "El grupo 'candidatos' no existe."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Filter for incoming pending requests where the destination center is the current user's center
        # and the requested user is the candidate being viewed.
        queryset = TransferRequest.objects.filter(
            requested_user=candidate_user,
            destination_center=user.center,
            status='pending' # Only interested in pending requests for actions
        ).order_by('-requested_at')

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)