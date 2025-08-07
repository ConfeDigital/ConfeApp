from django.http import Http404
from simple_history.utils import update_change_reason # type: ignore
from .models import SISAidCandidateHistory
from .serializers import SISAidCandidateHistorySerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group 
from rest_framework import generics, viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated, AllowAny
from api.permissions import CombinedJobAccessPermission, IsInSameCenter, PersonalPermission, GerentePermission
from .models import UserProfile, Cycle, TAidCandidateHistory, SISAidCandidateHistory, CHAidCandidateHistory, Domicile, JobHistory
from .serializers import CandidateCentroSerializer, CandidateListSerializer, UserProfileSerializer, CandidateCreateSerializer, CycleSerializer
from .serializers import CandidateUpdateSerializer, CurrentUserProfileSerializer, CandidateRegisterSerializer, CandidatePhotoSerializer, BulkCandidateCreateSerializer
from .serializers import TAidCandidateHistorySerializer, SISAidCandidateHistorySerializer, CHAidCandidateHistorySerializer, DomicileUpdateSerializer, EmergencyContactSerializer
from .serializers import DatosMedicosSerializer
from .agency_serializers import CandidateEmploymentSerializer, CandidateEmploymentRemovalSerializer, JobHistoryCommentSerializer, JobHistorySerializer, CandidateListAgencySerializer
from mycalendar.serializers import AppointmentSerializer
from mycalendar.models import Appointment
from djoser import utils
from api.email import ActivationEmail
from djoser.conf import settings as djoser_settings
from django.contrib.auth.tokens import default_token_generator
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from .utils import process_excel_file
import json
from django.shortcuts import get_object_or_404
from rest_framework.parsers import MultiPartParser


User = get_user_model()


class BulkCandidateUploadView(APIView):

    def post(self, request):
        excel_file = request.FILES.get("file")
        if not excel_file:
            return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            candidates_data, pre_validation_errors = process_excel_file(excel_file)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        successfully_processed = 0
        errors = []

        for index, candidate_data in enumerate(candidates_data):
            serializer = BulkCandidateCreateSerializer(data=candidate_data)
            if serializer.is_valid():
                try:
                    serializer.save()
                    successfully_processed += 1
                except Exception as e:
                    errors.append({
                        "index": index + 1,
                        "input": candidate_data,
                        "errors": {"non_field_errors": [str(e)]}
                    })
            else:
                errors.append({
                    "index": index + 1,
                    "input": candidate_data,
                    "errors": serializer.errors
                })

        return Response({
            "successfully_processed": successfully_processed,
            "errors": pre_validation_errors + errors
        })


class CycleListViewSet(viewsets.ModelViewSet):
    queryset = Cycle.objects.all()
    serializer_class = CycleSerializer

    def get_queryset(self):
        if self.request.user.is_authenticated and hasattr(self.request.user, 'center'):
            return Cycle.objects.filter(center=self.request.user.center)
        return Cycle.objects.none()

    def get_permissions(self):
        permissions = [IsAuthenticated(), IsInSameCenter(), PersonalPermission()]
        
        if self.action in ['create', 'update', 'partial_update']:
            permissions.append(GerentePermission())

        return permissions

    def perform_create(self, serializer):
        serializer.save(center=self.request.user.center)

    def perform_update(self, serializer):
        serializer.save(center=self.request.user.center)

class CandidateListAPIView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, PersonalPermission]
    serializer_class = CandidateListSerializer

    def get_queryset(self):
        if self.request.user.is_authenticated and hasattr(self.request.user, 'center'):
            return User.objects.filter(
                groups__name='candidatos',
                center=self.request.user.center
            )
        return User.objects.none()
    
class CandidateListAgencyAPIView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, PersonalPermission]
    serializer_class = CandidateListAgencySerializer

    def get_queryset(self):
        queryset = UserProfile.objects.all()
        agency_state = self.request.query_params.get('agency_state')
        if agency_state:
            queryset = queryset.filter(stage='Agn')
            queryset = queryset.filter(agency_state=agency_state)
            queryset = queryset.filter(user__center=self.request.user.center)
        else:
            # Si no se especifica, puedes filtrar por un valor por defecto, por ejemplo:
            queryset = queryset.filter(stage='Agn')
            queryset = queryset.filter(user__center=self.request.user.center)
        return queryset

