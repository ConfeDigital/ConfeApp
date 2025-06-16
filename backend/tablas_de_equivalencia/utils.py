from django.db.models import Q
from .models import PercentilesPorCuestionario
from .serializers import PercentilesPorCuestionarioSerializer

def get_filtered_and_formatted_puntuaciones(query_params):
    """
    Obtiene y formatea las puntuaciones basadas en los parámetros de consulta.

    Args:
        query_params (dict or QueryDict): Un diccionario o QueryDict que contiene
                                          los parámetros de filtro (e.g., request.query_params).

    Returns:
        list: Una lista de diccionarios, donde cada diccionario representa una
              puntuación con sus detalles de sección y cuestionario.
    """
    queryset = PercentilesPorCuestionario.objects.prefetch_related(
        "secciones_percentiles__puntuaciones"
    ).all()

    filtros = Q()

    if "base_cuestionario" in query_params:
        filtros &= Q(base_cuestionario__nombre__icontains=query_params["base_cuestionario"])
    if "seccion_id" in query_params:
        filtros &= Q(secciones_percentiles__id=query_params["seccion_id"])
    if "nombre_seccion" in query_params:
        filtros &= Q(secciones_percentiles__nombre_seccion__icontains=query_params["nombre_seccion"])
    if "grupo" in query_params:
        filtros &= Q(secciones_percentiles__grupo__icontains=query_params["grupo"])
    if "puntuacion_directa" in query_params:
        filtros &= Q(secciones_percentiles__puntuaciones__puntuacion_directa=query_params["puntuacion_directa"])
    if "puntuacion_estandar" in query_params:
        filtros &= Q(secciones_percentiles__puntuaciones__puntuacion_estandar=query_params["puntuacion_estandar"])
    if "percentil" in query_params:
        filtros &= Q(secciones_percentiles__puntuaciones__percentil=query_params["percentil"])

    filtered_queryset = queryset.filter(filtros).distinct()

    # Use the serializer to transform the queryset into a serializable format
    serializer = PercentilesPorCuestionarioSerializer(filtered_queryset, many=True)
    
    resultados = []
    for cuestionario in serializer.data:
        for seccion in cuestionario["secciones_percentiles"]:
            for puntuacion in seccion["puntuaciones"]:
                resultados.append({
                    "id": puntuacion["id"],
                    "base_cuestionario": cuestionario["base_cuestionario"],
                    "nombre_seccion": seccion["nombre_seccion"],
                    "grupo": seccion["grupo"],
                    "puntuacion_directa": puntuacion["puntuacion_directa"],
                    "puntuacion_estandar": puntuacion["puntuacion_estandar"],
                    "percentil": puntuacion["percentil"]
                })
    return resultados
