from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

class Habilidad(models.Model):
    """
    Modelo para representar las habilidades que pueden tener los candidatos
    y que pueden requerir los empleos.
    """
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    categoria = models.CharField(
        max_length=50,
        choices=[
            ('tecnica', 'Técnica'),
            ('blanda', 'Blanda'),
            ('fisica', 'Física'),
            ('cognitiva', 'Cognitiva'),
            ('social', 'Social'),
        ],
        default='blanda'
    )
    es_activa = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Habilidad'
        verbose_name_plural = 'Habilidades'
        ordering = ['categoria', 'nombre']
    
    def __str__(self):
        return f"{self.nombre} ({self.get_categoria_display()})"

class Company(models.Model):
    name = models.CharField(max_length=255, unique=True)
    logo = models.ImageField(upload_to='company_logos/', null=True, blank=True)

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
    
class Location(models.Model):
    alias = models.CharField(max_length=50, null=True, blank=True)

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

    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True)
    
    def __str__(self):
        return f"{self.address_road}, {self.address_number}, {self.address_municip}, {self.address_city}, {self.address_state}"
    
class Job(models.Model):
    name = models.CharField(max_length=255, unique=True)

    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True)
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True)

    job_description = models.TextField(null=True, blank=True)

    vacancies = models.IntegerField(null=True, blank=True)
    
    # Nuevos campos solicitados
    horario = models.CharField(max_length=255, null=True, blank=True, help_text="Horario de trabajo (ej: Lunes a Viernes 8:00-17:00)")
    sueldo_base = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Sueldo base mensual")
    prestaciones = models.TextField(null=True, blank=True, help_text="Prestaciones ofrecidas (seguro médico, vales, etc.)")
    
    # Habilidades requeridas para el empleo
    habilidades_requeridas = models.ManyToManyField(
        Habilidad, 
        through='JobHabilidadRequerida',
        related_name='empleos_que_requieren',
        blank=True
    )

    def __str__(self):
        if self.company:
            return f"{self.company.name} - {self.name}"
        else:
            return f"Sin compañía - {self.name}"

class JobHabilidadRequerida(models.Model):
    """
    Modelo intermedio para especificar las habilidades requeridas para un empleo
    con su nivel de importancia.
    """
    NIVEL_IMPORTANCIA_CHOICES = [
        ('esencial', 'Esencial'),
        ('importante', 'Importante'),
        ('deseable', 'Deseable'),
    ]
    
    job = models.ForeignKey(Job, on_delete=models.CASCADE)
    habilidad = models.ForeignKey(Habilidad, on_delete=models.CASCADE)
    nivel_importancia = models.CharField(
        max_length=20,
        choices=NIVEL_IMPORTANCIA_CHOICES,
        default='importante'
    )
    fecha_asignacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['job', 'habilidad']
        verbose_name = 'Habilidad Requerida para Empleo'
        verbose_name_plural = 'Habilidades Requeridas para Empleos'
    
    def __str__(self):
        return f"{self.job.name} - {self.habilidad.nombre} ({self.get_nivel_importancia_display()})"

class Employer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)

    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True)
    
    def __str__(self):
        if self.company:
            company_name_str = f"{self.company.name} - " if self.company else ""
            return f"{company_name_str} - {self.user.first_name} {self.user.last_name}"
        else:
            return f"Sin compañia - {self.user.first_name} {self.user.last_name}"