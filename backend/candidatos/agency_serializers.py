from rest_framework import serializers
from .models import UserProfile, JobHistory, JobHistoryComment # Import the new model
from .serializers import CandidatePrimaryKeyRelatedField, UserSerializer, DomicileSerializer, MedicationSerializer
from agencia.models import Job
from agencia.serializers import JobSerializer
from django.contrib.auth import get_user_model
from api.fields import SASImageField

User = get_user_model()

# --- NEW: Serializer for JobHistoryComment ---
class JobHistoryCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField() # To show author's name in read-only

    class Meta:
        model = JobHistoryComment
        fields = ['id', 'comment_text', 'type', 'created_at', 'author', 'author_name']
        read_only_fields = ['created_at', 'author'] # 'author' will be set by the view or save method

    def get_author_name(self, obj):
        return obj.author.get_full_name() if obj.author else 'Usuario Desconocido'


# --- MODIFIED: JobHistorySerializer ---
class JobHistorySerializer(serializers.ModelSerializer):
    candidate = CandidatePrimaryKeyRelatedField(queryset=UserProfile.objects.all())
    candidate_name = serializers.SerializerMethodField()
    job = JobSerializer(read_only=True)
    job_id = serializers.PrimaryKeyRelatedField(queryset=Job.objects.all(), write_only=True, source='job')
    # Use nested serializer for comments, many=True for multiple comments
    comments = JobHistoryCommentSerializer(many=True, read_only=True) # Read-only for retrieval

    class Meta:
        model = JobHistory
        fields = ['id', 'candidate', 'candidate_name', 'job', 'job_id', 'start_date', 'end_date', 'comments']
        # 'comments' field is now derived from the related JobHistoryComment objects

    def get_candidate_name(self, obj):
        return f"{obj.candidate.user.first_name} {obj.candidate.user.last_name} {obj.candidate.user.second_last_name}"
    # If you want to allow creating comments when creating/updating JobHistory,
    # you'll need to define a writeable nested field or handle it explicitly.
    # For simplicity, we'll assume comments are added separately or in a different workflow.
    # If comments are ONLY read, then the above `read_only=True` is fine.
    # If you need to write comments via this serializer, you would do:
    # comments = JobHistoryCommentSerializer(many=True, required=False)
    # And then override create/update methods as below:

    def create(self, validated_data):
        # Pop comments data if you want to handle it here (e.g., creating initial comments)
        # comments_data = validated_data.pop('comments', [])
        job_history = JobHistory.objects.create(**validated_data)
        # For example, if you allowed initial comments in the payload:
        # for comment_data in comments_data:
        #     JobHistoryComment.objects.create(job_history=job_history, **comment_data)
        return job_history

    def update(self, instance, validated_data):
        # Pop comments data if you want to handle it here
        # comments_data = validated_data.pop('comments', [])

        # Update JobHistory fields
        instance.candidate = validated_data.get('candidate', instance.candidate)
        instance.job = validated_data.get('job', instance.job)
        instance.start_date = validated_data.get('start_date', instance.start_date)
        instance.end_date = validated_data.get('end_date', instance.end_date)
        instance.save()

        # Logic for updating/creating comments if you allowed them as writeable fields
        # If 'comments' is read_only, you won't need this part for comments:
        # if comments_data:
        #     # This simple example assumes replacing all comments or adding new ones.
        #     # More complex logic is needed for partial updates to existing comments.
        #     instance.comments.all().delete() # Delete existing if you want to replace
        #     for comment_data in comments_data:
        #         JobHistoryComment.objects.create(job_history=instance, **comment_data)
        return instance

# --- CandidateEmploymentSerializer remains the same for now, as it doesn't directly handle comments on creation ---
class CandidateEmploymentSerializer(serializers.ModelSerializer):
    start_date = serializers.DateField(write_only=True, required=True)

    class Meta:
        model = UserProfile
        fields = ['current_job', 'start_date']

    def update(self, instance, validated_data):
        start_date = validated_data.pop('start_date')
        current_job = validated_data.get('current_job')
        if current_job:
            validated_data['agency_state'] = 'Emp'
        instance = super().update(instance, validated_data)
        if current_job:
            JobHistory.objects.create(
                candidate=instance,
                job=current_job,
                start_date=start_date,
            )
        return instance

