# report_utils.py

import os
from django.conf import settings
from reportlab.platypus import Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape, A3
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import unicodedata
import re
import json
import requests
from copy import deepcopy

from cuestionarios.utils import evaluar_rango, get_user_evaluation_summary
from reportlab.lib.units import cm



def draw_logo_header():
    logo_paths = [
        os.path.join(settings.MEDIA_ROOT, "logos/confe_Azul.png"),
        os.path.join(settings.MEDIA_ROOT, "logos/JAP.png"),
        os.path.join(settings.MEDIA_ROOT, "logos/ceil.png")
    ]
    logos = []
    for path in logo_paths:
        if os.path.exists(path):
            logos.append(Image(path, width=80, height=60))
        else:
            logos.append(Spacer(1, 60))
    logo_table = Table([[logos[0], logos[1], logos[2]]], colWidths=[180, 180, 180])
    logo_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10)
    ]))
    return logo_table

def draw_logo_header_canvas(canvas_obj, width, height):
    logo_paths = [
        os.path.join(settings.MEDIA_ROOT, "logos/logo1.png"),
        os.path.join(settings.MEDIA_ROOT, "logos/logo2.png"),
        os.path.join(settings.MEDIA_ROOT, "logos/logo3.png")
    ]
    positions = [50, (width / 2) - 40, width - 130]
    for i, path in enumerate(logo_paths):
        if os.path.exists(path):
            canvas_obj.drawImage(path, positions[i], height - 80, width=80, height=60, preserveAspectRatio=True)

def draw_footer(canvas_obj, page_num):
    canvas_obj.setFont("Helvetica", 10)
    canvas_obj.drawString(300, 50, f"Page {page_num}")

def normalize_text(text):
    return unicodedata.normalize("NFKD", text).encode("ASCII", "ignore").decode("utf-8").strip().lower()

def redondear_percentil(percentil):
    if percentil is None:
        return None
    try:
        percentil = int(percentil)
        resto = percentil % 5
        if resto >= 3:
            return percentil + (5 - resto)
        else:
            return percentil - resto
    except Exception as e:
        print("⚠️ Error redondeando percentil:", e)
        return percentil


