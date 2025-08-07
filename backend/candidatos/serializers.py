from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from djoser.serializers import UserCreateSerializer
from centros.models import Center
from centros.serializers import CenterSerializer
from discapacidad.models import TechnicalAid, SISHelp, CHItem
from discapacidad.serializers import TechnicalAidSerializer, SISHelpFlatSerializer, CHItemSerializer
from .models import UserProfile, EmergencyContact, Cycle, Domicile, Medication, Disability, TAidCandidateHistory, SISAidCandidateHistory, CHAidCandidateHistory
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
        user.groups.add(group)
    
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
            
        # Create emergency contacts (handled as before)
        for contact_data in emergency_contacts_data:
            contact_data.pop("id", None)  # Remove id if present
            contact_domicile_data = contact_data.pop('domicile', None)
            if contact_data.get('lives_at_same_address'):
                contact_domicile = None
            elif contact_domicile_data and any(contact_domicile_data.values()):
                contact_domicile = Domicile.objects.create(**contact_domicile_data)
            else:
                contact_domicile = None
            contact = EmergencyContact.objects.create(domicile=contact_domicile, **contact_data)
            user_profile.emergency_contacts.add(contact)
    
        # --- NEW: Handle medications ---
        # medications_data is expected to be a list of dictionaries
        if medications_data:
            medication_instances = []
            for med_data in medications_data:
                # Optionally, you might check for an existing Medication with the same name/dose/reason
                med_instance = Medication.objects.create(**med_data)
                medication_instances.append(med_instance)
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
        if 'emergency_contacts' in validated_data:
            emergency_contacts_data = validated_data.pop('emergency_contacts')
            if isinstance(emergency_contacts_data, str):
                import json
                emergency_contacts_data = json.loads(emergency_contacts_data)
            profile.emergency_contacts.all().delete()
            for contact_data in emergency_contacts_data:
                contact_data.pop("id", None)
                contact_domicile_data = contact_data.pop('domicile', None)
                if contact_data.get('lives_at_same_address'):
                    contact_domicile = None
                elif contact_domicile_data and any(contact_domicile_data.values()):
                    contact_domicile = Domicile.objects.create(**contact_domicile_data)
                else:
                    contact_domicile = None
                contact = EmergencyContact.objects.create(domicile=contact_domicile, **contact_data)
                profile.emergency_contacts.add(contact)

        # --- NEW: Update medications if provided ---
        if 'medications' in validated_data:
            medications_data = validated_data.pop('medications')
            if isinstance(medications_data, str):
                import json
                medications_data = json.loads(medications_data)
            # Optionally, clear existing medications (or update them individually)
            profile.medications.clear()
            medication_instances = []
            for med_data in medications_data:
                medication_instance = Medication.objects.create(**med_data)
                medication_instances.append(medication_instance)
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
        user.groups.add(group)
        
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
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)
    second_last_name = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(write_only=True, required=False)

    phone_number = serializers.CharField(write_only=True, required=False)
    stage = serializers.CharField(write_only=True, required=False)
    disability = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )
    cycle = serializers.IntegerField(write_only=True, required=False)
    has_disability_certificate = serializers.BooleanField(write_only=True, required=False)
    has_interdiction_judgment = serializers.BooleanField(write_only=True, required=False)

    tutor_name = serializers.CharField(write_only=True, required=False)
    tutor_relationship = serializers.CharField(write_only=True, required=False)
    municipio = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = UserProfile
        fields = [
            'first_name', 'last_name', 'second_last_name', 'email',
            'phone_number', 'stage', 'disability', 'cycle',
            'has_disability_certificate', 'has_interdiction_judgment',
            'tutor_name', 'tutor_relationship', 'municipio'
        ]

    def to_internal_value(self, data):
        if 'disability' in data and isinstance(data['disability'], str):
            data['disability'] = [data['disability']]
        return super().to_internal_value(data)

    def create(self, validated_data):
        user_data = {key: validated_data.pop(key, None) for key in ['first_name', 'last_name', 'second_last_name', 'email']}

        if not user_data.get("email"):
            first_name = user_data.get("first_name", "user")
            last_name = user_data.get("last_name", "placeholder")
            user_data["email"] = f"{first_name.lower()}.{last_name.lower()}@placeholder.com"

        user, created = User.objects.get_or_create(email=user_data["email"], defaults=user_data)

        if created:
            group, _ = Group.objects.get_or_create(name='candidatos')
            user.groups.add(group)

        cycle_id = validated_data.pop('cycle', None)
        cycle_instance = Cycle.objects.filter(id=cycle_id).first() if cycle_id else None

        disability_list = validated_data.pop('disability', [])
        if isinstance(disability_list, str):
            disability_list = [disability_list]
        disability_instances = Disability.objects.filter(name__in=disability_list)

        tutor_name = validated_data.pop("tutor_name", None)
        tutor_relationship = validated_data.pop("tutor_relationship", None)
        municipio = validated_data.pop("municipio", None)

        domicile = None
        if municipio:
            try:
                domicile = Domicile.objects.create(address_municip=municipio)
            except Exception:
                domicile = None

        emergency_contact = None
        if tutor_name and tutor_relationship:
            try:
                emergency_contact = EmergencyContact.objects.create(
                    first_name=tutor_name,
                    last_name=user.last_name,
                    second_last_name=user.second_last_name,
                    relationship=tutor_relationship.upper(),
                    phone_number=validated_data.get("phone_number", ""),
                    email=validated_data.get("email", ""),
                    lives_at_same_address=True,
                    domicile=domicile
                )
            except Exception:
                emergency_contact = None

        user_profile, profile_created = UserProfile.objects.get_or_create(
            user=user,
            defaults={**validated_data, "cycle": cycle_instance, "domicile": domicile}
        )

        if not profile_created:
            for key, value in validated_data.items():
                setattr(user_profile, key, value)
            if cycle_instance:
                user_profile.cycle = cycle_instance
            if domicile:
                user_profile.domicile = domicile
            user_profile.save()

        if disability_instances:
            user_profile.disability.set(disability_instances)

        if emergency_contact:
            user_profile.emergency_contacts.add(emergency_contact)

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


class EmergencyContactSerializer(serializers.ModelSerializer):
    domicile = DomicileSerializer(required=False, allow_null=True)

    class Meta:
        model = EmergencyContact
        fields = [
            "id",
            "first_name",
            "last_name",
            "second_last_name",
            "relationship",
            "phone_number",
            "email",
            "lives_at_same_address",
            "domicile",
        ]

    def create(self, validated_data):
        domicile_data = validated_data.pop("domicile", None)
        if domicile_data:
            domicile = Domicile.objects.create(**domicile_data)
        else:
            domicile = None
        return EmergencyContact.objects.create(domicile=domicile, **validated_data)

    def update(self, instance, validated_data):
        domicile_data = validated_data.pop("domicile", None)

        # Actualizar datos del contacto
        for key, value in validated_data.items():
            setattr(instance, key, value)

        # Actualizar domicilio si existe
        if domicile_data:
            if instance.domicile:
                for key, value in domicile_data.items():
                    setattr(instance.domicile, key, value)
                instance.domicile.save()
            else:
                instance.domicile = Domicile.objects.create(**domicile_data)
        instance.save()
        return instance
    

class DatosMedicosSerializer(serializers.ModelSerializer):
    medications = MedicationSerializer(many=True)
    # disability = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = UserProfile
        fields = [
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
