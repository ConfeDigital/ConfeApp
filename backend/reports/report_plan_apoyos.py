"""
Modern Plan de Apoyos report generator with contemporary design.
Handles the complete generation of support plan reports with enhanced styling,
more compact layout, and better pagination behavior. Emojis removed (unsupported)
and replaced with small Drawings or plain text labels for consistent rendering.
"""
from io import BytesIO
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, Image, Frame, PageTemplate, Flowable
)
from reportlab.lib.units import inch, cm, mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.graphics.shapes import Drawing, Rect, Circle, Line, Path
from reportlab.graphics import renderPDF
from candidatos.models import UserProfile, SISAidCandidateHistory, TAidCandidateHistory
from collections import defaultdict
from datetime import datetime
from .report_utils import draw_logo_header

class ModernColors:
    """Modern color palette for the report."""
    PRIMARY = colors.Color(0.067, 0.267, 0.506)  # #114481
    SECONDARY = colors.Color(0.396, 0.776, 0.875)  # #65C6DF
    ACCENT = colors.Color(0.133, 0.804, 0.596)  # #22CD98

    SUCCESS = colors.Color(0.133, 0.804, 0.596)  # green
    WARNING = colors.Color(1.0, 0.647, 0.0)  # orange
    ERROR = colors.Color(0.925, 0.341, 0.341)  # red

    DARK_GRAY = colors.Color(0.2, 0.2, 0.2)
    MEDIUM_GRAY = colors.Color(0.4, 0.4, 0.4)
    LIGHT_GRAY = colors.Color(0.95, 0.95, 0.95)
    WHITE = colors.white

    SECTION_BG = colors.Color(0.98, 0.99, 1.0)
    TABLE_HEADER_BG = colors.Color(0.067, 0.329, 0.847, alpha=0.95)
    TABLE_ROW_ALT = colors.Color(0.98, 0.99, 1.0)

    SIS = colors.Color(0.157, 0.227, 0.408)

class TinySpacer(Flowable):
    """A very small spacer to use inside KeepTogether if needed."""
    def __init__(self, height=2):
        Flowable.__init__(self)
        self.height = height

    def wrap(self, availWidth, availHeight):
        return (availWidth, self.height)

    def draw(self):
        return


