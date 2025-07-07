from django.core.management.base import BaseCommand
from django.db import transaction
from cuestionarios.models import Respuesta, Cuestionario, Pregunta, Opcion
import json
from collections import defaultdict


class Command(BaseCommand):
    help = 'Migra todas las respuestas existentes al nuevo formato procesado con texto descriptivo'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Ejecutar sin hacer cambios reales en la base de datos',
        )
        parser.add_argument(
            '--user-id',
            type=int,
            help='Migrar solo respuestas de un usuario específico',
        )
        parser.add_argument(
            '--cuestionario-id',
            type=int,
            help='Migrar solo respuestas de un cuestionario específico',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        user_id = options.get('user_id')
        cuestionario_id = options.get('cuestionario_id')

        self.stdout.write(
            self.style.SUCCESS('🚀 Iniciando migración de respuestas al formato procesado...')
        )

        if dry_run:
            self.stdout.write(
                self.style.WARNING('⚠️  MODO DRY-RUN: No se harán cambios reales en la base de datos')
            )

        # Obtener respuestas a migrar
        respuestas_query = Respuesta.objects.select_related('pregunta', 'cuestionario', 'usuario')
        
        if user_id:
            respuestas_query = respuestas_query.filter(usuario_id=user_id)
            self.stdout.write(f'👤 Migrando solo respuestas del usuario ID: {user_id}')
        
        if cuestionario_id:
            respuestas_query = respuestas_query.filter(cuestionario_id=cuestionario_id)
            self.stdout.write(f'📋 Migrando solo respuestas del cuestionario ID: {cuestionario_id}')

        respuestas = respuestas_query.all()
        
        self.stdout.write(f'📊 Total de respuestas a procesar: {respuestas.count()}')

        # Estadísticas
        stats = {
            'total': 0,
            'migradas': 0,
            'ya_procesadas': 0,
            'errores': 0,
            'tipos_procesados': defaultdict(int)
        }

        # Procesar respuestas
        for respuesta in respuestas:
            stats['total'] += 1
            
            try:
                resultado = self.procesar_respuesta(respuesta, dry_run)
                
                if resultado == 'migrada':
                    stats['migradas'] += 1
                elif resultado == 'ya_procesada':
                    stats['ya_procesadas'] += 1
                elif resultado == 'error':
                    stats['errores'] += 1
                
                # Mostrar progreso cada 100 respuestas
                if stats['total'] % 100 == 0:
                    self.stdout.write(f'📈 Procesadas: {stats["total"]} respuestas...')

            except Exception as e:
                stats['errores'] += 1
                self.stdout.write(
                    self.style.ERROR(f'❌ Error procesando respuesta {respuesta.id}: {str(e)}')
                )

        # Mostrar estadísticas finales
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('📊 ESTADÍSTICAS FINALES:'))
        self.stdout.write(f'   Total de respuestas: {stats["total"]}')
        self.stdout.write(f'   Migradas: {stats["migradas"]}')
        self.stdout.write(f'   Ya procesadas: {stats["ya_procesadas"]}')
        self.stdout.write(f'   Errores: {stats["errores"]}')
        
        self.stdout.write('\n📋 Tipos de preguntas procesadas:')
        for tipo, cantidad in stats['tipos_procesados'].items():
            self.stdout.write(f'   {tipo}: {cantidad}')
        
        self.stdout.write('='*60)

        if dry_run:
            self.stdout.write(
                self.style.WARNING('⚠️  DRY-RUN completado. Ejecuta sin --dry-run para aplicar cambios reales.')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('✅ Migración completada exitosamente!')
            )

    def procesar_respuesta(self, respuesta, dry_run=False):
        """
        Procesa una respuesta individual y la convierte al nuevo formato
        Retorna: 'migrada', 'ya_procesada', o 'error'
        """
        respuesta_raw = respuesta.respuesta
        
        # Verificar si ya está procesada
        if self.es_respuesta_procesada(respuesta_raw):
            return 'ya_procesada'

        # Obtener información de la pregunta
        pregunta = respuesta.pregunta
        tipo_pregunta = pregunta.tipo
        
        # Solo procesar tipos específicos
        if tipo_pregunta not in ['checkbox', 'dropdown', 'multiple']:
            return 'ya_procesada'  # No necesita procesamiento

        try:
            # Procesar según el tipo
            if tipo_pregunta == 'checkbox':
                respuesta_procesada = self.procesar_checkbox(respuesta_raw, pregunta)
            elif tipo_pregunta in ['dropdown', 'multiple']:
                respuesta_procesada = self.procesar_dropdown_multiple(respuesta_raw, pregunta)
            else:
                return 'ya_procesada'

            # Guardar la respuesta procesada
            if not dry_run:
                respuesta.respuesta = respuesta_procesada
                respuesta.save()
            
            return 'migrada'

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error procesando respuesta {respuesta.id}: {str(e)}')
            )
            return 'error'

    def es_respuesta_procesada(self, respuesta_raw):
        """
        Verifica si una respuesta ya está en el nuevo formato procesado
        """
        if isinstance(respuesta_raw, dict):
            return 'texto' in respuesta_raw and 'valor_original' in respuesta_raw
        
        if isinstance(respuesta_raw, str):
            try:
                parsed = json.loads(respuesta_raw)
                return isinstance(parsed, dict) and 'texto' in parsed and 'valor_original' in parsed
            except:
                return False
        
        return False

    def procesar_checkbox(self, respuesta_raw, pregunta):
        """
        Procesa una respuesta de tipo checkbox
        """
        # Obtener opciones seleccionadas
        opciones_seleccionadas = []
        
        if isinstance(respuesta_raw, list):
            opciones_seleccionadas = respuesta_raw
        elif isinstance(respuesta_raw, str):
            try:
                opciones_seleccionadas = json.loads(respuesta_raw)
                if not isinstance(opciones_seleccionadas, list):
                    opciones_seleccionadas = [opciones_seleccionadas]
            except:
                opciones_seleccionadas = [respuesta_raw]
        else:
            opciones_seleccionadas = [respuesta_raw]

        # Procesar cada opción seleccionada
        opciones_info = []
        for opcion_id in opciones_seleccionadas:
            opcion = pregunta.opciones.filter(id=opcion_id).first()
            if opcion:
                indice = list(pregunta.opciones.all()).index(opcion)
                opciones_info.append({
                    'id': opcion_id,
                    'texto': opcion.texto,
                    'valor': opcion.valor,
                    'indice': indice
                })

        # Crear respuesta procesada
        respuesta_procesada = {
            'valor_original': opciones_seleccionadas,
            'texto': ', '.join([op['texto'] for op in opciones_info]),
            'opciones_info': opciones_info
        }

        return respuesta_procesada

    def procesar_dropdown_multiple(self, respuesta_raw, pregunta):
        """
        Procesa una respuesta de tipo dropdown o multiple
        """
        # Obtener el índice seleccionado
        indice = None
        
        if isinstance(respuesta_raw, (int, str)):
            try:
                indice = int(respuesta_raw)
            except:
                indice = 0
        else:
            indice = 0

        # Obtener la opción correspondiente
        opciones = list(pregunta.opciones.all())
        opcion = None
        
        if 0 <= indice < len(opciones):
            opcion = opciones[indice]
        else:
            # Si el índice no es válido, buscar por valor
            opcion = pregunta.opciones.filter(valor=indice).first()
            if opcion:
                indice = list(opciones).index(opcion)

        if opcion:
            opciones_info = [{
                'id': opcion.id,
                'texto': opcion.texto,
                'valor': opcion.valor,
                'indice': indice
            }]
            
            respuesta_procesada = {
                'valor_original': indice,
                'texto': opcion.texto,
                'opciones_info': opciones_info
            }
        else:
            # Fallback si no se encuentra la opción
            respuesta_procesada = {
                'valor_original': respuesta_raw,
                'texto': f'Opción no encontrada: {respuesta_raw}',
                'opciones_info': []
            }

        return respuesta_procesada 