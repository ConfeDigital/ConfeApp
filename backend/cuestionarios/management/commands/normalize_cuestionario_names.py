from django.core.management.base import BaseCommand
from django.db import transaction
from cuestionarios.models import Cuestionario, BaseCuestionarios
import unicodedata
import re


class Command(BaseCommand):
    help = 'Normaliza nombres de cuestionarios: mayúsculas, sin espacios, sin acentos, sin símbolos extraños'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Ejecutar sin hacer cambios reales en la base de datos',
        )
        parser.add_argument(
            '--base-only',
            action='store_true',
            help='Normalizar solo nombres de BaseCuestionarios',
        )
        parser.add_argument(
            '--cuestionarios-only',
            action='store_true',
            help='Normalizar solo nombres de Cuestionarios',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        base_only = options['base_only']
        cuestionarios_only = options['cuestionarios_only']

        self.stdout.write(
            self.style.SUCCESS('🚀 Iniciando normalización de nombres de cuestionarios...')
        )

        if dry_run:
            self.stdout.write(
                self.style.WARNING('⚠️  MODO DRY-RUN: No se harán cambios reales en la base de datos')
            )

        # Normalizar BaseCuestionarios
        if not cuestionarios_only:
            self.normalizar_base_cuestionarios(dry_run)

        # Normalizar Cuestionarios
        if not base_only:
            self.normalizar_cuestionarios(dry_run)

        if dry_run:
            self.stdout.write(
                self.style.WARNING('⚠️  DRY-RUN completado. Ejecuta sin --dry-run para aplicar cambios reales.')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('✅ Normalización completada exitosamente!')
            )

    def normalizar_base_cuestionarios(self, dry_run=False):
        """Normaliza nombres de BaseCuestionarios"""
        self.stdout.write('\n📋 Normalizando BaseCuestionarios...')
        
        base_cuestionarios = BaseCuestionarios.objects.all()
        stats = {'total': 0, 'cambiados': 0, 'sin_cambios': 0}

        for base in base_cuestionarios:
            stats['total'] += 1
            nombre_original = base.nombre
            nombre_normalizado = self.normalizar_nombre(nombre_original)

            if nombre_original != nombre_normalizado:
                stats['cambiados'] += 1
                self.stdout.write(f'   🔄 "{nombre_original}" → "{nombre_normalizado}"')
                
                if not dry_run:
                    base.nombre = nombre_normalizado
                    base.save()
            else:
                stats['sin_cambios'] += 1
                self.stdout.write(f'   ✅ "{nombre_original}" (sin cambios)')

        self.stdout.write(f'\n📊 BaseCuestionarios: {stats["total"]} total, {stats["cambiados"]} cambiados, {stats["sin_cambios"]} sin cambios')

    def normalizar_cuestionarios(self, dry_run=False):
        """Normaliza nombres de Cuestionarios"""
        self.stdout.write('\n📋 Normalizando Cuestionarios...')
        
        cuestionarios = Cuestionario.objects.all()
        stats = {'total': 0, 'cambiados': 0, 'sin_cambios': 0}

        for cuestionario in cuestionarios:
            stats['total'] += 1
            nombre_original = cuestionario.nombre
            nombre_normalizado = self.normalizar_nombre(nombre_original)

            if nombre_original != nombre_normalizado:
                stats['cambiados'] += 1
                self.stdout.write(f'   🔄 "{nombre_original}" → "{nombre_normalizado}"')
                
                if not dry_run:
                    cuestionario.nombre = nombre_normalizado
                    cuestionario.save()
            else:
                stats['sin_cambios'] += 1
                self.stdout.write(f'   ✅ "{nombre_original}" (sin cambios)')

        self.stdout.write(f'\n📊 Cuestionarios: {stats["total"]} total, {stats["cambiados"]} cambiados, {stats["sin_cambios"]} sin cambios')

    def normalizar_nombre(self, nombre):
        """
        Normaliza un nombre aplicando las siguientes reglas:
        1. Convertir a mayúsculas
        2. Quitar espacios innecesarios (múltiples espacios, espacios al inicio/final)
        3. Quitar acentos
        4. Quitar símbolos extraños (mantener solo letras, números y espacios)
        """
        if not nombre:
            return nombre

        # 1. Convertir a mayúsculas
        nombre = nombre.upper()

        # 2. Quitar acentos
        nombre = self.quitar_acentos(nombre)

        # 3. Quitar símbolos extraños (mantener solo letras, números y espacios)
        nombre = re.sub(r'[^A-Z0-9\s]', '', nombre)

        # 4. Quitar espacios innecesarios
        nombre = re.sub(r'\s+', ' ', nombre)  # Múltiples espacios → un espacio
        nombre = nombre.strip()  # Espacios al inicio/final

        return nombre

    def quitar_acentos(self, texto):
        """
        Quita los acentos de un texto usando unicodedata
        """
        # Normalizar a forma NFD (descomponer caracteres)
        texto_normalizado = unicodedata.normalize('NFD', texto)
        
        # Filtrar solo caracteres que no son diacríticos (acentos)
        texto_sin_acentos = ''.join(
            char for char in texto_normalizado 
            if not unicodedata.combining(char)
        )
        
        return texto_sin_acentos 