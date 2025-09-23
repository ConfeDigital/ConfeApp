"""
Utility functions for report generation.
Common functions used across different report types.
"""
import unicodedata
import re
from reportlab.platypus import Paragraph, Table, TableStyle, KeepTogether, Spacer, ListFlowable
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter


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


def create_basic_table(data, col_widths=None, title=None, center_right_column=False):
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
    
    # Ensure col_widths are valid
    if col_widths:
        # Ensure all column widths are positive
        col_widths = [max(1, width) if width is not None else 100 for width in col_widths]
    
    table = Table(processed_data, colWidths=col_widths)
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
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.whitesmoke]),
    ])

    if center_right_column:
        table_style.add('ALIGN', (-1, 0), (-1, -1), 'CENTER')

    for row_idx, row_data in enumerate(processed_data):
        if row_data and str(row_data[0]).strip() == "Puntuación Total":
            table_style.add('FONTNAME', (0, row_idx), (-1, row_idx), 'Helvetica-Bold'),
            table_style.add('LINEABOVE', (0, row_idx), (-1, row_idx), 2, colors.black)

    table.setStyle(table_style)
    
    # Wrap table in KeepTogether to prevent splitting across pages when possible
    elements.append(KeepTogether(table))
    return elements

def create_side_by_side_tables(table_data_1, table_data_2, inner_col_widths = [85, 155]):
    """Create two tables side by side with a margin and center them."""
    
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

    # Ensure we have data before calculating columns
    if not processed_data_1 or len(processed_data_1) < 2:
        num_cols = 2  # Default to 2 columns
    else:
        num_cols = len(processed_data_1[1]) if processed_data_1[1] else 2
    
    # Ensure inner_col_widths are valid
    if inner_col_widths:
        inner_col_widths = [max(1, width) if width is not None else 100 for width in inner_col_widths]
    
    # Create table style (will be applied after potential scaling)
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
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.whitesmoke]),
    ])

    if len(processed_data_1[0]) == 1 and len(processed_data_2[0]) == 1:
        table_style.add('SPAN', (0, 0), (num_cols - 1, 0))
        table_style.add('ALIGN', (0, 0), (num_cols - 1, 0), 'CENTER')
    
    # Create individual tables with default widths (may be scaled later)
    table1 = Table(processed_data_1, colWidths=inner_col_widths)
    table2 = Table(processed_data_2, colWidths=inner_col_widths)
    
    # Apply styling to both tables
    table1.setStyle(table_style)
    table2.setStyle(table_style)

    # --- KEY FIX START ---
    
    # Calculate available width and adjust table sizes accordingly
    page_width = 612
    available_width = page_width - (50 * 2)  # Document margins
    
    # Define the margin between the two tables
    margin_between = 20
    
    # Calculate how much space we have for each table
    space_for_tables = available_width - margin_between
    max_table_width = space_for_tables / 2
    
    # If the default table width is too large, scale down the column widths
    current_table_width = sum(inner_col_widths) + 16  # 16 for padding (8 left + 8 right)
    
    if current_table_width > max_table_width:
        # Scale down the column widths proportionally
        scale_factor = (max_table_width - 16) / (current_table_width - 16)  # Subtract padding from both
        scaled_inner_col_widths = [width * scale_factor for width in inner_col_widths]
        
        # Recreate tables with scaled widths
        table1 = Table(processed_data_1, colWidths=scaled_inner_col_widths)
        table2 = Table(processed_data_2, colWidths=scaled_inner_col_widths)
        
        # Apply styling to the resized tables
        table1.setStyle(table_style)
        table2.setStyle(table_style)
        
        # Update the table width for container calculations
        table_actual_width = sum(scaled_inner_col_widths) + 16
    else:
        table_actual_width = current_table_width
    
    # Create a container table with three columns: table1, a spacer, and table2
    side_by_side_data = [[table1, Spacer(margin_between, 1), table2]]
    
    # The colWidths for the container table must account for the actual rendered width
    container_col_widths = [table_actual_width, margin_between, table_actual_width]
    container_table = Table(side_by_side_data, colWidths=container_col_widths)
    
    container_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    
    # Calculate padding to center the container table, using your document's margins
    page_width = 612
    available_width = page_width - (50 * 2)  # Your document's margins are 50 points on each side
    total_table_width = sum(container_col_widths)
    
    # Ensure we don't have negative padding
    if total_table_width >= available_width:
        # If tables are too wide, just use the container table without centering
        return [KeepTogether(container_table)]
    
    left_padding_width = (available_width - total_table_width) / 2
    
    # Ensure left_padding_width is not negative
    left_padding_width = max(0, left_padding_width)
    
    # Create a wrapper table to apply centering using Spacers
    wrapper_table = Table([
        [Spacer(left_padding_width, 1), container_table, Spacer(left_padding_width, 1)]
    ], colWidths=[left_padding_width, total_table_width, left_padding_width])
    
    # --- KEY FIX END ---
    
    return [KeepTogether(wrapper_table)]


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