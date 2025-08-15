"""
Utility functions for report generation.
Common functions used across different report types.
"""
import unicodedata
import re
from reportlab.platypus import Paragraph, Table, TableStyle, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors


def normalize_text(text):
    """Normalize text by removing accents and converting to lowercase."""
    if not isinstance(text, str):
        return ""
    
    # Remove accents and normalize
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ASCII", "ignore").decode("utf-8")
    
    # Clean up whitespace
    text = re.sub(r"\s+", " ", text)
    
    return text.strip().lower()


def create_section_header(text):
    """Create a section header with navy background."""
    section_header_style = ParagraphStyle(
        name="SectionTitle",
        backColor=colors.Color(6 / 255, 45 / 255, 85 / 255),
        alignment=1,
        spaceBefore=6,
        spaceAfter=12,
        leading=16,
        textColor=colors.white,
        fontSize=14,
        fontName="Helvetica-Bold"
    )
    
    return Paragraph(f"<b><font size=14 color='white'>{text}</font></b>", section_header_style)


def create_basic_table(data, col_widths=None, title=None):
    """Create a basic table with standard styling and text wrapping."""
    if not data:
        return []
    
    elements = []
    
    if title:
        title_style = ParagraphStyle(
            "TitleStyle", 
            fontSize=14, 
            textColor=colors.black, 
            fontName="Helvetica-Bold", 
            alignment=0, 
            spaceAfter=12
        )
        elements.append(Paragraph(title, title_style))
    
    # Create a style for table content
    table_text_style = ParagraphStyle(
        "TableTextStyle",
        fontSize=9,
        textColor=colors.black,
        fontName="Helvetica",
        wordWrap='LTR',
        splitLongWords=True,
        leading=11  # Line spacing
    )
    
    # Process data to wrap long text in Paragraphs
    processed_data = []
    for i, row in enumerate(data):
        processed_row = []
        for j, cell in enumerate(row):
            if isinstance(cell, Paragraph):
                # Already a Paragraph, use as is
                processed_row.append(cell)
            elif isinstance(cell, str):
                if i == 0:  # Header row - make bold
                    header_style = ParagraphStyle(
                        "HeaderStyle",
                        fontSize=10,
                        textColor=colors.black,
                        fontName="Helvetica-Bold",
                        wordWrap='LTR',
                        splitLongWords=True,
                        leading=12
                    )
                    processed_row.append(Paragraph(cell, header_style))
                elif len(cell) > 30:  # Long text - wrap in Paragraph
                    processed_row.append(Paragraph(cell, table_text_style))
                else:
                    processed_row.append(cell)
            else:
                processed_row.append(str(cell) if cell is not None else "")
        processed_data.append(processed_row)
    
    table = Table(processed_data, colWidths=col_widths)
    table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),  # Header background
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),     # Data background
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),    # Header font
        ('FONTSIZE', (0, 0), (-1, 0), 10),                  # Header font size
        ('FONTSIZE', (0, 1), (-1, -1), 9),                  # Data font size
    ]))
    
    # Wrap table in KeepTogether to prevent splitting across pages when possible
    elements.append(KeepTogether(table))
    return elements

def create_side_by_side_tables(table_data_1, table_data_2):
    """Create two tables side by side."""
    from reportlab.lib.styles import ParagraphStyle
    
    # Create table style for content
    table_text_style = ParagraphStyle(
        "TableTextStyle",
        fontSize=9,
        textColor=colors.black,
        fontName="Helvetica",
        wordWrap='LTR',
        splitLongWords=True,
        leading=11
    )
    
    # Process both tables data
    def process_table_data(data):
        processed_data = []
        for i, row in enumerate(data):
            processed_row = []
            for cell in row:
                if i == 0:  # Header row
                    header_style = ParagraphStyle(
                        "HeaderStyle",
                        fontSize=10,
                        textColor=colors.black,
                        fontName="Helvetica-Bold",
                        wordWrap='LTR',
                        splitLongWords=True,
                        leading=12
                    )
                    processed_row.append(Paragraph(cell, header_style))
                elif len(str(cell)) > 30:  # Long text
                    processed_row.append(Paragraph(str(cell), table_text_style))
                else:
                    processed_row.append(str(cell))
            processed_data.append(processed_row)
        return processed_data
    
    # Process both tables
    processed_data_1 = process_table_data(table_data_1)
    processed_data_2 = process_table_data(table_data_2)
    
    # Create individual tables
    table1 = Table(processed_data_1, colWidths=[80, 180])
    table2 = Table(processed_data_2, colWidths=[80, 180])
    
    # Apply styling to both tables
    table_style = TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
    ])
    
    table1.setStyle(table_style)
    table2.setStyle(table_style)
    
    # Create a container table to place them side by side
    side_by_side_data = [[table1, table2]]
    container_table = Table(side_by_side_data, colWidths=[280, 280])
    container_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    
    return [KeepTogether(container_table)]


def draw_logo_header():
    """Create logo header with fallback options."""
    import os
    from django.conf import settings
    from reportlab.platypus import Image, Table, TableStyle
    
    # Try multiple possible locations for logos
    logo_filenames = ["confe_Azul.png", "ceil.png"]
    possible_paths = []
    
    # Add different possible locations
    if hasattr(settings, 'STATIC_ROOT') and settings.STATIC_ROOT:
        possible_paths.append(settings.STATIC_ROOT)
    if hasattr(settings, 'STATICFILES_DIRS'):
        possible_paths.extend(settings.STATICFILES_DIRS)
    
    # Fallback to common locations
    possible_paths.extend([
        os.path.join(settings.BASE_DIR, 'static'),
        os.path.join(settings.BASE_DIR, 'staticfiles'),
        os.path.join(settings.BASE_DIR, 'backend', 'static'),
    ])
    
    logos = []
    for filename in logo_filenames:
        logo_found = False
        for base_path in possible_paths:
            full_path = os.path.join(base_path, "logos", filename)
            try:
                if os.path.exists(full_path):
                    logos.append(Image(full_path, width=100, height=75))
                    logo_found = True
                    break
            except Exception as e:
                continue
        
        if not logo_found:
            # Create a placeholder with the logo name
            placeholder_style = ParagraphStyle(
                'LogoPlaceholder',
                fontSize=8,
                textColor=colors.grey,
                alignment=1  # Center alignment
            )
            placeholder = Paragraph(f"[{filename.split('.')[0]}]", placeholder_style)
            logos.append(placeholder)
    
    logo_table = Table([[logos[0], logos[1]]], colWidths=[220, 220])
    logo_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10)
    ]))
    return logo_table