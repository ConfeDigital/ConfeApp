from django.core.management.base import BaseCommand
import pandas as pd
import os
from datetime import datetime

class Command(BaseCommand):
    help = 'Genera plantillas de Excel para carga masiva de candidatos por tipo de cuestionario'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tipo',
            type=str,
            choices=['preentrevista', 'entrevista', 'socioeconomico', 'todos'],
            default='todos',
            help='Tipo de cuestionario para generar plantilla'
        )
        parser.add_argument(
            '--output',
            type=str,
            default=None,
            help='Ruta de salida para la plantilla (opcional)'
        )

    def handle(self, *args, **options):
        tipo = options['tipo']
        
        if tipo == 'todos':
            self.generar_todas_plantillas(options['output'])
        else:
            self.generar_plantilla_especifica(tipo, options['output'])

    def generar_todas_plantillas(self, output_path=None):
        """Genera plantillas para todos los tipos de cuestionarios"""
        tipos = ['preentrevista', 'entrevista', 'socioeconomico']
        
        for tipo in tipos:
            self.generar_plantilla_especifica(tipo, output_path)

    def generar_plantilla_especifica(self, tipo, output_path=None):
        """Genera una plantilla específica para un tipo de cuestionario"""
        
        if tipo == 'preentrevista':
            datos_ejemplo = self.get_datos_preentrevista()
            nombre_archivo = 'plantilla_preentrevistas'
        elif tipo == 'entrevista':
            datos_ejemplo = self.get_datos_entrevista()
            nombre_archivo = 'plantilla_entrevistas'
        elif tipo == 'socioeconomico':
            datos_ejemplo = self.get_datos_socioeconomico()
            nombre_archivo = 'plantilla_socioeconomico'
        else:
            self.stdout.write(self.style.ERROR(f'Tipo de cuestionario no válido: {tipo}'))
            return

        df = pd.DataFrame(datos_ejemplo)

        if output_path:
            filename = f"{output_path}/{nombre_archivo}.xlsx"
        else:
            os.makedirs('plantillas', exist_ok=True)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'plantillas/{nombre_archivo}_{timestamp}.xlsx'

        with pd.ExcelWriter(filename, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Datos', index=False)
            
            # Ajustar ancho de columnas
            worksheet = writer.sheets['Datos']
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width

        self.stdout.write(self.style.SUCCESS(f'✅ Plantilla {tipo} creada exitosamente: {filename}'))
        self.mostrar_instrucciones(tipo)

    def get_datos_preentrevista(self):
        """Datos de ejemplo para preentrevistas"""
        return [
            {
                'Nombre': 'Juan Carlos',
                'Apellido Paterno': 'García',
                'Apellido Materno': 'López',
                'Fecha de Nacimiento': '1990-05-15',
                'Género': 'Masculino',
                'CURP': 'GALJ900515HDFXXX01',
                'Teléfono': '5551234567',
                'Correo Electrónico': 'juan.garcia@email.com',
                'Dirección': 'Av. Reforma 123',
                'Colonia': 'Centro',
                'Ciudad': 'Ciudad de México',
                'Estado': 'CDMX',
                'Código Postal': '06000',
                'Tipo de Discapacidad': 'Física',
                '¿Tiene Certificado de Discapacidad?': 'Sí',
                '¿Recibe Pensión?': 'No',
                'Seguridad Social': 'IMSS',
                '¿Recibe Cuidado Psicológico?': 'No',
                '¿Recibe Cuidado Psiquiátrico?': 'No',
                '¿Tiene Convulsiones?': 'No',
                'Tipo de Sangre': 'O+',
                'Alergias': 'Ninguna',
                'Restricciones Dietéticas': 'Ninguna',
                'Restricciones Físicas': 'Movilidad reducida en pierna derecha',
                'Nombre del Contacto de Emergencia': 'María García',
                'Relación': 'Madre',
                'Teléfono de Emergencia': '5559876543',
                '¿Vive en la Misma Dirección?': 'Sí'
            },
            {
                'Nombre': 'Ana María',
                'Apellido Paterno': 'Rodríguez',
                'Apellido Materno': 'Martínez',
                'Fecha de Nacimiento': '1985-12-03',
                'Género': 'Femenino',
                'CURP': 'ROMA851203MDFXXX02',
                'Teléfono': '5552345678',
                'Correo Electrónico': 'ana.rodriguez@email.com',
                'Dirección': 'Calle Juárez 456',
                'Colonia': 'San Rafael',
                'Ciudad': 'Ciudad de México',
                'Estado': 'CDMX',
                'Código Postal': '06470',
                'Tipo de Discapacidad': 'Visual',
                '¿Tiene Certificado de Discapacidad?': 'Sí',
                '¿Recibe Pensión?': 'Bienestar',
                'Seguridad Social': 'ISSSTE',
                '¿Recibe Cuidado Psicológico?': 'Sí',
                '¿Recibe Cuidado Psiquiátrico?': 'No',
                '¿Tiene Convulsiones?': 'No',
                'Tipo de Sangre': 'A+',
                'Alergias': 'Polen',
                'Restricciones Dietéticas': 'Sin gluten',
                'Restricciones Físicas': 'Baja visión',
                'Nombre del Contacto de Emergencia': 'Carlos Rodríguez',
                'Relación': 'Hermano',
                'Teléfono de Emergencia': '5558765432',
                '¿Vive en la Misma Dirección?': 'No'
            }
        ]

    def get_datos_entrevista(self):
        """Datos de ejemplo para entrevistas"""
        return [
            {
                'Nombre': 'Juan Carlos García López',
                '¿Cuál es su nivel de escolaridad?': 'Licenciatura',
                '¿En qué área se especializa?': 'Administración',
                '¿Tiene experiencia laboral previa?': 'Sí',
                '¿Cuántos años de experiencia tiene?': '5 años',
                '¿Qué tipo de trabajo busca?': 'Administrativo',
                '¿Está dispuesto a trabajar en turnos nocturnos?': 'No',
                '¿Tiene disponibilidad para viajar?': 'Sí',
                '¿Cuál es su expectativa salarial?': '$15,000 - $20,000',
                '¿Por qué quiere trabajar con nosotros?': 'Interés en la inclusión laboral',
                '¿Qué fortalezas considera que tiene?': 'Organización y liderazgo',
                '¿Cuáles son sus áreas de mejora?': 'Tecnología',
                '¿Cómo maneja el estrés?': 'Ejercicio y meditación',
                '¿Trabaja bien en equipo?': 'Sí',
                '¿Prefiere trabajo individual o en equipo?': 'Ambos',
                '¿Tiene alguna limitación física para el trabajo?': 'Movilidad reducida',
                '¿Necesita algún apoyo especial?': 'Rampa de acceso',
                '¿Cuál es su disponibilidad horaria?': 'Tiempo completo',
                '¿Cuándo puede comenzar?': 'Inmediatamente',
                '¿Tiene referencias laborales?': 'Sí'
            },
            {
                'Nombre': 'Ana María Rodríguez Martínez',
                '¿Cuál es su nivel de escolaridad?': 'Bachillerato',
                '¿En qué área se especializa?': 'Servicio al cliente',
                '¿Tiene experiencia laboral previa?': 'Sí',
                '¿Cuántos años de experiencia tiene?': '3 años',
                '¿Qué tipo de trabajo busca?': 'Atención al cliente',
                '¿Está dispuesta a trabajar en turnos nocturnos?': 'Sí',
                '¿Tiene disponibilidad para viajar?': 'No',
                '¿Cuál es su expectativa salarial?': '$12,000 - $15,000',
                '¿Por qué quiere trabajar con nosotros?': 'Oportunidad de crecimiento',
                '¿Qué fortalezas considera que tiene?': 'Comunicación y empatía',
                '¿Cuáles son sus áreas de mejora?': 'Inglés',
                '¿Cómo maneja el estrés?': 'Música y lectura',
                '¿Trabaja bien en equipo?': 'Sí',
                '¿Prefiere trabajo individual o en equipo?': 'En equipo',
                '¿Tiene alguna limitación física para el trabajo?': 'Baja visión',
                '¿Necesita algún apoyo especial?': 'Lupa y buena iluminación',
                '¿Cuál es su disponibilidad horaria?': 'Tiempo completo',
                '¿Cuándo puede comenzar?': 'En 2 semanas',
                '¿Tiene referencias laborales?': 'Sí'
            }
        ]

    def get_datos_socioeconomico(self):
        """Datos de ejemplo para estudios socioeconómicos"""
        return [
            {
                'Nombre': 'Juan Carlos García López',
                '¿Cuál es su estado civil?': 'Soltero',
                '¿Cuántas personas viven en su hogar?': '3',
                '¿Cuál es el ingreso mensual familiar?': '$25,000',
                '¿Cuál es su principal fuente de ingresos?': 'Trabajo formal',
                '¿Tiene otras fuentes de ingresos?': 'No',
                '¿Cuánto gasta en renta/mortgage mensualmente?': '$8,000',
                '¿Cuánto gasta en servicios básicos?': '$2,500',
                '¿Cuánto gasta en alimentación?': '$6,000',
                '¿Cuánto gasta en transporte?': '$1,500',
                '¿Cuánto gasta en salud?': '$1,000',
                '¿Tiene deudas?': 'Sí',
                '¿Cuál es el monto total de sus deudas?': '$50,000',
                '¿Tiene ahorros?': 'Sí',
                '¿Cuánto tiene ahorrado?': '$30,000',
                '¿Tiene seguro médico?': 'Sí',
                '¿Qué tipo de vivienda tiene?': 'Departamento rentado',
                '¿Cuántos cuartos tiene su vivienda?': '2',
                '¿Tiene automóvil?': 'No',
                '¿Tiene acceso a internet?': 'Sí',
                '¿Cuál es su nivel de estudios?': 'Licenciatura'
            },
            {
                'Nombre': 'Ana María Rodríguez Martínez',
                '¿Cuál es su estado civil?': 'Casada',
                '¿Cuántas personas viven en su hogar?': '4',
                '¿Cuál es el ingreso mensual familiar?': '$35,000',
                '¿Cuál es su principal fuente de ingresos?': 'Trabajo formal',
                '¿Tiene otras fuentes de ingresos?': 'Sí',
                '¿Cuánto gasta en renta/mortgage mensualmente?': '$12,000',
                '¿Cuánto gasta en servicios básicos?': '$3,000',
                '¿Cuánto gasta en alimentación?': '$8,000',
                '¿Cuánto gasta en transporte?': '$2,000',
                '¿Cuánto gasta en salud?': '$2,500',
                '¿Tiene deudas?': 'Sí',
                '¿Cuál es el monto total de sus deudas?': '$80,000',
                '¿Tiene ahorros?': 'Sí',
                '¿Cuánto tiene ahorrado?': '$50,000',
                '¿Tiene seguro médico?': 'Sí',
                '¿Qué tipo de vivienda tiene?': 'Casa propia',
                '¿Cuántos cuartos tiene su vivienda?': '3',
                '¿Tiene automóvil?': 'Sí',
                '¿Tiene acceso a internet?': 'Sí',
                '¿Cuál es su nivel de estudios?': 'Bachillerato'
            }
        ]

    def mostrar_instrucciones(self, tipo):
        """Muestra instrucciones específicas para cada tipo"""
        self.stdout.write('\n📋 INSTRUCCIONES DE USO:')
        
        if tipo == 'preentrevista':
            self.stdout.write('🔹 PREENTREVISTAS:')
            self.stdout.write('   • La primera fila debe contener los nombres de las preguntas')
            self.stdout.write('   • Cada fila siguiente representa un candidato')
            self.stdout.write('   • La primera columna debe ser el nombre del candidato')
            self.stdout.write('   • Mapea las preguntas a los campos de la base de datos')
            self.stdout.write('   • Los candidatos se crearán en el sistema')
            
        elif tipo == 'entrevista':
            self.stdout.write('🔹 ENTREVISTAS:')
            self.stdout.write('   • Los candidatos deben existir en preentrevistas')
            self.stdout.write('   • La primera fila debe contener los nombres de las preguntas')
            self.stdout.write('   • La primera columna debe ser el nombre del candidato')
            self.stdout.write('   • Los datos se actualizarán en los candidatos existentes')
            
        elif tipo == 'socioeconomico':
            self.stdout.write('🔹 ESTUDIOS SOCIOECONÓMICOS:')
            self.stdout.write('   • Los candidatos deben existir en preentrevistas')
            self.stdout.write('   • La primera fila debe contener los nombres de las preguntas')
            self.stdout.write('   • La primera columna debe ser el nombre del candidato')
            self.stdout.write('   • Los datos se actualizarán en los candidatos existentes')
        
        self.stdout.write('\n⚠️  NOTAS IMPORTANTES:')
        self.stdout.write('   • Los nombres de los candidatos deben coincidir exactamente')
        self.stdout.write('   • Las preguntas no mapeadas se guardarán como respuestas de cuestionario')
        self.stdout.write('   • Revisa los errores en caso de que haya problemas')
        self.stdout.write('   • Los archivos deben estar en formato .xlsx o .xls') 