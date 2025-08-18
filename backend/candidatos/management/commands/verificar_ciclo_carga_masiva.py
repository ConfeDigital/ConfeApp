from django.core.management.base import BaseCommand
from django.utils import timezone
from candidatos.models import Cycle


class Command(BaseCommand):
    help = 'Verifica y crea el ciclo "carga_masiva" si no existe'

    def handle(self, *args, **options):
        try:
            # Verificar si existe el ciclo "carga_masiva"
            ciclo, created = Cycle.objects.get_or_create(
                name="carga_masiva",
                defaults={
                    'start_date': timezone.now().date(),
                    'end_date': None
                }
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Ciclo "carga_masiva" creado exitosamente\n'
                        f'   - ID: {ciclo.id}\n'
                        f'   - Fecha de inicio: {ciclo.start_date}\n'
                        f'   - Fecha de fin: {ciclo.end_date or "Sin fecha"}'
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f'ℹ️  El ciclo "carga_masiva" ya existe\n'
                        f'   - ID: {ciclo.id}\n'
                        f'   - Fecha de inicio: {ciclo.start_date}\n'
                        f'   - Fecha de fin: {ciclo.end_date or "Sin fecha"}'
                    )
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error al verificar/crear el ciclo: {str(e)}')
            ) 