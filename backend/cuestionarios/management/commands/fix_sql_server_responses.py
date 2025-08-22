from django.core.management.base import BaseCommand
from django.db import transaction
from cuestionarios.models import Respuesta
import json
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Arregla respuestas que pueden tener problemas de compatibilidad con Microsoft SQL Server'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Ejecutar sin hacer cambios reales en la base de datos',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('🔍 Ejecutando en modo DRY-RUN (sin cambios reales)'))
        
        try:
            # Obtener todas las respuestas
            respuestas = Respuesta.objects.all()
            total_respuestas = respuestas.count()
            
            self.stdout.write(f'📊 Total de respuestas a revisar: {total_respuestas}')
            
            respuestas_procesadas = 0
            respuestas_arregladas = 0
            errores = 0
            
            for respuesta in respuestas:
                try:
                    respuestas_procesadas += 1
                    
                    if respuestas_procesadas % 100 == 0:
                        self.stdout.write(f'🔄 Procesadas: {respuestas_procesadas}/{total_respuestas}')
                    
                    # Validar la respuesta actual
                    respuesta_original = respuesta.respuesta
                    respuesta_validada = self.validar_respuesta_para_sql_server(respuesta_original)
                    
                    # Si la respuesta necesita ser arreglada
                    if respuesta_original != respuesta_validada:
                        self.stdout.write(
                            f'🔧 Arreglando respuesta ID {respuesta.id}: '
                            f'{type(respuesta_original)} -> {type(respuesta_validada)}'
                        )
                        
                        if not dry_run:
                            with transaction.atomic():
                                respuesta.respuesta = respuesta_validada
                                respuesta.save(update_fields=['respuesta'])
                        
                        respuestas_arregladas += 1
                
                except Exception as e:
                    errores += 1
                    self.stdout.write(
                        self.style.ERROR(f'❌ Error procesando respuesta ID {respuesta.id}: {str(e)}')
                    )
            
            # Resumen final
            self.stdout.write('\n📋 RESUMEN:')
            self.stdout.write(f'   • Total de respuestas procesadas: {respuestas_procesadas}')
            self.stdout.write(f'   • Respuestas arregladas: {respuestas_arregladas}')
            self.stdout.write(f'   • Errores encontrados: {errores}')
            
            if dry_run:
                self.stdout.write(
                    self.style.WARNING('⚠️  Modo DRY-RUN: No se realizaron cambios reales en la base de datos')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS('✅ Proceso completado exitosamente')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error general: {str(e)}')
            )

    def validar_respuesta_para_sql_server(self, respuesta):
        """Valida y limpia la respuesta para compatibilidad con Microsoft SQL Server"""
        try:
            # Si la respuesta es None, devolver None
            if respuesta is None:
                return None
            
            # Si es un string vacío, devolver string vacío
            if respuesta == "":
                return ""
            
            # Si es un número, convertir a string para SQL Server
            if isinstance(respuesta, (int, float)):
                return str(respuesta)
            
            # Si es un booleano, mantener como booleano
            if isinstance(respuesta, bool):
                return respuesta
            
            # Si es una lista, validar que contenga solo tipos básicos
            if isinstance(respuesta, list):
                lista_validada = []
                for item in respuesta:
                    if isinstance(item, (str, int, float, bool)):
                        lista_validada.append(item)
                    else:
                        lista_validada.append(str(item))
                return lista_validada
            
            # Si es un diccionario, validar que contenga solo tipos básicos
            if isinstance(respuesta, dict):
                dict_validado = {}
                for key, value in respuesta.items():
                    if isinstance(key, str):
                        if isinstance(value, (str, int, float, bool, list)):
                            dict_validado[key] = value
                        else:
                            dict_validado[key] = str(value)
                return dict_validado
            
            # Para cualquier otro tipo, convertir a string
            return str(respuesta)
            
        except Exception as e:
            logger.error(f"Error validando respuesta para SQL Server: {e}")
            # En caso de error, devolver string vacío
            return ""
