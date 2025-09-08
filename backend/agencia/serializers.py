from rest_framework import serializers

from .models import Location, Company, Job, Employer, Habilidad, JobHabilidadRequerida
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from candidatos.models import UserProfile, CandidatoHabilidadEvaluada
from candidatos.serializers import UserProfileMinimalSerializer

User = get_user_model()

class HabilidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habilidad
        fields = ['id', 'nombre', 'descripcion', 'categoria', 'es_activa', 'fecha_creacion']

class JobHabilidadRequeridaSerializer(serializers.ModelSerializer):
    habilidad_nombre = serializers.CharField(source='habilidad.nombre', read_only=True)
    habilidad_categoria = serializers.CharField(source='habilidad.categoria', read_only=True)
    
    class Meta:
        model = JobHabilidadRequerida
        fields = ['id', 'habilidad', 'habilidad_nombre', 'habilidad_categoria', 'nivel_importancia', 'fecha_asignacion']

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = '__all__'

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'

class JobSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(),
        allow_null=True,
        required=False
    )
    company_name = serializers.CharField(source="company.name", read_only=True)
    # Para lectura se muestran todos los detalles de la ubicación
    location_details = LocationSerializer(source='location', read_only=True)
    # Para escritura se recibe el id de la ubicación
    location_id = serializers.PrimaryKeyRelatedField(
        source='location',
        queryset=Location.objects.all(),
        allow_null=True,
        required=False
    )
    # Habilidades requeridas
    habilidades_requeridas = JobHabilidadRequeridaSerializer(
        source='jobhabilidadrequerida_set',
        many=True,
        read_only=True
    )
    habilidades_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="Lista de IDs de habilidades requeridas"
    )

    class Meta:
        model = Job
        fields = [
            'id', 'name', 'company', 'company_name', 'location_details', 'location_id', 
            'job_description', 'vacancies', 'horario', 'sueldo_base', 'prestaciones',
            'habilidades_requeridas', 'habilidades_ids'
        ]

    def create(self, validated_data):
        # Extract habilidades_ids before creating the job
        habilidades_ids = validated_data.pop('habilidades_ids', [])
        
        # If no company specified, assign the current employer's company
        request = self.context.get('request')
        if validated_data.get('company') is None and request and hasattr(request.user, 'employer'):
            validated_data['company'] = request.user.employer.company
        
        # Create the job
        job = super().create(validated_data)
        
        # Add habilidades if provided
        if habilidades_ids:
            for habilidad_id in habilidades_ids:
                try:
                    habilidad = Habilidad.objects.get(id=habilidad_id)
                    JobHabilidadRequerida.objects.create(
                        job=job,
                        habilidad=habilidad,
                        nivel_importancia='importante'  # Default level
                    )
                except Habilidad.DoesNotExist:
                    continue
        
        return job

    def update(self, instance, validated_data):
        # Extract habilidades_ids before updating the job
        habilidades_ids = validated_data.pop('habilidades_ids', None)
        
        # Same logic on update: if they clear it, reset to their own company
        request = self.context.get('request')
        if 'company' in validated_data and validated_data['company'] is None and request and hasattr(request.user, 'employer'):
            validated_data['company'] = request.user.employer.company
        
        # Update the job
        job = super().update(instance, validated_data)
        
        # Update habilidades if provided
        if habilidades_ids is not None:
            # Clear existing habilidades
            JobHabilidadRequerida.objects.filter(job=job).delete()
            
            # Add new habilidades
            for habilidad_id in habilidades_ids:
                try:
                    habilidad = Habilidad.objects.get(id=habilidad_id)
                    JobHabilidadRequerida.objects.create(
                        job=job,
                        habilidad=habilidad,
                        nivel_importancia='importante'  # Default level
                    )
                except Habilidad.DoesNotExist:
                    continue
        
        return job

class EmployerSerializer(serializers.ModelSerializer):
    id          = serializers.PrimaryKeyRelatedField(
        source='user',
        queryset=User.objects.all(),
        required=False
    )
    email       = serializers.EmailField(source='user.email')
    first_name  = serializers.CharField(source='user.first_name')
    last_name   = serializers.CharField(source='user.last_name')
    is_active   = serializers.BooleanField(source='user.is_active', required=False)
    password    = serializers.CharField(write_only=True, source='user.password', required=False, min_length=6)

    company     = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(),
        required=False,
        allow_null=True
    )
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_details = CompanySerializer(source='company', read_only=True)
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model  = Employer
        fields = [
            'id',
            'email', 'first_name', 'last_name', 'is_active',
            'password',
            'company', 'company_name', 'company_details',
            'nombre_completo',
        ]

    def get_nombre_completo(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"

    def create(self, validated_data):
        # pull nested user data and company
        user_data = validated_data.pop('user', {})
        raw_pwd   = user_data.pop('password', None)
        company   = validated_data.get('company', None)

        # default company to the creator's company if none given
        request = self.context.get('request')
        if company is None and request and hasattr(request.user, 'employer'):
            company = request.user.employer.company

        # 1) create user
        user = User(**{k: v for k, v in user_data.items() if k != 'password'}, username=user_data.get('email'))
        if raw_pwd:
            user.set_password(raw_pwd)
        user.save()

        # 2) add to 'empleador' group
        group, _ = Group.objects.get_or_create(name='empleador')
        user.groups.add(group)

        # 3) create employer
        return Employer.objects.create(user=user, company=company)

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        # update builtin user
        for field in ('email', 'first_name', 'last_name', 'is_active'):
            if field in user_data:
                setattr(instance.user, field, user_data[field])
        instance.user.save()

        # update company, default back if they clear it
        if 'company' in validated_data:
            company = validated_data['company']
            if company is None and hasattr(self.context['request'].user, 'employer'):
                company = self.context['request'].user.employer.company
            instance.company = company
            instance.save()

        return instance
    
class JobWithAssignedCandidatesSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.name", read_only=True)
    location_details = LocationSerializer(source='location', read_only=True)
    # This field will list candidates whose current_job points to this job
    assigned_candidates = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id', 'name', 'company_name', 'location_details',
            'job_description', 'vacancies', 'horario', 'sueldo_base', 'prestaciones',
            'assigned_candidates'
        ]

    def get_assigned_candidates(self, obj):
        # Filter UserProfile instances where current_job is this job
        # Assuming UserProfile has a current_job ForeignKey to Job
        # And assuming UserProfile is imported from 'candidato' or where it resides
        # from candidatos.models import UserProfile # Import it here to avoid circular dependencies if needed

        candidates = UserProfile.objects.filter(current_job=obj, agency_state='Emp').select_related('user')
        # Only show candidates who are 'employed' (Emp)
        return UserProfileMinimalSerializer(candidates, many=True).data