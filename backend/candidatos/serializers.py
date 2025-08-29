from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from djoser.serializers import UserCreateSerializer
from centros.models import Center
from centros.serializers import CenterSerializer
from discapacidad.models import TechnicalAid, SISHelp, CHItem
from discapacidad.serializers import TechnicalAidSerializer, SISHelpFlatSerializer, CHItemSerializer
from .models import UserProfile, EmergencyContact, Cycle, Domicile, Medication, Disability, TAidCandidateHistory, SISAidCandidateHistory, CHAidCandidateHistory
from api.fields import SASImageField, SASFileField
import json

User = get_user_model()

class CandidatePrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    def to_representation(self, value):
        # Return the primary key (user id) of the UserProfile instance
        return value.pk

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'second_last_name', 'is_active']

class CycleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cycle
        fields = ['id', 'name', 'start_date', 'end_date']

class DomicileSerializer(serializers.ModelSerializer):
    address_road = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    address_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    address_number_int = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    address_PC = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    address_municip = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    address_col = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    address_state = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    address_city = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    address_lat = serializers.DecimalField(required=False, allow_null=True, max_digits=9, decimal_places=6)
    address_lng = serializers.DecimalField(required=False, allow_null=True, max_digits=9, decimal_places=6)

    residence_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Domicile
        fields = ['id', 'address_road', 'address_number', 'address_number_int', 'address_PC', 'address_municip', 'address_col', 'address_state', 'address_city', 'address_lat', 'address_lng', 'residence_type']

class EmergencyContactSerializer(serializers.ModelSerializer):
    domicile = DomicileSerializer(required=False, allow_null=True)

    class Meta:
        model = EmergencyContact
        fields = ['id', 'first_name', 'last_name', 'second_last_name', 'relationship', 'phone_number', 'email', 'lives_at_same_address', 'domicile']
        read_only_fields = ['user']

class MedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = ['id', 'name', 'dose', 'reason']
        read_onli_fields = ['user']

class CurrentUserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    disability_name = serializers.SerializerMethodField()
    cycle = CycleSerializer(read_only=True)
    emergency_contacts = EmergencyContactSerializer(many=True, read_only=True)
    domicile = DomicileSerializer(read_only=True)
    medications = MedicationSerializer(many=True, read_only=True)
    photo = SASImageField(read_only=True)

    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ['user']

    def get_disability_name(self, obj):
        disabilities = obj.disability.all()
        return ", ".join(disability.name for disability in disabilities) if disabilities else "Sin discapacidad"

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    disability_name = serializers.SerializerMethodField()
    cycle = CycleSerializer(read_only=True)
    emergency_contacts = EmergencyContactSerializer(many=True, read_only=True)
    domicile = DomicileSerializer(read_only=True)
    medications = MedicationSerializer(many=True, read_only=True)
    photo = SASImageField(read_only=True)

    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ['user']

    def get_disability_name(self, obj):
        disabilities = obj.disability.all()
        return ", ".join(disability.name for disability in disabilities) if disabilities else "Sin discapacidad"

class UserProfileMinimalSerializer(serializers.ModelSerializer):
    # Adjust this to match your UserProfile model fields and your display needs
    id = serializers.ReadOnlyField(source='user.id') # Assuming UserProfile has a OneToOne to User
    full_name = serializers.SerializerMethodField()
    email = serializers.ReadOnlyField(source='user.email')
    agency_state = serializers.ReadOnlyField() # Assuming this is directly on UserProfile
    current_job_history_comments = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile # Assuming UserProfile is your candidate model
        fields = ['id', 'full_name', 'email', 'agency_state', 'current_job_history_comments'] # Add other relevant fields if needed

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name} {obj.user.second_last_name}" if obj.user else 'N/A'
    
    def get_current_job_history_comments(self, obj):
        job_id = obj.current_job.id
        
        if not job_id:
            return []

        job_history = obj.jobhistory_set.filter(
            job_id=job_id,
            end_date__isnull=True # Assumes current job history has no end_date
        ).first()

        if job_history:
            # Get comments for this specific job history
            comments = job_history.comments.all().order_by('-created_at')[:5] # Limit comments to 5

            from .agency_serializers import JobHistoryCommentSerializer;

            return JobHistoryCommentSerializer(comments, many=True).data
        return []
    
class CandidateCentroSerializer(serializers.ModelSerializer):
    center = CenterSerializer(read_only=True)
    center_id = serializers.PrimaryKeyRelatedField(queryset=Center.objects.all(), write_only=True, source='center', required=False)
    domicile = DomicileSerializer(read_only=True, source='userprofile.domicile')

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'second_last_name', 'center', 'center_id', 'domicile']
        read_only_fields = ['id', 'email', 'first_name', 'last_name', 'second_last_name', 'center', 'domicile']
    
class CandidatePhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['photo']

class CandidateListSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.SerializerMethodField()
    edad = serializers.SerializerMethodField()
    discapacidad = serializers.SerializerMethodField()
    fecha_registro = serializers.CharField(source='userprofile.registration_date')
    telefono = serializers.CharField(source='userprofile.phone_number')
    estado = serializers.SerializerMethodField()
    ciclo = serializers.SerializerMethodField()
    domicile = DomicileSerializer(source='userprofile.domicile')
    municipio = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'nombre_completo', 'edad', 'discapacidad', 'fecha_registro', 'telefono', 'email', 'estado', 'ciclo', 'municipio', 'domicile']

    def get_nombre_completo(self, obj):
        return f"{obj.first_name} {obj.last_name} {obj.second_last_name}"


    def get_edad(self, obj):
        if hasattr(obj, 'userprofile') and obj.userprofile.birth_date:
            from datetime import date
            today = date.today()
            born = obj.userprofile.birth_date

            # Ensure birth_date is not None before accessing .year
            if born:
                return today.year - born.year - ((today.month, today.day) < (born.month, born.day))
        
        return "Fecha de nacimiento no disponible"  # Return a default value


    def get_discapacidad(self, obj):
        if hasattr(obj, 'userprofile'):
            disabilities = obj.userprofile.disability.all()
            return ", ".join(disability.name for disability in disabilities) if disabilities else "Sin discapacidad"

    def get_estado(self, obj):
        """Map short codes to full names."""
        stage_mapping = {
            "Reg": "Registro",
            "Pre": "Preentrevista",
            "Ent": "Entrevista",
            "Cap": "Capacitación",
            "Agn": "Agencia",
            "Can": "Canalización",
        }
        if hasattr(obj, "userprofile") and obj.userprofile.stage:
            return stage_mapping.get(obj.userprofile.stage, obj.userprofile.stage)  # Fallback to original if not found
        return None  # Or return "Desconocido" if you want a default value
    
    def get_ciclo(self, obj):
        if hasattr(obj, "userprofile") and obj.userprofile.cycle:
            return obj.userprofile.cycle.name
        return "Sin ciclo"
    
    def get_municipio(self, obj):
        if hasattr(obj, "userprofile") and obj.userprofile.domicile:
            return obj.userprofile.domicile.address_municip
        return "Sin domicilio"

