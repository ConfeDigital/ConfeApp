from django.db import models
from django.core.validators import RegexValidator
from discapacidad.models import Disability, TechnicalAid, SISHelp, CHItem
from agencia.models import Job
from centros.models import Center
from django.conf import settings

from simple_history.models import HistoricalRecords # type: ignore

User = settings.AUTH_USER_MODEL

class Cycle(models.Model):
    name = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    center = models.ForeignKey(Center, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Cycle from {self.start_date} to {self.end_date}"
    
class Domicile(models.Model):
    RESIDENCE_CHOICES = [
        ('CASA', 'Casa'),
        ('DEPARTAMENTO', 'Departamento'),
        ('ALBERGUE', 'Albergue'),
        ('INSTITUCION', 'Institución (asilo, centro de atención, etc.)'),
        ('OTRO', 'Otro'),
    ]

    address_road = models.CharField(max_length=50, null=True, blank=True)
    address_number = models.CharField(max_length=8, null=True, blank=True)
    address_number_int = models.CharField(max_length=8, null=True, blank=True)
    address_PC = models.CharField(max_length=5, null=True, blank=True)
    address_municip = models.CharField(max_length=128, null=True, blank=True)
    address_col = models.CharField(max_length=128, null=True, blank=True)
    address_state = models.CharField(max_length=128, null=True, blank=True)
    address_city = models.CharField(max_length=128, null=True, blank=True)
    address_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    address_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    residence_type = models.CharField(max_length=50, choices=RESIDENCE_CHOICES, null=True, blank=True)

    def __str__(self):
        return f"{self.address_road}, {self.address_number}, {self.address_municip}, {self.address_city}, {self.address_state}"

class EmergencyContact(models.Model):
    RELATIONSHIP_CHOICES = [
        ('PADRE', 'Padre'),
        ('MADRE', 'Madre'),
        ('HERMANO', 'Hermano'),
        ('HERMANA', 'Hermana'),
        ('PAREJA', 'Pareja'),
        ('ABUELO', 'Abuelo'),
        ('ABUELA', 'Abuela'),
        ('HIJO', 'Hijo'),
        ('HIJA', 'Hija'),
        ('OTRO FAM', 'Otro Familiar'),
        ('AMIGO', 'Amigo'),
        ('AMIGA', 'Amiga'),
        ('OTRO', 'Otro'),
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    second_last_name = models.CharField(max_length=100, null=True, blank=True)
    relationship = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES)
    phone_number = models.CharField(
        max_length=15, 
        #validators=[RegexValidator(r'^\+?1?\d{9,15}$', 'Enter a valid phone number.')]
    )
    email = models.EmailField(max_length=100, null=True, blank=True)
    lives_at_same_address = models.BooleanField(default=False)
    domicile = models.ForeignKey(Domicile, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} {self.second_last_name} ({self.relationship})"

class Medication(models.Model):
    name = models.CharField(max_length=100)
    dose = models.CharField(max_length=100, blank=True, null=True)
    reason = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} , Dosis: {self.dose} ({self.reason})"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)

    BLOOD_TYPE_CHOICES = [
        ('', '---------'),
        ('A+', 'A+'), ('A-', 'A-'),
        ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'),
        ('O+', 'O+'), ('O-', 'O-'),
    ]

    GENDER_CHOICES = [
        ('M', 'Masculino'),
        ('F', 'Femenino'),
        ('O', 'Otro'),
    ]

    STAGE_CHOICES = [
        ('Reg', 'Registro'),
        ('Pre', 'Preentrevista'),
        ('Ent', 'Entrevista'),
        ('Cap', 'Capacitación'),
        ('Agn', 'Agencia'),
        ('Can', 'Canalización'),
    ]

    AGENCY_STATE_CHOICES = [
        ('Bol', 'Bolsa de Trabajo'),
        ('Emp', 'Empleado'),
        ('Des', 'Desempleado'),
    ]

    PENSION_CHOICES = [
        ('No', 'No'),
        ('Bie', 'Bienestar'),
        ('Orf', 'Orfandad'),
        ('Otr', 'Otra'),
    ]

    # Personal Information
    photo = models.ImageField(upload_to='user_photos/', null=True, blank=True)
    disability = models.ManyToManyField(Disability, blank=True)
    registration_date = models.DateField(auto_now_add=True, null=True)
    birth_date = models.DateField(null=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True)
    stage = models.CharField(max_length=3, choices=STAGE_CHOICES, default='Reg', null=True)
    
    # Unique Identifiers
    curp = models.CharField(
        max_length=18, 
        #unique=True,
        blank=True,
        null=True,
        validators=[RegexValidator(r'^[A-Z]{4}\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d{1}$', 'Enter a valid CURP')]
    )

    # Medical and Legal Status
    has_disability_certificate = models.BooleanField(default=False)
    has_interdiction_judgment = models.BooleanField(default=False)
    receives_pension = models.CharField(max_length=3, choices=PENSION_CHOICES, null=True, blank=True)
    receives_psychological_care = models.BooleanField(default=False)
    receives_psychiatric_care = models.BooleanField(default=False)

    # Medical Details
    blood_type = models.CharField(default='', max_length=3, choices=BLOOD_TYPE_CHOICES, null=True, blank=True)
    medications = models.ManyToManyField(Medication, blank=True)
    allergies = models.TextField(blank=True, null=True)
    dietary_restrictions = models.TextField(blank=True, null=True)
    physical_restrictions = models.TextField(blank=True, null=True)
    
    # Seizure Information
    has_seizures = models.BooleanField(default=False)
    
    cycle = models.ForeignKey(Cycle, on_delete=models.SET_NULL, null=True, blank=True)

    # Contact Information
    phone_number = models.CharField(
        max_length=15, 
        #validators=[RegexValidator(r'^\+?1?\d{9,15}$', 'Enter a valid phone number.')]
    )
    
    domicile = models.ForeignKey(Domicile, on_delete=models.SET_NULL, null=True, blank=True)

    emergency_contacts = models.ManyToManyField(EmergencyContact, blank=True)

    agency_state = models.CharField(max_length=3, choices=AGENCY_STATE_CHOICES, default='Bol', null=True, blank=True)
    current_job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True)

    history = HistoricalRecords()

    def __str__(self,):
        return f"{self.curp} - {self.user.first_name} {self.user.last_name} {self.user.second_last_name}"

