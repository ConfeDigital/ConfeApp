"""
Proyecto de Vida report generator.
Handles the complete generation of life project PowerPoint presentations.
"""
from io import BytesIO
from django.http import HttpResponse
from datetime import datetime
from candidatos.models import UserProfile
from .data_collector import ReportDataCollector

# PowerPoint imports
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE


class ProyectoVidaReport:
    """Generator for Proyecto de Vida PowerPoint presentations."""
    
    def __init__(self):
        self.navy_color = RGBColor(6, 45, 85)  # #062d55
        self.white_color = RGBColor(255, 255, 255)
    
    def get_profile(self, uid):
        """Get user profile."""
        try:
            return UserProfile.objects.get(user__id=uid)
        except UserProfile.DoesNotExist:
            raise ValueError(f"Profile not found for user ID: {uid}")
    
    def create_title_slide(self, prs, profile):
        """Create the title slide."""
        blank_slide_layout = prs.slide_layouts[6]
        slide = prs.slides.add_slide(blank_slide_layout)
        shapes = slide.shapes
        
        # Background color
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = self.navy_color
        
        # Title
        title_box = shapes.add_textbox(Inches(1), Inches(2), Inches(8), Inches(1.5))
        tf = title_box.text_frame
        p = tf.paragraphs[0]
        run = p.add_run()
        run.text = "PROYECTO DE VIDA"
        run.font.size = Pt(44)
        run.font.bold = True
        run.font.color.rgb = self.white_color
        
        # Subtitle
        full_name = f"{profile.user.first_name} {profile.user.last_name}"
        if hasattr(profile.user, 'second_last_name') and profile.user.second_last_name:
            full_name += f" {profile.user.second_last_name}"
        date_str = datetime.now().strftime("%d/%m/%Y")
        
        sub_box = shapes.add_textbox(Inches(1), Inches(3.2), Inches(8), Inches(1))
        sub_tf = sub_box.text_frame
        sub_tf.text = f"Nombre: {full_name}\nFecha: {date_str}"
        for p in sub_tf.paragraphs:
            for run in p.runs:
                run.font.size = Pt(20)
                run.font.color.rgb = self.white_color
    
    def create_section_slide(self, prs, title, content):
        """Create a section slide."""
        blank_slide_layout = prs.slide_layouts[6]
        slide = prs.slides.add_slide(blank_slide_layout)
        shapes = slide.shapes
        
        # Header bar
        header = shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, Inches(1))
        fill = header.fill
        fill.solid()
        fill.fore_color.rgb = self.navy_color
        header.line.fill.background()
        
        # Title
        title_box = shapes.add_textbox(Inches(0.5), Inches(0.2), prs.slide_width - Inches(1), Inches(0.8))
        tf = title_box.text_frame
        tf.text = title
        tf.paragraphs[0].font.size = Pt(28)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = self.white_color
        
        # Content
        content_box = shapes.add_textbox(Inches(1), Inches(1.3), prs.slide_width - Inches(2), prs.slide_height - Inches(2))
        tf_content = content_box.text_frame
        tf_content.word_wrap = True
        tf_content.margin_top = Inches(0.1)
        tf_content.margin_left = Inches(0.1)
        tf_content.margin_right = Inches(0.1)
        tf_content.text = content
        
        for paragraph in tf_content.paragraphs:
            for run in paragraph.runs:
                run.font.size = Pt(18)
                run.font.color.rgb = RGBColor(0, 0, 0)
    
    def get_sections_data(self, data_collector):
        """Get all sections data for the presentation."""
        proyecto_vida_data = data_collector.get_proyecto_vida_data()
        
        sections = {
            "Grupo de Apoyo": proyecto_vida_data.get("Mi grupo de apoyo", "No especificado"),
            "Mis Talentos": proyecto_vida_data.get("Mis talentos personales", "No especificado"),
            "Talentos de Mi Grupo de Apoyo": proyecto_vida_data.get("Las cosas que a otras personas les gustan de mi", "No especificado"),
            "Lo Más Importante Para Mí": proyecto_vida_data.get("Lo más importante para mi", "No especificado"),
            "Cosas Sobre Mí": proyecto_vida_data.get("Cosas sobre mí", "No especificado"),
            "Apoyos Que Necesito": proyecto_vida_data.get("Lo que los demás deben de saber para apoyarme", "No especificado"),
            "Mi Historia": proyecto_vida_data.get("Mi historia, recuerdos que quiero compartir", "No especificado"),
            "Meta 1": proyecto_vida_data.get("Meta 1", "No especificado"),
            "Meta 2": proyecto_vida_data.get("Meta 2", "No especificado"),
            "Meta 3": proyecto_vida_data.get("Meta 3", "No especificado"),
            "Futuro Ideal": proyecto_vida_data.get("¿Cuál sería tu futuro ideal?", "No especificado"),
            "Pasos para Alcanzar Meta 1": proyecto_vida_data.get("Pasos para alcanzar Meta 1", "No especificado"),
            "Pasos para Alcanzar Meta 2": proyecto_vida_data.get("Pasos para alcanzar Meta 2", "No especificado"),
            "Pasos para Alcanzar Meta 3": proyecto_vida_data.get("Pasos para alcanzar Meta 3", "No especificado"),
        }
        
        return sections
    
    def generate(self, uid):
        """Generate the complete Proyecto de Vida presentation."""
        # Get profile and data collector
        profile = self.get_profile(uid)
        data_collector = ReportDataCollector(uid)
        
        # Create presentation
        prs = Presentation()
        
        # Create title slide
        self.create_title_slide(prs, profile)
        
        # Get sections data
        sections = self.get_sections_data(data_collector)
        
        # Create section slides
        for title, content in sections.items():
            self.create_section_slide(prs, title, content)
        
        # Export PowerPoint
        ppt_buffer = BytesIO()
        prs.save(ppt_buffer)
        ppt_buffer.seek(0)
        
        # Create response
        response = HttpResponse(
            ppt_buffer.getvalue(), 
            content_type='application/vnd.openxmlformats-officedocument.presentationml.presentation'
        )
        response['Content-Disposition'] = f'attachment; filename="proyecto_vida_{uid}.pptx"'
        
        return response