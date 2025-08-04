from django.db import models
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _
from api.models import CustomUser
from django.utils import timezone
from django.core.exceptions import ValidationError
from candidatos.models import UserProfile  # Asegúrate de importar el modelo UserProfile
from django.contrib.postgres.fields import ArrayField

class BaseCuestionarios(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    inicio = models.BooleanField(default=False)
    estado_desbloqueo = models.CharField(
        max_length=3,
        choices=[
            ('Reg', 'Registro'),
            ('Pre', 'Preentrevista'),
            ('Can', 'Canalización'),
            ('Ent', 'Entrevista'),
            ('Cap', 'Capacitación'),
            ('Bol', 'Bolsa de Trabajo'),
            ('Emp', 'Empleado'),
            ('Des', 'Desempleado'),
        ],
        help_text="Estado necesario para desbloquear este cuestionario."
    )
    responsable = models.CharField(
        max_length=3,
        choices=[
            ('PCD', 'Persona con Discapacidad'),
            ('Psi', 'Psicólogo'),
        ],
        help_text="Dato necesario para determinar quién contesta este cuestionario.", default="Psi",
    )

    class Meta:
        verbose_name = _("Base Cuestionarios")
        verbose_name_plural = _("Bases Cuestionarios")

    def __str__(self):
        return self.nombre

class Cuestionario(models.Model):
    nombre = models.CharField(max_length=50)
    version = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="Número de versión del cuestionario."
    )
    activo = models.BooleanField(
        default=False,
        help_text="Indica si esta versión del cuestionario está activa."
    )
    fecha_creacion = models.DateTimeField(
        default=timezone.now,
        help_text="Fecha de creación de esta versión del cuestionario."
    )
    base_cuestionario = models.ForeignKey(BaseCuestionarios, on_delete=models.CASCADE, related_name="cuestionarios", default="")

    class Meta:
        verbose_name = _("Cuestionario")
        verbose_name_plural = _("Cuestionarios")
        unique_together = ('nombre', 'version')  # Asegura que no haya dos versiones con el mismo nombre y número de versión

    def __str__(self):
        return f"{self.nombre} (v{self.version})"

    def save(self, *args, **kwargs):
        # Si es un nuevo cuestionario (no tiene ID), asignar la siguiente versión disponible
        if not self.id:
            ultima_version = Cuestionario.objects.filter(nombre=self.nombre).order_by('-version').first()
            if ultima_version:
                self.version = ultima_version.version + 1
            else:
                self.version = 1  # Si no hay versiones anteriores, empezar con la versión 1

        # Validar que solo una versión del cuestionario esté activa
        if self.activo:
            # Desactivar todas las demás versiones del mismo cuestionario
            Cuestionario.objects.filter(nombre=self.nombre).exclude(version=self.version).update(activo=False)

        super().save(*args, **kwargs)

    def clean(self):
        # Validar que no haya dos versiones activas del mismo cuestionario
        if self.activo:
            if Cuestionario.objects.filter(nombre=self.nombre, activo=True).exclude(version=self.version).exists():
                raise ValidationError("Solo una versión de un cuestionario puede estar activa al mismo tiempo.")

    def puede_desbloquear(self, user):
        # Verificar el estado del usuario
        user_profile = UserProfile.objects.get(user=user)
        return user_profile.stage == self.base_cuestionario.estado_desbloqueo

class Pregunta(models.Model):
    TIPO_PREGUNTA_CHOICES = [
        ('multiple', 'Opción Múltiple'),
        ('abierta', 'Abierta'),
        ('numero', 'Número'),
        ('checkbox', 'Checkbox'),
        ('binaria', 'Binaria'),
        ('fecha', 'Fecha'),
        ('fecha_hora', 'Fecha y Hora'),
        ('dropdown', 'Dropdown'),
        ('sis', 'SIS DE 0-4'),
        ('sis2', 'SIS DE 0-2'),
        ('datos_personales', 'Datos Personales'),
        ('datos_domicilio', 'Datos Domicilio'),
        ('datos_medicos', 'Datos Médicos'),
        ('contactos', 'Contactos'),
        ('tipo_discapacidad', 'Discapacidad'),
        ('canalizacion', 'Canalización'),
        ('canalizacion_centro', 'Canalización Centro'),
        ('ed', 'Evaluación Diagnóstica'),
        ('ch', 'Cuadro de Habilidades'),
        ('imagen', 'Imagen'),
        ('meta', 'Meta'),
    ]

    cuestionario = models.ForeignKey(Cuestionario, on_delete=models.CASCADE, related_name="preguntas")
    texto = models.CharField(max_length=2500)
    tipo = models.CharField(max_length=50, choices=TIPO_PREGUNTA_CHOICES, default="multiple")

    seccion_sis = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    nombre_seccion = models.CharField(max_length=1000, default=" ")

    campo_ficha_tecnica = models.CharField(max_length=2500, default=" ")
    campo_datos_personales = models.CharField(max_length=2500, default=" ")

    actualiza_usuario = models.BooleanField(
        default=False,
        help_text="Si está marcado, la respuesta a esta pregunta actualizará la información del usuario."
    )
    ficha_tecnica = models.BooleanField(
        default=False,
        help_text="Si está marcado, la respuesta a esta pregunta se verá en el api de ficha tecnica"
    )

    class Meta:
        verbose_name = _("Pregunta")
        verbose_name_plural = _("Preguntas")

    def __str__(self):
        return self.texto