class TAidCandidateHistory(models.Model):
    candidate = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    aid = models.ForeignKey(TechnicalAid, on_delete=models.SET_NULL, null=True, blank=True)

    is_active = models.BooleanField(default=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    # is_successful = models.BooleanField(null=True)
    is_successful = models.CharField(
        max_length=20,
        default='intentando',
        choices=[
            ('intentando', 'Intentando'),
            ('funciono', 'Le funcionó'),
            ('no_funciono', 'No le funcionó'),
        ],
        null=True,
        blank=True
    )
    comments = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = 'Technical(Evaluación Diagnóstica) Aid History'

    def __str__(self):
        return f"{self.candidate.user.first_name} {self.candidate.user.last_name} {self.candidate.user.second_last_name} - ({self.start_date} to {self.end_date or 'Present'})"

# class SISAidCandidateHistory(models.Model):
#     candidate = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
#     aid = models.ForeignKey(SISHelp, on_delete=models.SET_NULL, null=True, blank=True)

#     is_active = models.BooleanField(default=True)
#     start_date = models.DateField(null=True, blank=True)
#     end_date = models.DateField(null=True, blank=True)

#     is_successful = models.BooleanField(null=True)
#     comments = models.TextField(null=True, blank=True)

#     class Meta:
#         verbose_name = 'SIS Aid History'
    
#     def __str__(self):
#         return f"{self.candidate.user.first_name} {self.candidate.user.last_name} {self.candidate.user.second_last_name} - {self.aid.sis_aid.sub_item} ({self.start_date} to {self.end_date or 'Present'})"

############################  Prueba de cambio de Kaki a Kuki #############################

class SISAidCandidateHistory(models.Model):
    candidate = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    aid = models.ForeignKey(SISHelp, on_delete=models.SET_NULL, null=True, blank=True)

    is_active = models.BooleanField(default=False)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_successful = models.CharField(
        max_length=20,
        default='intentando',
        choices=[
            ('intentando', 'Intentando'),
            ('funciono', 'Le funcionó'),
            ('no_funciono', 'No le funcionó'),
        ],
        null=True,
        blank=True
    )
    comments = models.TextField(null=True, blank=True)

    seccion = models.CharField(max_length=255)
    item = models.CharField(max_length=255)
    subitem = models.CharField(max_length=255)
    # resultado = models.CharField(max_length=20, choices=[
    #     ('funciono', 'Le funcionó'),
    #     ('no_funciono', 'No le funcionó'),
    #     ('no_especificado', 'No especificado')
    # ])
    # comentario = models.TextField(blank=True, null=True)
    # fecha_sesion = models.DateTimeField(auto_now_add=True)
    # ultima_actualizacion = models.DateTimeField(auto_now=True)
    # sesion_seguimiento = models.CharField(max_length=50)

    history = HistoricalRecords()

    class Meta:
        verbose_name = 'SIS Aid History'
        # ordering = ['-fecha_sesion']
        indexes = [
            models.Index(fields=['candidate']),
        ]

    def __str__(self):
        return f"{self.candidate} - {self.seccion} - {self.item}"
    
###################################################################################
    
class CHAidCandidateHistory(models.Model):
    candidate = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    aid = models.ForeignKey(CHItem, on_delete=models.SET_NULL, null=True, blank=True)

    is_active = models.BooleanField(default=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    # is_successful = models.BooleanField(null=True)
    is_successful = models.CharField(
        max_length=20,
        default='intentando',
        choices=[
            ('intentando', 'Intentando'),
            ('funciono', 'Le funcionó'),
            ('no_funciono', 'No le funcionó'),
        ],
        null=True,
        blank=True
    )
    comments = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = 'CH(Cuadro de Habilidades) Aid History'
    
    def __str__(self):
        return f"{self.candidate.user.first_name} {self.candidate.user.last_name} {self.candidate.user.second_last_name} - ({self.start_date} to {self.end_date or 'Present'})"

class JobHistory(models.Model):
    candidate = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True)

    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    # comments = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = 'Job History'

    def __str__(self):
        return f"{self.candidate.user.first_name} {self.candidate.user.last_name} {self.candidate.user.second_last_name} - {self.job.name} ({self.start_date} to {self.end_date or 'Present'})"
    

class JobHistoryComment(models.Model):
    """
    Model to store individual comments related to a JobHistory entry.
    Each comment includes the text, creation date, and the user who made it.
    """
    job_history = models.ForeignKey(
        JobHistory,
        on_delete=models.CASCADE,
        related_name='comments', # This allows you to access comments from JobHistory: `job_history_instance.comments.all()`
        help_text="The job history entry this comment belongs to."
    )
    comment_text = models.TextField(
        help_text="The actual text content of the comment."
    )
    type = models.CharField(
        max_length=10,
        default='info',
        choices=[
            ('info', 'Información'),
            ('success', 'Éxito'),
            ("warning", "Advertencia"),
            ('error', 'Error'),
        ],
    )
    created_at = models.DateTimeField(
        auto_now_add=True, # Automatically sets the date/time when the comment is first created
        help_text="The date and time the comment was created."
    )
    author = models.ForeignKey(
        User, # Link to the User model, assuming a user makes the comment
        on_delete=models.SET_NULL, # If the user is deleted, don't delete their comments, just set author to null
        null=True,
        blank=True,
        related_name='job_history_comments',
        help_text="The user who created this comment."
    )

    class Meta:
        verbose_name = 'Job History Comment'
        verbose_name_plural = 'Job History Comments'
        ordering = ['created_at'] # Order comments by creation date, oldest first

    def __str__(self):
        return f"Comment on {self.job_history.id} by {self.author.get_full_name() if self.author else 'Unknown'} at {self.created_at.strftime('%Y-%m-%d %H:%M')}"