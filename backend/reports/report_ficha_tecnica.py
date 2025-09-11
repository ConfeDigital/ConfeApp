"""
Ficha Técnica report generator.
Handles the complete generation of technical file reports.
"""
from io import BytesIO
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from copy import deepcopy
from datetime import datetime
from django.core.files.storage import default_storage
from reportlab.platypus import Image
import unicodedata
import re
from candidatos.models import UserProfile
from .data_collector import ReportDataCollector
from .report_utils import create_section_header, create_basic_table, create_side_by_side_tables, draw_logo_header
from cuestionarios.utils import evaluar_rango, get_user_evaluation_summary

SIS_TEMPLATE = {
    "Habilidades Adaptativas - Tabla de resultados SIS": [
        ["PERCENTILES", "Vida en el hogar", "Vida en la comunidad", "Aprendizaje a lo largo de la vida", 
         "Empleo", "Salud y seguridad", "Social", "Índice de necesidades de apoyo", "PERCENTILES"],
        ["100", "17-20", "17-20", "17-20", "N/A", "N/A", "N/A", ">137", "100"],
        ["95", "16", "15-16", "15-16", "15", "N/A", "N/A", "121-127", "95"],
        ["90", "15", "14", "14", "14", "14", "14", "117-120", "90"],
        ["85", "14", "", "13", "13", "13", "13", "114-116", "85"],
        ["80", "13", "13", "", "", "", "", "111-113", "80"],
        ["75", "", "", "12", "12", "12", "12", "109-110", "75"],
        ["70", "12", "12", "", "", "", "", "107-108", "70"],
        ["65", "11", "11", "11", "11", "11", "11", "104-106", "65"],
        ["60", "", "", "", "", "", "", "102-103", "60"],
        ["55", "", "", "", "", "", "", "101", "55"],
        ["50", "10", "10", "10", "10", "10", "10", "98-100", "50"],
        ["45", "", "", "", "", "", "", "96-97", "45"],
        ["40", "9", "9", "9", "9", "9", "9", "93-95", "40"],
        ["35", "", "", "", "", "", "", "91-92", "35"],
        ["30", "8", "8", "8", "8", "8", "8", "89-90", "30"],
        ["25", "", "", "", "", "", "", "87-88", "25"],
        ["20", "7", "7", "7", "7", "7", "7", "84-86", "20"],
        ["15", "", "", "", "", "", "", "82-83", "15"],
        ["10", "6", "6", "6", "6", "6", "6", "79-81", "10"],
        ["5", "", "", "5", "5", "5", "", "75-78", "5"],
        ["1", "1-5", "1-5", "1-4", "1-4", "1-4", "1-5", "<73", "1"]
    ],
}

