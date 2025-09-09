from django.core.management.base import BaseCommand
from agencia.models import Habilidad

class Command(BaseCommand):
    help = 'Pobla la base de datos con las 10 habilidades iniciales'

    def handle(self, *args, **options):
        habilidades_iniciales = [
            {
                'nombre': 'Comunicación Efectiva',
                'descripcion': 'Capacidad para expresarse claramente y escuchar activamente',
                'categoria': 'blanda'
            },
            {
                'nombre': 'Trabajo en Equipo',
                'descripcion': 'Habilidad para colaborar efectivamente con otros',
                'categoria': 'social'
            },
            {
                'nombre': 'Resolución de Problemas',
                'descripcion': 'Capacidad para analizar situaciones y encontrar soluciones',
                'categoria': 'cognitiva'
            },
            {
                'nombre': 'Adaptabilidad',
                'descripcion': 'Flexibilidad para ajustarse a cambios y nuevas situaciones',
                'categoria': 'blanda'
            },
            {
                'nombre': 'Organización',
                'descripcion': 'Capacidad para planificar y estructurar tareas eficientemente',
                'categoria': 'cognitiva'
            },
            {
                'nombre': 'Atención al Detalle',
                'descripcion': 'Precisión y cuidado en la ejecución de tareas',
                'categoria': 'cognitiva'
            },
            {
                'nombre': 'Manejo de Herramientas Básicas',
                'descripcion': 'Competencia en el uso de herramientas manuales comunes',
                'categoria': 'tecnica'
            },
            {
                'nombre': 'Capacidad Física',
                'descripcion': 'Resistencia y fuerza para tareas que requieren esfuerzo físico',
                'categoria': 'fisica'
            },
            {
                'nombre': 'Iniciativa',
                'descripcion': 'Proactividad para tomar acción sin necesidad de supervisión constante',
                'categoria': 'blanda'
            },
            {
                'nombre': 'Puntualidad',
                'descripcion': 'Cumplimiento consistente con horarios y plazos establecidos',
                'categoria': 'blanda'
            }
        ]

        created_count = 0
        for habilidad_data in habilidades_iniciales:
            habilidad, created = Habilidad.objects.get_or_create(
                nombre=habilidad_data['nombre'],
                defaults={
                    'descripcion': habilidad_data['descripcion'],
                    'categoria': habilidad_data['categoria'],
                    'es_activa': True
                }
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Creada habilidad: {habilidad.nombre}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Habilidad ya existe: {habilidad.nombre}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Proceso completado. {created_count} habilidades nuevas creadas.')
        )
