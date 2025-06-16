from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils.dateparse import parse_date
from .models import UserProfile
from mycalendar.models import Appointment
from centros.models import TransferRequest
from cuestionarios.models import EstadoCuestionario, BaseCuestionarios
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .serializers import CandidateListSerializer
from rest_framework import generics
from django.contrib.auth import get_user_model

User = get_user_model()

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")
        cycle_id = request.GET.get("cycle_id")

        current_center = self.request.user.center

        users = UserProfile.objects.filter(
                user__center=current_center
            )
        
        users_pending_transfer_to_center_ids = TransferRequest.objects.filter(
            status='pending',
            destination_center=current_center
        ).values_list('requested_user__userprofile__pk', flat=True)

        canalizacion_users = UserProfile.objects.filter(
            (Q(user__center=current_center) | Q(pk__in=users_pending_transfer_to_center_ids)) & Q(stage='Can')
        ).distinct() # Use distinct to avoid duplicates if a user somehow meets both criteria

        date_filtered_users = users  # Initialize with all users
        canalizacion_date_filtered_users = canalizacion_users  # Initialize with all users

        if start_date and end_date:
            date_filtered_users = users.filter(
                registration_date__range=(
                    parse_date(start_date),
                    parse_date(end_date)
                )
            )
            canalizacion_date_filtered_users = canalizacion_users.filter(
                registration_date__range=(
                    parse_date(start_date),
                    parse_date(end_date)
                )
            )
        if cycle_id:
            date_filtered_users = date_filtered_users.filter(cycle_id=cycle_id)
            canalizacion_date_filtered_users = canalizacion_date_filtered_users.filter(cycle_id=cycle_id)

        # Apply date/cycle filters to all subsequent queries
        users = date_filtered_users.select_related('user', 'cycle').prefetch_related('user__estadocuestionario_set__cuestionario__base_cuestionario', 'user__attended_appointments_set', 'user__userprofile__disability')
        canalizacion_stage_users = canalizacion_date_filtered_users.select_related('user', 'cycle').prefetch_related('user__estadocuestionario_set__cuestionario__base_cuestionario', 'user__attended_appointments_set', 'user__userprofile__disability')
        ####################################################################################################
        # Filter users who are in the 'Pre' (Preentrevista) stage
        preentrevista_stage_users = users.filter(Q(stage="Reg") | Q(stage="Pre"))

        # Get the BaseCuestionarios object for 'Preentrevista'
        try:
            preentrevista_base_cuestionario = BaseCuestionarios.objects.get(nombre='Preentrevista')
            users_with_preentrevista_finalizada = preentrevista_stage_users.filter(
                user__estadocuestionario__cuestionario__base_cuestionario=preentrevista_base_cuestionario,
                user__estadocuestionario__estado='finalizado'
            ).distinct()
            preentrevista_finalizada_count = users_with_preentrevista_finalizada.count()
        except BaseCuestionarios.DoesNotExist:
            preentrevista_base_cuestionario = None
            users_with_preentrevista_finalizada = UserProfile.objects.none()
            preentrevista_finalizada_count = "Cuestionario 'Entrevista' no encontrado"

        users_without_preentrevista = preentrevista_stage_users.filter(
            stage='Pre'
        ).exclude(
            pk__in=users_with_preentrevista_finalizada.values_list('pk', flat=True)
        ).distinct()

        ####################################################################################################
        # Filter users who are in the 'Ent' (Entrevista) stage
        interview_stage_users = users.filter(stage="Ent")

        # Get the BaseCuestionarios object for 'Entrevista'
        try:
            entrevista_base_cuestionario = BaseCuestionarios.objects.get(nombre='Entrevista')
            users_with_entrevista_finalizada = interview_stage_users.filter(
                user__estadocuestionario__cuestionario__base_cuestionario=entrevista_base_cuestionario,
                user__estadocuestionario__estado='finalizado'
            ).distinct()
            entrevista_finalizada_count = users_with_entrevista_finalizada.count()
        except BaseCuestionarios.DoesNotExist:
            entrevista_base_cuestionario = None
            users_with_entrevista_finalizada = UserProfile.objects.none()
            entrevista_finalizada_count = "Cuestionario 'Entrevista' no encontrado"

        users_with_entrevista = interview_stage_users.filter(
            user__attended_appointments__category='Entrevista'
        ).exclude(
            pk__in=users_with_entrevista_finalizada.values_list('pk', flat=True)
        ).distinct()

        users_without_entrevista = interview_stage_users.exclude(
            user__attended_appointments__category='Entrevista'
        ).exclude(
            pk__in=users_with_entrevista_finalizada.values_list('pk', flat=True)
        )

        ####################################################################################################
        # Filter users who are in the 'Can' (Canalización) stage
        # Filter already done above
        # canalizacion_stage_users = users.filter(stage="Can")

        # Logic for pending transfer requests for 'Canalización' stage
        # Users who have requested to transfer *to* this center
        # This will be candidates in the 'Can' stage who are the `requested_user` in a pending `TransferRequest`
        # where `destination_center` is the current user's center.
        request_canalizacion_to_centro_profiles = canalizacion_stage_users.filter(
            user__transfer_requests_received__status='pending',
            user__transfer_requests_received__destination_center=self.request.user.center
        ).distinct()
        request_canalizacion_to_centro = request_canalizacion_to_centro_profiles.count()
        request_canalizacion_to_centro_pks = list(request_canalizacion_to_centro_profiles.values_list('user_id', flat=True))


        # Users who have requested to transfer *from* this center
        # This will be candidates in the 'Can' stage who are the `requested_user` in a pending `TransferRequest`
        # where `source_center` is the current user's center.
        request_canalizacion_from_centro_profiles = canalizacion_stage_users.filter(
            user__transfer_requests_received__status='pending',
            user__transfer_requests_received__source_center=self.request.user.center
        ).distinct()
        request_canalizacion_from_centro = request_canalizacion_from_centro_profiles.count()
        request_canalizacion_from_centro_pks = list(request_canalizacion_from_centro_profiles.values_list('user_id', flat=True))

        # Users in canalización without any transfer request
        excluded_transfer_pks = list(set(request_canalizacion_to_centro_pks + request_canalizacion_from_centro_pks))

        without_request_canalizacion = canalizacion_stage_users.exclude(
            user__id__in=excluded_transfer_pks
        ).distinct() # Add distinct just in case, though less likely after explicit PK exclusion

        without_request_canalizacion_pks = list(without_request_canalizacion.values_list('user_id', flat=True))

        ####################################################################################################
        # Filter users who are in the 'Cap' (Capacitación) stage
        capacitacion_stage_users = users.filter(stage="Cap")

        # Get the BaseCuestionarios object for 'SIS'
        try:
            sis_base_cuestionario = BaseCuestionarios.objects.get(nombre='SIS')
            users_without_sis_finalizado = capacitacion_stage_users.exclude(
                user__estadocuestionario__cuestionario__base_cuestionario=sis_base_cuestionario,
                user__estadocuestionario__estado='finalizado'
            ).distinct()
            users_without_sis_finalizado_count = users_without_sis_finalizado.count()
            users_without_sis_finalizado_pks = list(users_without_sis_finalizado.values_list('user_id', flat=True))
        except BaseCuestionarios.DoesNotExist:
            sis_base_cuestionario = None
            users_without_sis_finalizado_count = "Cuestionario 'SIS' no encontrado"
            users_without_sis_finalizado_pks = [] # Initialize here

        # Get the BaseCuestionarios object for 'Evaluación Diagnóstica'
        try:
            ed_base_cuestionario = BaseCuestionarios.objects.get(nombre='Evaluación Diagnóstica')
            users_without_ed_finalizado = capacitacion_stage_users.exclude(
                user__estadocuestionario__cuestionario__base_cuestionario=ed_base_cuestionario,
                user__estadocuestionario__estado='finalizado'
            ).distinct()
            users_without_ed_finalizado_count = users_without_ed_finalizado.count()
            users_without_ed_finalizado_pks = list(users_without_ed_finalizado.values_list('user_id', flat=True))
        except BaseCuestionarios.DoesNotExist:
            ed_base_cuestionario = None
            users_without_ed_finalizado_count = "Cuestionario 'Evaluación Diagnóstica' no encontrado"
            users_without_ed_finalizado_pks = [] # Initialize here

        # Get the BaseCuestionarios object for 'Proyecto de Vida'
        try:
            pv_base_cuestionario = BaseCuestionarios.objects.get(nombre='Proyecto de Vida')
            users_without_pv_finalizado = capacitacion_stage_users.exclude(
                user__estadocuestionario__cuestionario__base_cuestionario=pv_base_cuestionario,
                user__estadocuestionario__estado='finalizado'
            ).distinct()
            users_without_pv_finalizado_count = users_without_pv_finalizado.count()
            users_without_pv_finalizado_pks = list(users_without_pv_finalizado.values_list('user_id', flat=True))
        except BaseCuestionarios.DoesNotExist:
            pv_base_cuestionario = None
            users_without_pv_finalizado_count = "Cuestionario 'Proyecto de Vida' no encontrado"
            users_without_pv_finalizado_pks = [] # Initialize here

        # Get the BaseCuestionarios object for 'Cuadro de Habilidades'
        try:
            ch_base_cuestionario = BaseCuestionarios.objects.get(nombre='Cuadro de Habilidades')
            users_without_ch_finalizado = capacitacion_stage_users.exclude(
                user__estadocuestionario__cuestionario__base_cuestionario=ch_base_cuestionario,
                user__estadocuestionario__estado='finalizado'
            ).distinct()
            users_without_ch_finalizado_count = users_without_ch_finalizado.count()
            users_without_ch_finalizado_pks = list(users_without_ch_finalizado.values_list('user_id', flat=True))
        except BaseCuestionarios.DoesNotExist:
            ch_base_cuestionario = None
            users_without_ch_finalizado_count = "Cuestionario 'Cuadro de Habilidades' no encontrado"
            users_without_ch_finalizado_pks = [] # Initialize here

        data = {
            "registrados": {
                "total": preentrevista_stage_users.count(),
                "sinPre": preentrevista_stage_users.filter(stage="Reg").count(),
                "preIncompleta": users_without_preentrevista.count(),
                "preTerminada": preentrevista_finalizada_count,
            },
            "entrevistas": {
                "total": interview_stage_users.count(),
                "porContactar": users_without_entrevista.count(),
                "conFecha": users_with_entrevista.count(),
                "entrevistados": entrevista_finalizada_count,
            },
            "documentacion": {
                "total": 0,
                "porContactar": 0,
                "enProceso": 0,
                "pendientes": 0,
                "terminados": 0
            },
            "capacitacion": {
                "total": capacitacion_stage_users.count(),
                "sis": users_without_sis_finalizado_count,
                "diagnostica": users_without_ed_finalizado_count,
                "apoyo": 0,
                "vida": users_without_pv_finalizado_count,
                "habilidades": users_without_ch_finalizado_count
            },
            "agencia": {
                "total": users.filter(stage='Agn').count(),
                "desempleados": users.filter(stage='Agn', agency_state="Des").count(),
                "bolsa": users.filter(stage='Agn', agency_state="Bol").count(),
                "empleados": users.filter(stage='Agn', agency_state="Emp").count()
            },
            "canalizacion": {
                "total": canalizacion_stage_users.count(),
                "porCanalizar": without_request_canalizacion.count(),
                "desdeOrganizacion": request_canalizacion_from_centro,
                "haciaOrganizacion": request_canalizacion_to_centro,
            },
            "candidatos": {
                "total": users.count(),
                "activos": users.filter(user__is_active=True).count(),
                "inactivos": users.filter(user__is_active=False).count(),
            },
            "user_pks": {
                "sinPre": list(preentrevista_stage_users.filter(stage="Reg").values_list('user_id', flat=True)),
                "preIncompleta": list(users_without_preentrevista.values_list('user_id', flat=True)),
                "preTerminada": list(users_with_preentrevista_finalizada.values_list('user_id', flat=True)),

                "porContactar": list(users_without_entrevista.values_list('user_id', flat=True)),
                "conFecha": list(users_with_entrevista.values_list('user_id', flat=True)),
                "entrevistados": list(users_with_entrevista_finalizada.values_list('user_id', flat=True)),

                "sis": users_without_sis_finalizado_pks if isinstance(users_without_sis_finalizado_count, int) else [],
                "diagnostica": users_without_ed_finalizado_pks if isinstance(users_without_ed_finalizado_count, int) else [],
                "vida": users_without_pv_finalizado_pks if isinstance(users_without_pv_finalizado_count, int) else [],
                "habilidades": users_without_ch_finalizado_pks if isinstance(users_without_ch_finalizado_count, int) else [],

                "activos": list(users.filter(user__is_active=True).values_list('user_id', flat=True)),
                "inactivos": list(users.filter(user__is_active=False).values_list('user_id', flat=True)),

                "desempleados": list(users.filter(stage='Agn', agency_state="Des").values_list('user_id', flat=True)),
                "bolsa": list(users.filter(stage='Agn', agency_state="Bol").values_list('user_id', flat=True)),
                "empleados": list(users.filter(stage='Agn', agency_state="Emp").values_list('user_id', flat=True)),

                "porCanalizar": without_request_canalizacion_pks,
                "haciaOrganizacion": request_canalizacion_to_centro_pks,
                "desdeOrganizacion": request_canalizacion_from_centro_pks
            }
        }

        return Response(data)

class CandidateListDashboardView(generics.ListAPIView):
    serializer_class = CandidateListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_ids = self.request.query_params.getlist('ids')
        if user_ids:
            return User.objects.filter(id__in=user_ids, groups__name='candidatos')
        return User.objects.none()