class PlanApoyosReport:
    """Modern generator for Plan de Apoyos reports (compact, better pagination)."""

    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.colors = ModernColors()
        self.setup_custom_styles()

    def setup_custom_styles(self):
        """Setup compact, modern custom paragraph styles (smaller and tighter)."""

        # Main title style — reduced size for compactness
        self.styles.add(ParagraphStyle(
            name='ModernTitle',
            parent=self.styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=20,
            textColor=self.colors.PRIMARY,
            spaceAfter=12,
            spaceBefore=8,
            alignment=TA_CENTER,
            leading=22
        ))

        # Subtitle
        self.styles.add(ParagraphStyle(
            name='Subtitle',
            parent=self.styles['Normal'],
            fontName='Helvetica',
            fontSize=11,
            textColor=self.colors.MEDIUM_GRAY,
            spaceAfter=10,
            alignment=TA_CENTER,
            leading=14
        ))

        # Section headers (compact)
        self.styles.add(ParagraphStyle(
            name='ModernSectionHeader',
            parent=self.styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=13,
            textColor=self.colors.PRIMARY,
            spaceAfter=6,
            spaceBefore=12,
            leading=16
        ))

        # Subsection headers
        self.styles.add(ParagraphStyle(
            name='ModernSubsectionHeader',
            parent=self.styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            textColor=self.colors.DARK_GRAY,
            spaceAfter=4,
            spaceBefore=8,
            leftIndent=8,
            leading=13
        ))

        # Card content style (smaller)
        self.styles.add(ParagraphStyle(
            name='CardContent',
            parent=self.styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            textColor=self.colors.DARK_GRAY,
            spaceAfter=6,
            leading=12,
            alignment=TA_LEFT
        ))

        # Info box
        self.styles.add(ParagraphStyle(
            name='InfoBox',
            parent=self.styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            textColor=self.colors.DARK_GRAY,
            spaceAfter=8,
            spaceBefore=6,
            leftIndent=8,
            rightIndent=8,
            borderWidth=0.5,
            borderColor=self.colors.LIGHT_GRAY,
            borderPadding=8,
            backColor=self.colors.SECTION_BG,
            leading=12
        ))

        # Small normal paragraph
        self.styles.add(ParagraphStyle(
            name='Small',
            parent=self.styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=self.colors.DARK_GRAY
        ))

        # Footer (even smaller)
        self.styles.add(ParagraphStyle(
            name='FooterSmall',
            parent=self.styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=8,
            leading=10,
            alignment=TA_CENTER,
            textColor=self.colors.MEDIUM_GRAY
        ))

    def create_header_graphic(self, width=6 * inch, height=0.25 * inch):
        """Create a small, compact header graphic using gradient-like rectangles."""
        d = Drawing(width, height)
        gradient_steps = 10
        step_width = width / gradient_steps
        for i in range(gradient_steps):
            alpha = 0.85 - (i * (0.75 / gradient_steps))
            if alpha < 0.05:
                alpha = 0.05
            color = colors.Color(self.colors.PRIMARY.red,
                                 self.colors.PRIMARY.green,
                                 self.colors.PRIMARY.blue,
                                 alpha=alpha)
            rect = Rect(i * step_width, 0, step_width + 0.5, height)
            rect.fillColor = color
            rect.strokeColor = None
            d.add(rect)
        return d

    def create_status_indicator(self, status, size=10):
        """
        Return a Drawing with a color + shape pattern for status.
        - 'funciono'    -> filled circle
        - 'intentando'  -> circle with diagonal line
        - else          -> hollow circle with X
        """
        d = Drawing(size, size)
        cx, cy, r = size / 2, size / 2, size / 2 - 1  # center + radius
        circle = Circle(cx, cy, r)
    
        if status == 'funciono':
            circle.fillColor = self.colors.SUCCESS
            circle.strokeColor = self.colors.SUCCESS
    
        elif status == 'intentando':
            circle.fillColor = None
            circle.strokeColor = self.colors.WARNING
            d.add(circle)
            # diagonal line
            d.add(Line(cx - r, cy - r, cx + r, cy + r, strokeColor=self.colors.WARNING, strokeWidth=1.2))
            return d
    
        else:  # no funciono
            circle.fillColor = None
            circle.strokeColor = self.colors.ERROR
            d.add(circle)
            # X mark
            d.add(Line(cx - r, cy - r, cx + r, cy + r, strokeColor=self.colors.ERROR, strokeWidth=1.2))
            d.add(Line(cx - r, cy + r, cx + r, cy - r, strokeColor=self.colors.ERROR, strokeWidth=1.2))
            return d
    
        d.add(circle)
        return d

    def create_check_indicator(self, true_val):
        """Return a small indicator: green circle with check if True, gray with cross if False."""
        d = Drawing(12, 12)
        radius = 7
        center = 6

        circle = Circle(center, center, radius)
        circle.strokeColor = None

        if true_val:
            circle.fillColor = self.colors.SECONDARY
            d.add(circle)
            # Draw a check mark
            check = Path()
            check.moveTo(center - 3, center)       # start left of center
            check.lineTo(center - 1, center - 2)   # down
            check.lineTo(center + 3, center + 2)   # up right
            check.strokeColor = colors.white
            check.strokeWidth = 1.5
            d.add(check)
        else:
            circle.fillColor = colors.Color(0.8, 0.8, 0.8)
            d.add(circle)
            # draw small cross line
            l1 = Line(center - 3, center - 3, center + 3, center + 3)
            l2 = Line(center - 3, center + 3, center + 3, center - 3)
            l1.strokeColor = colors.white
            l2.strokeColor = colors.white
            l1.strokeWidth = 1
            l2.strokeWidth = 1
            d.add(l1)
            d.add(l2)

        return d

    def get_profile(self, uid):
        """Get user profile; return None if not found (caller will handle)."""
        try:
            return UserProfile.objects.get(user__id=uid)
        except UserProfile.DoesNotExist:
            return None

    def get_sis_aids(self, uid):
        """Get SIS aids for the user."""
        return SISAidCandidateHistory.objects.filter(
            candidate__user__id=uid
        ).select_related('aid', 'candidate').order_by('seccion', 'item', 'subitem')

    def get_technical_aids(self, uid):
        """Get technical aids for the user."""
        return TAidCandidateHistory.objects.filter(
            candidate__user__id=uid
        ).select_related('aid', 'candidate').order_by('start_date')

    def get_status_text(self, status):
        """Convert status code to readable text (no emojis)."""
        status_map = {
            'funciono': 'Exitoso',
            'no_funciono': 'No efectivo',
            'intentando': 'Por evaluar'
        }
        return status_map.get(status, 'Sin estado')

    def get_status_color(self, status):
        color_map = {
            'funciono': self.colors.SUCCESS,
            'no_funciono': self.colors.ERROR,
            'intentando': self.colors.WARNING
        }
        return color_map.get(status, self.colors.DARK_GRAY)

    def create_summary_cards(self, sis_aids, technical_aids):
        """Create compact summary table. Keep it tight and compact."""
        story = []

        sis_active = len([aid for aid in sis_aids if getattr(aid, 'is_active', False)])
        sis_total = len(sis_aids)
        sis_success = len([aid for aid in sis_aids if getattr(aid, 'is_successful', None) == 'funciono'])

        tech_active = len([aid for aid in technical_aids if getattr(aid, 'is_active', False)])
        tech_total = len(technical_aids)
        tech_success = len([aid for aid in technical_aids if getattr(aid, 'is_successful', None) == 'funciono'])

        summary_data = [
            ['Métrica', 'Apoyos SIS', 'Apoyos Técnicos', 'Total'],
            ['Activos', str(sis_active), str(tech_active), str(sis_active + tech_active)],
            ['Totales', str(sis_total), str(tech_total), str(sis_total + tech_total)],
            ['Exitosos', str(sis_success), str(tech_success), str(sis_success + tech_success)],
            ['Tasa de Éxito',
             f'{(sis_success / sis_total * 100):.0f}%' if sis_total > 0 else '0%',
             f'{(tech_success / tech_total * 100):.0f}%' if tech_total > 0 else '0%',
             f'{((sis_success + tech_success) / (sis_total + tech_total) * 100):.0f}%' if (sis_total + tech_total) > 0 else '0%'
             ]
        ]

        # Slightly smaller columns to fit more compactly
        table = Table(summary_data, colWidths=[1.6 * inch, 1.1 * inch, 1.1 * inch, 1.0 * inch], repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.colors.PRIMARY),
            ('TEXTCOLOR', (0, 0), (-1, 0), self.colors.WHITE),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),

            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('TEXTCOLOR', (0, 1), (-1, -1), self.colors.DARK_GRAY),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            ('ALIGN', (0, 1), (0, -1), 'LEFT'),

            ('GRID', (0, 0), (-1, -1), 0.4, self.colors.LIGHT_GRAY),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))

        story.append(table)
        story.append(Spacer(1, 12))
        return story

    def create_modern_sis_section(self, sis_aids):
        """Compact SIS aids section with better pagination behavior."""
        story = []

        if not sis_aids:
            no_data_content = "<i>No hay apoyos SIS registrados en el sistema</i>"
            story.append(Paragraph(no_data_content, self.styles['InfoBox']))
            return story

        grouped_aids = defaultdict(lambda: defaultdict(list))
        for aid in sis_aids:
            seccion = aid.seccion or "Sección no especificada"
            item = aid.item or "Item no especificado"
            grouped_aids[seccion][item].append(aid)

        section_count = 0
        for seccion, items in grouped_aids.items():
            section_count += 1
            section_header = f"{section_count}. {seccion}"
            # We'll keep header and first rows of the table together to avoid a header being orphaned
            section_flow = [Paragraph(section_header, self.styles['ModernSectionHeader'])]

            for item, subitems in items.items():
                item_header = f"{item}"
                section_flow.append(Paragraph(item_header, self.styles['ModernSubsectionHeader']))

                table_data = [['SubItem', 'Apoyo Específico', 'Efectividad', 'Activo', 'Observaciones']]

                for subitem in subitems:
                    status_text = self.get_status_text(subitem.is_successful)
                    active_bool = bool(getattr(subitem, 'is_active', False))
                    subitem_text = subitem.subitem or "Sin SubItem"
                    aid_text = subitem.aid.descripcion or "Sin descripción específica"

                    comments = subitem.comments or "Sin observaciones registradas"
                    if len(comments) > 140:
                        comments = comments[:137] + "..."

                    # We'll put a small colored circle drawing in the 'Estado' cell
                    status_draw = self.create_status_indicator(subitem.is_successful, size=14)
                    active_draw = self.create_check_indicator(active_bool)

                    table_data.append([
                        Paragraph(subitem_text, self.styles['Small']),
                        Paragraph(aid_text, self.styles['Small']),  # <-- wrap text here
                        status_draw,
                        active_draw,
                        Paragraph(comments, self.styles['Small']),  # <-- wrap text here
                    ])

                if len(table_data) > 1:
                    # compact column widths
                    table = Table(table_data, colWidths=[1.6 * inch, 2.1 * inch, 0.9 * inch, 0.6 * inch, 2.0 * inch],
                                  repeatRows=1)
                    table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), self.colors.SIS),
                        ('TEXTCOLOR', (0, 0), (-1, 0), self.colors.WHITE),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, 0), 9),
                        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),

                        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                        ('FONTSIZE', (0, 1), (-1, -1), 8.5),
                        ('TEXTCOLOR', (0, 1), (-1, -1), self.colors.DARK_GRAY),
                        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
                        ('ALIGN', (1, 1), (3, -1), 'CENTER'),
                        ('ALIGN', (4, 1), (4, -1), 'LEFT'),

                        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                        ('LEFTPADDING', (0, 0), (-1, -1), 4),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                        ('TOPPADDING', (0, 0), (-1, -1), 6),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),

                        ('GRID', (0, 1), (-1, -1), 0.35, self.colors.LIGHT_GRAY),
                    ]))

                    # Alternating row color
                    for i in range(1, len(table_data)):
                        if i % 2 == 0:
                            table.setStyle(TableStyle([('BACKGROUND', (0, i), (-1, i), self.colors.TABLE_ROW_ALT)]))

                        # color status text column if it were text; here we keep drawing in place

                    # Keep header + table together to avoid header orphaning.
                    section_flow.append(KeepTogether([table]))
                    section_flow.append(Spacer(1, 8))

            # Append section block (kept together where reasonable)
            story.extend(section_flow)
            story.append(Spacer(1, 6))

        return story

    def create_modern_technical_section(self, technical_aids):
        """Compact technical aids section with kept-together headers and repeatable table headers."""
        story = []

        if not technical_aids:
            story.append(Paragraph("No hay apoyos técnicos registrados.", self.styles['InfoBox']))
            return story

        active_aids = [aid for aid in technical_aids if getattr(aid, 'is_active', False)]
        inactive_aids = [aid for aid in technical_aids if not getattr(aid, 'is_active', False)]

        if active_aids:
            header_text = f"Apoyos Técnicos Activos ({len(active_aids)})"
            header_par = Paragraph(header_text, self.styles['ModernSectionHeader'])

            table_data = [['Apoyo Técnico', 'Grupos', 'Efectividad', 'Inicio', 'Duración', 'Observaciones']]
            for aid in active_aids:
                aid_name = aid.aid.name if getattr(aid, 'aid', None) else "Apoyo sin especificar"
                status_text = self.get_status_text(aid.is_successful)
                start_date = aid.start_date.strftime('%d/%m/%Y') if getattr(aid, 'start_date', None) else "No registrado"
                impediments = aid.aid.impediments.all()
                impediments_ist = ", ".join(impediment.name for impediment in impediments) if impediments else "Sin discapacidad"

                if getattr(aid, 'start_date', None):
                    duration_days = (datetime.now().date() - aid.start_date).days
                    if duration_days < 30:
                        duration = f"{duration_days} días"
                    else:
                        duration_months = duration_days // 30
                        duration = f"{duration_months} mes{'es' if duration_months > 1 else ''}"
                else:
                    duration = "N/A"

                comments = aid.comments or "Sin observaciones"
                if len(comments) > 140:
                    comments = comments[:137] + "..."

                status_draw = self.create_status_indicator(aid.is_successful, size=14)
                table_data.append([Paragraph(aid_name, self.styles['Small']), Paragraph(impediments_ist, self.styles['Small']), status_draw, start_date, duration, Paragraph(comments, self.styles['Small'])])

            table = Table(table_data, colWidths=[1.6 * inch, 1.6 * inch, 0.6 * inch, 0.9 * inch, 0.9 * inch, 1.7 * inch],
                          repeatRows=1)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), self.colors.SUCCESS),
                ('TEXTCOLOR', (0, 0), (-1, 0), self.colors.WHITE),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('ALIGN', (1, 1), (4, -1), 'CENTER'),
                ('VALIGN', (0, 1), (-1, -1), 'MIDDLE'),

                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 8.5),
                ('TEXTCOLOR', (0, 1), (-1, -1), self.colors.DARK_GRAY),

                ('LEFTPADDING', (0, 0), (-1, -1), 5),
                ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),

                ('GRID', (0, 1), (-1, -1), 0.35, self.colors.LIGHT_GRAY),
            ]))

            # Keep header + table together
            story.append(KeepTogether([header_par, table]))
            story.append(Spacer(1, 8))

        if inactive_aids:
            header_text = f"Historial de Apoyos Técnicos ({len(inactive_aids)})"
            header_par = Paragraph(header_text, self.styles['ModernSectionHeader'])

            table_data = [['Apoyo Técnico', 'Grupos', 'Resultado', 'Periodo', 'Motivo de Finalización']]
            for aid in inactive_aids:
                aid_name = aid.aid.name if getattr(aid, 'aid', None) else "Apoyo sin especificar"
                impediments = aid.aid.impediments.all()
                impediments_ist = ", ".join(impediment.name for impediment in impediments) if impediments else "Sin discapacidad"
                status_text = self.get_status_text(aid.is_successful)
                start_date = aid.start_date.strftime('%d/%m/%Y') if getattr(aid, 'start_date', None) else "N/A"
                end_date = aid.end_date.strftime('%d/%m/%Y') if getattr(aid, 'end_date', None) else "N/A"
                period = f"{start_date} - {end_date}"
                reason = aid.comments or ("Objetivo alcanzado" if aid.is_successful == 'funciono' else
                                          "No se obtuvieron resultados" if aid.is_successful == 'no_funciono' else "Sin especificar")
                if len(reason) > 120:
                    reason = reason[:117] + "..."
                status_draw = self.create_status_indicator(aid.is_successful, size=14)
                table_data.append([Paragraph(aid_name, self.styles['Small']), Paragraph(impediments_ist, self.styles['Small']), status_draw, period, Paragraph(reason, self.styles['Small'])])

            table = Table(table_data, colWidths=[1.6 * inch, 1.6 * inch, 0.8 * inch, 1.5 * inch, 1.8 * inch], repeatRows=1)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), self.colors.MEDIUM_GRAY),
                ('TEXTCOLOR', (0, 0), (-1, 0), self.colors.WHITE),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('ALIGN', (1, 1), (3, -1), 'CENTER'),
                ('VALIGN', (0, 1), (-1, -1), 'MIDDLE'),

                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 8.5),
                ('TEXTCOLOR', (0, 1), (-1, -1), self.colors.DARK_GRAY),

                ('GRID', (0, 1), (-1, -1), 0.35, self.colors.LIGHT_GRAY),
                ('LEFTPADDING', (0, 0), (-1, -1), 5),
                ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))

            story.append(KeepTogether([header_par, table]))

        return story

    def create_modern_legend(self):
        """Compact legend using colored circles for effectiveness."""
        story = []

        # Create a simple table: 2 columns per row (circle + label)
        data = []

        # Status circles
        data.append([
            self.create_status_indicator('funciono', size=14),
            Paragraph("Exitoso: apoyo demostrado como efectivo", self.styles['Small'])
        ])
        data.append([
            self.create_status_indicator('intentando', size=14),
            Paragraph("Por evaluar: apoyo en prueba y seguimiento", self.styles['Small'])
        ])
        data.append([
            self.create_status_indicator('no_funciono', size=14),
            Paragraph("No efectivo: no ha entregado resultados esperados", self.styles['Small'])
        ])
        data.append([
            self.create_check_indicator(True),
            Paragraph("Apoyo en uso", self.styles['Small'])
        ])
        data.append([
            self.create_check_indicator(False),
            Paragraph("Apoyo no en uso", self.styles['Small'])
        ])

        # Build table
        table = Table(data, colWidths=[0.25*inch, 5.5*inch])
        table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))

        # Optional: add a small heading
        story.append(Paragraph("<b>Guía de Interpretación</b>", self.styles['InfoBox']))
        story.append(Spacer(1, 4))
        story.append(table)
        story.append(Spacer(1, 6))

        return story


    def generate_recommendations(self, sis_aids, technical_aids):
        """Generate dynamic recommendations (kept compact)."""
        recommendations = []
        sis_active_aids = [aid for aid in sis_aids if getattr(aid, 'is_active', False)]
        tech_active_aids = [aid for aid in technical_aids if getattr(aid, 'is_active', False)]

        sis_active_count = len(sis_active_aids)
        sis_active_success = len([a for a in sis_active_aids if a.is_successful == 'funciono'])
        sis_active_in_progress = len([a for a in sis_active_aids if a.is_successful == 'intentando'])

        tech_active_count = len(tech_active_aids)
        tech_active_success = len([a for a in tech_active_aids if a.is_successful == 'funciono'])
        tech_active_in_progress = len([a for a in tech_active_aids if a.is_successful == 'intentando'])

        recommendations.append("<b>Análisis del Plan Activo:</b><br/>")

        total_active_aids = sis_active_count + tech_active_count
        total_active_success = sis_active_success + tech_active_success
        total_active_in_progress = sis_active_in_progress + tech_active_in_progress

        if total_active_aids == 0:
            recommendations.append(
                "<b>Sin Apoyos Activos:</b> No hay apoyos en implementación. Recomendar evaluación para definir intervenciones.<br/><br/>"
            )
            return "".join(recommendations)

        active_success_rate = (total_active_success / total_active_aids) * 100
        in_progress_rate = (total_active_in_progress / total_active_aids) * 100

        if active_success_rate >= 70:
            recommendations.append(
                f"<b>Plan Altamente Efectivo:</b> Tasa de éxito {active_success_rate:.0f}%. Mantener implementación actual.<br/><br/>"
            )
        elif active_success_rate >= 50:
            recommendations.append(
                f"<b>Plan Moderadamente Efectivo:</b> Tasa de éxito {active_success_rate:.0f}%. Revisar apoyos menos efectivos.<br/><br/>"
            )
        else:
            recommendations.append(
                f"<b>Plan Requiere Atención:</b> Tasa de éxito {active_success_rate:.0f}%. Evaluación urgente recomendada.<br/><br/>"
            )

        if total_active_in_progress > 0:
            recommendations.append(
                f"<b>Apoyos por Evaluar:</b> {total_active_in_progress} apoyos ({in_progress_rate:.0f}%). Seguimiento cercano recomendado.<br/><br/>"
            )

        if total_active_aids > 10:
            recommendations.append("<b>Gestión de Carga:</b> Priorizar apoyos más efectivos para evitar sobrecarga.<br/><br/>")
        elif total_active_aids < 3:
            recommendations.append("<b>Oportunidad de Expansión:</b> Considerar si se requieren apoyos adicionales.<br/><br/>")

        if sis_active_count > 0:
            sis_rate = (sis_active_success / sis_active_count * 100) if sis_active_count else 0
            recommendations.append(f"<b>Apoyos SIS Activos:</b> {sis_active_count} (Efectividad {sis_rate:.0f}%).<br/>")
            if sis_rate < 50:
                recommendations.append("Revisión de implementación SIS recomendada.<br/><br/>")
            else:
                recommendations.append("Apoyos SIS muestran rendimiento adecuado.<br/><br/>")

        if tech_active_count > 0:
            tech_rate = (tech_active_success / tech_active_count * 100) if tech_active_count else 0
            recommendations.append(f"<b>Apoyos Técnicos Activos:</b> {tech_active_count} (Efectividad {tech_rate:.0f}%).<br/>")
            if tech_rate < 50:
                recommendations.append("Evaluación técnica especializada recomendada.<br/><br/>")
            else:
                recommendations.append("Apoyos técnicos demuestran efectividad.<br/><br/>")

        recommendations.extend([
            "<b>Recomendaciones:</b><br/>",
            "• Seguimiento regular de apoyos por evaluar.<br/>",
            "• Documentar cambios y resultados en comentarios.<br/>",
            "• Mantener comunicación con implementadores.<br/>",
            "• Revisar apoyos no efectivos y ajustar.<br/>",
        ])

        return "".join(recommendations)

    def generate(self, uid):
        """Generate the compact modern Plan de Apoyos report as a PDF HttpResponse."""
        profile = self.get_profile(uid)
        sis_aids = list(self.get_sis_aids(uid))
        technical_aids = list(self.get_technical_aids(uid))

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            topMargin=0.6 * inch,
            bottomMargin=0.6 * inch,
            leftMargin=0.6 * inch,
            rightMargin=0.6 * inch
        )

        story = []

        # Header graphic (compact)
        header_graphic = self.create_header_graphic(width=6.5 * inch, height=0.22 * inch)
        story.append(draw_logo_header())
        story.append(header_graphic)
        story.append(Spacer(1, 8))

        # Title and subtitle
        story.append(Paragraph("Plan Personalizado de Apoyos", self.styles['ModernTitle']))
        story.append(Paragraph("Evaluación Integral y Estrategia de Intervención", self.styles['Subtitle']))
        story.append(Spacer(1, 6))

        # User info box (compact). Handle missing profile gracefully.
        if profile:
            full_name = f"{profile.user.first_name} {profile.user.last_name}"
            if hasattr(profile.user, 'second_last_name') and profile.user.second_last_name:
                full_name += f" {profile.user.second_last_name}"

            current_date = datetime.now()
            user_info_content = f"""
            <b>Información del Usuario</b><br/>
            <b>Nombre:</b> {full_name}<br/>
            <b>Edad:</b> {str(datetime.now().year - profile.birth_date.year) + " años" if profile.birth_date else "N/A"}<br/>
            """
        else:
            current_date = datetime.now()
            user_info_content = f"""
            <b>Información del Usuario</b><br/>
            """

        story.append(Paragraph(user_info_content, self.styles['Subtitle']))
        story.append(Spacer(1, 8))

        story.append(Paragraph(f"<b>Fecha de Generación:</b> {current_date.strftime('%d/%m/%Y %H:%M')}<br/>", self.styles['FooterSmall']))

        # Executive summary (compact)
        story.append(Paragraph("Resumen Ejecutivo", self.styles['ModernSectionHeader']))
        story.extend(self.create_summary_cards(sis_aids, technical_aids))
        story.extend(self.create_modern_legend())

        # Ensure main content starts on a fresh page if necessary
        story.append(PageBreak())

        # SIS Section
        story.append(Paragraph("Sistema de Intensidad de Apoyos (SIS)", self.styles['ModernTitle']))
        sis_intro = ("Esta sección presenta los apoyos identificados mediante el Sistema de Intensidad "
                     "de Apoyos, organizados por áreas y actividades específicas.")
        story.append(Paragraph(sis_intro, self.styles['InfoBox']))
        story.append(Spacer(1, 6))
        sis_content = self.create_modern_sis_section(sis_aids)
        story.extend(sis_content)

        # Technical aids on next page if needed
        story.append(PageBreak())
        story.append(Paragraph("Apoyos Técnicos Especializados", self.styles['ModernTitle']))
        tech_intro = ("Los apoyos técnicos representan intervenciones especializadas basadas en evaluación diagnóstica. "
                      "Incluye apoyos activos y el historial de intervenciones.")
        story.append(Paragraph(tech_intro, self.styles['InfoBox']))
        story.append(Spacer(1, 6))
        technical_content = self.create_modern_technical_section(technical_aids)
        story.extend(technical_content)

        # Recommendations
        story.append(Spacer(1, 10))
        story.append(Paragraph("Observaciones y Recomendaciones", self.styles['ModernSectionHeader']))
        story.append(Spacer(1, 4))
        recommendations = self.generate_recommendations(sis_aids, technical_aids)
        story.append(Paragraph(recommendations, self.styles['InfoBox']))

        story.append(Spacer(1, 10))
        footer_content = ("Este reporte ha sido generado automáticamente por el Sistema de Gestión de Apoyos. "
                          "Para consultas, contacte al equipo de evaluación. Documento confidencial.")
        story.append(Paragraph(footer_content, self.styles['FooterSmall']))

        # Build PDF
        doc.build(story)
        buffer.seek(0)

        # Create HTTP response
        timestamp = current_date.strftime('%Y%m%d_%H%M')
        filename = f'plan_apoyos_compacto_{uid}_{timestamp}.pdf'
        response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
