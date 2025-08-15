"""
Central data collection for all reports.
Handles fetching and processing data from the database.
"""
import json
from collections import defaultdict
from django.db.models import Q
from cuestionarios.models import Cuestionario, Respuesta, Pregunta
from cuestionarios.utils import get_user_evaluation_summary, get_resumen_cuestionarios_completo
from discapacidad.models import CHItem


class ReportDataCollector:
    """Central data collector for all report types."""
    
    def __init__(self, user_id):
        self.user_id = user_id
    
    def get_questionnaire_by_name(self, name_variations):
        """Get questionnaire by trying different name variations."""
        for name in name_variations:
            questionnaire = Cuestionario.objects.filter(
                nombre__iexact=name, 
                activo=True
            ).first()
            if questionnaire:
                return questionnaire
        
        # Try partial matching
        for name in name_variations:
            if name:  # Check if name is not None
                words = name.lower().split()
                if len(words) >= 2:
                    q_filter = Q(activo=True)
                    for word in words:
                        q_filter &= Q(nombre__icontains=word)
                    questionnaire = Cuestionario.objects.filter(q_filter).first()
                    if questionnaire:
                        return questionnaire
        return None
    
    def parse_response_content(self, response_raw):
        """Parse response content from various formats."""
        if response_raw is None:
            return ""
        
        if isinstance(response_raw, str):
            try:
                parsed = json.loads(response_raw)
                if isinstance(parsed, dict) and 'texto' in parsed:
                    return parsed['texto'] or ""
                return str(parsed)
            except json.JSONDecodeError:
                return response_raw
        elif isinstance(response_raw, dict):
            return response_raw.get('texto', str(response_raw)) or ""
        else:
            return str(response_raw) if response_raw is not None else ""
    
    def get_evaluacion_diagnostica_data(self):
        """Get diagnostic evaluation data."""
        from cuestionarios.models import Opcion
        
        name_variations = [
            "Evaluación Diagnóstica", "evaluacion diagnostica", 
            "Evaluacion Diagnostica", "evaluación diagnóstica"
        ]
        
        questionnaire = self.get_questionnaire_by_name(name_variations)
        if not questionnaire:
            return {}
        
        responses = Respuesta.objects.filter(
            usuario_id=self.user_id,
            cuestionario=questionnaire
        ).select_related('pregunta')
        
        responses_dict = {}
        for response in responses:
            question_text = response.pregunta.texto.strip() if response.pregunta.texto else ""
            
            # Get the raw response
            raw_response = response.respuesta
            
            # Try to map numeric responses to option text
            if isinstance(raw_response, (int, float)):
                # Look for option with this numeric value
                option = Opcion.objects.filter(
                    pregunta=response.pregunta,
                    valor=int(raw_response)
                ).first()
                
                if option:
                    response_text = option.texto
                else:
                    response_text = str(raw_response)
            
            elif isinstance(raw_response, str):
                # Check if it's a numeric string
                if raw_response.strip().isdigit():
                    option = Opcion.objects.filter(
                        pregunta=response.pregunta,
                        valor=int(raw_response)
                    ).first()
                    
                    if option:
                        response_text = option.texto
                    else:
                        response_text = raw_response
                else:
                    # Try to parse as JSON first
                    try:
                        parsed = json.loads(raw_response)
                        if isinstance(parsed, dict):
                            # Check if it has a 'valor' key for mapping
                            if 'valor' in parsed:
                                option = Opcion.objects.filter(
                                    pregunta=response.pregunta,
                                    valor=int(parsed['valor'])
                                ).first()
                                
                                if option:
                                    response_text = option.texto
                                else:
                                    response_text = parsed.get('texto', str(parsed['valor']))
                            else:
                                response_text = parsed.get('texto', str(parsed))
                        else:
                            response_text = str(parsed)
                    except json.JSONDecodeError:
                        response_text = raw_response
            
            elif isinstance(raw_response, dict):
                # Check if it has a 'valor' key for mapping
                if 'valor' in raw_response:
                    option = Opcion.objects.filter(
                        pregunta=response.pregunta,
                        valor=int(raw_response['valor'])
                    ).first()
                    
                    if option:
                        response_text = option.texto
                    else:
                        response_text = raw_response.get('texto', str(raw_response['valor']))
                else:
                    response_text = raw_response.get('texto', str(raw_response))
            
            else:
                response_text = self.parse_response_content(raw_response)
            
            responses_dict[question_text] = response_text or "No especificado"
        
        return responses_dict
    
    def get_proyecto_vida_data(self):
        """Get life project data."""
        questionnaire = self.get_questionnaire_by_name(["Proyecto de Vida"])
        if not questionnaire:
            return {}
        
        responses = Respuesta.objects.filter(
            usuario_id=self.user_id,
            cuestionario=questionnaire
        ).select_related('pregunta')
        
        answers = {}
        for response in responses:
            question_text = response.pregunta.texto.strip() if response.pregunta.texto else ""
            if question_text.lower().startswith("pasos para"):
                answers[question_text] = "N/A"
            else:
                response_text = self.parse_response_content(response.respuesta)
                answers[question_text] = response_text if response_text else "No especificado"
        
        return answers
    
    def get_sis_protection_defense_data(self):
        """Get SIS protection and defense data."""
        responses = Respuesta.objects.filter(
            usuario_id=self.user_id,
            pregunta__nombre_seccion="Actividades de protección y defensa",
            pregunta__tipo__in=["sis", "sis2"]
        ).select_related("pregunta")
        
        items_scores = {}
        for response in responses:
            item_name = response.pregunta.texto.strip() if response.pregunta.texto else ""
            if not item_name:
                continue
                
            try:
                if response.respuesta:
                    data = json.loads(response.respuesta)
                    frequency = int(data.get("frecuencia", 0))
                    support_time = int(data.get("tiempo_apoyo", 0))
                    support_type = int(data.get("tipo_apoyo", 0))
                    total = frequency + support_time + support_type
                    
                    if item_name in items_scores:
                        items_scores[item_name] += total
                    else:
                        items_scores[item_name] = total
            except (json.JSONDecodeError, ValueError, TypeError):
                continue
        
        return items_scores
    
    def get_sis_medical_behavioral_data(self):
        """Get SIS medical and behavioral needs data."""
        responses = Respuesta.objects.filter(
            usuario_id=self.user_id,
            pregunta__tipo__in=["sis", "sis2"]
        ).select_related("pregunta")
        
        def get_section_totals(section_name):
            items = defaultdict(lambda: {"frecuencia": 0, "tiempo_apoyo": 0, "tipo_apoyo": 0})
            for response in responses:
                section_name_response = response.pregunta.nombre_seccion.strip() if response.pregunta.nombre_seccion else ""
                if section_name_response.lower() != section_name.lower():
                    continue
                try:
                    if response.respuesta:
                        data = json.loads(response.respuesta)
                        question_text = response.pregunta.texto if response.pregunta.texto else ""
                        items[question_text]["frecuencia"] += int(data.get("frecuencia", 0))
                        items[question_text]["tiempo_apoyo"] += int(data.get("tiempo_apoyo", 0))
                        items[question_text]["tipo_apoyo"] += int(data.get("tipo_apoyo", 0))
                except (json.JSONDecodeError, ValueError, TypeError):
                    continue
            return list(items.values())
        
        def calculate_totals(item_list):
            total = sum(i["frecuencia"] + i["tiempo_apoyo"] + i["tipo_apoyo"] for i in item_list)
            has_2 = any(i["frecuencia"] == 2 or i["tiempo_apoyo"] == 2 or i["tipo_apoyo"] == 2 for i in item_list)
            return total, has_2
        
        medical_items = get_section_totals("Necesidades de Apoyo Médicas")
        total_medical, has_2_medical = calculate_totals(medical_items)
        
        behavioral_items = get_section_totals("Necesidades de Apoyo Conductuales")
        total_behavioral, has_2_behavioral = calculate_totals(behavioral_items)
        
        return {
            "medical_total": total_medical,
            "medical_greater_than_5": total_medical > 5,
            "medical_has_2": has_2_medical,
            "behavioral_total": total_behavioral,
            "behavioral_greater_than_5": total_behavioral > 5,
            "behavioral_has_2": has_2_behavioral
        }
    
    def get_cuadro_habilidades_data(self):
        """Get skills chart data."""
        responses = Respuesta.objects.filter(
            usuario_id=self.user_id,
            cuestionario__nombre__iexact="Cuadro de Habilidades",
            cuestionario__activo=True
        ).select_related('pregunta')
        
        responses_data = {}
        for response in responses:
            question_text = response.pregunta.texto.strip() if response.pregunta.texto else ""
            if not question_text:
                continue
                
            try:
                if response.respuesta and isinstance(response.respuesta, str):
                    parsed_content = json.loads(response.respuesta)
                elif response.respuesta:
                    parsed_content = response.respuesta
                else:
                    parsed_content = {"resultado": "", "aid_id": None, "aid_text": "Sin respuesta."}
            except json.JSONDecodeError:
                parsed_content = {"resultado": "", "aid_id": None, "aid_text": "Error al procesar apoyo."}
            
            responses_data[question_text] = parsed_content
        
        return responses_data
    
    def get_comprehensive_data(self):
        """Get comprehensive data from cuestionarios utils."""
        return get_resumen_cuestionarios_completo(self.user_id)
    
    def get_evaluation_summary(self):
        """Get evaluation summary."""
        return get_user_evaluation_summary(usuario_id=self.user_id, query_params={})