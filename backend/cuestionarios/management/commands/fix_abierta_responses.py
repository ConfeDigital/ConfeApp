from django.core.management.base import BaseCommand
from django.db import transaction
from cuestionarios.models import Respuesta
import json


class Command(BaseCommand):
    help = 'Convierte respuestas de tipo abierta del formato objeto al formato string simple'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Ejecutar sin hacer cambios reales en la base de datos',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        self.stdout.write(
            self.style.SUCCESS('🚀 Iniciando conversión de respuestas abierta al formato simple...')
        )

        if dry_run:
            self.stdout.write(
                self.style.WARNING('⚠️  MODO DRY-RUN: No se harán cambios reales en la base de datos')
            )

        # Obtener todas las respuestas de preguntas tipo 'abierta'
        respuestas_abierta = Respuesta.objects.filter(
            pregunta__tipo='abierta'
        ).select_related('pregunta', 'usuario')

        self.stdout.write(f'📊 Total de respuestas abierta encontradas: {respuestas_abierta.count()}')

        stats = {
            'total': 0,
            'convertidas': 0,
            'ya_simples': 0,
            'errores': 0
        }

        with transaction.atomic():
            for respuesta in respuestas_abierta:
                stats['total'] += 1
                
                try:
                    resultado = self.convertir_respuesta_abierta(respuesta, dry_run)
                    
                    if resultado == 'convertida':
                        stats['convertidas'] += 1
                    elif resultado == 'ya_simple':
                        stats['ya_simples'] += 1
                    elif resultado == 'error':
                        stats['errores'] += 1

                except Exception as e:
                    stats['errores'] += 1
                    self.stdout.write(
                        self.style.ERROR(f'❌ Error procesando respuesta {respuesta.id}: {str(e)}')
                    )

        # Mostrar estadísticas finales
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('📊 ESTADÍSTICAS FINALES:'))
        self.stdout.write(f'   Total de respuestas: {stats["total"]}')
        self.stdout.write(f'   Convertidas: {stats["convertidas"]}')
        self.stdout.write(f'   Ya eran simples: {stats["ya_simples"]}')
        self.stdout.write(f'   Errores: {stats["errores"]}')
        self.stdout.write('='*60)

        if dry_run:
            self.stdout.write(
                self.style.WARNING('⚠️  DRY-RUN completado. Ejecuta sin --dry-run para aplicar cambios reales.')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('✅ Conversión completada exitosamente!')
            )

    def convertir_respuesta_abierta(self, respuesta, dry_run=False):
        """
        Convierte una respuesta abierta del formato objeto al formato string simple
        Retorna: 'convertida', 'ya_simple', o 'error'
        """
        respuesta_raw = respuesta.respuesta
        
        # Debug output (can be removed in production)
        # self.stdout.write(f'🔍 Analizando respuesta {respuesta.id}: tipo={type(respuesta_raw)}, valor={respuesta_raw}')
        
        # Si es None o vacío, no hacer nada
        if not respuesta_raw:
            return 'ya_simple'
        
        # Si es un string, verificar si contiene formato JSON de objeto
        if isinstance(respuesta_raw, str):
            # Verificar si es un string que contiene el formato objeto
            if respuesta_raw.startswith("{'texto':") or respuesta_raw.startswith('{"texto":'):
                try:
                    # Intentar parsear como JSON (reemplazando comillas simples por dobles si es necesario)
                    json_str = respuesta_raw.replace("'", '"')
                    parsed_obj = json.loads(json_str)
                    
                    if isinstance(parsed_obj, dict) and ('texto' in parsed_obj or 'valor_original' in parsed_obj):
                        # Extraer el texto del objeto
                        texto = parsed_obj.get('texto') or parsed_obj.get('valor_original') or str(parsed_obj)
                        
                        if not dry_run:
                            respuesta.respuesta = texto
                            respuesta.save()
                        
                        self.stdout.write(
                            f'🔄 Convertida respuesta {respuesta.id}: {respuesta_raw} -> "{texto}"'
                        )
                        return 'convertida'
                        
                except (json.JSONDecodeError, ValueError) as e:
                    # Si no se puede parsear como JSON, intentar con eval (cuidadosamente)
                    try:
                        # Solo usar eval si el string parece seguro (contiene solo texto, comillas y llaves)
                        if all(c in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 {}':\"_,áéíóúñÁÉÍÓÚÑ" for c in respuesta_raw):
                            parsed_obj = eval(respuesta_raw)
                            
                            if isinstance(parsed_obj, dict) and ('texto' in parsed_obj or 'valor_original' in parsed_obj):
                                texto = parsed_obj.get('texto') or parsed_obj.get('valor_original') or str(parsed_obj)
                                
                                if not dry_run:
                                    respuesta.respuesta = texto
                                    respuesta.save()
                                
                                self.stdout.write(
                                    f'🔄 Convertida respuesta {respuesta.id}: {respuesta_raw} -> "{texto}"'
                                )
                                return 'convertida'
                    except Exception as eval_error:
                        self.stdout.write(f'⚠️ No se pudo parsear respuesta {respuesta.id}: {eval_error}')
            
            # Si llegamos aquí, es un string simple (no formato objeto)
            return 'ya_simple'
        
        # Si es un objeto dict real, convertir
        if isinstance(respuesta_raw, dict):
            if 'texto' in respuesta_raw or 'valor_original' in respuesta_raw:
                texto = respuesta_raw.get('texto') or respuesta_raw.get('valor_original') or str(respuesta_raw)
                
                if not dry_run:
                    respuesta.respuesta = texto
                    respuesta.save()
                
                self.stdout.write(
                    f'🔄 Convertida respuesta {respuesta.id}: {respuesta_raw} -> "{texto}"'
                )
                return 'convertida'
        
        # Si es otro tipo, convertir a string
        texto = str(respuesta_raw)
        
        if not dry_run:
            respuesta.respuesta = texto
            respuesta.save()
        
        self.stdout.write(
            f'🔄 Convertida respuesta {respuesta.id}: {respuesta_raw} -> "{texto}"'
        )
        return 'convertida'