class CandidateAgencyProfileRetrieveAPIView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, PersonalPermission]
    serializer_class = CandidateListAgencySerializer
    lookup_field = 'user__id'  # Lookup by the related user's id

    def get_object(self):
        uid = self.kwargs.get('uid')
        try:
            return UserProfile.objects.get(user__id=uid)
        except UserProfile.DoesNotExist:
            raise NotFound("Candidate profile not found.")

class CurrentUserProfileAPIView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]

    serializer_class = CurrentUserProfileSerializer

    def get_object(self):
        # Returns the profile for the currently logged-in user
        return self.request.user.userprofile

class CandidateProfileRetrieveAPIView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, PersonalPermission]
    serializer_class = UserProfileSerializer
    lookup_field = 'user__id'  # We want to lookup by the related user’s id

    def get_object(self):
        uid = self.kwargs.get('uid')
        try:
            return UserProfile.objects.get(user__id=uid)
        except UserProfile.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Candidate profile not found.")
        
class CandidateCreateAPIView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, PersonalPermission]
    serializer_class = CandidateCreateSerializer

    def perform_create(self, serializer):
        creating_user_center = getattr(self.request.user, 'center', None)

        user = serializer.save()

        if creating_user_center:
            # Set the center of the newly created user
            user.center = creating_user_center
            user.save()
        else:
            # Handle the case where the creating user doesn't have a center
            raise Exception("Creating user does not have an associated center.")

        # Add the user to the 'candidatos' group
        group, _ = Group.objects.get_or_create(name='candidatos')
        user.groups.add(group)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        candidate = serializer.instance

        return Response(
            {"message": "Candidate created successfully", "user_id": candidate.id},
            status=status.HTTP_201_CREATED,
        )

class CandidateUpdateAPIView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, PersonalPermission, IsInSameCenter]
    serializer_class = CandidateUpdateSerializer
    lookup_field = 'user__id'
    
    def get_object(self):
        uid = self.kwargs.get('uid')
        try:
            # Ensure that you’re fetching only candidates (users in the "candidatos" group)
            return User.objects.get(id=uid, groups__name='candidatos')
        except User.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Candidate not found.")
        
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        self.check_object_permissions(request, instance)
        data = request.data.copy()
        serializer = self.get_serializer(
            instance, data=data, partial=kwargs.get('partial', False)
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
        
class CandidateRegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = CandidateRegisterSerializer

    def perform_create(self, serializer):
        self.user = serializer.save()

    def get_email_context(self, user):
        request = self.request  # Ensure request is an actual HttpRequest object
        return {
            'user': user,
            'uid': utils.encode_uid(user.pk),
            'token': default_token_generator.make_token(user),
            'request': request,  # Pass the real request object
            'protocol': 'https' if request.is_secure() else 'http',
        }

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if djoser_settings.SEND_ACTIVATION_EMAIL:
            context = self.get_email_context(self.user)
            activation_email = ActivationEmail(self.request, context)  # Pass request properly
            activation_email.send([self.user.email])
        return response
    
class CandidatePhotoUploadAPIView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated, PersonalPermission, IsInSameCenter]
    serializer_class = CandidatePhotoSerializer

    def get_object(self):
        # Use the uid passed in the URL to get the candidate's profile
        uid = self.kwargs.get('uid')
        try:
            return UserProfile.objects.get(user__id=uid)
        except UserProfile.DoesNotExist:
            raise NotFound("Candidate profile not found.")

    def update(self, request, *args, **kwargs):
        # This view expects only the photo in the payload
        instance = self.get_object()
        self.check_object_permissions(request, instance)
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data, status=status.HTTP_200_OK)

class TAidCandidateHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = TAidCandidateHistorySerializer

    def get_queryset(self):
        # Expecting a query parameter named 'candidate' with the user's id
        candidate_id = self.request.query_params.get('candidate')
        if candidate_id:
            # Assuming candidate is a ForeignKey to UserProfile and that UserProfile
            # is linked to User via a one-to-one relationship, we filter by candidate__user__id.
            return TAidCandidateHistory.objects.filter(candidate__user__id=candidate_id)
        return TAidCandidateHistory.objects.all()