class CandidateCreateSerializer(serializers.ModelSerializer):
    # Profile fields
    birth_date = serializers.DateField(write_only=True)
    gender = serializers.ChoiceField(choices=UserProfile.GENDER_CHOICES, write_only=True)
    curp = serializers.CharField(write_only=True, required=False)
    phone_number = serializers.CharField(write_only=True)
    stage = serializers.CharField(write_only=True, required=False, default='Reg')
    photo = serializers.ImageField(write_only=True, required=False)
    
    receives_pension = serializers.CharField(write_only=True, required=False, allow_blank=True)
    social_security = serializers.CharField(write_only=True, required=False, allow_blank=True)

    # Booleans (optional)
    has_disability_certificate = serializers.BooleanField(write_only=True, required=False, default=False)
    has_interdiction_judgment = serializers.BooleanField(write_only=True, required=False, default=False)
    receives_psychological_care = serializers.BooleanField(write_only=True, required=False, default=False)
    receives_psychiatric_care = serializers.BooleanField(write_only=True, required=False, default=False)
    has_seizures = serializers.BooleanField(write_only=True, required=False, default=False)
    
    # Medical details (optional)
    blood_type = serializers.ChoiceField(choices=UserProfile.BLOOD_TYPE_CHOICES, write_only=True, required=False)
    allergies = serializers.CharField(write_only=True, required=False, allow_blank=True)
    dietary_restrictions = serializers.CharField(write_only=True, required=False, allow_blank=True)
    physical_restrictions = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    # Domicile fields (optional)
    address_road = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    address_number = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    address_number_int = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    address_PC = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    address_municip = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    address_col = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    address_state = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    address_city = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    address_lat = serializers.DecimalField(required=False, allow_null=True, max_digits=9, decimal_places=6)
    address_lng = serializers.DecimalField(required=False, allow_null=True, max_digits=9, decimal_places=6)

    residence_type = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    
    # Additional fields for relationships:
    disability = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )
    cycle = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    # Emergency Contact Fields (optional)
    emergency_contacts = EmergencyContactSerializer(many=True, required=False)
    medications = MedicationSerializer(many=True, required=False)
    
    class Meta:
        model = User
        # Remove 'id' from writable fields (or mark it as read-only)
        fields = [
            'email', 'first_name', 'last_name', 'second_last_name', 'password',
            'birth_date', 'gender', 'blood_type', 'curp', 'phone_number',
            'stage', 'has_disability_certificate', 'has_interdiction_judgment',
            'receives_pension', 'receives_psychological_care', 'receives_psychiatric_care', 'social_security',
            'has_seizures', 'medications', 'allergies', 'dietary_restrictions', 'physical_restrictions',
            'address_road', 'address_number', 'address_number_int', 'address_PC',
            'address_municip', 'address_col', 'address_state', 'address_city', 'address_lat', 'address_lng', 'residence_type',
            'disability', 'cycle', 'emergency_contacts', 'photo'
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        photo = validated_data.pop('photo', None)
    
        # Extract nested domicile data
        domicile_fields = ['address_road', 'address_number', 'address_number_int', 'address_PC', 
                           'address_municip', 'address_col', 'address_state', 'address_city', 'address_lat', 'address_lng', 'residence_type']
        domicile_data = {field: validated_data.pop(field, None) for field in domicile_fields}
        emergency_contacts_data = validated_data.pop('emergency_contacts', [])
        # NEW: Extract medications data (expected as a list of medication objects)
        medications_data = validated_data.pop('medications', [])
        if isinstance(emergency_contacts_data, str):
            import json
            emergency_contacts_data = json.loads(emergency_contacts_data)
        if isinstance(medications_data, str):
            import json
            medications_data = json.loads(medications_data)
    
        # Create a Domicile if data exists
        domicile = None
        if any(domicile_data.values()):
            domicile = Domicile.objects.create(**domicile_data)
    
        # Extract profile data for UserProfile
        profile_fields = [
            'birth_date', 'gender', 'blood_type', 'curp', 'phone_number', 'stage',
            'has_disability_certificate', 'has_interdiction_judgment', 'receives_pension', 'social_security',
            'receives_psychological_care', 'receives_psychiatric_care', 'has_seizures',
            'allergies', 'dietary_restrictions', 'physical_restrictions'
        ]
        profile_data = {field: validated_data.pop(field) for field in profile_fields if field in validated_data}
        profile_data['domicile'] = domicile
    
        # Extract additional relational fields
        disability_ids = validated_data.pop('disability', None)
        cycle_id = validated_data.pop('cycle', None)
    
        # Create the User
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
    
        from django.contrib.auth.models import Group
        group, _ = Group.objects.get_or_create(name='candidatos')
        user.groups.set([group])
    
        # If a UserProfile already exists, update it; otherwise, create it.
        if hasattr(user, 'userprofile'):
            user_profile = user.userprofile
            for key, value in profile_data.items():
                setattr(user_profile, key, value)
            user_profile.save()
        else:
            user_profile = UserProfile.objects.create(user=user, **profile_data)
    
        if photo:
            user_profile.photo = photo
            user_profile.save()
    
        # Handle disabilities
        if disability_ids:
            user_profile.disability.set(disability_ids)
    
        # Handle cycle
        if cycle_id:
            try:
                cycle_obj = Cycle.objects.get(id=cycle_id)
                user_profile.cycle = cycle_obj
                user_profile.save()
            except Cycle.DoesNotExist:
                pass
            
        # Create emergency contacts (corrected logic)
        created_contacts = []
        for contact_data in emergency_contacts_data:
            contact_data.pop("id", None)  # Remove id if present
            contact_domicile_data = contact_data.pop('domicile', None)
            
            contact_domicile = None
            if not contact_data.get('lives_at_same_address') and contact_domicile_data and any(contact_domicile_data.values()):
                 contact_domicile = Domicile.objects.create(**contact_domicile_data)
            
            contact = EmergencyContact.objects.create(domicile=contact_domicile, **contact_data)
            created_contacts.append(contact)

        # Attach all created contacts at once
        if created_contacts:
            user_profile.emergency_contacts.set(created_contacts)
    
        # --- NEW: Handle medications ---
        # medications_data is expected to be a list of dictionaries
        if medications_data:
            medication_instances = []
            for med_data in medications_data:
                if isinstance(med_data, dict):
                    # Asegurar que el medicamento tenga al menos un nombre
                    if med_data.get('name'):
                        # Crear o buscar medicamento existente
                        med_instance, created = Medication.objects.get_or_create(
                            name=med_data['name'],
                            defaults={
                                'dose': med_data.get('dose', ''),
                                'reason': med_data.get('reason', '')
                            }
                        )
                        medication_instances.append(med_instance)
                elif isinstance(med_data, str):
                    # Si es un string, crear medicamento con solo el nombre
                    med_instance, created = Medication.objects.get_or_create(
                        name=med_data.strip(),
                        defaults={'dose': '', 'reason': ''}
                    )
                    medication_instances.append(med_instance)
            
            if medication_instances:
                user_profile.medications.set(medication_instances)
        # ------------------------------
    
        return user

    
class CandidateUpdateSerializer(serializers.ModelSerializer):
    # Define the same write-only fields as in CandidateCreateSerializer
    birth_date = serializers.DateField(write_only=True, required=False)
    gender = serializers.ChoiceField(choices=UserProfile.GENDER_CHOICES, write_only=True, required=False)
    curp = serializers.CharField(write_only=True, required=False, allow_blank=True)
    phone_number = serializers.CharField(write_only=True, required=False)
    stage = serializers.CharField(write_only=True, required=False)
    
    receives_pension = serializers.CharField(write_only=True, required=False, allow_blank=True)
    social_security = serializers.CharField(write_only=True, required=False, allow_blank=True)

    has_disability_certificate = serializers.BooleanField(write_only=True, required=False)
    has_interdiction_judgment = serializers.BooleanField(write_only=True, required=False)
    receives_psychological_care = serializers.BooleanField(write_only=True, required=False)
    receives_psychiatric_care = serializers.BooleanField(write_only=True, required=False)
    has_seizures = serializers.BooleanField(write_only=True, required=False)
    
    blood_type = serializers.ChoiceField(choices=UserProfile.BLOOD_TYPE_CHOICES, write_only=True, required=False)
    allergies = serializers.CharField(write_only=True, required=False, allow_blank=True)
    dietary_restrictions = serializers.CharField(write_only=True, required=False, allow_blank=True)
    physical_restrictions = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    address_road = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    address_number = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    address_number_int = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    address_PC = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    address_municip = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    address_col = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    address_state = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    address_city = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    address_lat = serializers.DecimalField(required=False, allow_null=True, max_digits=9, decimal_places=6)
    address_lng = serializers.DecimalField(required=False, allow_null=True, max_digits=9, decimal_places=6)
    
    residence_type = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)

    disability = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    cycle = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    emergency_contacts = EmergencyContactSerializer(many=True, required=False)
    medications = MedicationSerializer(many=True, required=False)

    agency_state = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'second_last_name',
            'birth_date', 'gender', 'blood_type', 'curp', 'phone_number',
            'stage', 'has_disability_certificate', 'has_interdiction_judgment',
            'receives_pension', 'receives_psychological_care', 'receives_psychiatric_care', 'social_security',
            'has_seizures', 'medications', 'allergies', 'dietary_restrictions', 'physical_restrictions',
            'address_road', 'address_number', 'address_number_int', 'address_PC',
            'address_municip', 'address_col', 'address_state', 'address_city', 'address_lat', 'address_lng', 'residence_type',
            'disability', 'cycle', 'emergency_contacts', 'agency_state',
        ]

    def update(self, instance, validated_data):
        # Update user fields
        instance.email = validated_data.get('email', instance.email)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.second_last_name = validated_data.get('second_last_name', instance.second_last_name)
        instance.save()

        profile = instance.userprofile

        # Update profile fields
        profile.birth_date = validated_data.get('birth_date', profile.birth_date)
        profile.gender = validated_data.get('gender', profile.gender)
        profile.blood_type = validated_data.get('blood_type', profile.blood_type)
        profile.curp = validated_data.get('curp', profile.curp)
        profile.phone_number = validated_data.get('phone_number', profile.phone_number)
        profile.stage = validated_data.get('stage', profile.stage)
        profile.has_disability_certificate = validated_data.get('has_disability_certificate', profile.has_disability_certificate)
        profile.has_interdiction_judgment = validated_data.get('has_interdiction_judgment', profile.has_interdiction_judgment)
        profile.receives_pension = validated_data.get('receives_pension', profile.receives_pension)
        profile.social_security = validated_data.get('social_security', profile.social_security)
        profile.receives_psychological_care = validated_data.get('receives_psychological_care', profile.receives_psychological_care)
        profile.receives_psychiatric_care = validated_data.get('receives_psychiatric_care', profile.receives_psychiatric_care)
        profile.has_seizures = validated_data.get('has_seizures', profile.has_seizures)
        # Remove the direct assignment of medications here (since it's now a relation)
        profile.allergies = validated_data.get('allergies', profile.allergies)
        profile.dietary_restrictions = validated_data.get('dietary_restrictions', profile.dietary_restrictions)
        profile.physical_restrictions = validated_data.get('physical_restrictions', profile.physical_restrictions)
        profile.agency_state = validated_data.get('agency_state', profile.agency_state)

        # Update domicile fields (as before)
        domicile_fields = ['address_road', 'address_number', 'address_number_int',
                           'address_PC', 'address_municip', 'address_col', 'address_state', 'address_city', 'address_lat', 'address_lng', 'residence_type']
        domicile_data = {field: validated_data.get(field) for field in domicile_fields if field in validated_data}
        if domicile_data:
            if profile.domicile:
                for field, value in domicile_data.items():
                    setattr(profile.domicile, field, value if value is not None else getattr(profile.domicile, field))
                profile.domicile.save()
            elif any(domicile_data.values()):
                profile.domicile = Domicile.objects.create(**domicile_data)
        profile.save()

        # Update related fields: disabilities and cycle
        if 'disability' in validated_data:
            profile.disability.set(validated_data.get('disability'))
        if 'cycle' in validated_data:
            cycle_id = validated_data.get('cycle')
            try:
                profile.cycle = Cycle.objects.get(id=cycle_id)
            except Cycle.DoesNotExist:
                profile.cycle = None
            profile.save()

        # Update emergency contacts (as before)
        # Update emergency contacts (corrected logic)
        if 'emergency_contacts' in validated_data:
            emergency_contacts_data = validated_data.pop('emergency_contacts')
            if isinstance(emergency_contacts_data, str):
                import json
                emergency_contacts_data = json.loads(emergency_contacts_data)
            
            # First, clear all existing emergency contacts for the profile
            profile.emergency_contacts.all().delete()
            
            created_contacts = []
            for contact_data in emergency_contacts_data:
                contact_data.pop("id", None)
                contact_domicile_data = contact_data.pop('domicile', None)
                
                contact_domicile = None
                if not contact_data.get('lives_at_same_address') and contact_domicile_data and any(contact_domicile_data.values()):
                    contact_domicile = Domicile.objects.create(**contact_domicile_data)
                
                contact = EmergencyContact.objects.create(domicile=contact_domicile, **contact_data)
                created_contacts.append(contact)
            
            # Then, set the relationship with the newly created contacts
            if created_contacts:
                profile.emergency_contacts.set(created_contacts)

        # --- NEW: Update medications if provided ---
        if 'medications' in validated_data:
            medications_data = validated_data.pop('medications')
            if isinstance(medications_data, str):
                import json
                medications_data = json.loads(medications_data)
            
            # Clear existing medications
            profile.medications.clear()
            
            if medications_data:
                medication_instances = []
                for med_data in medications_data:
                    if isinstance(med_data, dict):
                        # Asegurar que el medicamento tenga al menos un nombre
                        if med_data.get('name'):
                            # Crear o buscar medicamento existente
                            med_instance, created = Medication.objects.get_or_create(
                                name=med_data['name'],
                                defaults={
                                    'dose': med_data.get('dose', ''),
                                    'reason': med_data.get('reason', '')
                                }
                            )
                            medication_instances.append(med_instance)
                    elif isinstance(med_data, str):
                        # Si es un string, crear medicamento con solo el nombre
                        med_instance, created = Medication.objects.get_or_create(
                            name=med_data.strip(),
                            defaults={'dose': '', 'reason': ''}
                        )
                        medication_instances.append(med_instance)
                
                if medication_instances:
                    profile.medications.set(medication_instances)
        # ------------------------------

        return instance
    
