"""
Plan de Apoyos report generator.
Handles the complete generation of support plan reports.
"""
from io import BytesIO
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from candidatos.models import UserProfile, SISAidCandidateHistory, TAidCandidateHistory
from collections import defaultdict


class PlanApoyosReport:
    """Generator for Plan de Apoyos reports."""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
    
    def setup_custom_styles(self):
        """Setup custom paragraph styles."""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            spaceBefore=20,
            textColor=colors.darkblue
        ))
        
        self.styles.add(ParagraphStyle(
            name='SubsectionHeader',
            parent=self.styles['Heading3'],
            fontSize=12,
            spaceAfter=8,
            spaceBefore=12,
            textColor=colors.darkgreen
        ))
    
    def get_profile(self, uid):
        """Get user profile."""
        try:
            return UserProfile.objects.get(user__id=uid)
        except UserProfile.DoesNotExist:
            raise ValueError(f"Profile not found for user ID: {uid}")
    
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
        """Convert status code to readable text."""
        status_map = {
            'funciono': 'Le funcionó',
            'no_funciono': 'No le funcionó',
            'intentando': 'En proceso'
        }
        return status_map.get(status, 'Sin estado')
    
    def get_status_color(self, status):
        """Get color for status."""
        color_map = {
            'funciono': colors.green,
            'no_funciono': colors.red,
            'intentando': colors.orange
        }
        return color_map.get(status, colors.black)
    
    def create_sis_aids_section(self, sis_aids):
        """Create SIS aids section content."""
        story = []
        
        if not sis_aids:
            story.append(Paragraph("No hay apoyos SIS registrados.", self.styles['Normal']))
            return story
        
        # Group by section
        grouped_aids = defaultdict(lambda: defaultdict(list))
        for aid in sis_aids:
            seccion = aid.seccion or "Sin sección"
            item = aid.item or "Sin item"
            grouped_aids[seccion][item].append(aid)
        
        for seccion, items in grouped_aids.items():
            story.append(Paragraph(f"<b>{seccion}</b>", self.styles['SectionHeader']))
            
            for item, subitems in items.items():
                story.append(Paragraph(f"• {item}", self.styles['SubsectionHeader']))
                
                # Create table for subitems
                table_data = [['Subitem', 'Estado', 'Comentarios', 'Activo']]
                
                for subitem in subitems:
                    status_text = self.get_status_text(subitem.is_successful)
                    active_text = "Sí" if subitem.is_active else "No"
                    subitem_text = subitem.subitem or "Sin descripción"
                    comments = subitem.comments[:50] + "..." if subitem.comments and len(subitem.comments) > 50 else (subitem.comments or "Sin comentarios")
                    
                    table_data.append([
                        subitem_text,
                        status_text,
                        comments,
                        active_text
                    ])
                
                if len(table_data) > 1:  # Only create table if there's data
                    table = Table(table_data, colWidths=[2.5*inch, 1*inch, 2*inch, 0.8*inch])
                    table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, 0), 10),
                        ('FONTSIZE', (0, 1), (-1, -1), 8),
                        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                        ('GRID', (0, 0), (-1, -1), 1, colors.black),
                        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ]))
                    
                    # Color code status column
                    for i, subitem in enumerate(subitems, 1):
                        status_color = self.get_status_color(subitem.is_successful)
                        table.setStyle(TableStyle([
                            ('TEXTCOLOR', (1, i), (1, i), status_color),
                        ]))
                    
                    story.append(table)
                    story.append(Spacer(1, 12))
        
        return story
    
    def create_technical_aids_section(self, technical_aids):
        """Create technical aids section content."""
        story = []
        
        if not technical_aids:
            story.append(Paragraph("No hay apoyos técnicos registrados.", self.styles['Normal']))
            return story
        
        # Separate active and inactive aids
        active_aids = [aid for aid in technical_aids if aid.is_active]
        inactive_aids = [aid for aid in technical_aids if not aid.is_active]
        
        # Active aids
        if active_aids:
            story.append(Paragraph(f"<b>Apoyos Activos ({len(active_aids)})</b>", self.styles['SectionHeader']))
            
            table_data = [['Apoyo Técnico', 'Estado', 'Fecha Inicio', 'Comentarios']]
            
            for aid in active_aids:
                aid_name = aid.aid.name if aid.aid else "Apoyo sin nombre"
                status_text = self.get_status_text(aid.is_successful)
                start_date = aid.start_date.strftime('%d/%m/%Y') if aid.start_date else "N/A"
                comments = aid.comments[:60] + "..." if aid.comments and len(aid.comments) > 60 else (aid.comments or "Sin comentarios")
                
                table_data.append([aid_name, status_text, start_date, comments])
            
            table = Table(table_data, colWidths=[2*inch, 1*inch, 1*inch, 2.3*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.lightblue),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            
            # Color code status column
            for i, aid in enumerate(active_aids, 1):
                status_color = self.get_status_color(aid.is_successful)
                table.setStyle(TableStyle([
                    ('TEXTCOLOR', (1, i), (1, i), status_color),
                ]))
            
            story.append(table)
            story.append(Spacer(1, 20))
        
        # Inactive aids
        if inactive_aids:
            story.append(Paragraph(f"<b>Apoyos Inactivos ({len(inactive_aids)})</b>", self.styles['SectionHeader']))
            
            table_data = [['Apoyo Técnico', 'Estado Final', 'Fecha Inicio', 'Fecha Fin', 'Comentarios']]
            
            for aid in inactive_aids:
                aid_name = aid.aid.name if aid.aid else "Apoyo sin nombre"
                status_text = self.get_status_text(aid.is_successful)
                start_date = aid.start_date.strftime('%d/%m/%Y') if aid.start_date else "N/A"
                end_date = aid.end_date.strftime('%d/%m/%Y') if aid.end_date else "N/A"
                comments = aid.comments[:50] + "..." if aid.comments and len(aid.comments) > 50 else (aid.comments or "Sin comentarios")
                
                table_data.append([aid_name, status_text, start_date, end_date, comments])
            
            table = Table(table_data, colWidths=[1.5*inch, 0.8*inch, 0.8*inch, 0.8*inch, 2.4*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            
            # Color code status column
            for i, aid in enumerate(inactive_aids, 1):
                status_color = self.get_status_color(aid.is_successful)
                table.setStyle(TableStyle([
                    ('TEXTCOLOR', (1, i), (1, i), status_color),
                ]))
            
            story.append(table)
        
        return story
    
    def generate(self, uid):
        """Generate the complete Plan de Apoyos report."""
        # Get profile and aids data
        profile = self.get_profile(uid)
        sis_aids = self.get_sis_aids(uid)
        technical_aids = self.get_technical_aids(uid)
        
        # Create PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=1*inch)
        
        # Build story
        story = []
        
        # Title
        story.append(Paragraph("Plan Personalizado de Apoyos", self.styles['CustomTitle']))
        story.append(Spacer(1, 20))
        
        # User information
        full_name = f"{profile.user.first_name} {profile.user.last_name}"
        if hasattr(profile.user, 'second_last_name') and profile.user.second_last_name:
            full_name += f" {profile.user.second_last_name}"
        
        from datetime import datetime
        
        user_info = f"""
        <b>Nombre:</b> {full_name}<br/>
        <b>Usuario ID:</b> {uid}<br/>
        <b>Fecha de registro:</b> {profile.registration_date.strftime('%d/%m/%Y') if profile.registration_date else 'N/A'}<br/>
        <b>Fecha de generación del reporte:</b> {datetime.now().strftime('%d/%m/%Y')}
        """
        
        story.append(Paragraph(user_info, self.styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Summary section
        sis_active_count = len([aid for aid in sis_aids if aid.is_active])
        sis_total_count = len(sis_aids)
        tech_active_count = len([aid for aid in technical_aids if aid.is_active])
        tech_total_count = len(technical_aids)
        
        summary_info = f"""
        <b>Resumen del Plan de Apoyos:</b><br/>
        • Apoyos SIS activos: {sis_active_count} de {sis_total_count} total<br/>
        • Apoyos técnicos activos: {tech_active_count} de {tech_total_count} total<br/>
        • Total de apoyos en el plan: {sis_total_count + tech_total_count}
        """
        
        story.append(Paragraph(summary_info, self.styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Legend
        legend_info = """
        <b>Leyenda de Estados:</b><br/>
        • <font color="green"><b>Le funcionó:</b></font> El apoyo ha sido exitoso<br/>
        • <font color="orange"><b>En proceso:</b></font> El apoyo está siendo evaluado<br/>
        • <font color="red"><b>No le funcionó:</b></font> El apoyo no fue efectivo
        """
        
        story.append(Paragraph(legend_info, self.styles['Normal']))
        story.append(Spacer(1, 30))
        
        # SIS Aids Section
        story.append(Paragraph("Apoyos del Sistema de Intensidad de Apoyos (SIS)", self.styles['CustomTitle']))
        story.append(Spacer(1, 15))
        sis_content = self.create_sis_aids_section(sis_aids)
        story.extend(sis_content)
        story.append(Spacer(1, 30))
        
        # Technical Aids Section
        story.append(Paragraph("Apoyos Técnicos (Evaluación Diagnóstica)", self.styles['CustomTitle']))
        story.append(Spacer(1, 15))
        technical_content = self.create_technical_aids_section(technical_aids)
        story.extend(technical_content)
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        # Create response
        response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
        response['Content-Disposition'] = f'attachment; filename="plan_apoyos_{uid}.pdf"'
        
        return response