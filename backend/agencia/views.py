from rest_framework import viewsets, permissions, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count
from api.permissions import IsEmployer, IsEmployerOrReadOnly
import math
from .models import Location, Company, Job, Employer, Habilidad, JobHabilidadRequerida
from .serializers import (
    JobWithAssignedCandidatesSerializer, LocationSerializer, CompanySerializer, 
    JobSerializer, EmployerSerializer, HabilidadSerializer, JobHabilidadRequeridaSerializer
)
from candidatos.models import UserProfile, CandidatoHabilidadEvaluada
from candidatos.serializers import CandidatoHabilidadEvaluadaSerializer

def calculate_distance(lat1, lng1, lat2, lng2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees).
    Returns distance in kilometers.
    """
    if None in [lat1, lng1, lat2, lng2]:
        return None
    
    # Convert decimal degrees to radians
    lat1, lng1, lat2, lng2 = map(math.radians, [float(lat1), float(lng1), float(lat2), float(lng2)])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Radius of earth in kilometers
    r = 6371
    return c * r

class LocationViewSet(viewsets.ModelViewSet):
    queryset         = Location.objects.all()
    serializer_class = LocationSerializer

    queryset = Location.objects.select_related('company').all()

    def get_queryset(self):
        qs = Location.objects.select_related('company').all()
        if not self.request.user.is_staff and not self.request.user.groups.filter(name='agencia_laboral').exists():
            qs = qs.filter(company=self.request.user.employer.company)
        
        # Add search functionality
        search = self.request.query_params.get('search', None)
        if search:
            qs = qs.filter(
                Q(alias__icontains=search) |
                Q(address_road__icontains=search) |
                Q(address_col__icontains=search) |
                Q(address_municip__icontains=search) |
                Q(address_city__icontains=search) |
                Q(address_state__icontains=search)
            )
        
        return qs

class CompanyViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsEmployer]
    serializer_class = CompanySerializer

    queryset = Company.objects.all()

    def get_queryset(self):
        qs = Company.objects.all()
        if not self.request.user.is_staff and not self.request.user.groups.filter(name='agencia_laboral').exists():
            # employer only sees their own company
            qs = qs.filter(pk=self.request.user.employer.company_id)
        return qs

class JobViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsEmployerOrReadOnly]
    serializer_class = JobSerializer

    queryset = Job.objects.select_related('company', 'location').all()

    def get_queryset(self):
        qs = Job.objects.select_related('company', 'location').all()
        if not self.request.user.is_staff and not self.request.user.groups.filter(name='personal').exists():
            qs = qs.filter(company=self.request.user.employer.company)
        
        # Proximity filtering
        max_distance = self.request.query_params.get('max_distance', None)
        candidate_lat = self.request.query_params.get('candidate_lat', None)
        candidate_lng = self.request.query_params.get('candidate_lng', None)
        
        if max_distance and candidate_lat and candidate_lng:
            try:
                max_distance = float(max_distance)
                candidate_lat = float(candidate_lat)
                candidate_lng = float(candidate_lng)
                
                # Filter jobs by distance
                filtered_jobs = []
                for job in qs:
                    if job.location and job.location.address_lat and job.location.address_lng:
                        distance = calculate_distance(
                            candidate_lat, candidate_lng,
                            job.location.address_lat, job.location.address_lng
                        )
                        if distance is not None and distance <= max_distance:
                            filtered_jobs.append(job.id)
                
                qs = qs.filter(id__in=filtered_jobs)
            except (ValueError, TypeError):
                # If invalid parameters, ignore proximity filtering
                pass
        
        return qs

class EmployerViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsEmployer]
    serializer_class = EmployerSerializer

    queryset = Employer.objects.select_related('user','company').all()

    def get_queryset(self):
        qs = Employer.objects.select_related('user','company').all()
        if not self.request.user.is_staff and not self.request.user.groups.filter(name='agencia_laboral').exists():
            qs = qs.filter(company=self.request.user.employer.company)
        return qs
    
class CurrentEmployerAPIView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]

    serializer_class = EmployerSerializer

    def get_object(self):
        return self.request.user.employer
    
class JobAssignedCandidatesView(generics.RetrieveAPIView):
    """
    API view to retrieve a specific Job and the candidates currently assigned to it.
    Takes a job_id as a URL parameter.
    """
    queryset = Job.objects.all() # The base queryset for the job
    serializer_class = JobWithAssignedCandidatesSerializer
    permission_classes = [permissions.IsAuthenticated, IsEmployerOrReadOnly] # Or more restrictive if needed

    # The lookup field is 'pk' by default for RetrieveAPIView, which matches <int:pk> in URLs.
    # We will use 'pk' for the job ID.

    def get_object(self):
        # Ensure the employer can only see jobs they are associated with if not staff.
        # This duplicates logic from JobViewSet, but is good for security on this specific endpoint.
        obj = super().get_object() # Get the Job object by its PK

        # Apply same filtering logic as JobViewSet if necessary for individual Job retrieval
        if not self.request.user.is_staff and hasattr(self.request.user, 'employer'):
            if obj.company != self.request.user.employer.company:
                self.permission_denied(
                    self.request,
                    message="You do not have permission to access this job."
                )
        return obj

class HabilidadViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las habilidades disponibles en el sistema.
    """
    queryset = Habilidad.objects.all()
    serializer_class = HabilidadSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        qs = Habilidad.objects.all()
        categoria = self.request.query_params.get('categoria', None)
        if categoria:
            qs = qs.filter(categoria=categoria)
        return qs.order_by('categoria', 'nombre')

class JobHabilidadRequeridaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las habilidades requeridas para empleos específicos.
    """
    queryset = JobHabilidadRequerida.objects.all()
    serializer_class = JobHabilidadRequeridaSerializer
    permission_classes = [permissions.IsAuthenticated, IsEmployerOrReadOnly]
    
    def get_queryset(self):
        qs = JobHabilidadRequerida.objects.select_related('job', 'habilidad')
        job_id = self.request.query_params.get('job_id', None)
        if job_id:
            qs = qs.filter(job_id=job_id)
        return qs

class CandidatoHabilidadEvaluadaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las habilidades evaluadas de los candidatos.
    """
    queryset = CandidatoHabilidadEvaluada.objects.filter(es_activa=True)
    serializer_class = CandidatoHabilidadEvaluadaSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        qs = CandidatoHabilidadEvaluada.objects.filter(es_activa=True).select_related(
            'candidato__user', 'habilidad', 'evaluado_por'
        )
        candidato_id = self.request.query_params.get('candidato_id', None)
        if candidato_id:
            qs = qs.filter(candidato_id=candidato_id)
        return qs

class JobMatchingView(generics.GenericAPIView):
    """
    Vista para encontrar candidatos que coincidan con las habilidades requeridas de un empleo.
    """
    permission_classes = [permissions.IsAuthenticated, IsEmployerOrReadOnly]
    
    def get(self, request, job_id):
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response(
                {'error': 'Empleo no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Obtener habilidades requeridas del empleo
        habilidades_requeridas = JobHabilidadRequerida.objects.filter(job=job).select_related('habilidad')
        
        if not habilidades_requeridas.exists():
            return Response({
                'job': {
                    'id': job.id,
                    'name': job.name,
                    'company': job.company.name if job.company else None
                },
                'habilidades_requeridas': [],
                'candidatos_matching': [],
                'message': 'Este empleo no tiene habilidades requeridas definidas'
            })
        
        # Obtener IDs de habilidades requeridas
        habilidades_ids = [hr.habilidad.id for hr in habilidades_requeridas]
        
        # Buscar candidatos que tengan al menos una de las habilidades requeridas
        candidatos_con_habilidades = UserProfile.objects.filter(
            candidatohabilidadevaluada__habilidad_id__in=habilidades_ids,
            candidatohabilidadevaluada__es_activa=True,
            agency_state='Bol'  # Solo candidatos en bolsa de trabajo
        ).distinct().select_related('user')
        
        # Calcular matching para cada candidato
        candidatos_matching = []
        for candidato in candidatos_con_habilidades:
            # Obtener habilidades evaluadas del candidato
            habilidades_candidato = CandidatoHabilidadEvaluada.objects.filter(
                candidato=candidato,
                habilidad_id__in=habilidades_ids,
                es_activa=True
            ).select_related('habilidad')
            
            # Calcular puntuación de matching con algoritmo mejorado
            matching_score = 0
            max_possible_score = 0
            habilidades_coincidentes = []
            habilidades_faltantes = []
            
            for hr in habilidades_requeridas:
                # Peso de importancia de la habilidad
                peso_importancia = {
                    'esencial': 4.0,    # Peso máximo para habilidades esenciales
                    'importante': 2.0,  # Peso medio para habilidades importantes
                    'deseable': 1.0     # Peso mínimo para habilidades deseables
                }.get(hr.nivel_importancia, 1.0)
                
                # Puntuación máxima posible para esta habilidad
                max_score_habilidad = peso_importancia * 4.0  # 4 = nivel experto máximo
                max_possible_score += max_score_habilidad
                
                habilidad_candidato = habilidades_candidato.filter(habilidad=hr.habilidad).first()
                if habilidad_candidato:
                    # Puntuación del candidato basada en su nivel de competencia
                    competencia_score = {
                        'basico': 1.0,      # 25% de la puntuación máxima
                        'intermedio': 2.0,  # 50% de la puntuación máxima
                        'avanzado': 3.0,    # 75% de la puntuación máxima
                        'experto': 4.0      # 100% de la puntuación máxima
                    }.get(habilidad_candidato.nivel_competencia, 0.0)
                    
                    # Puntuación final para esta habilidad
                    skill_score = competencia_score * peso_importancia
                    matching_score += skill_score
                    
                    # Calcular porcentaje de competencia para esta habilidad específica
                    porcentaje_competencia = (competencia_score / 4.0) * 100
                    
                    habilidades_coincidentes.append({
                        'habilidad': hr.habilidad.nombre,
                        'categoria': hr.habilidad.categoria,
                        'nivel_requerido': hr.get_nivel_importancia_display(),
                        'nivel_candidato': habilidad_candidato.get_nivel_competencia_display(),
                        'puntuacion': round(skill_score, 2),
                        'porcentaje_competencia': round(porcentaje_competencia, 1),
                        'peso_importancia': peso_importancia
                    })
                else:
                    # El candidato no tiene esta habilidad
                    habilidades_faltantes.append({
                        'habilidad': hr.habilidad.nombre,
                        'categoria': hr.habilidad.categoria,
                        'nivel_requerido': hr.get_nivel_importancia_display(),
                        'peso_importancia': peso_importancia,
                        'puntuacion_perdida': max_score_habilidad
                    })
            
            # Calcular porcentaje de matching preciso
            matching_percentage = (matching_score / max_possible_score * 100) if max_possible_score > 0 else 0
            
            candidatos_matching.append({
                'candidato': {
                    'id': candidato.user_id,
                    'nombre': f"{candidato.user.first_name} {candidato.user.last_name} {candidato.user.second_last_name}",
                    'curp': candidato.curp,
                    'email': candidato.user.email
                },
                'matching_score': round(matching_score, 2),
                'max_possible_score': round(max_possible_score, 2),
                'matching_percentage': round(matching_percentage, 1),
                'habilidades_coincidentes': habilidades_coincidentes,
                'habilidades_faltantes': habilidades_faltantes,
                'total_habilidades_requeridas': len(habilidades_requeridas),
                'habilidades_coincidentes_count': len(habilidades_coincidentes),
                'habilidades_faltantes_count': len(habilidades_faltantes),
                'puntuacion_perdida': round(sum([h.get('puntuacion_perdida', 0) for h in habilidades_faltantes]), 2)
            })
        
        # Ordenar por puntuación de matching (mayor a menor)
        candidatos_matching.sort(key=lambda x: x['matching_score'], reverse=True)
        
        return Response({
            'job': {
                'id': job.id,
                'name': job.name,
                'company': job.company.name if job.company else None
            },
            'habilidades_requeridas': [
                {
                    'id': hr.habilidad.id,
                    'nombre': hr.habilidad.nombre,
                    'categoria': hr.habilidad.categoria,
                    'nivel_importancia': hr.get_nivel_importancia_display()
                }
                for hr in habilidades_requeridas
            ],
            'candidatos_matching': candidatos_matching,
            'total_candidatos': len(candidatos_matching)
        })

class CandidatoMatchingView(generics.GenericAPIView):
    """
    Vista para encontrar empleos que coincidan con las habilidades de un candidato.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, candidato_id):
        try:
            candidato = UserProfile.objects.get(user_id=candidato_id)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'Candidato no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Obtener habilidades evaluadas del candidato
        habilidades_candidato = CandidatoHabilidadEvaluada.objects.filter(
            candidato=candidato,
            es_activa=True
        ).select_related('habilidad')
        
        if not habilidades_candidato.exists():
            return Response({
                'candidato': {
                    'id': candidato.user_id,
                    'nombre': f"{candidato.user.first_name} {candidato.user.last_name} {candidato.user.second_last_name}",
                    'curp': candidato.curp
                },
                'habilidades_evaluadas': [],
                'empleos_matching': [],
                'message': 'Este candidato no tiene habilidades evaluadas'
            })
        
        # Obtener IDs de habilidades del candidato
        habilidades_ids = [hc.habilidad.id for hc in habilidades_candidato]
        
        # Buscar empleos que requieran al menos una de las habilidades del candidato
        empleos_con_habilidades = Job.objects.filter(
            jobhabilidadrequerida__habilidad_id__in=habilidades_ids
        ).distinct().select_related('company', 'location')
        
        # Calcular matching para cada empleo
        empleos_matching = []
        for empleo in empleos_con_habilidades:
            # Obtener habilidades requeridas del empleo
            habilidades_requeridas = JobHabilidadRequerida.objects.filter(
                job=empleo
            ).select_related('habilidad')
            
            # Calcular puntuación de matching con algoritmo mejorado
            matching_score = 0
            max_possible_score = 0
            habilidades_coincidentes = []
            habilidades_faltantes = []
            
            for hr in habilidades_requeridas:
                # Peso de importancia de la habilidad
                peso_importancia = {
                    'esencial': 4.0,    # Peso máximo para habilidades esenciales
                    'importante': 2.0,  # Peso medio para habilidades importantes
                    'deseable': 1.0     # Peso mínimo para habilidades deseables
                }.get(hr.nivel_importancia, 1.0)
                
                # Puntuación máxima posible para esta habilidad
                max_score_habilidad = peso_importancia * 4.0  # 4 = nivel experto máximo
                max_possible_score += max_score_habilidad
                
                habilidad_candidato = habilidades_candidato.filter(habilidad=hr.habilidad).first()
                if habilidad_candidato:
                    # Puntuación del candidato basada en su nivel de competencia
                    competencia_score = {
                        'basico': 1.0,      # 25% de la puntuación máxima
                        'intermedio': 2.0,  # 50% de la puntuación máxima
                        'avanzado': 3.0,    # 75% de la puntuación máxima
                        'experto': 4.0      # 100% de la puntuación máxima
                    }.get(habilidad_candidato.nivel_competencia, 0.0)
                    
                    # Puntuación final para esta habilidad
                    skill_score = competencia_score * peso_importancia
                    matching_score += skill_score
                    
                    # Calcular porcentaje de competencia para esta habilidad específica
                    porcentaje_competencia = (competencia_score / 4.0) * 100
                    
                    habilidades_coincidentes.append({
                        'habilidad': hr.habilidad.nombre,
                        'categoria': hr.habilidad.categoria,
                        'nivel_requerido': hr.get_nivel_importancia_display(),
                        'nivel_candidato': habilidad_candidato.get_nivel_competencia_display(),
                        'puntuacion': round(skill_score, 2),
                        'porcentaje_competencia': round(porcentaje_competencia, 1),
                        'peso_importancia': peso_importancia
                    })
                else:
                    # El candidato no tiene esta habilidad
                    habilidades_faltantes.append({
                        'habilidad': hr.habilidad.nombre,
                        'categoria': hr.habilidad.categoria,
                        'nivel_requerido': hr.get_nivel_importancia_display(),
                        'peso_importancia': peso_importancia,
                        'puntuacion_perdida': max_score_habilidad
                    })
            
            # Calcular porcentaje de matching preciso
            matching_percentage = (matching_score / max_possible_score * 100) if max_possible_score > 0 else 0
            
            empleos_matching.append({
                'empleo': {
                    'id': empleo.id,
                    'name': empleo.name,
                    'company': empleo.company.name if empleo.company else None,
                    'location': str(empleo.location) if empleo.location else None,
                    'vacancies': empleo.vacancies,
                    'horario': empleo.horario,
                    'sueldo_base': float(empleo.sueldo_base) if empleo.sueldo_base else None,
                    'prestaciones': empleo.prestaciones
                },
                'matching_score': round(matching_score, 2),
                'max_possible_score': round(max_possible_score, 2),
                'matching_percentage': round(matching_percentage, 1),
                'habilidades_coincidentes': habilidades_coincidentes,
                'habilidades_faltantes': habilidades_faltantes,
                'total_habilidades_requeridas': len(habilidades_requeridas),
                'habilidades_coincidentes_count': len(habilidades_coincidentes),
                'habilidades_faltantes_count': len(habilidades_faltantes),
                'puntuacion_perdida': round(sum([h.get('puntuacion_perdida', 0) for h in habilidades_faltantes]), 2)
            })
        
        # Ordenar por puntuación de matching (mayor a menor)
        empleos_matching.sort(key=lambda x: x['matching_score'], reverse=True)
        
        return Response({
            'candidato': {
                'id': candidato.user_id,
                'nombre': f"{candidato.user.first_name} {candidato.user.last_name} {candidato.user.second_last_name}",
                'curp': candidato.curp
            },
            'habilidades_evaluadas': [
                {
                    'id': hc.habilidad.id,
                    'nombre': hc.habilidad.nombre,
                    'categoria': hc.habilidad.categoria,
                    'nivel_competencia': hc.get_nivel_competencia_display()
                }
                for hc in habilidades_candidato
            ],
            'empleos_matching': empleos_matching,
            'total_empleos': len(empleos_matching)
        })