class CandidateRegisterSerializer(UserCreateSerializer):
    # Extra fields for UserProfile
    phone_number = serializers.CharField(write_only=True)
    gender = serializers.ChoiceField(choices=UserProfile.GENDER_CHOICES, write_only=True)
    birth_date = serializers.DateField(write_only=True)
    re_password = serializers.CharField(write_only=True)

    class Meta(UserCreateSerializer.Meta):
        model = User
        fields = (
            'email',
            'first_name',
            'last_name',
            'second_last_name',
            'password',
            're_password',
            'phone_number',
            'gender',
            'birth_date'
        )
        extra_kwargs = {'password': {'write_only': True}}

    def validate(self, data):
        """
        Pop extra fields (used for profile creation) from the input data so they are not passed
        to the User model creation. Their values are stored in an instance variable for later use.
        """
        extra_fields = {}
        for field in ['re_password', 'phone_number', 'gender', 'birth_date']:
            extra_fields[field] = data.pop(field, None)
        self._extra_data = extra_fields
        return data

    def create(self, validated_data):
        # Create the user using djoser's built-in logic
        user = super().create(validated_data)
        
        # Retrieve the extra data stored in validate()
        extra_data = getattr(self, '_extra_data', {})
        phone_number = extra_data.get('phone_number')
        gender = extra_data.get('gender')
        birth_date = extra_data.get('birth_date')
        
        # Add the new user to the "candidatos" group
        group, _ = Group.objects.get_or_create(name='candidatos')
        user.groups.set([group])
        
        # ✅ Add user to center with ID 1 if they don't have a center
        if not hasattr(user, 'center') or user.center is None:
            center_one = Center.objects.get(pk=1)
            user.center = center_one
            user.save(update_fields=['center'])

        # Use get_or_create to avoid duplicate UserProfile creation.
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'phone_number': phone_number,
                'gender': gender,
                'birth_date': birth_date,
            }
        )
        # If the profile already exists, update its values.
        if not created:
            profile.phone_number = phone_number
            profile.gender = gender
            profile.birth_date = birth_date
            profile.save()
            
        return user
    

