"""
Cuadro de Habilidades report generator.
Handles the complete generation of skills chart reports.
"""
from io import BytesIO
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Frame, PageTemplate
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from datetime import datetime
from candidatos.models import UserProfile
from .data_collector import ReportDataCollector
from .report_utils import normalize_text
from discapacidad.models import CHItem


class CuadroHabilidadesReport:
    """Generator for Cuadro de Habilidades reports."""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.navy_color = colors.Color(6 / 255, 45 / 255, 85 / 255)
        self.setup_custom_styles()
    
    def setup_custom_styles(self):
        """Setup custom styles for the report."""
        self.left_align_style = ParagraphStyle(
            name='LeftAlign', 
            parent=self.styles['Normal'], 
            alignment=0, 
            fontSize=9
        )
        
        self.support_style = ParagraphStyle(
            name='SupportStyle', 
            parent=self.styles['Normal'], 
            alignment=0, 
            fontSize=8, 
            leading=10
        )
        
        self.signature_style = ParagraphStyle(
            name="SignatureStyle", 
            parent=self.styles['Normal'], 
            alignment=1, 
            fontSize=10
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
    
    def draw_header(self, canvas, doc):
        """Draw the header on each page."""
        width, height = landscape(letter)
        canvas.setFillColor(self.navy_color)
        canvas.setFont("Helvetica-Bold", 16)
        canvas.drawCentredString(width / 2, height - 40, "CUADRO DE HABILIDADES")
        canvas.setFont("Helvetica", 12)
        canvas.drawCentredString(width / 2, height - 60,
                                 "Institución CONFE a Favor de la Persona con Discapacidad Intelectual I.A.P.")
        canvas.drawCentredString(width / 2, height - 75,
                                 "CENTRO ESPECIALIZADO DE INCLUSIÓN LABORAL")
        canvas.setStrokeColor(self.navy_color)
        canvas.line(30, height - 80, width - 30, height - 80)
    
    def create_personal_info_section(self, profile):
        """Create personal information section."""
        # Get profile information
        full_name = f"{profile.user.first_name} {profile.user.last_name}"
        if hasattr(profile.user, 'second_last_name') and profile.user.second_last_name:
            full_name += f" {profile.user.second_last_name}"
        
        birth_date = profile.birth_date.strftime("%d/%m/%Y") if profile.birth_date else "N/A"
        registration_date = profile.registration_date.strftime("%Y-%m-%d") if profile.registration_date else "N/A"
        gender = dict(profile.GENDER_CHOICES).get(profile.gender, "No especificado") if hasattr(profile, 'GENDER_CHOICES') else "No especificado"
        discapacidad = ", ".join([d.name for d in profile.disability.all()]) if profile.disability.exists() else "No especificada"
        stage = dict(profile.STAGE_CHOICES).get(profile.stage, "No especificado") if hasattr(profile, 'STAGE_CHOICES') else "No especificado"
        
        # Build address
        domicilio = "N/A"
        if profile.domicile:
            domicilio = (
                f"{profile.domicile.address_road}, {profile.domicile.address_number}, "
                f"{profile.domicile.address_col}, {profile.domicile.address_municip}, "
                f"{profile.domicile.address_city}, {profile.domicile.address_state}, CP {profile.domicile.address_PC}"
            )
        
        user_info = [
            ["Nombre completo:", full_name, "Género:", gender],
            ["Discapacidad:", discapacidad, "", ""],
            ["Teléfono:", getattr(profile, 'phone_number', 'N/A') or "N/A", "Fecha nacimiento:", birth_date],
            ["Tipo de sangre:", getattr(profile, 'blood_type', 'N/A') or "N/A", "Medicamentos:", ", ".join([m.name for m in profile.medications.all()]) if profile.medications.exists() else "N/A"],
            ["CURP:", getattr(profile, 'curp', 'N/A') or "N/A", "Alergias:", getattr(profile, 'allergies', 'N/A') or "N/A"],
            ["Restricciones de dieta:", getattr(profile, 'dietary_restrictions', 'N/A') or "N/A", "Restricciones físicas:", getattr(profile, 'physical_restrictions', 'N/A') or "N/A"],
            ["Dirección:", domicilio, "", ""],
        ]

        wrapped_user_info = []
        for row in user_info:
            wrapped_row = []
            for i, cell in enumerate(row):
                if isinstance(cell, str) and len(cell) > 50:  # Wrap long text
                    wrapped_row.append(Paragraph(cell, self.normal_style))
                else:
                    wrapped_row.append(cell)
            wrapped_user_info.append(wrapped_row)
        
        user_table = Table(wrapped_user_info, colWidths=[120, 220, 120, 220])
        user_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BACKGROUND', (0, 0), (-1, -1), colors.whitesmoke),
            ('SPAN', (1, 1), (-1, 1)),
            ('SPAN', (1, -1), (-1, -1)),
        ]))
        
        return user_table
    
    def create_skills_table(self, questions, title, responses_data):
        """Create a skills table."""
        col_widths = [225, 60, 65, 55, 320]
        
        data = [[title, "No lo hace", "En proceso", "Lo hace", "Apoyos"]]
        
        # Cache all CHItem objects to avoid repeated queries
        all_ch_items = list(CHItem.objects.all())
        
        for question_original in questions:
            if not isinstance(question_original, str):
                continue
            
            # Normalize the question text for lookup
            question_normalized = normalize_text(question_original)
            
            # Get the parsed response data for the current question
            response_info = responses_data.get(question_original, {})
            
            # Extract 'resultado' and 'aid_text' from the parsed JSON data
            resultado_raw = response_info.get('resultado', '')
            aid_text_from_response = response_info.get('aid_text', '')
            
            # Determine if support text should be shown
            mostrar_apoyo = resultado_raw in ["no_lo_hace", "en_proceso"]
            
            # Set the final aid_text for the 'Apoyos' column
            final_aid_text = ""
            if mostrar_apoyo:
                if aid_text_from_response:
                    final_aid_text = aid_text_from_response
                else:
                    # Fallback to CHItem's aid if aid_text was missing
                    ch_item_obj = next(
                        (item for item in all_ch_items if normalize_text(question_original) in normalize_text(item.name)),
                        None
                    )
                    final_aid_text = ch_item_obj.aid if ch_item_obj and ch_item_obj.aid else "Sin apoyo registrado"
            
            # Create Paragraph for support text only if there's text to show
            columna_apoyos = Paragraph(final_aid_text, self.support_style) if final_aid_text else ""
            
            fila = [
                Paragraph(question_original, self.left_align_style),
                "X" if resultado_raw == "no_lo_hace" else "",
                "X" if resultado_raw == "en_proceso" else "",
                "X" if resultado_raw == "lo_hace" else "",
                columna_apoyos,
            ]
            data.append(fila)
        
        tabla = Table(data, colWidths=col_widths)
        tabla.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (-1, 0), self.navy_color),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (1, 1), (-2, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ]))
        
        return tabla
    
    def generate(self, uid):
        """Generate the complete Cuadro de Habilidades report."""
        # Get profile and data collector
        profile = self.get_profile(uid)
        data_collector = ReportDataCollector(uid)
        
        # Get skills data
        responses_data = data_collector.get_cuadro_habilidades_data()
        
        # Setup document
        buffer = BytesIO()
        width, height = landscape(letter)
        
        left_margin = 30
        right_margin = 30
        top_margin = 70
        bottom_margin = 40
        
        usable_width = width - left_margin - right_margin
        usable_height = height - top_margin - bottom_margin
        
        frame = Frame(left_margin, bottom_margin, usable_width, usable_height, id='normal')
        
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=landscape(letter),
            leftMargin=left_margin, 
            rightMargin=right_margin,
            topMargin=top_margin, 
            bottomMargin=bottom_margin
        )
        doc.addPageTemplates([PageTemplate(id='with-header', frames=frame, onPage=self.draw_header)])
        
        elements = []
        
        # Personal information section
        elements.append(Spacer(1, 40))
        user_table = self.create_personal_info_section(profile)
        elements.append(user_table)
        elements.append(Spacer(1, 40))
        
        # Skills questions
        habilidades_laborales = [
            "Asistencia", "Puntualidad", "Higiene y buena presencia", "Avisa cuando llega",
            "Avisa cuando no va a venir", "Avisa cuando termina actividad", "Sigue 1-2 instrucciones",
            "Respeta autoridad", "Es amable con compañeros", "Respeta reglamento", "Trabaja en equipo",
            "No usa celular en el trabajo", "Si no entendió o se le olvidó, pregunta",
            "Ayuda a compañeros de trabajo", "Atención a clientes amable", "Trabaja aún con distracciones",
            "Concluye la tarea asignada", "Revisa que su tarea esté bien hecha",
            "Clasifica y acomoda correctamente", "Ordena correctamente",
            "Recibe nueva mercancía revisando cantidad y calidad",
            "Hace reposición de productos cuando se le pide", "Hace inventario",
            "Conoce y ejecuta reglas de un probador", "Promueve la venta"
        ]
        
        conducta_adaptativa = [
            "Lectoescritura", "Manejo de dinero", "Comunicación", "Uso de transporte", "Buenos modales",
            "Uso de comunidad", "Guarda distancia correctamente", "Sabe poner límites a agresiones",
            "Sabe negociar", "Toma decisiones importantes en su vida", "Acepta supervisión",
            "Resuelve problemas sencillos", "Maneja correctamente sus emociones", "Se comporta con ética"
        ]
        
        # Create skills tables
        elements.append(self.create_skills_table(habilidades_laborales, "HABILIDADES LABORALES", responses_data))
        elements.append(Spacer(1, 20))
        elements.append(self.create_skills_table(conducta_adaptativa, "CONDUCTA ADAPTATIVA", responses_data))
        
        # Signature section
        elements.append(Spacer(1, 40))
        elements.append(Paragraph("______________________________", self.signature_style))
        elements.append(Paragraph("Responsable 1", self.signature_style))
        elements.append(Spacer(1, 15))
        elements.append(Paragraph("______________________________", self.signature_style))
        elements.append(Paragraph("Responsable 2", self.signature_style))
        
        # Build document
        doc.build(elements)
        buffer.seek(0)
        
        # Create response
        response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
        response['Content-Disposition'] = f'attachment; filename="cuadro_de_habilidades_{uid}.pdf"'
        
        return response