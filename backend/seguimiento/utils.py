from collections import defaultdict
from discapacidad.models import TechnicalAid, Impediment
from cuestionarios.models import Respuesta
from candidatos.models import TAidCandidateHistory

# Your existing code...
QUESTION_THRESHOLDS = {
    "Describe el nivel de lectura del/la candidato/a": range(0, 4),
    "Describe el nivel de escritura del/la candidato/a": range(0, 3),
    "Describe el conocimiento de números del/la candidato/a": range(0, 4), 
    "Describe el nivel de suma del/la candidato/a": range(0, 2),  
    "Describe el nivel de resta del/la candidato/a": range(0, 2),  
    "Describe el nivel de manejo de dinero del/la candidato/a": range(0, 3),
    "¿Necesita apoyo para comunicarse?": [0],
    "¿Se observa alguna problemática conductual?": [0],
}

QUESTION_IMPEDIMENT_MAP = {
    "Describe el nivel de lectura del/la candidato/a": "Lectura y Escritura",
    "Describe el nivel de escritura del/la candidato/a": "Lectura y Escritura",
    "Describe el conocimiento de números del/la candidato/a": "Manejo del Dinero", 
    "Describe el nivel de suma del/la candidato/a": "Manejo del Dinero",  
    "Describe el nivel de resta del/la candidato/a": "Manejo del Dinero",  
    "Describe el nivel de manejo de dinero del/la candidato/a": "Manejo del Dinero",
    "¿Necesita apoyo para comunicarse?": "Comunicación",
    "¿Se observa alguna problemática conductual?": "Conductual",
}

def get_suggested_technical_aids_grouped(user_id):
    """
    Returns technical aids grouped by impediments, excluding aids already assigned to the candidate.
    """
    respuestas = Respuesta.objects.filter(
        usuario_id=user_id,
        cuestionario__nombre__iexact="Evaluación Diagnóstica"
    ).select_related("pregunta")

    impediment_ids = set()

    # Find relevant impediments based on survey responses
    for r in respuestas:
        question_text = r.pregunta.texto
        if question_text in QUESTION_THRESHOLDS:
            try:
                value = int(r.respuesta)
            except ValueError:
                continue
            if value in QUESTION_THRESHOLDS[question_text]:
                impediment_name = QUESTION_IMPEDIMENT_MAP.get(question_text)
                if impediment_name:
                    try:
                        impediment = Impediment.objects.get(name=impediment_name)
                        impediment_ids.add(impediment.id)
                    except Impediment.DoesNotExist:
                        continue

    # Get aids already assigned to this candidate
    assigned_aid_ids = set(
        TAidCandidateHistory.objects.filter(
            candidate__user_id=user_id,
            is_active=True
        ).values_list('aid_id', flat=True).exclude(aid_id__isnull=True)
    )

    # Get all technical aids for the identified impediments, excluding already assigned ones
    available_aids = TechnicalAid.objects.filter(
        impediments__id__in=impediment_ids
    ).exclude(
        id__in=assigned_aid_ids
    ).distinct().prefetch_related(
        'technicalaidimpediment_set__impediment',
        'links'
    )

    # Group aids by impediment
    grouped_aids = defaultdict(list)
    
    for aid in available_aids:
        # Get all impediments for this aid that are in our identified impediments
        aid_impediments = aid.technicalaidimpediment_set.filter(
            impediment_id__in=impediment_ids
        )
        
        for aid_impediment in aid_impediments:
            grouped_aids[aid_impediment.impediment.name].append({
                'aid': aid,
                'description': aid_impediment.description
            })

    return dict(grouped_aids)