class Opcion(models.Model):
    pregunta = models.ForeignKey(Pregunta, on_delete=models.CASCADE, related_name='opciones')
    texto = models.CharField(max_length=250)
    valor = models.IntegerField(default=0, validators=[MinValueValidator(0)])

    class Meta:
        verbose_name = _("Opción")
        verbose_name_plural = _("Opciones")

    def __str__(self):
        return self.texto

class DesbloqueoPregunta(models.Model):
    cuestionario = models.ForeignKey(Cuestionario, on_delete=models.CASCADE)
    pregunta_origen = models.ForeignKey(Pregunta, on_delete=models.CASCADE, related_name="desbloqueos_hechos")
    opcion_desbloqueadora = models.ForeignKey(Opcion, on_delete=models.CASCADE, related_name="desbloqueos")
    pregunta_desbloqueada = models.ForeignKey(Pregunta, on_delete=models.CASCADE, related_name="desbloqueos_recibidos")

    class Meta:
        unique_together = ('cuestionario', 'pregunta_origen', 'opcion_desbloqueadora', 'pregunta_desbloqueada')

    def __str__(self):
        return f"{self.pregunta_origen.texto} ({self.opcion_desbloqueadora.texto}) → {self.pregunta_desbloqueada.texto}"

class Respuesta(models.Model):
    cuestionario = models.ForeignKey(Cuestionario, on_delete=models.CASCADE)
    pregunta = models.ForeignKey(Pregunta, on_delete=models.CASCADE)
    usuario = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="respuestas")
    respuesta = models.JSONField(blank=True, null=True, help_text="Almacena la respuesta en formato JSON.")

    class Meta:
        verbose_name = _("Respuesta")
        verbose_name_plural = _("Respuestas")
        unique_together = ('cuestionario', 'pregunta', 'usuario')

    def __str__(self):
        return f"{self.usuario} - {self.pregunta}: {self.respuesta}"

    def save(self, *args, **kwargs):
        # Update user information if the question is marked as "actualiza_usuario"
        if self.pregunta.actualiza_usuario:
            if self.pregunta.texto == "Nombre":
                self.usuario.nombre = self.respuesta
            elif self.pregunta.texto == "Apellido Paterno":
                self.usuario.apellido_paterno = self.respuesta
            elif self.pregunta.texto == "Apellido Materno":
                self.usuario.apellido_materno = self.respuesta
            self.usuario.save()
    
        super().save(*args, **kwargs)
    
        # Check for unlocked questions - only for specific question types
        if self.pregunta.tipo in ['multiple', 'checkbox', 'binaria']:
            print(f"🔍 === PROCESANDO DESBLOQUEOS EN MODELO ===")
            print(f"🔍 Pregunta ID: {self.pregunta.id}")
            print(f"🔍 Texto de la pregunta: {self.pregunta.texto}")
            print(f"🔍 Tipo de pregunta: {self.pregunta.tipo}")
            print(f"🔍 Respuesta: {self.respuesta}")
            print(f"🔍 Tipo de respuesta: {type(self.respuesta)}")
            
            try:
                # First, remove all existing unlocked questions for this pregunta_origen
                # to handle changes in responses
                desbloqueos_existentes = DesbloqueoPregunta.objects.filter(
                    cuestionario=self.cuestionario,
                    pregunta_origen=self.pregunta
                )
                
                print(f"🗑️ Desbloqueos existentes encontrados: {desbloqueos_existentes.count()}")
                
                # Get all questions that were unlocked by this pregunta_origen
                preguntas_desbloqueadas = []
                for desbloqueo in desbloqueos_existentes:
                    preguntas_desbloqueadas.append(desbloqueo.pregunta_desbloqueada)
                    print(f"🗑️ Pregunta desbloqueada existente: {desbloqueo.pregunta_desbloqueada.texto}")
                
                # Remove responses for questions that were unlocked by this pregunta_origen
                if preguntas_desbloqueadas:
                    respuestas_eliminadas = Respuesta.objects.filter(
                        usuario=self.usuario,
                        cuestionario=self.cuestionario,
                        pregunta__in=preguntas_desbloqueadas
                    ).delete()
                    print(f"🗑️ Respuestas eliminadas: {respuestas_eliminadas}")
                
                # Handle different response formats safely
                respuesta_valor = None
                respuesta_texto = None
                
                # Handle different types of responses
                if isinstance(self.respuesta, (int, float)):
                    respuesta_valor = int(self.respuesta)
                elif isinstance(self.respuesta, str):
                    # Only process if it's a numeric string
                    if self.respuesta.strip().isdigit():
                        respuesta_valor = int(self.respuesta)
                    else:
                        # For non-numeric strings, skip processing
                        return
                elif isinstance(self.respuesta, dict):
                    # For JSON responses, check if there's a 'valor' key
                    respuesta_valor = self.respuesta.get('valor')
                    if respuesta_valor is not None:
                        try:
                            respuesta_valor = int(respuesta_valor)
                        except (ValueError, TypeError):
                            return
                    else:
                        return
                elif isinstance(self.respuesta, list) and len(self.respuesta) > 0:
                    # For array responses, try to get the first numeric value
                    try:
                        first_val = self.respuesta[0]
                        if isinstance(first_val, (int, float)):
                            respuesta_valor = int(first_val)
                        elif isinstance(first_val, str) and first_val.isdigit():
                            respuesta_valor = int(first_val)
                        else:
                            return
                    except (IndexError, ValueError, TypeError):
                        return
                elif isinstance(self.respuesta, bool):
                    # For boolean responses (binary questions)
                    respuesta_texto = "Sí" if self.respuesta else "No"
                elif isinstance(self.respuesta, str) and self.respuesta in ["Sí", "No"]:
                    # For string responses that are already "Sí" or "No"
                    respuesta_texto = self.respuesta
                
                # Skip if we couldn't extract a valid value
                if respuesta_valor is None and respuesta_texto is None:
                    return
    
                # Find selected options
                if respuesta_texto is not None:
                    # For binary questions, search by text
                    opciones_seleccionadas = Opcion.objects.filter(
                        pregunta=self.pregunta,
                        texto=respuesta_texto
                    )
                else:
                    # For other questions, search by numeric value
                    opciones_seleccionadas = Opcion.objects.filter(
                        pregunta=self.pregunta,
                        valor=respuesta_valor
                    )
                
                print(f"🔘 Opciones encontradas para valor {respuesta_valor}: {opciones_seleccionadas.count()}")
                
                # Verificar todas las opciones disponibles
                todas_opciones = Opcion.objects.filter(pregunta=self.pregunta)
                print(f"🔘 Todas las opciones disponibles:")
                for op in todas_opciones:
                    print(f"  - ID: {op.id}, Valor: {op.valor}, Texto: {op.texto}")
                    print(f"    Comparando: op.valor ({op.valor}) == respuesta_valor ({respuesta_valor}) = {op.valor == respuesta_valor}")
                
                for opcion in opciones_seleccionadas:
                    print(f"🔘 Opción encontrada: {opcion.texto} (ID: {opcion.id}, valor: {opcion.valor})")
    
                # Unlock questions based on selected options
                for opcion_seleccionada in opciones_seleccionadas:
                    print(f"🔘 Procesando opción: {opcion_seleccionada.texto}")
                    desbloqueos = DesbloqueoPregunta.objects.filter(
                        cuestionario=self.cuestionario,
                        pregunta_origen=self.pregunta,
                        opcion_desbloqueadora=opcion_seleccionada
                    )
                    print(f"🔘 Desbloqueos encontrados para esta opción: {desbloqueos.count()}")
    
                    for desbloqueo in desbloqueos:
                        print(f"🔓 Desbloqueando pregunta: {desbloqueo.pregunta_desbloqueada.texto}")
                        # Create an empty response for the unlocked question
                        # Use None instead of empty string to avoid constraint issues
                        try:
                            resp_desbloqueada, created = Respuesta.objects.get_or_create(
                                usuario=self.usuario,
                                cuestionario=self.cuestionario,
                                pregunta=desbloqueo.pregunta_desbloqueada,
                                defaults={'respuesta': None}
                            )
                            print(f"🔓 Respuesta de desbloqueo creada: {created}")
                        except Exception as e:
                            print(f"❌ Error al crear respuesta de desbloqueo: {e}")
                            continue
                            
                print("🔍 === FIN PROCESANDO DESBLOQUEOS EN MODELO ===\n")
            except (ValueError, TypeError, Opcion.DoesNotExist) as e:
                # Handle any conversion errors gracefully
                print(f"❌ Error in save method unlock logic: {e}")
                pass

class EstadoCuestionario(models.Model):
    ESTADO_CHOICES = [
        ('inactivo', 'Inactivo'),
        ('en_proceso', 'En Proceso'),
        ('finalizado', 'Finalizado'),
    ]

    usuario = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    cuestionario = models.ForeignKey(Cuestionario, on_delete=models.CASCADE)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='inactivo')
    fecha_finalizado = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('usuario', 'cuestionario')

    def __str__(self):
        return f"{self.usuario.email} - {self.cuestionario.nombre} - {self.estado}"
    

class ImagenOpcion(models.Model):
    pregunta = models.ForeignKey(Pregunta, on_delete=models.CASCADE, related_name='imagenes')
    imagen = models.ImageField(upload_to='preguntas_con_imagenes/')
    descripcion = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = _("Imagen de pregunta")
        verbose_name_plural = _("Imagenes de pregunta")

    def __str__(self):
        return f"Imagen para pregunta: {self.pregunta.texto}"