def get_habilidades_adaptativas_coloreadas(uid, table):
    section_to_column = {
        "actividades de la vida en el hogar": "Vida en el hogar",
        "actividades de la vida en la comunidad": "Vida en la comunidad",
        "actividades de aprendizaje a lo largo de la vida": "Aprendizaje a lo largo de la vida",
        "empleo": "Empleo",
        "actividades de salud y seguridad": "Salud y seguridad",
        "actividades sociales": "Social",
        "índice de necesidades de apoyo": "Índice de Necesidades de Apoyo"
    }

    try:
        # 1. Replace API call with direct utility function call
        # No 'requests' needed anymore!
        evaluation_summary = get_user_evaluation_summary(usuario_id=uid, query_params={})

        if not evaluation_summary: # Handle cases where summary might be empty or problematic
            print("❌ No se pudo obtener el resumen de evaluación del usuario.")
            return table, []

        secciones = evaluation_summary.get("detalles_por_seccion", [])
        resumen_global = evaluation_summary.get("resumen_global", {})

        # --- Remainder of your original logic ---
        header_row = table[0]
        col_index_map = {}
        for key, col_name in section_to_column.items():
            for idx, header in enumerate(header_row):
                if normalize_text(col_name) == normalize_text(header):
                    col_index_map[key] = idx
                    break
        print("🧩 col_index_map generado:")
        for k, v in col_index_map.items():
            print(f" → {k} → columna {v} → header = {header_row[v]}")
        print("Encabezados reales:", header_row)

        # Buscar la segunda columna que contenga 'percentil'
        percentil_col_indices = [idx for idx, name in enumerate(header_row) if "percentil" in name.lower()]
        percentil_col_idx = percentil_col_indices[1] if len(percentil_col_indices) > 1 else (
            percentil_col_indices[0] if percentil_col_indices else None
        )

        celdas_a_colorear = []

        def encontrar_fila_por_percentil(percentil):
            for row_idx in range(1, len(table)):
                # Ensure comparison is robust (e.g., handle ranges in table cells)
                cell_value = str(table[row_idx][0]).strip()
                if str(percentil) == cell_value: # Exact match
                    return row_idx
                # Additional logic if percentiles in table cells can be ranges like "5-10"
                # You might need a more sophisticated range check here as well if the table cells are ranges.
                # For simplicity, assuming direct match or first/last cell.
                # If table cells have range, you'd need:
                # if evaluar_rango(percentil, cell_value): return row_idx
            return None

        def marcar_celda(row_idx, col_idx):
            celdas_a_colorear.append({
                "row": row_idx,
                "col": col_idx,
                "background": colors.Color(6 / 255, 45 / 255, 85 / 255),
                "textColor": colors.white,
                "fontName": "Helvetica-Bold"
            })

        # This `procesar_seccion` is internal to get_habilidades_adaptativas_coloreadas
        # It's better to inline the logic or pass specific data rather than relying on closures
        # that might be unclear. However, for direct porting, we'll keep it.
        def procesar_seccion(nombre, puntaje, percentil_val): # Renamed percentil to percentil_val to avoid conflict
            if nombre not in col_index_map or not isinstance(puntaje, (int, float)): # Allow float for puntaje
                return
            col_idx = col_index_map[nombre]
            match_encontrado = False
            for row_idx in range(1, len(table)):
                celda = str(table[row_idx][col_idx]).strip()
                if not celda or celda == "#N/A":
                    continue
                
                # Use the existing evaluar_rango utility for robust checking
                if evaluar_rango(float(puntaje), celda): # Cast puntaje to float for evaluation
                    marcar_celda(row_idx, col_idx)
                    if percentil_col_idx is not None:
                        marcar_celda(row_idx, percentil_col_idx)
                    match_encontrado = True
                    break
            
            # Fallback if no direct score match found in the table, try matching by percentile
            if not match_encontrado and percentil_val is not None:
                percentil_redondeado = redondear_percentil(percentil_val)
                fila_idx = encontrar_fila_por_percentil(percentil_redondeado)
                if fila_idx is not None:
                    marcar_celda(fila_idx, col_idx)
                    if percentil_col_idx is not None:
                        marcar_celda(fila_idx, percentil_col_idx)

        # Iterate through evaluation summary sections
        for seccion in secciones:
            nombre = seccion["nombre_seccion"].strip().lower()
            procesar_seccion(nombre, seccion.get("puntuacion_estandar"), seccion.get("percentil"))

        # Process global index
        indice = resumen_global.get("indice_de_necesidades_de_apoyo")
        percentil_global = resumen_global.get("percentil")
        col_idx = col_index_map.get("índice de necesidades de apoyo")
        if col_idx is not None:
            procesar_seccion("índice de necesidades de apoyo", indice, percentil_global)

        print(celdas_a_colorear)
        return table, celdas_a_colorear
    except Exception as e:
        print(f"❌ Error general en get_habilidades_adaptativas_coloreadas: {e}")
        return table, []