class BulkCandidateCreateSerializer(serializers.ModelSerializer):
    # Campos del usuario
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)
    second_last_name = serializers.CharField(write_only=True, required=False)
    email = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False)
    
    # Campos del perfil
    birth_date = serializers.DateField(write_only=True, required=False)
    gender = serializers.CharField(write_only=True, required=False)
    curp = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    phone_number = serializers.CharField(write_only=True, required=False)
    stage = serializers.CharField(write_only=True, required=False)
    disability = serializers.ListField(write_only=True, required=False)
    cycle = serializers.IntegerField(write_only=True, required=False)
    
    # Campos booleanos (solo los que existen en el modelo)
    has_disability_certificate = serializers.BooleanField(write_only=True, required=False)
    has_interdiction_judgment = serializers.BooleanField(write_only=True, required=False)
    receives_psychological_care = serializers.BooleanField(write_only=True, required=False)
    receives_psychiatric_care = serializers.BooleanField(write_only=True, required=False)
    has_seizures = serializers.BooleanField(write_only=True, required=False)
    
    # Campos de pensiones y seguridad social
    receives_pension = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    social_security = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    
    # Campos médicos
    blood_type = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    allergies = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    dietary_restrictions = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    physical_restrictions = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    medications = serializers.ListField(write_only=True, required=False)
    
    # Campos de agencia
    agency_state = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    current_job = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    
    # Campos de domicilio
    address_road = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    address_number = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    address_number_int = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    address_PC = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    address_municip = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    address_col = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    address_state = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    address_city = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    address_lat = serializers.FloatField(write_only=True, required=False, allow_null=True)
    address_lng = serializers.FloatField(write_only=True, required=False, allow_null=True)
    residence_type = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    
    # Campos de contacto de emergencia (legacy)
    emergency_first_name = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_last_name = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_second_last_name = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_relationship = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_phone = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_email = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    
    # Campos de contacto de emergencia múltiples (nuevo formato)
    emergency_first_name_1 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_last_name_1 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_second_last_name_1 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_relationship_1 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_phone_1 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_email_1 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    
    emergency_first_name_2 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_last_name_2 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_second_last_name_2 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_relationship_2 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_phone_2 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_email_2 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    
    emergency_first_name_3 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_last_name_3 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_second_last_name_3 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_relationship_3 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_phone_3 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_email_3 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    
    emergency_first_name_4 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_last_name_4 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_second_last_name_4 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_relationship_4 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_phone_4 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_email_4 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    
    emergency_first_name_5 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_last_name_5 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_second_last_name_5 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_relationship_5 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_phone_5 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    emergency_email_5 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    # emergency_contacts = serializers.ListField(
    #     child=serializers.DictField(),
    #     write_only=True, 
    #     required=False
    # )

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'second_last_name', 'email', 'password',
            'birth_date', 'gender', 'blood_type', 'curp', 'phone_number', 'stage',
            'has_disability_certificate', 'has_interdiction_judgment',
            'receives_psychological_care', 'receives_psychiatric_care',
            'has_seizures', 'receives_pension', 'social_security', 'allergies',
            'dietary_restrictions', 'physical_restrictions', 'medications', 'agency_state',
            'current_job', 'address_road', 'address_number', 'address_number_int',
            'address_PC', 'address_municip', 'address_col', 'address_state',
            'address_city', 'address_lat', 'address_lng', 'residence_type',
            'emergency_first_name', 'emergency_last_name', 'emergency_second_last_name',
            'emergency_relationship', 'emergency_phone', 'emergency_email',
            'emergency_first_name_1', 'emergency_last_name_1', 'emergency_second_last_name_1',
            'emergency_relationship_1', 'emergency_phone_1', 'emergency_email_1',
            'emergency_first_name_2', 'emergency_last_name_2', 'emergency_second_last_name_2',
            'emergency_relationship_2', 'emergency_phone_2', 'emergency_email_2',
            'emergency_first_name_3', 'emergency_last_name_3', 'emergency_second_last_name_3',
            'emergency_relationship_3', 'emergency_phone_3', 'emergency_email_3',
            'emergency_first_name_4', 'emergency_last_name_4', 'emergency_second_last_name_4',
            'emergency_relationship_4', 'emergency_phone_4', 'emergency_email_4',
            'emergency_first_name_5', 'emergency_last_name_5', 'emergency_second_last_name_5',
            'emergency_relationship_5', 'emergency_phone_5', 'emergency_email_5',
            'disability', 'cycle'
        ]

    def to_internal_value(self, data):
        print(f"DEBUG TO_INTERNAL_VALUE: Starting validation for data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
        
        # Debug: mostrar el email antes de la limpieza
        if isinstance(data, dict) and 'email' in data:
            print(f"DEBUG TO_INTERNAL_VALUE: Email antes de limpieza: '{data.get('email')}'")
        
        # Limpiar valores problemáticos antes de la validación
        if isinstance(data, dict):
            cleaned_data = {}
            for key, value in data.items():
                if isinstance(value, float):
                    import math
                    if math.isinf(value) or math.isnan(value) or abs(value) > 1e308:
                        cleaned_data[key] = None
                    elif value.is_integer():
                        cleaned_data[key] = int(value)
                    else:
                        cleaned_data[key] = value
                else:
                    cleaned_data[key] = value
            data = cleaned_data
            
            # Debug: mostrar el email después de la limpieza
            if 'email' in data:
                print(f"DEBUG TO_INTERNAL_VALUE: Email después de limpieza: '{data.get('email')}'")
        
        # Manejar disability como lista
        if 'disability' in data and isinstance(data['disability'], str):
            data['disability'] = [data['disability']]
        
        print(f"DEBUG TO_INTERNAL_VALUE: About to call super().to_internal_value")
        try:
            result = super().to_internal_value(data)
            print(f"DEBUG TO_INTERNAL_VALUE: Validation successful")
            return result
        except Exception as e:
            print(f"DEBUG TO_INTERNAL_VALUE: Validation failed with error: {e}")
            raise

    def create(self, validated_data):
        print(f"DEBUG SERIALIZER: Iniciando método create para {validated_data.get('first_name', 'N/A')}")
        print(f"DEBUG SERIALIZER: validated_data keys al inicio: {list(validated_data.keys())}")
        print(f"DEBUG SERIALIZER: validated_data completo: {validated_data}")
        print(f"DEBUG SERIALIZER: Antes de extraer datos del usuario")
        
        # Inicializar estadísticas
        if not hasattr(self, 'stats'):
            self.stats = {
                'usuarios_creados': 0,
                'usuarios_encontrados': 0,
                'usuarios_actualizados': 0
            }
        # Extraer datos del usuario
        user_data = {key: validated_data.pop(key, None) for key in ['first_name', 'last_name', 'second_last_name', 'email']}
        print(f"DEBUG SERIALIZER: user_data extraído: {user_data}")
        
        # Generar email si no se proporciona, es None, o es un valor inválido
        email_value = user_data.get("email")
        if not email_value or email_value is None or email_value.lower() in ['no aplica', 'n/a', 'na', '']:
            first_name = user_data.get("first_name", "user")
            last_name = user_data.get("last_name", "placeholder")
            base_email = f"{first_name.lower()}.{last_name.lower()}@placeholder.com"
            
            # Verificar si el email ya existe y generar uno único
            counter = 1
            email = base_email
            while User.objects.filter(email=email).exists():
                email = f"{first_name.lower()}.{last_name.lower()}{counter}@placeholder.com"
                counter += 1
            
            user_data["email"] = email
            print(f"DEBUG SERIALIZER: Email generado automáticamente: {email}")
        
        # Generar contraseña si no se proporciona
        password = validated_data.pop('password', None)
        if not password:
            import secrets
            import string
            alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
            password = ''.join(secrets.choice(alphabet) for i in range(12))
        
        print(f"DEBUG SERIALIZER: Antes de crear/obtener usuario")
        
        # Verificar si el usuario ya existe por nombre completo (más estricto que email)
        first_name = user_data.get("first_name", "").strip()
        last_name = user_data.get("last_name", "").strip()
        second_last_name = user_data.get("second_last_name", "").strip()
        
        # Buscar usuario existente por nombre completo
        existing_user = None
        if first_name and last_name:
            # Buscar por nombre completo exacto
            if second_last_name:
                existing_user = User.objects.filter(
                    first_name__iexact=first_name,
                    last_name__iexact=last_name,
                    second_last_name__iexact=second_last_name
                ).first()
            else:
                existing_user = User.objects.filter(
                    first_name__iexact=first_name,
                    last_name__iexact=last_name
                ).first()
        
        if existing_user:
            print(f"DEBUG SERIALIZER: Usuario ya existe por nombre: {existing_user.first_name} {existing_user.last_name}")
            user = existing_user
            created = False
            self.stats['usuarios_encontrados'] += 1
            # Actualizar email si es diferente y el existente es placeholder
            if (user_data["email"] != existing_user.email and 
                not existing_user.email.endswith("@placeholder.com")):
                user.email = user_data["email"]
                user.save()
                self.stats['usuarios_actualizados'] += 1
                print(f"DEBUG SERIALIZER: Email actualizado: {user.email}")
        else:
            # Verificar también por email como respaldo
            existing_user_by_email = User.objects.filter(email=user_data["email"]).first()
            if existing_user_by_email:
                print(f"DEBUG SERIALIZER: Usuario ya existe por email: {existing_user_by_email.email}")
                user = existing_user_by_email
                created = False
                self.stats['usuarios_encontrados'] += 1
            else:
                # Crear nuevo usuario
                user = User.objects.create(**user_data)
                user.set_password(password)
                created = True
                self.stats['usuarios_creados'] += 1
                print(f"DEBUG SERIALIZER: Usuario creado: {user.email}")
        
        # Asignar center del usuario que está creando (solo si es nuevo)
        if created:
            print(f"DEBUG: Assigning center for user {user.email}")
            
            # Obtener el centro del usuario que está creando
            creating_user = None
            if hasattr(self, 'context') and self.context.get('request'):
                creating_user = self.context['request'].user
                print(f"DEBUG: Creating user: {creating_user.email}")
                print(f"DEBUG: Creating user center: {creating_user.center}")
            
            # Asignar centro
            if creating_user and hasattr(creating_user, 'center') and creating_user.center:
                user.center = creating_user.center
                print(f"DEBUG: Assigned center from creating user: {user.center}")
            else:
                # Fallback al primer center disponible
                from centros.models import Center
                first_center = Center.objects.first()
                if first_center:
                    user.center = first_center
                    print(f"DEBUG: Assigned fallback center: {user.center}")
                else:
                    print(f"DEBUG: No center available - user will be created without center")
            
            user.save()
            print(f"DEBUG: User saved with center: {user.center}")
            
            # Agregar al grupo candidatos
            from django.contrib.auth.models import Group
            group, _ = Group.objects.get_or_create(name='candidatos')
            user.groups.set([group])
            print(f"DEBUG: Added user to 'candidatos' group")
        
        # Extraer datos de domicilio
        domicile_fields = ['address_road', 'address_number', 'address_number_int', 'address_PC', 
                           'address_municip', 'address_col', 'address_state', 'address_city', 'address_lat', 'address_lng', 'residence_type']
        
        # Verificar qué campos de domicilio están disponibles
        domicile_available = [field for field in domicile_fields if field in validated_data]
        print(f"DEBUG SERIALIZER: Campos de domicilio disponibles: {domicile_available}")
        for field in domicile_available:
            print(f"DEBUG SERIALIZER: {field}: {validated_data.get(field)}")
        
        # Verificar todos los campos que contienen 'address' en validated_data
        address_fields_in_data = [key for key in validated_data.keys() if 'address' in key]
        print(f"DEBUG SERIALIZER: Todos los campos con 'address' en validated_data: {address_fields_in_data}")
        for field in address_fields_in_data:
            print(f"DEBUG SERIALIZER: {field}: {validated_data.get(field)}")
        
        domicile_data = {field: validated_data.pop(field, None) for field in domicile_fields}
        
        # Crear domicilio si hay datos
        domicile = None
        if any(domicile_data.values()):
            # Limpiar valores None antes de crear el domicilio
            clean_domicile_data = {k: v for k, v in domicile_data.items() if v is not None}
            if clean_domicile_data:
                domicile = Domicile.objects.create(**clean_domicile_data)
        
        # Extraer datos de medicamentos
        medications_data = validated_data.pop('medications', [])
        
        # Extraer campos relacionales
        disability_ids = validated_data.pop('disability', None)
        cycle_id = validated_data.pop('cycle', None)
        
        # Obtener ciclo si se especifica
        cycle_instance = None
        if cycle_id:
            cycle_instance = Cycle.objects.filter(id=cycle_id).first()
        
        # ASIGNAR AUTOMÁTICAMENTE ETAPA "ENTREVISTA"
        validated_data['stage'] = 'Ent'
        
        # Crear o actualizar perfil
        # Asegurar que phone_number tenga un valor por defecto si no se proporciona
        if 'phone_number' not in validated_data or not validated_data['phone_number']:
            validated_data['phone_number'] = 'Sin especificar'
        
        # Limpiar validated_data removiendo campos de emergencia antes de crear UserProfile
        emergency_fields_to_remove = []
        for key in validated_data.keys():
            if 'emergency' in key:
                emergency_fields_to_remove.append(key)
        
        # Crear una copia limpia de validated_data para UserProfile
        userprofile_data = {k: v for k, v in validated_data.items() if k not in emergency_fields_to_remove}
        
        print(f"DEBUG SERIALIZER: Antes de crear/obtener UserProfile")
        user_profile, profile_created = UserProfile.objects.get_or_create(
            user=user,
            defaults={**userprofile_data, "cycle": cycle_instance, "domicile": domicile}
        )
        print(f"DEBUG SERIALIZER: UserProfile {'creado' if profile_created else 'obtenido'}")
        print(f"DEBUG SERIALIZER: validated_data después de crear UserProfile: {list(validated_data.keys())}")
        
        if not profile_created:
            # Actualizar perfil existente
            for key, value in userprofile_data.items():
                setattr(user_profile, key, value)
            if cycle_instance:
                user_profile.cycle = cycle_instance
            if domicile:
                user_profile.domicile = domicile
            user_profile.save()
            print(f"DEBUG SERIALIZER: UserProfile actualizado")
        else:
            print(f"DEBUG SERIALIZER: UserProfile creado exitosamente")
        
        print(f"DEBUG SERIALIZER: validated_data después de actualizar/crear UserProfile: {list(validated_data.keys())}")
        
        print(f"DEBUG SERIALIZER: Antes de manejar discapacidades")
        # Manejar discapacidades
        if disability_ids:
            user_profile.disability.set(disability_ids)
            print(f"DEBUG SERIALIZER: Discapacidades procesadas: {len(disability_ids)}")
        else:
            print(f"DEBUG SERIALIZER: No hay discapacidades para procesar")
        
        # Manejar medicamentos
        if medications_data:
            medication_instances = []
            for med_data in medications_data:
                if isinstance(med_data, dict):
                    # Asegurar que el medicamento tenga al menos un nombre
                    if med_data.get('name'):
                        # Crear o buscar medicamento existente
                        med_instance, created = Medication.objects.get_or_create(
                            name=med_data['name'],
                            defaults={
                                'dose': med_data.get('dose', ''),
                                'reason': med_data.get('reason', '')
                            }
                        )
                        medication_instances.append(med_instance)
                        print(f"DEBUG SERIALIZER: Medicamento {'creado' if created else 'encontrado'}: {med_instance.name}")
                elif isinstance(med_data, str):
                    # Si es un string, crear medicamento con solo el nombre
                    med_instance, created = Medication.objects.get_or_create(
                        name=med_data.strip(),
                        defaults={'dose': '', 'reason': ''}
                    )
                    medication_instances.append(med_instance)
                    print(f"DEBUG SERIALIZER: Medicamento {'creado' if created else 'encontrado'} desde string: {med_instance.name}")
            
            if medication_instances:
                user_profile.medications.set(medication_instances)
                print(f"DEBUG SERIALIZER: {len(medication_instances)} medicamentos asignados")
            else:
                print(f"DEBUG SERIALIZER: No se pudieron procesar medicamentos válidos")
        else:
            print(f"DEBUG SERIALIZER: No hay medicamentos para procesar")
        
        print(f"DEBUG SERIALIZER: Antes de procesar contactos de emergencia")
        # Verificar qué campos de emergencia están disponibles
        emergency_fields = [key for key in validated_data.keys() if 'emergency' in key]
        print(f"DEBUG SERIALIZER: Campos de emergencia disponibles: {emergency_fields}")
        for field in emergency_fields:
            print(f"DEBUG SERIALIZER: {field}: {validated_data.get(field)}")
        
        # MANEJAR CONTACTOS DE EMERGENCIA (usando campos individuales)
        emergency_contacts_list = []
        
        # Procesar contacto individual (legacy)
        if any(validated_data.get(field) for field in ['emergency_first_name', 'emergency_last_name', 'emergency_relationship']):
            print(f"DEBUG SERIALIZER: Procesando contacto legacy para {user.first_name}")
            contact_data = {
                'first_name': validated_data.pop('emergency_first_name', None),
                'last_name': validated_data.pop('emergency_last_name', None),
                'second_last_name': validated_data.pop('emergency_second_last_name', None),
                'relationship': validated_data.pop('emergency_relationship', None),
                'phone_number': validated_data.pop('emergency_phone', None),
                'email': validated_data.pop('emergency_email', None),
                'lives_at_same_address': False
            }
            
            # Solo crear si tiene los campos mínimos
            if contact_data['first_name'] and contact_data['last_name'] and contact_data['relationship']:
                contact = EmergencyContact.objects.create(**contact_data)
                emergency_contacts_list.append(contact)
                print(f"DEBUG SERIALIZER: Contacto legacy creado: {contact.first_name} {contact.last_name}")
        
        # Procesar múltiples contactos (nuevo formato)
        for contact_num in range(1, 6):  # 1, 2, 3, 4, 5
            first_name = validated_data.pop(f'emergency_first_name_{contact_num}', None)
            last_name = validated_data.pop(f'emergency_last_name_{contact_num}', None)
            relationship = validated_data.pop(f'emergency_relationship_{contact_num}', None)
            
            if first_name and last_name and relationship:
                contact_data = {
                    'first_name': first_name,
                    'last_name': last_name,
                    'second_last_name': validated_data.pop(f'emergency_second_last_name_{contact_num}', None),
                    'relationship': relationship,
                    'phone_number': validated_data.pop(f'emergency_phone_{contact_num}', None),
                    'email': validated_data.pop(f'emergency_email_{contact_num}', None),
                    'lives_at_same_address': False
                }
                
                contact = EmergencyContact.objects.create(**contact_data)
                emergency_contacts_list.append(contact)
                print(f"DEBUG SERIALIZER: Contacto {contact_num} creado: {contact.first_name} {contact.last_name}")
        
        # Asignar todos los contactos usando .set()
        if emergency_contacts_list:
            user_profile.emergency_contacts.set(emergency_contacts_list)
            print(f"DEBUG SERIALIZER: {len(emergency_contacts_list)} contactos de emergencia asignados")
        else:
            print(f"DEBUG SERIALIZER: No hay contactos de emergencia para asignar")
        
        print(f"DEBUG SERIALIZER: Procesamiento de contactos de emergencia completado")
        
        return user_profile.user
    
class TAidCandidateHistorySerializer(serializers.ModelSerializer):
    # Use our custom field so that both input and output are the candidate's pk.
    candidate = CandidatePrimaryKeyRelatedField(queryset=UserProfile.objects.all())
    aid = TechnicalAidSerializer(read_only=True)
    aid_id = serializers.PrimaryKeyRelatedField(queryset=TechnicalAid.objects.all(), write_only=True, source='aid')

    class Meta:
        model = TAidCandidateHistory
        fields = ['id', 'candidate', 'aid', 'aid_id', 'is_active', 'start_date', 'end_date', 'is_successful', 'comments']

class SISAidCandidateHistorySerializer(serializers.ModelSerializer):
    candidate = CandidatePrimaryKeyRelatedField(queryset=UserProfile.objects.all())
    aid = SISHelpFlatSerializer(read_only=True)
    aid_id = serializers.PrimaryKeyRelatedField(
        queryset=SISHelp.objects.all(),
        source='aid',
        write_only=True
    )

    class Meta:
        model = SISAidCandidateHistory
        fields = [
            'id',
            'candidate',
            'aid',
            'aid_id',
            'is_active',
            'start_date',
            'end_date',
            'is_successful',
            'comments',
            'seccion',
            'item',
            'subitem',
        ]




##################################################



class CHAidCandidateHistorySerializer(serializers.ModelSerializer):
    candidate = CandidatePrimaryKeyRelatedField(queryset=UserProfile.objects.all())
    aid = CHItemSerializer(read_only=True)
    aid_id = serializers.PrimaryKeyRelatedField(queryset=CHItem.objects.all(), write_only=True, source='aid')

    class Meta:
        model = CHAidCandidateHistory
        fields = [
            'id',
            'candidate',
            'aid',
            'aid_id',
            'is_active',
            'start_date',
            'end_date',
            'is_successful',
            'comments',
            'pregunta_id',
            'pregunta_text',
            'aid_text'
        ]

class DomicileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domicile
        fields = [
            "address_road",
            "address_number",
            "address_number_int",
            "address_PC",
            "address_municip",
            "address_col",
            "address_state",
            "address_city",
            "address_lat",
            "address_lng",
            "residence_type"
        ]

    def update(self, instance, validated_data):
        """
        Método de actualización para modificar la instancia de Domicile.
        """
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# EmergencyContactSerializer duplicado eliminado - usando la primera definición
    

class DatosMedicosSerializer(serializers.ModelSerializer):
    medications = MedicationSerializer(many=True)
    # disability = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = UserProfile
        fields = [
            "stage",
            "has_disability_certificate",
            "has_interdiction_judgment",
            "receives_pension",
            "social_security",
            "receives_psychological_care",
            "receives_psychiatric_care",
            "has_seizures",
            "medications",
            "allergies",
            "dietary_restrictions",
            "physical_restrictions",
            "blood_type",
            "disability"
        ]

    def update(self, instance, validated_data):
        meds_data = validated_data.pop('medications', None)

        # Optional: handle disability like in CandidateUpdateSerializer
        if 'disability' in validated_data:
            instance.disability.set(validated_data.pop('disability'))

        instance = super().update(instance, validated_data)

        if meds_data is not None:
            instance.medications.clear()
            new_meds = []
            for med in meds_data:
                medication = Medication.objects.create(**med)
                new_meds.append(medication)
            instance.medications.set(new_meds)

        return instance