class SISAidCandidateHistoryViewSet(viewsets.ModelViewSet):
    queryset = SISAidCandidateHistory.objects.select_related('candidate', 'aid')
    serializer_class = SISAidCandidateHistorySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        candidate_id = self.request.query_params.get('candidate')
        if candidate_id:
            qs = qs.filter(candidate__user__id=candidate_id)
        return qs
    
class CHAidCandidateHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = CHAidCandidateHistorySerializer

    def get_queryset(self):
        candidate_id = self.request.query_params.get('candidate')
        if candidate_id:
            return CHAidCandidateHistory.objects.filter(candidate__user__id=candidate_id)
        return CHAidCandidateHistory.objects.all()
    
class JobHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = JobHistorySerializer

    def get_queryset(self):
        candidate_id = self.request.query_params.get('candidate')
        if candidate_id:
            return JobHistory.objects.filter(candidate__user__id=candidate_id)
        return JobHistory.objects.all()
    
class CandidateEmploymentUpdateView(generics.UpdateAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = CandidateEmploymentSerializer
    permission_classes = [IsAuthenticated, PersonalPermission, IsInSameCenter]

class CandidateEmploymentRemovalUpdateView(generics.UpdateAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = CandidateEmploymentRemovalSerializer
    permission_classes = [IsAuthenticated, PersonalPermission, IsInSameCenter]

    # --- IMPORTANT CHANGE HERE ---
    def get_serializer_context(self):
        """
        Extra context provided to the serializer.
        Ensures the request object is available to the serializer.
        """
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
class JobHistoryCommentCreateView(generics.CreateAPIView):
    """
    API view to create a new comment for a specific JobHistory entry.
    Requires the job_history_id in the URL.
    """
    serializer_class = JobHistoryCommentSerializer
    permission_classes = [IsAuthenticated, CombinedJobAccessPermission] # Either PersonalPermission and IsInSameCenter or EmployerPermission and WorksInSameCompany

    def perform_create(self, serializer):
        # Get the job_history_id from the URL kwargs
        job_history_id = self.kwargs.get('job_history_pk')
        try:
            job_history = JobHistory.objects.get(pk=job_history_id)
        except JobHistory.DoesNotExist:
            raise Http404("JobHistory not found.")

        self.check_object_permissions(self.request, job_history)

        # Set the job_history and author before saving
        serializer.save(
            job_history=job_history,
            author=self.request.user # Set the author to the authenticated user
        )

    def get_serializer_context(self):
        """
        Extra context provided to the serializer.
        Ensures the request object is available to the serializer for read-only fields.
        """
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
class CandidateDomicileUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsInSameCenter, PersonalPermission]  # Solo usuarios autenticados pueden editar

    def get_object(self, uid):
        """
        Obtiene el perfil del usuario basado en el ID.
        """
        try:
            return UserProfile.objects.get(user__id=uid)
        except UserProfile.DoesNotExist:
            raise NotFound("Candidate profile not found.")

    def get(self, request, uid, *args, **kwargs):
        """
        Retrieves the authenticated user's domicile.
        """
        candidate_profile = self.get_object(uid)

        if not candidate_profile.domicile:
            return Response({"message": "Domicile not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = DomicileUpdateSerializer(candidate_profile.domicile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, uid, *args, **kwargs):
        """
        Actualiza la información del domicilio de un candidato.
        """
        candidate_profile = self.get_object(uid)

        if not candidate_profile.domicile:
            # Si el usuario no tiene un domicilio, creamos uno nuevo.
            candidate_profile.domicile = Domicile.objects.create()
            candidate_profile.save()

        serializer = DomicileUpdateSerializer(candidate_profile.domicile, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Domicile updated successfully"}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CandidateDomicileMeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """
        Gets the authenticated user's profile.
        """
        try:
            return UserProfile.objects.get(user=self.request.user)
        except UserProfile.DoesNotExist:
            raise NotFound("Candidate profile not found.")

    def get(self, request, *args, **kwargs):
        """
        Retrieves the authenticated user's domicile.
        """
        candidate_profile = self.get_object()

        if not candidate_profile.domicile:
            return Response({"message": "Domicile not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = DomicileUpdateSerializer(candidate_profile.domicile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, *args, **kwargs):
        """
        Updates the authenticated user's domicile.
        """
        candidate_profile = self.get_object()

        if not candidate_profile.domicile:
            candidate_profile.domicile = Domicile.objects.create()
            candidate_profile.save()

        serializer = DomicileUpdateSerializer(candidate_profile.domicile, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Domicile updated successfully"}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmergencyContactUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsInSameCenter, PersonalPermission]

    def get_object(self, uid):
        """
        Obtiene el perfil del usuario basado en el ID.
        """
        try:
            return UserProfile.objects.get(user__id=uid)
        except UserProfile.DoesNotExist:
            raise NotFound("Candidate profile not found.")

    def get(self, request, uid, *args, **kwargs):
        """
        Retorna los contactos de emergencia existentes del candidato.
        """
        candidate_profile = self.get_object(uid)
        contacts = candidate_profile.emergency_contacts.all()
        serializer = EmergencyContactSerializer(contacts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, uid, *args, **kwargs):
        """
        Actualiza los contactos de emergencia del candidato automáticamente.
        """
        candidate_profile = self.get_object(uid)
        emergency_contacts_data = request.data.get("emergency_contacts", [])

        # Eliminar contactos anteriores
        candidate_profile.emergency_contacts.all().delete()

        # Crear nuevos contactos
        serializer = EmergencyContactSerializer(data=emergency_contacts_data, many=True)
        if serializer.is_valid():
            contacts = serializer.save()
            candidate_profile.emergency_contacts.set(contacts)
            return Response({"message": "Contactos de emergencia actualizados"}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class EmergencyContactMeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """
        Obtiene el perfil del usuario basado en el ID.
        """
        try:
            return UserProfile.objects.get(user=self.request.user)
        except UserProfile.DoesNotExist:
            raise NotFound("Candidate profile not found.")

    def get(self, request, *args, **kwargs):
        """
        Retorna los contactos de emergencia existentes del candidato.
        """
        candidate_profile = self.get_object()
        contacts = candidate_profile.emergency_contacts.all()
        serializer = EmergencyContactSerializer(contacts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, *args, **kwargs):
        """
        Actualiza los contactos de emergencia del candidato automáticamente.
        """
        candidate_profile = self.get_object()
        emergency_contacts_data = request.data.get("emergency_contacts", [])

        # Eliminar contactos anteriores
        candidate_profile.emergency_contacts.all().delete()

        # Crear nuevos contactos
        serializer = EmergencyContactSerializer(data=emergency_contacts_data, many=True)
        if serializer.is_valid():
            contacts = serializer.save()
            candidate_profile.emergency_contacts.set(contacts)
            return Response({"message": "Contactos de emergencia actualizados"}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DatosMedicosAPIView(APIView):
    permission_classes = [IsAuthenticated, IsInSameCenter, PersonalPermission]  

    def get(self, request, uid):
        # Obtiene el UserProfile del candidato
        perfil = get_object_or_404(UserProfile, user__id=uid)
        # Serializa usando tu serializer de datos médicos
        serializer = DatosMedicosSerializer(perfil)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, uid):
        # Obtiene el UserProfile del candidato
        perfil = get_object_or_404(UserProfile, user__id=uid)
        # Aplicas partial=True para permitir actualizar solo algunos campos
        serializer = DatosMedicosSerializer(perfil, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

class DatosMedicosMeAPIView(APIView):
    permission_classes = [IsAuthenticated] 

    def get(self, request):
        # Obtiene el UserProfile del candidato
        perfil = get_object_or_404(UserProfile, user=self.request.user)
        # Serializa usando tu serializer de datos médicos
        serializer = DatosMedicosSerializer(perfil)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        # Obtiene el UserProfile del candidato
        perfil = get_object_or_404(UserProfile, user=self.request.user)
        # Aplicas partial=True para permitir actualizar solo algunos campos
        serializer = DatosMedicosSerializer(perfil, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

class CandidateAppointmentsView(generics.ListAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated, IsInSameCenter]  # O ajusta a IsAuthenticated si lo deseas

    def get_queryset(self):
        user_id = self.kwargs.get('uid')
        queryset = Appointment.objects.filter(attendees__id=user_id)
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset

    def get(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        category = self.request.query_params.get('category')
        if category:
            appointment = queryset.first()
            if appointment:
                serializer = self.get_serializer(appointment)
                return Response(serializer.data)
            else:
                return Response(None)
        else:
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

class CandidateCentroAPIView(APIView):
    permission_classes = [IsAuthenticated, PersonalPermission, IsInSameCenter]  # Keep IsAuthenticated

    def get(self, request, uid):
        user = get_object_or_404(User, id=uid)

        candidatos_group = Group.objects.get(name='candidatos')
        if candidatos_group not in user.groups.all():
            return Response(status=status.HTTP_403_FORBIDDEN)

        # Object-level permission check for viewing
        self.check_object_permissions(request, user)

        serializer = CandidateCentroSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, uid):
        candidate = get_object_or_404(User, id=uid)  # Explicitly get the candidate

        candidatos_group = Group.objects.get(name='candidatos')
        if candidatos_group not in candidate.groups.all():
            return Response(status=status.HTTP_403_FORBIDDEN)

        # Object-level permission check for modification
        try:
            self.check_object_permissions(request, candidate)
        except PermissionDenied:
            return Response({"detail": "You do not have permission to change the center of this candidate."}, status=status.HTTP_403_FORBIDDEN)

        serializer = CandidateCentroSerializer(candidate, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    
# --- SISAidCandidateHistory APIViews ---


# --- SISAidCandidateHistory APIViews ---

class SISAidCandidateHistoryCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("📥 POST recibido:", request.data)
        serializer = SISAidCandidateHistorySerializer(data=request.data)
        if serializer.is_valid():
            print("✅ Datos validados:", serializer.validated_data)
            instance = serializer.save()
            update_change_reason(instance, f"Creado/modificado con resultado: {instance.is_successful}")
            print("🧠 Objeto creado:", instance)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SISAidCandidateHistoryListAPIView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SISAidCandidateHistorySerializer

    def get_queryset(self):
        candidate_id = self.kwargs.get('candidate_id')
        return SISAidCandidateHistory.objects.filter(candidate__user__id=candidate_id)

class SISAidCandidateHistoryDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return SISAidCandidateHistory.objects.get(pk=pk)
        except SISAidCandidateHistory.DoesNotExist:
            raise status.HTTP_404_NOT_FOUND # Or you can return None and handle

    def get(self, request, pk):
        instance = self.get_object(pk)
        if isinstance(instance, int): # Check if get_object returned a status code
            return Response({"detail": "Not found."}, status=instance)
        serializer = SISAidCandidateHistorySerializer(instance)
        return Response(serializer.data)

    def patch(self, request, pk):
        print(f"📥 PATCH received (UPDATE) for ID {pk}:", request.data)
        instance = self.get_object(pk)
        if isinstance(instance, int):
            return Response({"detail": "Not found."}, status=instance)

        # For partial update, pass the instance and request.data
        serializer = SISAidCandidateHistorySerializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            print("✅ Data validated:", serializer.validated_data)
            instance = serializer.save()
            update_change_reason(instance, f"Modificado con resultado: {instance.is_successful}")
            print("🧠 Object updated:", instance)
            return Response(serializer.data, status=status.HTTP_200_OK)
        print("❌ Validation errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        print(f"🗑️ DELETE received for ID {pk}")
        instance = self.get_object(pk)
        if isinstance(instance, int):
            return Response({"detail": "Not found."}, status=instance)
        instance.delete()
        update_change_reason(instance, f"Eliminado") # Log deletion reason
        print(f"🧠 Object with ID {pk} deleted.")
        return Response(status=status.HTTP_204_NO_CONTENT)


class SISAidCandidateHistoryHistoryAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, candidate_id):
        historial = []
        records = SISAidCandidateHistory.history.filter(candidate__user__id=candidate_id).order_by('-history_date')
        for record in records:
            historial.append({
                "id": record.id,
                "aid": getattr(record.aid, "id", None),
                "aid_desc": getattr(record.aid, "descripcion", ""),
                "seccion": record.seccion,
                "item": record.item,
                "subitem": record.subitem,
                "is_active": record.is_active,
                "start_date": record.start_date,
                "end_date": record.end_date,
                "is_successful": record.get_is_successful_display() if hasattr(record, 'get_is_successful_display') else record.is_successful,
                "comments": record.comments,
                "history_date": record.history_date,
                "history_type": record.get_history_type_display(),
            })
        return Response(historial)


# --- TAidCandidateHistory APIViews ---

class TAidCandidateHistoryCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("📥 POST recibido:", request.data)
        serializer = TAidCandidateHistorySerializer(data=request.data)
        if serializer.is_valid():
            print("✅ Datos validados:", serializer.validated_data)
            instance = serializer.save()
            update_change_reason(instance, f"Creado/modificado con resultado: {instance.is_successful}")
            print("🧠 Objeto creado:", instance)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TAidCandidateHistoryListAPIView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TAidCandidateHistorySerializer

    def get_queryset(self):
        candidate_id = self.kwargs.get('candidate_id')
        return TAidCandidateHistory.objects.filter(candidate__user__id=candidate_id)


class TAidCandidateHistoryHistoryAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, candidate_id):
        historial = []
        records = TAidCandidateHistory.history.filter(candidate__user__id=candidate_id).order_by('-history_date')
        for record in records:
            historial.append({
                "id": record.id,
                "aid": getattr(record.aid, "id", None),
                "aid_desc": getattr(record.aid, "descripcion", ""),
                "is_active": record.is_active,
                "start_date": record.start_date,
                "end_date": record.end_date,
                "is_successful": record.get_is_successful_display() if hasattr(record, 'get_is_successful_display') else record.is_successful,
                "comments": record.comments,
                "history_date": record.history_date,
                "history_type": record.get_history_type_display(),
            })
        return Response(historial)


# --- CHAidCandidateHistory APIViews ---

class CHAidCandidateHistoryCreateAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print("📥 POST recibido:", request.data)
        try:
            pregunta_id = request.data.get("pregunta_id")
            resultado = request.data.get("resultado")
            aid_id = request.data.get("aid_id")
            aid_text = request.data.get("aid_text")

            from cuestionarios.models import Pregunta, CHAid
            from .models import UserProfile

            candidate_id = request.query_params.get("candidate_id")
            candidate = UserProfile.objects.get(user__id=candidate_id)

            pregunta = Pregunta.objects.get(id=pregunta_id)
            aid_instance = None
            if aid_id:
                aid_instance = CHAid.objects.get(id=aid_id)

            payload = {
                "candidate": candidate.id,
                "item": pregunta.texto,
                "is_successful": resultado,
                "aid": aid_instance.id if aid_instance else None,
                "aid_text": aid_text,  # New field added
            }

            serializer = CHAidCandidateHistorySerializer(data=payload)
            if serializer.is_valid():
                instance = serializer.save()
                update_change_reason(instance, f"Creado/modificado con resultado: {instance.is_successful}")
                print("🧠 Objeto creado:", instance)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CHAidCandidateHistoryListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, candidate_id):
        queryset = CHAidCandidateHistory.objects.filter(candidate__user__id=candidate_id)

        resultados = {
            "lo_hace": [],
            "en_proceso": [],
            "no_lo_hace": [],
        }

        for entry in queryset:
            data = {
                "pregunta": entry.item,  # Assuming `item` contains the name of the question
            }

            if entry.is_successful in ["en_proceso", "no_lo_hace"]:
                data["aid"] = {
                    "id": getattr(entry.aid, "id", None),
                    "texto": getattr(entry.aid, "aid", ""),
                }

            resultados[entry.is_successful].append(data)

        return Response(resultados)


class CHAidCandidateHistoryHistoryAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, candidate_id):
        historial = []
        records = CHAidCandidateHistory.history.filter(candidate__user__id=candidate_id).order_by('-history_date')
        for record in records:
            historial.append({
                "id": record.id,
                "aid": getattr(record.aid, "id", None),
                "aid_desc": getattr(record.aid, "descripcion", ""),
                "is_active": record.is_active,
                "start_date": record.start_date,
                "end_date": record.end_date,
                "is_successful": record.get_is_successful_display() if hasattr(record, 'get_is_successful_display') else record.is_successful,
                "comments": record.comments,
                "history_date": record.history_date,
                "history_type": record.get_history_type_display(),
            })
        return Response(historial)