from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db import models
from django.db.models import Count, Q, F, Case, When, IntegerField, Value
from django.db.models.functions import Extract, TruncMonth, TruncYear
from django.utils.dateparse import parse_date
from django.contrib.auth import get_user_model
from .models import UserProfile
from centros.models import Center, TransferRequest
from discapacidad.models import Disability
from agencia.models import Job, Habilidad
from cuestionarios.models import EstadoCuestionario, BaseCuestionarios
from datetime import datetime, timedelta
import calendar

User = get_user_model()

class StatisticsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        """
        Get comprehensive statistics for candidatos data.
        Supports filtering by center and date range.
        """
        # Get filter parameters
        center_id = request.GET.get('center_id')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        # Determine which center to filter by
        if center_id == 'all' or (request.user.is_staff and not center_id):
            # Admin can see all centers
            centers = Center.objects.filter(is_active=True)
            base_queryset = UserProfile.objects.all()
        else:
            # Use specific center or user's center
            if center_id:
                try:
                    center = Center.objects.get(id=center_id)
                except Center.DoesNotExist:
                    return Response({"error": "Center not found"}, status=400)
            else:
                center = request.user.center
                if not center:
                    return Response({"error": "User has no associated center"}, status=400)
            
            centers = [center]
            base_queryset = UserProfile.objects.filter(user__center=center)

        # Apply date filters
        if start_date and end_date:
            try:
                start_date_obj = parse_date(start_date)
                end_date_obj = parse_date(end_date)
                base_queryset = base_queryset.filter(
                    registration_date__range=[start_date_obj, end_date_obj]
                )
            except ValueError:
                return Response({"error": "Invalid date format"}, status=400)


        # Get statistics data
        stats_data = {
            'overview': self._get_overview_stats(base_queryset),
            'stages': self._get_stage_stats(base_queryset),
            'demographics': self._get_demographics_stats(base_queryset),
            'domicile': self._get_domicile_stats(base_queryset),
            'disabilities': self._get_disability_stats(base_queryset),
            'employment': self._get_employment_stats(base_queryset),
            'training': self._get_training_stats(base_queryset),
            'transfers': self._get_transfer_stats(centers, start_date, end_date),
            'timeline': self._get_timeline_stats(base_queryset),
            'centers': self._get_center_comparison_stats(centers, start_date, end_date),
        }

        return Response(stats_data)

    def _get_overview_stats(self, queryset):
        """Get overall statistics"""
        total_candidates = queryset.count()
        active_candidates = queryset.filter(user__is_active=True).count()
        
        # Registration trends
        current_month = datetime.now().replace(day=1)
        last_month = (current_month - timedelta(days=1)).replace(day=1)
        
        current_month_registrations = queryset.filter(
            registration_date__gte=current_month
        ).count()
        
        last_month_registrations = queryset.filter(
            registration_date__gte=last_month,
            registration_date__lt=current_month
        ).count()

        return {
            'total_candidates': total_candidates,
            'active_candidates': active_candidates,
            'inactive_candidates': total_candidates - active_candidates,
            'current_month_registrations': current_month_registrations,
            'last_month_registrations': last_month_registrations,
            'registration_growth': self._calculate_growth_rate(
                current_month_registrations, last_month_registrations
            )
        }

    def _get_stage_stats(self, queryset):
        """Get statistics by stage"""
        stage_counts = queryset.values('stage').annotate(
            count=Count('user_id')
        ).order_by('stage')

        stage_data = {}
        for item in stage_counts:
            stage = item['stage']
            count = item['count']
            stage_data[stage] = {
                'count': count,
                'percentage': round((count / queryset.count() * 100), 2) if queryset.count() > 0 else 0
            }

        return stage_data

    def _get_demographics_stats(self, queryset):
        """Get demographic statistics"""
        # Gender distribution
        gender_stats = queryset.values('gender').annotate(
            count=Count('user_id')
        ).order_by('gender')

        # Age groups (assuming birth_date is available)
        age_groups = queryset.annotate(
            age_group=Case(
                When(birth_date__isnull=True, then=Value('No especificado')),
                When(birth_date__year__gte=datetime.now().year - 18, then=Value('18-25')),
                When(birth_date__year__gte=datetime.now().year - 30, then=Value('26-30')),
                When(birth_date__year__gte=datetime.now().year - 40, then=Value('31-40')),
                When(birth_date__year__gte=datetime.now().year - 50, then=Value('41-50')),
                When(birth_date__year__gte=datetime.now().year - 60, then=Value('51-60')),
                default=Value('60+'),
                output_field=models.CharField()
            )
        ).values('age_group').annotate(
            count=Count('user_id')
        )

        return {
            'gender': {item['gender'] or 'No especificado': item['count'] for item in gender_stats},
            'age_groups': {item['age_group']: item['count'] for item in age_groups}
        }

    def _get_disability_stats(self, queryset):
        """Get disability statistics"""
        # Most common disabilities
        disability_stats = queryset.values('disability__name').annotate(
            count=Count('user_id')
        ).exclude(disability__isnull=True).order_by('-count')[:10]

        # Disability group statistics
        disability_group_stats = queryset.values('disability__group__name').annotate(
            count=Count('user_id')
        ).exclude(disability__group__isnull=True).order_by('-count')

        # Disability certificate statistics
        cert_stats = queryset.aggregate(
            with_certificate=Count('user_id', filter=Q(has_disability_certificate=True)),
            without_certificate=Count('user_id', filter=Q(has_disability_certificate=False))
        )

        return {
            'common_disabilities': {item['disability__name']: item['count'] for item in disability_stats},
            'disability_groups': {item['disability__group__name']: item['count'] for item in disability_group_stats},
            'certificate_status': cert_stats
        }

    def _get_domicile_stats(self, queryset):
        """Get domicile/location statistics"""
        # State distribution
        state_stats = queryset.values('domicile__address_state').annotate(
            count=Count('user_id')
        ).exclude(domicile__address_state__isnull=True).exclude(
            domicile__address_state=''
        ).order_by('-count')[:10]

        # Municipality distribution by state
        municipality_stats = queryset.values(
            'domicile__address_state', 
            'domicile__address_municip'
        ).annotate(
            count=Count('user_id')
        ).exclude(
            domicile__address_state__isnull=True
        ).exclude(
            domicile__address_state=''
        ).exclude(
            domicile__address_municip__isnull=True
        ).exclude(
            domicile__address_municip=''
        ).order_by('domicile__address_state', '-count')

        # Group municipalities by state
        municipalities_by_state = {}
        for item in municipality_stats:
            state = item['domicile__address_state']
            if state not in municipalities_by_state:
                municipalities_by_state[state] = []
            municipalities_by_state[state].append({
                'municipality': item['domicile__address_municip'],
                'count': item['count']
            })

        # City distribution (keeping for backward compatibility)
        city_stats = queryset.values('domicile__address_city').annotate(
            count=Count('user_id')
        ).exclude(domicile__address_city__isnull=True).exclude(
            domicile__address_city=''
        ).order_by('-count')[:10]

        # Heatmap data - get all candidates with valid coordinates
        heatmap_data = queryset.filter(
            domicile__address_lat__isnull=False,
            domicile__address_lng__isnull=False
        ).exclude(
            domicile__address_lat=0,
            domicile__address_lng=0
        ).values(
            'domicile__address_lat',
            'domicile__address_lng'
        ).annotate(
            count=Count('user_id')
        )

        return {
            'states': {item['domicile__address_state']: item['count'] for item in state_stats},
            'cities': {item['domicile__address_city']: item['count'] for item in city_stats},
            'municipalities_by_state': municipalities_by_state,
            'heatmap_data': [
                {
                    'lat': float(item['domicile__address_lat']),
                    'lng': float(item['domicile__address_lng']),
                    'count': item['count']
                }
                for item in heatmap_data
            ]
        }

    def _get_employment_stats(self, queryset):
        """Get employment statistics"""
        # Agency state distribution
        agency_stats = queryset.filter(stage='Agn').values('agency_state').annotate(
            count=Count('user_id')
        ).order_by('agency_state')

        # Job statistics
        job_stats = queryset.filter(current_job__isnull=False).values(
            'current_job__name'
        ).annotate(
            count=Count('user_id')
        ).order_by('-count')[:10]

        return {
            'agency_states': {item['agency_state']: item['count'] for item in agency_stats},
            'top_jobs': {item['current_job__name']: item['count'] for item in job_stats}
        }

    def _get_training_stats(self, queryset):
        """Get training and questionnaire statistics"""
        # Questionnaire completion rates
        questionnaire_stats = {}
        
        questionnaire_names = ['SIS', 'Evaluación Diagnóstica', 'Proyecto de Vida', 'Cuadro de Habilidades']
        
        for q_name in questionnaire_names:
            try:
                base_cuestionario = BaseCuestionarios.objects.get(nombre=q_name)
                completed = queryset.filter(
                    user__estadocuestionario__cuestionario__base_cuestionario=base_cuestionario,
                    user__estadocuestionario__estado='finalizado'
                ).count()
                total = queryset.count()
                questionnaire_stats[q_name] = {
                    'completed': completed,
                    'total': total,
                    'completion_rate': round((completed / total * 100), 2) if total > 0 else 0
                }
            except BaseCuestionarios.DoesNotExist:
                questionnaire_stats[q_name] = {
                    'completed': 0,
                    'total': 0,
                    'completion_rate': 0
                }

        return questionnaire_stats

    def _get_transfer_stats(self, centers, start_date, end_date):
        """Get transfer request statistics"""
        transfer_queryset = TransferRequest.objects.all()
        
        if start_date and end_date:
            try:
                start_date_obj = parse_date(start_date)
                end_date_obj = parse_date(end_date)
                transfer_queryset = transfer_queryset.filter(
                    requested_at__date__range=[start_date_obj, end_date_obj]
                )
            except ValueError:
                pass

        # Filter by centers if not all centers
        if len(centers) == 1:
            center = centers[0]
            transfer_queryset = transfer_queryset.filter(
                Q(source_center=center) | Q(destination_center=center)
            )

        transfer_stats = transfer_queryset.values('status').annotate(
            count=Count('id')
        ).order_by('status')

        return {
            'by_status': {item['status']: item['count'] for item in transfer_stats},
            'total_transfers': transfer_queryset.count()
        }

    def _get_timeline_stats(self, queryset):
        """Get timeline statistics for charts"""
        # Monthly registration trends
        monthly_registrations = queryset.annotate(
            month=TruncMonth('registration_date')
        ).values('month').annotate(
            count=Count('user_id')
        ).order_by('month')

        # Stage progression over time
        stage_timeline = queryset.annotate(
            month=TruncMonth('registration_date')
        ).values('month', 'stage').annotate(
            count=Count('user_id')
        ).order_by('month', 'stage')

        return {
            'monthly_registrations': [
                {'month': item['month'].strftime('%Y-%m'), 'count': item['count']}
                for item in monthly_registrations
            ],
            'stage_timeline': [
                {
                    'month': item['month'].strftime('%Y-%m'),
                    'stage': item['stage'],
                    'count': item['count']
                }
                for item in stage_timeline
            ]
        }

    def _get_center_comparison_stats(self, centers, start_date, end_date):
        """Get statistics comparing different centers"""
        if len(centers) <= 1:
            return {}

        center_stats = []
        for center in centers:
            center_queryset = UserProfile.objects.filter(user__center=center)
            
            if start_date and end_date:
                try:
                    start_date_obj = parse_date(start_date)
                    end_date_obj = parse_date(end_date)
                    center_queryset = center_queryset.filter(
                        registration_date__range=[start_date_obj, end_date_obj]
                    )
                except ValueError:
                    pass


            center_stats.append({
                'center_name': center.name,
                'total_candidates': center_queryset.count(),
                'active_candidates': center_queryset.filter(user__is_active=True).count(),
                'stage_distribution': dict(
                    center_queryset.values('stage').annotate(
                        count=Count('user_id')
                    ).values_list('stage', 'count')
                )
            })

        return center_stats


    def _calculate_growth_rate(self, current, previous):
        """Calculate growth rate percentage"""
        if previous == 0:
            return 100 if current > 0 else 0
        return round(((current - previous) / previous) * 100, 2)


class CentersListAPIView(APIView):
    """API to get list of centers for admin filtering"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        if not request.user.is_staff:
            # Non-admin users can only see their own center
            if hasattr(request.user, 'center') and request.user.center:
                centers = [{
                    'id': request.user.center.id,
                    'name': request.user.center.name,
                    'center_type': request.user.center.center_type
                }]
            else:
                centers = []
        else:
            # Admin users can see all centers
            centers = Center.objects.filter(is_active=True).values(
                'id', 'name', 'center_type'
            )

        return Response({
            'centers': list(centers),
            'can_view_all': request.user.is_staff
        })