# --- MODIFIED: CandidateEmploymentRemovalSerializer ---
class CandidateEmploymentRemovalSerializer(serializers.ModelSerializer):
    end_date = serializers.DateField(write_only=True, required=True)
    # REMOVED: comments = serializers.CharField(write_only=True, required=False, allow_blank=True)
    # Now, comments will be added to the new JobHistoryComment model

    # Optional: If you want to receive a comment when removing employment,
    # you can keep this field but handle it differently in update.
    # Let's keep it for now and pass it to the new comment model.
    comment_for_removal = serializers.CharField(write_only=True, required=False, allow_blank=True)


    class Meta:
        model = UserProfile
        fields = ['end_date', 'comment_for_removal'] # Updated fields

    def update(self, instance, validated_data):
        end_date = validated_data.pop('end_date')
        comment_text = validated_data.pop('comment_for_removal', '') # Get the comment
        
        current_job = instance.current_job
        if not current_job:
            raise serializers.ValidationError("El candidato no tiene un empleo asignado.")
        
        job_history = instance.jobhistory_set.filter(job=current_job, end_date__isnull=True).last()
        
        if job_history:
            job_history.end_date = end_date
            job_history.save() # Save the end_date update

            # --- NEW: Create a JobHistoryComment instance ---
            if comment_text: # Only create comment if text is provided
                # Get the request user to set as author
                # This assumes you are calling this serializer in a ViewSet/APIView
                # where `self.context['request'].user` is available.
                request_user = self.context.get('request').user if 'request' in self.context else None
                JobHistoryComment.objects.create(
                    job_history=job_history,
                    comment_text=comment_text,
                    author=request_user if request_user and request_user.is_authenticated else None
                )
        
        # Update the profile: remove current_job and change agency_state to "Bol"
        instance.current_job = None
        instance.agency_state = 'Bol'
        instance.save()
        
        return instance

class CandidateListAgencySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    nombre_completo = serializers.SerializerMethodField()
    id = serializers.SerializerMethodField() 
    email = serializers.SerializerMethodField()
    current_job = JobSerializer(read_only=True)
    current_job_name = serializers.SerializerMethodField()
    current_job_company = serializers.SerializerMethodField()
    current_job_start = serializers.SerializerMethodField()
    estado_agencia = serializers.SerializerMethodField()
    domicile = DomicileSerializer(read_only=True)
    disability_name = serializers.SerializerMethodField()
    medications = MedicationSerializer(many=True, read_only=True)
    photo = SASImageField(read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'nombre_completo', 'email', 'phone_number', 'user', 'agency_state', 'estado_agencia', 'current_job', 'current_job_name', 'current_job_company', 'current_job_start',
        'domicile', 'birth_date', 'photo', 'gender', 'disability_name', 'curp', 'rfc', 'nss', 'blood_type', 'allergies', 'dietary_restrictions', 'physical_restrictions', 'has_seizures', 'medications']
        read_only_fields = ['user']

    def get_nombre_completo(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name} {obj.user.second_last_name}"
    
    def get_id(self, obj):
        return obj.user.id
    
    def get_email(self, obj):
        return obj.user.email
    
    def get_current_job_name(self, obj):
        if obj.current_job is not None and hasattr(obj.current_job, "name") and obj.current_job.name:
            return obj.current_job.name
        return "N/A"
    
    def get_current_job_company(self, obj):
        if obj.current_job is not None and hasattr(obj.current_job, "company") and hasattr(obj.current_job.company, "name") and obj.current_job.company.name:
            return obj.current_job.company.name
        return "N/A"
    
    def get_current_job_start(self, obj):
        if obj.current_job is not None:
            job_history = obj.jobhistory_set.filter(job=obj.current_job, end_date__isnull=True).last()
            if job_history is not None and job_history.start_date:
                return job_history.start_date
        return "N/A"

    def get_estado_agencia(self, obj):
        """Map short codes to full names."""
        stage_mapping = {
            "Bol": "Bolsa de Trabajo",
            "Emp": "Empleado",
            "Des": "Desempleado",
        }
        return stage_mapping.get(obj.agency_state, obj.agency_state)

    def get_disability_name(self, obj):
        disabilities = obj.disability.all()
        return ", ".join(disability.name for disability in disabilities) if disabilities else "Sin discapacidad asignada"

class CurrentJobHistoryDetailSerializer(serializers.ModelSerializer):
    # This assumes JobHistory has a ForeignKey to Job
    job = JobSerializer(read_only=True) # You might need a JobSerializer for basic job info
    comments = JobHistoryCommentSerializer(many=True, read_only=True, source='jobhistorycomment_set') # Assuming reverse relation

    class Meta:
        model = JobHistory
        fields = ['id', 'start_date', 'end_date', 'job', 'comments']