def draw_table(data, title, celdas_coloreadas=None):
    if not data or len(data) == 0 or not any(data):
        return []

    styles = getSampleStyleSheet()
    elements = []

    # Calcular ancho disponible de la página (letter size - márgenes)
    # Letter size: 612 x 792 points, márgenes: 50 puntos cada lado
    page_width = 612  # points
    margins = 50 * 2  # left + right margins
    available_width = page_width - margins
    
    # Insertar estructura especial para Habilidades Adaptativas
    if title == "Habilidades Adaptativas":
        # Título largo como fila dentro de la tabla
        full_title = (
            "Sección 1b. Perfil de necesidades de apoyo. "
            "Rodee la puntuación estándar para cada subescala de actividades y el índice de Necesidades de apoyo. "
            "Después conecte los círculos de las subescalas con una línea para formar el perfil."
        )
        title_row = [full_title] + [""] * (len(data[0]) - 1)
        data.insert(0, title_row)

        # Letras A-F
        letras = ["", "A", "B", "C", "D", "E", "F", "", ""]
        data.insert(1, letras)

        # Encabezados multilínea
        if len(data) > 2:
            data[2] = [
                "Percentiles",
                "Vida<br/>en el<br/>hogar",
                "Vida<br/>en<br/>comunidad",
                "Aprendizaje<br/>a lo largo<br/>de la vida",
                "Empleo",
                "Salud y<br/>seguridad",
                "Social",
                "Índice de<br/>Necesidades<br/>de apoyo",
                "Percentiles"
            ]

    # Estilo de encabezado genérico
    header_style = ParagraphStyle(
        name='HeaderStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=colors.white,
        alignment=1
    )

    # Estilo individual por celda
    def get_cell_style_override(i, j):
        if not celdas_coloreadas:
            return None
        for celda in celdas_coloreadas:
            if celda["row"] == i and celda["col"] == j:
                return celda
        return None

    # Procesar celdas
    formatted_data = []
    for i, row in enumerate(data):
        row_cells = []
        for j, cell in enumerate(row):
            if title == "Habilidades Adaptativas" and i == 0:
                style = ParagraphStyle(
                    name='AdaptiveTitle',
                    parent=styles['Normal'],
                    fontName='Helvetica-Bold',
                    fontSize=10,
                    textColor=colors.white,
                    alignment=1
                )
            elif title == "Habilidades Adaptativas" and i in (1, 2):
                style = ParagraphStyle(
                    name='AdaptiveHeader',
                    parent=styles['Normal'],
                    fontName='Helvetica-Bold',
                    fontSize=10,
                    alignment=1
                )
            elif i == 0:
                style = header_style
            else:
                style = deepcopy(styles['Normal'])
                celda_override = get_cell_style_override(i, j)
                if celda_override:
                    if "textColor" in celda_override:
                        style.textColor = celda_override["textColor"]
                    if "fontName" in celda_override:
                        style.fontName = celda_override["fontName"]
                    print(f"🎨 Pintando celda ({i}, {j}) con estilo: {celda_override}")
            p = Paragraph(str(cell), style)
            row_cells.append(p)
        formatted_data.append(row_cells)

    # Estilo general de la tabla
    table_style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.Color(6 / 255, 45 / 255, 85 / 255)),  # navy
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

    # Estilos específicos para tabla de Habilidades Adaptativas
    if title == "Habilidades Adaptativas":
        table_style.add('SPAN', (0, 0), (-1, 0))  # Unificar celda título
        table_style.add('BACKGROUND', (0, 0), (-1, 0), colors.Color(6 / 255, 45 / 255, 85 / 255))
        table_style.add('TEXTCOLOR', (0, 0), (-1, 0), colors.white)
        table_style.add('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold')
        table_style.add('FONTSIZE', (0, 0), (-1, 0), 10)
        table_style.add('ALIGN', (0, 0), (-1, 0), 'CENTER')
        table_style.add('VALIGN', (0, 0), (-1, 0), 'MIDDLE')

        table_style.add('ALIGN', (0, 1), (-1, 2), 'CENTER')
        table_style.add('FONTNAME', (0, 1), (-1, 2), 'Helvetica-Bold')
        table_style.add('FONTSIZE', (0, 1), (-1, 2), 10)

        table_style.add('BACKGROUND', (0, 3), (0, -1), colors.whitesmoke)
        table_style.add('FONTNAME', (0, 3), (0, -1), 'Helvetica-Bold')
        table_style.add('BACKGROUND', (-1, 3), (-1, -1), colors.whitesmoke)
        table_style.add('FONTNAME', (-1, 3), (-1, -1), 'Helvetica-Bold')
        table_style.add('ALIGN', (0, 3), (-1, -1), 'CENTER')
        table_style.add('FONTSIZE', (0, 3), (-1, -1), 9)
        table_style.add('TOPPADDING', (0, 3), (-1, -1), 6)
        table_style.add('BOTTOMPADDING', (0, 3), (-1, -1), 6)

    # Líneas extra (para percentil 50)
    for row_idx, row_data in enumerate(data):
        if row_data and str(row_data[0]).strip() == "50":
            table_style.add('LINEABOVE', (0, row_idx), (-1, row_idx), 2, colors.black)
            table_style.add('LINEBELOW', (0, row_idx), (-1, row_idx), 2, colors.black)

    # Celdas coloreadas manualmente
    if celdas_coloreadas:
        for celda in celdas_coloreadas:
            row_idx = celda["row"]
            col_idx = celda["col"]
            background = celda.get("background", colors.Color(6 / 255, 45 / 255, 85 / 255))
            text_color = celda.get("textColor", colors.white)
            font_name = celda.get("fontName", "Helvetica-Bold")

            table_style.add('BACKGROUND', (col_idx, row_idx), (col_idx, row_idx), background)
            table_style.add('TEXTCOLOR', (col_idx, row_idx), (col_idx, row_idx), text_color)
            table_style.add('FONTNAME', (col_idx, row_idx), (col_idx, row_idx), font_name)

    # Crear y agregar tabla con anchos dinámicos
    repeat_rows = 3 if title == "Habilidades Adaptativas" else 1
    
    # Calcular anchos de columna dinámicamente
    num_cols = len(formatted_data[0]) if formatted_data else 1
    
    if title == "Habilidades Adaptativas":
        # Para la tabla de Habilidades Adaptativas, mantener proporciones específicas
        col_widths = [available_width * 0.15] + [available_width * 0.12] * 7 + [available_width * 0.15]
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
        # Para otras tablas, distribuir el ancho uniformemente
        col_widths = [available_width / num_cols] * num_cols
    
    if title.lower() == "evaluación diagnóstica":
        col1, col2 = [], []
        for i, row in enumerate(data[1:]):  # Saltar encabezado
            if len(row) >= 2:
                pregunta = Paragraph(f"<b>{row[0]}</b>: {row[1]}", styles['Normal'])
                (col1 if i % 2 == 0 else col2).append(pregunta)
                (col1 if i % 2 == 0 else col2).append(Spacer(1, 6))

        elements.append(Paragraph(f"<b>{title}</b>", header_style))
        elements.append(Spacer(1, 6))

        two_col_table = Table([[col1, col2]], colWidths=[available_width / 2] * 2)
        two_col_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))
        elements.append(two_col_table)
        elements.append(Spacer(1, 12))
        return elements
    
    table = Table(formatted_data, repeatRows=repeat_rows, colWidths=col_widths)
    table.setStyle(table_style)
    elements.append(table)

    # Leyenda solo si es tabla adaptativa
    # if title == "Habilidades Adaptativas - Tabla de resultados SIS":
    #     legend_style = ParagraphStyle(
    #         name="Legend",
    #         parent=styles['Normal'],
    #         fontSize=9,
    #         textColor=colors.black,
    #         spaceBefore=6
    #     )
    #     elements.append(Paragraph(
    #         "Las celdas resaltadas en azul indican el valor correspondiente al puntaje estándar del usuario o su percentil.",
    #         legend_style
    #     ))
    #     elements.append(Paragraph(
    #         "American Association on Intellectual and Developmental Disabilities (AAIDD). (2020). Escala de Intensidad de Apoyos - Versión para Adultos (SIS-A). Traducción autorizada. AAIDD. https://www.aaidd.org/sis/sis-a",
    #         legend_style
    #     ))

    elements.append(Spacer(1, 12))
    return elements