class FichaTecnicaReport:
    """Generator for Ficha Técnica reports."""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
    
    def setup_custom_styles(self):
        """Setup custom styles for the report."""
        self.title_style = ParagraphStyle(
            "TitleStyle", 
            fontSize=14, 
            textColor=colors.black, 
            fontName="Helvetica-Bold", 
            alignment=0, 
            spaceAfter=12
        )
        
        self.normal_style = ParagraphStyle(
            "NormalStyle", 
            fontSize=10, 
            textColor=colors.black, 
            fontName="Helvetica",
            wordWrap='LTR',  # Enable word wrapping
            splitLongWords=True,  # Split long words
            spaceAfter=6  # Add space after paragraphs
        )
    
    def get_profile(self, uid):
        """Get user profile."""
        try:
            return UserProfile.objects.get(user__id=uid)
        except UserProfile.DoesNotExist:
            raise ValueError(f"Profile not found for user ID: {uid}")
    
    def create_header_section(self, profile):
        """Create the header section with title and photo."""
        elements = []
        
        # Get profile photo if available
        profile_pic = None
        if profile.photo and default_storage.exists(profile.photo.name):
            try:
                # Download file content to memory - works for both local and cloud storage
                with default_storage.open(profile.photo.name, 'rb') as image_file:
                    image_data = image_file.read()
                    image_buffer = BytesIO(image_data)
                    profile_pic = Image(image_buffer, width=120, height=120, kind='proportional')
            except Exception as e:
                # If there's any issue loading the image, continue without it
                print(f"Error loading profile image: {e}")
                profile_pic = None
        
        # Create title content
        title_content = Table([
            [Paragraph("Institución CONFE a Favor de la Persona con Discapacidad Intelectual I.A.P.", self.title_style)],
            [Paragraph("CENTRO ESPECIALIZADO DE INCLUSIÓN LABORAL", self.title_style)],
            [Paragraph("FICHA TÉCNICA", self.title_style)]
        ], colWidths=[400])
        
        # Combine title and photo
        header_data = [[title_content, profile_pic if profile_pic else ""]]
        header_table = Table(header_data, colWidths=[400, 100])
        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (-1, 0), (-1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        
        elements.append(draw_logo_header())
        elements.append(header_table)
        elements.append(Spacer(1, 12))
        
        return elements
    
    def create_personal_info_section(self, profile):
        """Create personal information section."""
        elements = []
        
        # Section header
        elements.append(create_section_header("DATOS PERSONALES"))
        
        # Get profile information
        discapacidades = ", ".join([d.name for d in profile.disability.all()]) if profile.disability.exists() else "No especificada"
        first_name = profile.user.first_name or ""
        last_name = profile.user.last_name or ""
        full_name = f"{first_name} {last_name}".strip()
        if hasattr(profile.user, 'second_last_name') and profile.user.second_last_name:
            full_name += f" {profile.user.second_last_name}"
        
        gender_display = dict(profile.GENDER_CHOICES).get(profile.gender, "No especificado") if hasattr(profile, 'GENDER_CHOICES') else "No especificado"
        stage_display = dict(profile.STAGE_CHOICES).get(profile.stage, "No especificado") if hasattr(profile, 'STAGE_CHOICES') else "No especificado"

        receives_pension_display = dict(profile.PENSION_CHOICES).get(profile.receives_pension, "No especificado") if hasattr(profile, 'PENSION_CHOICES') else "No especificado"
        social_security_display = dict(profile.SOCIAL_SECURITY_CHOICES).get(profile.social_security, "No especificado") if hasattr(profile, 'SOCIAL_SECURITY_CHOICES') else "No especificado"
        
        # Build address string
        address = "N/A"
        if profile.domicile:
            address_parts = [
                getattr(profile.domicile, 'address_road', '') or '',
                getattr(profile.domicile, 'address_number', '') or '',
                getattr(profile.domicile, 'address_col', '') or '',
                getattr(profile.domicile, 'address_municip', '') or '',
                getattr(profile.domicile, 'address_city', '') or '',
                getattr(profile.domicile, 'address_state', '') or '',
                f"CP {getattr(profile.domicile, 'address_PC', '') or ''}"
            ]
            # Filter out empty parts and join
            address_parts = [part.strip() for part in address_parts if part.strip()]
            address = ", ".join(address_parts) if address_parts else "N/A"
        
        # Create data rows
        info_data = [
            ["Nombre completo:", full_name, "Género:", gender_display],
            ["Discapacidad:", discapacidades, "", ""],  # Will span across columns 1-3
            ["Teléfono:", getattr(profile, 'phone_number', 'N/A') or "N/A", "Etapa:", stage_display],
            ["Edad:", str(datetime.now().year - profile.birth_date.year) + " años" if profile.birth_date else "N/A",
             "CURP:", getattr(profile, 'curp', 'N/A') or "N/A"],
            ["Tipo de sangre:", getattr(profile, 'blood_type', 'N/A') or "N/A",
             "Medicamentos:", ", ".join([m.name for m in profile.medications.all()]) if profile.medications.exists() else "N/A"],
            # ["Registro:", profile.registration_date.strftime('%Y-%m-%d') if profile.registration_date else "N/A"],
            ["Restricciones de dieta:", getattr(profile, 'dietary_restrictions', 'N/A') or "N/A",
             "Restricciones físicas:", getattr(profile, 'physical_restrictions', 'N/A') or "N/A"],
            ["Convulsiones:", "Sí" if getattr(profile, 'has_seizures', False) else "No", 
             "Alergias:", getattr(profile, 'allergies', 'N/A') or "N/A"],
            ["Seguridad social:", social_security_display,
             "Recibe pensión:", receives_pension_display],
            ["Atención psicológica:", "Sí" if getattr(profile, 'receives_psychological_care', False) else "No", 
             "Atención psiquiátrica:", "Sí" if getattr(profile, 'receives_psychiatric_care', False) else "No"],
            ["Cert. de discapacidad:", "Sí" if getattr(profile, 'has_disability_certificate', False) else "No",
             "Juicio de interdicción:", "Sí" if getattr(profile, 'has_interdiction_judgment', False) else "No"],
            ["Dirección:", address, "", ""]  # Will span across columns 1-3
        ]
        
        # Convert long text to Paragraphs for better wrapping
        wrapped_info_data = []
        for row in info_data:
            wrapped_row = []
            for i, cell in enumerate(row):
                if isinstance(cell, str) and len(cell) > 50:  # Wrap long text
                    wrapped_row.append(Paragraph(cell, self.normal_style))
                else:
                    wrapped_row.append(cell)
            wrapped_info_data.append(wrapped_row)
        
        info_table = Table(wrapped_info_data, colWidths=[110, 145, 110, 145])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 0), (-1, -1), colors.whitesmoke),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.whitesmoke, colors.white]),
            # Span discapacidad across columns 1-3 (row 1, columns 1-3)
            ('SPAN', (1, 1), (3, 1)),
            # Span dirección across columns 1-3 (last row, columns 1-3)
            ('SPAN', (1, -1), (3, -1)),
        ]))
        
        elements.append(info_table)
        elements.append(Spacer(1, 10))
        
        return elements
    
    def create_emergency_contacts_section(self, profile):
        """Create emergency contacts section."""
        elements = []
        
        elements.append(create_section_header("CONTACTO(S)"))
        
        if profile.emergency_contacts.exists():
            for contact in profile.emergency_contacts.all():
                first_name = getattr(contact, 'first_name', '') or ''
                last_name = getattr(contact, 'last_name', '') or ''
                name = f"{first_name} {last_name}".strip()
                if hasattr(contact, 'second_last_name') and contact.second_last_name:
                    name += f" {contact.second_last_name}"
                
                relationship = "N/A"
                if hasattr(contact, 'RELATIONSHIP_CHOICES') and hasattr(contact, 'relationship'):
                    relationship = dict(contact.RELATIONSHIP_CHOICES).get(contact.relationship, "N/A")
                
                address = "N/A"
                if contact.domicile:
                    try:
                        address = str(contact.domicile)
                    except:
                        address = "N/A"
                
                lives_same = "Sí" if getattr(contact, 'lives_at_same_address', False) else "No"
                phone = getattr(contact, 'phone_number', 'N/A') or 'N/A'
                email = getattr(contact, 'email', 'N/A') or 'N/A'
                
                # Create a more structured contact display to prevent long lines
                if(lives_same == "Sí"):
                    contact_info = [
                        f"<b>Nombre:</b> {name} ({relationship})",
                        f"<b>Teléfono:</b> {phone},  <b>Email:</b> {email},  <b>Mismo domicilio:</b> {lives_same}",
                    ]
                else:
                    contact_info = [
                        f"<b>Nombre:</b> {name} ({relationship})",
                        f"<b>Teléfono:</b> {phone},  <b>Email:</b> {email},  <b>Mismo domicilio:</b> {lives_same}",
                        f"<b>Dirección:</b> {address}"
                    ]
                
                for info_line in contact_info:
                    elements.append(Paragraph(info_line, self.normal_style))
                elements.append(Spacer(1, 6))  # Add space between contacts
        else:
            elements.append(Paragraph("N/A", self.normal_style))
        
        elements.append(Spacer(1, 12))
        
        return elements
    
    def create_diagnostic_evaluation_section(self, data_collector):
        """Create diagnostic evaluation section."""
        elements = [create_section_header("EVALUACIÓN DIAGNÓSTICA")]
        
        diagnostic_data = data_collector.get_evaluacion_diagnostica_data()
        
        # First table: Academic skills (Lectura to Resta)
        academic_skills = {
            "Lectura": ["Describe el nivel de lectura del/la candidato/a", "Lectura"],
            "Escritura": ["Describe el nivel de escritura del/la candidato/a", "Escritura"],
            "Números": ["Describe el conocimiento de números del/la candidato/a", "Números"],
            "Suma": ["Describe el nivel de suma del/la candidato/a", "Suma"],
            "Resta": ["Describe el nivel de resta del/la candidato/a", "Resta"],
        }
        
        # Second table: Life skills
        life_skills = {
            "Manejo de Dinero": ["Describe el nivel de manejo de dinero del/la candidato/a", "Manejo de Dinero"],
            "Cruzar la Calle": ["¿Cruza la calle de manera independiente?", "Cruzar la Calle"],
            "Transporte": ["Describe el nivel de uso de transporte del/la candidato/a", "Transporte"],
            "Comunicación": ["Describe como se comunica el/la candidato/a", "Comunicación"],
        }
        
        # Build table data for both tables
        table_data_1 = [["Habilidad", "Diagnóstico"]]
        for skill, questions in academic_skills.items():
            response = next((diagnostic_data[q] for q in questions if q in diagnostic_data), "No especificado")
            table_data_1.append([skill, response])
        
        table_data_2 = [["Habilidad", "Diagnóstico"]]
        for skill, questions in life_skills.items():
            response = next((diagnostic_data[q] for q in questions if q in diagnostic_data), "No especificado")
            table_data_2.append([skill, response])
        
        # Create side-by-side tables
        elements.extend(create_side_by_side_tables(table_data_1, table_data_2, inner_col_widths = [85, 155]))
        elements.append(Spacer(1, 24))
        return [KeepTogether(elements)]
    
    def create_text_sections(self, data_collector):
        """Create text-based sections (support needs, life project, talents)."""
        elements = []
        
        comprehensive_data = data_collector.get_comprehensive_data()
        
        # Support needs section
        elements.append(create_section_header("NECESIDADES DE APOYO"))
        entrevista_data = comprehensive_data.get("entrevista", {}) if comprehensive_data else {}
        
        support_data = [
            ["Pregunta", "Respuesta"],  # Header row
            ["Necesidades de apoyo según la familia", entrevista_data.get("futuro_usuario", "") or ""],
            ["Necesidades de apoyo según el candidato", entrevista_data.get("futuro_hijo", "") or ""],
            ["Necesidades de apoyo según el entrevistador", entrevista_data.get("observaciones_entrevistador", "") or ""],
        ]
        
        support_table = create_basic_table(support_data, col_widths=[200, 300])
        elements.extend(support_table)
        elements.append(Spacer(1, 20))
        
        # Life project section
        elements.append(create_section_header("PROYECTO DE VIDA"))
        proyecto_vida_data = comprehensive_data.get("proyecto_vida", {}) if comprehensive_data else {}
        
        text_data = [
            ["Pregunta", "Respuesta"],  # Header row
            ["Lo más importante para mí", proyecto_vida_data.get("lo_mas_importante", "") or ""],
            ["Me gusta, me tranquiliza, me hace sentir bien, me divierte", proyecto_vida_data.get("me_gusta", "") or ""],
        ]
        
        life_project_table = create_basic_table(text_data, col_widths=[200, 300])
        elements.extend(life_project_table)
        elements.append(Spacer(1, 20))
        
        # Talents section
        elements.append(create_section_header("TALENTOS"))
        talents = proyecto_vida_data.get("talentos", {}).copy() if proyecto_vida_data else {}
        
        # Add family talents observation
        family_talents = entrevista_data.get("talentos_familia") if entrevista_data else None
        if family_talents:
            talents["Talentos según la Familia"] = [family_talents]
        
        if talents:
            talents_data = [["Categoría", "Talentos"]]  # Header row
            for question, answers in talents.items():
                if answers:
                    # Ensure answers is a list and handle None values
                    if isinstance(answers, list):
                        safe_answers = [str(a) for a in answers if a is not None]
                        answer_text = ", ".join(safe_answers)
                    else:
                        answer_text = str(answers) if answers is not None else ""
                    
                    talents_data.append([question, answer_text])
            
            if len(talents_data) > 1:  # More than just header
                talents_table = create_basic_table(talents_data, col_widths=[200, 300])
                elements.extend(talents_table)
            else:
                elements.append(Paragraph("No se registraron talentos con contenido en esta sección.", self.normal_style))
        else:
            elements.append(Paragraph("No se registraron talentos para este usuario.", self.normal_style))
        
        elements.append(Spacer(1, 20))
        
        return elements
    
    def get_habilidades_adaptativas_coloreadas(self, uid, table):
        """Get SIS adaptive skills table with highlighted cells for user scores."""
        
        def normalize_text(text):
            """Normalize text by removing accents and converting to lowercase."""
            if not isinstance(text, str):
                return ""
            text = unicodedata.normalize("NFKD", text)
            text = text.encode("ASCII", "ignore").decode("utf-8")
            text = re.sub(r"\s+", " ", text)
            return text.strip().lower()
        
        section_to_column = {
            "actividades de la vida en el hogar": "vida en el hogar",
            "actividades de la vida en la comunidad": "vida en la comunidad",
            "actividades de aprendizaje a lo largo de la vida": "aprendizaje a lo largo de la vida",
            "empleo": "empleo",
            "actividades de salud y seguridad": "salud y seguridad",
            "actividades sociales": "social",
            "índice de necesidades de apoyo": "índice de necesidades de apoyo"
        }

        try:
            evaluation_summary = get_user_evaluation_summary(usuario_id=uid, query_params={})

            if not evaluation_summary:
                return table, []

            secciones = evaluation_summary.get("detalles_por_seccion", [])
            resumen_global = evaluation_summary.get("resumen_global", {})

            header_row = table[0]
            col_index_map = {}
            for i, col in enumerate(header_row):
                for section, mapped_col in section_to_column.items():
                    if normalize_text(mapped_col) == normalize_text(col):
                        # GUARDA usando la versión NORMALIZADA del mapped_col
                        normalized_key = normalize_text(mapped_col)
                        col_index_map[normalized_key] = i


            percentil_col_indices = [idx for idx, name in enumerate(header_row) if "percentil" in name.lower()]
            percentil_col_idx = percentil_col_indices[1] if len(percentil_col_indices) > 1 else (
                percentil_col_indices[0] if percentil_col_indices else None
            )

            celdas_a_colorear = []

            def redondear_percentil(percentil):
                if percentil is None:
                    return None
                try:
                    percentil_num = float(percentil)
                    standard_percentiles = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]
                    closest = min(standard_percentiles, key=lambda x: abs(x - percentil_num))
                    return closest
                except (ValueError, TypeError):
                    return None

            def encontrar_fila_por_percentil(percentil):
                for row_idx in range(1, len(table)):
                    cell_value = str(table[row_idx][0]).strip()
                    if str(percentil) == cell_value:
                        return row_idx
                return None

            def marcar_celda(row_idx, col_idx):
                celdas_a_colorear.append({
                    "row": row_idx,
                    "col": col_idx,
                    "background": colors.Color(6 / 255, 45 / 255, 85 / 255),
                    "textColor": colors.white,
                    "fontName": "Helvetica-Bold"
                })

            def procesar_seccion(nombre, puntaje, percentil_val):
                if nombre not in col_index_map or not isinstance(puntaje, (int, float)):
                    return
                    
                col_idx = col_index_map[nombre]
                match_encontrado = False
                
                for row_idx in range(2, len(table)):
                    celda = str(table[row_idx][col_idx]).strip()
                    if not celda or celda == "-" or celda == "" or celda.upper() == "N/A":
                        continue
                    
                    try:
                        if evaluar_rango(float(puntaje), celda):
                            marcar_celda(row_idx, col_idx)
                            if percentil_col_idx is not None:
                                marcar_celda(row_idx, percentil_col_idx)
                            match_encontrado = True
                            break
                    except Exception:
                        continue
                
                if not match_encontrado and percentil_val is not None:
                    try:
                        percentil_redondeado = redondear_percentil(percentil_val)
                        fila_idx = encontrar_fila_por_percentil(percentil_redondeado)
                        if fila_idx is not None:
                            marcar_celda(fila_idx, col_idx)
                            if percentil_col_idx is not None:
                                marcar_celda(fila_idx, percentil_col_idx)
                    except Exception:
                        pass

            for seccion in secciones:
                nombre_seccion = seccion["nombre_seccion"].strip().lower()
                # Normalize the section name and find the corresponding column mapping
                nombre_normalizado = normalize_text(nombre_seccion)
                
                # Find the mapped column name for this section
                mapped_column = None
                for section_key, column_name in section_to_column.items():
                    if normalize_text(section_key) == nombre_normalizado:
                        mapped_column = normalize_text(column_name)
                        break
                
                if mapped_column:
                    procesar_seccion(mapped_column, seccion.get("puntuacion_estandar"), seccion.get("percentil"))

            indice = resumen_global.get("indice_de_necesidades_de_apoyo")
            percentil_global = resumen_global.get("percentil")
            # Use the normalized key for the global index
            indice_normalizado = normalize_text("índice de necesidades de apoyo")
            if indice_normalizado in col_index_map:
                procesar_seccion(indice_normalizado, indice, percentil_global)

            return table, celdas_a_colorear
        except Exception as e:
            # print(f"❌ Error general en get_habilidades_adaptativas_coloreadas: {e}")
            return table, []

    def draw_sis_table(self, data, title, celdas_coloreadas=None):
        """Draw SIS table with proper formatting and highlighting."""
        
        if not data or len(data) == 0 or not any(data):
            return []

        styles = getSampleStyleSheet()
        elements = []

        # Insert special structure for Adaptive Skills
        if title == "Habilidades Adaptativas":
            full_title = (
                "Sección 1b. PERFIL DE NECESIDADED DE APOYO"
            )
            title_row = [full_title] + [""] * (len(data[0]) - 1)
            data.insert(0, title_row)

            if len(data) > 2:
                data[1] = [
                    "Per-<br/>centil",
                    "Vida en<br/>el hogar",
                    "Vida en<br/>comunidad",
                    "Aprendizaje<br/>a lo largo<br/>de la vida",
                    "Empleo",
                    "Salud y<br/>seguridad",
                    "Social",
                    "Índice de<br/>necesidades<br/>de apoyo",
                    "Per-<br/>centil",
                ]

        # Process cells
        formatted_data = []
        for i, row in enumerate(data):
            row_cells = []
            for j, cell in enumerate(row):
                if title == "Habilidades Adaptativas" and i == 0:
                    style = ParagraphStyle(
                        name='AdaptiveTitle',
                        parent=styles['Normal'],
                        fontName='Helvetica-Bold',
                        fontSize=14,
                        textColor=colors.white,
                        alignment=1
                    )
                elif title == "Habilidades Adaptativas" and i == 1:
                    style = ParagraphStyle(
                        name='AdaptiveHeader',
                        parent=styles['Normal'],
                        fontName='Helvetica-Bold',
                        fontSize=9,
                        alignment=1
                    )
                else:
                    style = deepcopy(styles['Normal'])
                    style.alignment = 1  # Center alignment for all cells
                    if celdas_coloreadas:
                        for celda in celdas_coloreadas:
                            # Adjust for the title row that was inserted for Habilidades Adaptativas
                            adjusted_row = celda["row"]
                            if title == "Habilidades Adaptativas":
                                adjusted_row += 1
                            
                            if adjusted_row == i and celda["col"] == j:
                                if "textColor" in celda:
                                    style.textColor = celda["textColor"]
                                if "fontName" in celda:
                                    style.fontName = celda["fontName"]
                                break
                
                p = Paragraph(str(cell), style)
                row_cells.append(p)
            formatted_data.append(row_cells)

        # Create table with styling
        page_width = 612
        margins = 50 * 2
        available_width = page_width - margins
        
        if title == "Habilidades Adaptativas":
            col_widths = [available_width * 0.08] + [available_width * 0.13] * 7 + [available_width * 0.08]
        else:
            num_cols = len(formatted_data[0]) if formatted_data else 1
            col_widths = [available_width / num_cols] * num_cols
        
        repeat_rows = 3 if title == "Habilidades Adaptativas" else 1
        table = Table(formatted_data, repeatRows=repeat_rows, colWidths=col_widths)
        
        # Apply table styling
        table_style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.Color(6 / 255, 45 / 255, 85 / 255)),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOX', (0, 0), (-1, -1), 1.5, colors.black),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ])

        if title == "Habilidades Adaptativas":
            table_style.add('SPAN', (0, 0), (-1, 0))
            table_style.add('BACKGROUND', (0, 0), (-1, 0), colors.Color(6 / 255, 45 / 255, 85 / 255))
            table_style.add('TEXTCOLOR', (0, 0), (-1, 0), colors.white)
            table_style.add('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold')
            table_style.add('FONTSIZE', (0, 0), (-1, 0), 10)
            table_style.add('ALIGN', (0, 0), (-1, -1), 'CENTER')
            table_style.add('VALIGN', (0, 0), (-1, 0), 'MIDDLE')
            table_style.add('BACKGROUND', (0, 1), (-1, 1), colors.Color(218 / 255, 233 / 255, 248 / 255 ))
            table_style.add('BACKGROUND', (0, 1), (0, -1), colors.Color(218 / 255, 233 / 255, 248 / 255 ))
            table_style.add('BACKGROUND', (-1, 1), (-1, -1), colors.Color(218 / 255, 233 / 255, 248 / 255 ))

        # Líneas extra (para percentil 50) DAE9F8
        for row_idx, row_data in enumerate(data):
            if row_data and str(row_data[0]).strip() == "50":
                table_style.add('BACKGROUND', (0, row_idx), (-1, row_idx), colors.Color(218 / 255, 233 / 255, 248 / 255 ))

        # Add colored cells
        if celdas_coloreadas:
            for celda in celdas_coloreadas:
                row_idx = celda["row"]
                col_idx = celda["col"]
                
                # Adjust row index if title was inserted for Habilidades Adaptativas
                if title == "Habilidades Adaptativas":
                    row_idx += 1  # Account for the inserted title row
                
                background = celda.get("background", colors.Color(6 / 255, 45 / 255, 85 / 255))
                text_color = celda.get("textColor", colors.white)
                font_name = celda.get("fontName", "Helvetica-Bold")

                table_style.add('BACKGROUND', (col_idx, row_idx), (col_idx, row_idx), background)
                table_style.add('TEXTCOLOR', (col_idx, row_idx), (col_idx, row_idx), text_color)
                table_style.add('FONTNAME', (col_idx, row_idx), (col_idx, row_idx), font_name)

        table.setStyle(table_style)
        
        if title == "Habilidades Adaptativas":
            elements.append(KeepTogether([table]))
            
            # Add legend
            legend_style = ParagraphStyle(
                name="Legend",
                parent=styles['Normal'],
                fontSize=9,
                textColor=colors.black,
                spaceBefore=6
            )
            elements.append(Paragraph(
                "Las celdas resaltadas en azul indican el valor correspondiente al puntaje estándar del usuario o su percentil.",
                legend_style
            ))
            elements.append(Paragraph(
                "American Association on Intellectual and Developmental Disabilities (AAIDD). (2020). Escala de Intensidad de Apoyos - Versión para Adultos (SIS-A). Traducción autorizada. AAIDD. https://www.aaidd.org/sis/sis-a",
                legend_style
            ))
        else:
            elements.append(table)

        elements.append(Spacer(1, 12))
        return elements

    def create_sis_summary_table(self, uid):
        """Create SIS summary table with section scores and percentiles."""
        try:
            evaluation_summary = get_user_evaluation_summary(usuario_id=uid, query_params={})
            
            if not evaluation_summary:
                return []
            
            elements = []
            elements.append(create_section_header("RESUMEN DE PUNTUACIONES SIS"))
            
            # Create paragraph style for section names that allows wrapping
            section_style = ParagraphStyle(
                "SectionNameStyle",
                fontSize=10,
                textColor=colors.black,
                fontName="Helvetica",
                wordWrap='LTR',
                splitLongWords=True,
                alignment=0  # Left alignment
            )

            header_style = ParagraphStyle(
                "HeaderStyle",
                fontSize=10,
                textColor=colors.black,
                fontName="Helvetica-Bold",
                wordWrap='LTR',
                splitLongWords=True,
                alignment=1 # Center alignment
            )

            headers = [
                Paragraph("Sección", header_style),
                Paragraph("Puntuación Directa", header_style),
                Paragraph("Puntuación Estándar", header_style),
                Paragraph("Percentil", header_style)
            ]
            
            # Build table data with headers
            table_data = [headers]
            
            secciones = evaluation_summary.get("detalles_por_seccion", [])
            resumen_global = evaluation_summary.get("resumen_global", {})
            for seccion in secciones:
                if seccion.get("tiene_puntuacion", False):
                    # Wrap the section name in a Paragraph for text wrapping
                    section_name = Paragraph(seccion.get("nombre_seccion", ""), section_style)
                    
                    table_data.append([
                        section_name,
                        seccion.get("total_general", ""),
                        str(seccion.get("puntuacion_estandar", "")),
                        str(seccion.get("percentil", ""))
                    ])
            
            table_data.append(["Total", "", resumen_global.get("total_general", ""), str(resumen_global.get("percentil", ""))])
            table_data.append(["Índice de Necesidades de Apoyo", resumen_global.get("indice_de_necesidades_de_apoyo", ""), "", ""])

            # Create and style the table
            summary_table = Table(table_data, colWidths=[260, 80, 80, 80])
            summary_table.setStyle(TableStyle([
                # Grid and borders
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),

                # Body styling
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                ('ALIGN', (0, 1), (0, -1), 'LEFT'),  # Section names left-aligned
                ('ALIGN', (1, 1), (-1, -1), 'CENTER'),  # Scores centered
                ('FONTNAME', (0, -2), (-1, -1), 'Helvetica-Bold'),
                ('LINEABOVE', (0, -2), (-1, -2), 2, colors.black),
                ('SPAN', (1, -1), (3, -1)),

                # Padding
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                
                # Alternating row colors for better readability
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.whitesmoke]),
            ]))
            
            elements.append(summary_table)
            # elements.append(Spacer(1, 12))
            
            return elements
            
        except Exception as e:
            # Return empty list if there's an error
            return []

    def create_sis_sections(self, data_collector, profile):
        """Create SIS-related sections."""
        elements = []
        
        # Page break for SIS section - ensure it starts on a fresh page
        elements.append(PageBreak())
        
        # SIS header with logos
        sis_title = Paragraph(
            "<b><font size=16>ESCALA DE INTENSIDAD DE APOYOS (SIS)</font></b>", 
            self.title_style
        )
        
        # Try to load SIS logos
        import os
        from django.conf import settings
        
        # Use BASE_DIR to get the actual static files during development
        static_dir = os.path.join(settings.BASE_DIR, "static", "logos")
        logo_sis_path = os.path.join(static_dir, "SISadultos.png")
        
        logo_ceil = Image(logo_sis_path, width=160, height=48) if os.path.exists(logo_sis_path) else Paragraph("", self.normal_style)
        
        sis_header_row = [[sis_title, logo_ceil]]
        sis_header = Table(sis_header_row, colWidths=[260, 260])
        sis_header.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (0, 0), 'CENTER'),
            ('ALIGN', (1, 0), (1, 0), 'CENTER'),
            ('ALIGN', (2, 0), (2, 0), 'CENTER'),
        ]))
        elements.append(sis_header)
        elements.append(Spacer(1, 24))
        
        # Add the missing SIS Adaptive Skills table
        sis_table = deepcopy(SIS_TEMPLATE)
        
        if "Habilidades Adaptativas - Tabla de resultados SIS" in sis_table:
            # Get the colored table with user's scores highlighted
            updated_table, celdas_coloreadas = self.get_habilidades_adaptativas_coloreadas(
                profile.user.id, 
                sis_table["Habilidades Adaptativas - Tabla de resultados SIS"]
            )
            
            # Use the internal draw_sis_table function to render it properly
            sis_table_elements = self.draw_sis_table(updated_table, "Habilidades Adaptativas", celdas_coloreadas)
            
            # The draw_sis_table function already handles KeepTogether for SIS tables
            elements.extend(sis_table_elements)
        else:
            elements.append(Paragraph("No hay datos de habilidades adaptativas disponibles.", self.normal_style))
        
        elements.append(PageBreak())
        
        # Protection and defense section
        elements.append(create_section_header("PROTECCIÓN Y DEFENSA"))
        protection_data = data_collector.get_sis_protection_defense_data()
        
        if protection_data:
            # Build table
            table_data = [["Actividad", "Puntaje Directo"]]
            for item, score in sorted(protection_data.items(), key=lambda x: x[1], reverse=True):
                if(item == "total"):
                    continue
                table_data.append([item, str(score)])
            
            table_data.append(["Puntuación Total", str(protection_data.get("total", 0))])
            
            protection_table = create_basic_table(table_data, col_widths=[400, 100], center_right_column=True)
            elements.extend(protection_table)
        else:
            elements.append(Paragraph("No hay datos de protección y defensa disponibles.", self.normal_style))
        
        elements.append(Spacer(1, 12))
        
        # Medical and behavioral needs section
        elements.append(create_section_header("NECESIDADES MÉDICAS Y CONDUCTUALES"))
        medical_behavioral_data = data_collector.get_sis_medical_behavioral_data()
        
        # table_data = [
        #     ["Pregunta", "Respuesta"],
        #     ["Puntuación total de la sección 3a", str(medical_behavioral_data.get("medical_total", 0))],
        #     ["¿La puntuación total es mayor a 5?", "SÍ" if medical_behavioral_data.get("medical_greater_than_5", False) else "NO"],
        #     ["¿Hay al menos un '2' para necesidades médicas?", "SÍ" if medical_behavioral_data.get("medical_has_2", False) else "NO"],
        #     ["Puntuación total de la sección 3b", str(medical_behavioral_data.get("behavioral_total", 0))],
        #     ["¿La puntuación es mayor a 5?", "SÍ" if medical_behavioral_data.get("behavioral_greater_than_5", False) else "NO"],
        #     ["¿Hay al menos un '2' para necesidades conductuales?", "SÍ" if medical_behavioral_data.get("behavioral_has_2", False) else "NO"]
        # ]

        medical_table = [
            ["Necesidades de Apoyo Médico"],
            # ["Puntuación total de la sección 3a", str(medical_behavioral_data.get("medical_total", 0))],
            ["¿La puntuación total es mayor a 5?", "SÍ" if medical_behavioral_data.get("medical_greater_than_5", False) else "NO"],
            ["¿Hay al menos un '2'?", "SÍ" if medical_behavioral_data.get("medical_has_2", False) else "NO"],
        ]

        conduct_table = [
            ["Necesidades de Apoyo Conductual"],
            # ["Puntuación total de la sección 3b", str(medical_behavioral_data.get("behavioral_total", 0))],
            ["¿La puntuación total es mayor a 5?", "SÍ" if medical_behavioral_data.get("behavioral_greater_than_5", False) else "NO"],
            ["¿Hay al menos un '2'?", "SÍ" if medical_behavioral_data.get("behavioral_has_2", False) else "NO"]
        ]
        
        # medical_table = create_basic_table(table_data, col_widths=[420, 80], center_right_column=True)
        # elements.extend(medical_table)

        elements.extend(create_side_by_side_tables(medical_table, conduct_table, inner_col_widths = [160, 80]))
        elements.append(Spacer(1, 12))
        
        elements.extend(self.create_sis_summary_table(profile.user.id))

        return elements
    
    def generate(self, uid):
        """Generate the complete Ficha Técnica report."""
        # Get profile and data collector
        profile = self.get_profile(uid)
        data_collector = ReportDataCollector(uid)
        
        # Setup document with better margins for content flow
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=letter, 
            leftMargin=50, 
            rightMargin=50, 
            topMargin=50, 
            bottomMargin=50,
            allowSplitting=1,  # Allow content to split across pages
            showBoundary=0     # Don't show page boundaries
        )
        
        elements = []
        
        # Build report sections
        elements.extend(self.create_header_section(profile))
        elements.extend(self.create_personal_info_section(profile))
        elements.extend(self.create_emergency_contacts_section(profile))
        elements.extend(self.create_diagnostic_evaluation_section(data_collector))
        elements.extend(self.create_text_sections(data_collector))
        elements.extend(self.create_sis_sections(data_collector, profile))
        
        # Build document
        doc.build(elements)
        buffer.seek(0)
        
        # Create response
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="ficha_tecnica_{uid}.pdf"'
        
        return response