from rest_framework import serializers
import json
from .models import Cuestionario, Pregunta, Opcion, Respuesta, DesbloqueoPregunta, BaseCuestionarios, ImagenOpcion
from api.models import CustomUser
# from .models import (
#     PercentilesPorCuestionario,
#     SeccionDePercentilesPorGrupo,
#     RelacionDePuntuacionesYPercentiles,
#     CalculoDeIndiceDeNecesidadesDeApoyo
# )

class DesbloqueoPreguntaSerializer(serializers.ModelSerializer):
    pregunta_origen = serializers.CharField(source='pregunta_origen.texto')
    opcion_desbloqueadora = serializers.CharField(source='opcion_desbloqueadora.texto')
    pregunta_desbloqueada = serializers.CharField(source='pregunta_desbloqueada.texto')

    class Meta:
        model = DesbloqueoPregunta
        fields = ['pregunta_origen', 'opcion_desbloqueadora', 'pregunta_desbloqueada']

class OpcionSerializer(serializers.ModelSerializer):
    """Serializador para opciones de preguntas."""
    desbloqueos = DesbloqueoPreguntaSerializer(many=True, read_only=True)

    class Meta:
        model = Opcion
        fields = [
            'id',
            'texto',
            'valor',
            'desbloqueos'
        ]
class ImagenOpcionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImagenOpcion
        fields = ['id', 'imagen', 'descripcion']

class PreguntaSerializer(serializers.ModelSerializer):
    """Serializador para preguntas dentro de un cuestionario."""
    opciones = OpcionSerializer(many=True, read_only=True)
    imagenes = ImagenOpcionSerializer(many=True, read_only=True)
    desbloqueos_recibidos = DesbloqueoPreguntaSerializer(many=True, read_only=True)


    class Meta:
        model = Pregunta
        fields = [
            'id',
            'texto',
            'tipo',
            'cuestionario',
            'seccion_sis',
            'nombre_seccion',
            'opciones',
            'imagenes',
            'actualiza_usuario',
            'desbloqueos_recibidos',
            'ficha_tecnica',
            'campo_ficha_tecnica',
            'actualiza_usuario',
            'campo_datos_personales',

        ]

class CuestionarioSerializer(serializers.ModelSerializer):
    """Serializador para cuestionarios con preguntas asociadas."""
    pregunta_count = serializers.SerializerMethodField()
    preguntas = PreguntaSerializer(many=True, read_only=True)

    class Meta:
        model = Cuestionario
        fields = [
            'id',
            'nombre',
            'version',
            'activo',
            'fecha_creacion',
            'preguntas',
            'pregunta_count',
        ]

    def get_pregunta_count(self, obj):
        return obj.preguntas.count()

# class BaseCuestionariosSerializer(serializers.ModelSerializer):
#     """Serializador para la base de cuestionarios."""
#     cuestionarios = CuestionarioSerializer(many=True, read_only=True)

#     class Meta:
#         model = BaseCuestionarios
#         fields = [
#             'id',
#             'nombre',
#             'estado_desbloqueo',
#             'responsable',
#             'cuestionarios',
#         ]

class BaseCuestionariosSerializer(serializers.ModelSerializer):
    """Serializador para la base de cuestionarios."""
    cuestionarios = CuestionarioSerializer(many=True, read_only=True)

    # cuestionarios = serializers.SerializerMethodField()  # Campo personalizado para cuestionarios
    responsable_nombre = serializers.SerializerMethodField()  # Campo personalizado para el nombre del responsable

    class Meta:
        model = BaseCuestionarios
        fields = [
            'id',
            'nombre',
            'estado_desbloqueo',
            'responsable',
            'responsable_nombre',  # Nuevo campo para el nombre completo del responsable
            'inicio',
            'cuestionarios',  # Lista de cuestionarios asociados
        ]

    def get_responsable_nombre(self, obj):
        """Devuelve el nombre completo del responsable."""
        responsable = obj.responsable
        if responsable == "PCD":
            return "Persona con Discapacidad"
        elif responsable == "Psi":
            return "Psicólogo"
        else:
            return responsable  # En caso de que haya otros valores no contemplados


class RespuestaSerializer(serializers.ModelSerializer):
    """Serializador para respuestas de los usuarios."""
    
    class Meta:
        model = Respuesta
        fields = [
            'id',
            'usuario',
            'cuestionario',
            'pregunta',
            'respuesta',
            # 'imagen',
        ]

class UsuarioRespuestaSerializer(serializers.ModelSerializer):
    """Serializador para respuestas con detalles adicionales sobre usuario, cuestionario y opciones."""
    usuario = serializers.StringRelatedField()
    cuestionario = serializers.StringRelatedField()
    cuestionario_id = serializers.PrimaryKeyRelatedField(source='cuestionario', read_only=True)
    pregunta_id = serializers.PrimaryKeyRelatedField(source='pregunta', read_only=True)
    pregunta = serializers.StringRelatedField()
    respuesta_texto = serializers.SerializerMethodField()

    class Meta:
        model = Respuesta
        fields = [
            'usuario',
            'cuestionario',
            'cuestionario_id',
            'pregunta_id',
            'pregunta',
            'respuesta',
            'respuesta_texto'
        ]

    def get_respuesta_texto(self, obj):
        """Si la pregunta no es de tipo 'abierta', obtiene el texto de la opción seleccionada."""
        if obj.pregunta.tipo != 'abierta':
            try:
                opcion = Opcion.objects.filter(pregunta=obj.pregunta, valor=obj.respuesta).first()
                return opcion.texto if opcion else obj.respuesta
            except Opcion.DoesNotExist:
                return obj.respuesta
        return obj.respuesta

class CuestionarioDesbloqueosSerializer(serializers.ModelSerializer):
    preguntas = PreguntaSerializer(many=True, read_only=True)

    class Meta:
        model = Cuestionario
        fields = ['id', 'nombre', 'preguntas']

class RespuestaDesbloqueadaSerializer(serializers.ModelSerializer):
    cuestionario_id = serializers.IntegerField(source='cuestionario.id')
    cuestionario_nombre = serializers.CharField(source='cuestionario.nombre')
    pregunta_texto = serializers.CharField(source='pregunta.texto')
    cumple_desbloqueo = serializers.SerializerMethodField()

    class Meta:
        model = Respuesta
        fields = [
            'cuestionario_id',
            'cuestionario_nombre',
            'pregunta_texto',
            'respuesta',
            'cumple_desbloqueo',  # Indicates if the answer meets the unlocking rules
        ]

    def get_cumple_desbloqueo(self, obj):
        # Check if the answer meets the unlocking rules
        if obj.respuesta == '':
            return False  # Empty answers do not meet unlocking rules

        try:
            # Convert respuesta to integer if possible
            respuesta_valor = int(obj.respuesta)
            desbloqueos = DesbloqueoPregunta.objects.filter(
                cuestionario=obj.cuestionario,
                pregunta_origen=obj.pregunta,
                opcion_desbloqueadora__valor=respuesta_valor
            ).exists()
            return desbloqueos
        except (ValueError, TypeError):
            # If respuesta is not a number, it cannot meet unlocking rules
            return False
        

from rest_framework import serializers
from .models import Respuesta, Opcion

from rest_framework import serializers
from .models import Respuesta, Opcion
import json

# class RespuestaUnlockedPathSerializer(serializers.ModelSerializer):
#     """
#     Serializador para respuestas:
#     - Convierte índices en 'multiple' y 'dropdown' a texto.
#     - Convierte IDs en 'checkbox' a texto separado por comas.
#     - Limpia la estructura JSON en 'sis'.
#     """

#     cuestionario_id = serializers.IntegerField(source='cuestionario.id')
#     cuestionario_nombre = serializers.CharField(source='cuestionario.nombre')
#     pregunta_id = serializers.IntegerField(source='pregunta.id')
#     pregunta_texto = serializers.CharField(source='pregunta.texto')
#     tipo_pregunta = serializers.CharField(source='pregunta.tipo')
#     respuesta = serializers.SerializerMethodField()

#     class Meta:
#         model = Respuesta
#         fields = [
#             'cuestionario_id',
#             'cuestionario_nombre',
#             'pregunta_id',
#             'pregunta_texto',
#             'tipo_pregunta',
#             'respuesta',
#         ]

#     def get_respuesta(self, obj):
#         """
#         - 'multiple' y 'dropdown': Convierte índice a texto.
#         - 'checkbox': Convierte lista de IDs a texto separado por comas.
#         - 'sis': Devuelve JSON estructurado.
#         """

#         # Si la respuesta está vacía o nula, devolver None
#         if obj.respuesta is None or obj.respuesta == '':
#             return None

#         # ✅ Si la pregunta es de tipo 'multiple' o 'dropdown'
#         if obj.pregunta.tipo in ['multiple', 'dropdown']:
#             try:
#                 respuesta_index = int(obj.respuesta)  # Convertir índice a número
#                 opciones = Opcion.objects.filter(pregunta=obj.pregunta).order_by('id')

#                 if 0 <= respuesta_index < len(opciones):
#                     return opciones[respuesta_index].texto  # Retornar solo el texto de la opción

#                 return obj.respuesta  # Si no se encuentra, devolver la respuesta original
#             except (ValueError, IndexError):
#                 return obj.respuesta  # Manejo de error si la conversión falla

#         # ✅ Si la pregunta es de tipo 'checkbox'
#         if obj.pregunta.tipo == 'checkbox':
#             try:
#                 # Convertir la respuesta en una lista de IDs
#                 if isinstance(obj.respuesta, str):
#                     # Convertir de string a lista de enteros (manejo de errores)
#                     respuesta_ids = json.loads(obj.respuesta)
#                 elif isinstance(obj.respuesta, list):
#                     respuesta_ids = obj.respuesta
#                 else:
#                     return obj.respuesta  # Si el formato es inesperado, devolver como está

#                 # Filtrar opciones seleccionadas por sus IDs
#                 opciones = Opcion.objects.filter(id__in=respuesta_ids)

#                 # Devolver solo los textos de las opciones, separados por comas
#                 return ", ".join([opcion.texto for opcion in opciones])

#             except (Opcion.DoesNotExist, json.JSONDecodeError, ValueError, TypeError):
#                 return obj.respuesta  # Si hay error, devolver la respuesta original

#         # ✅ Si la pregunta es de tipo 'sis'
#         if obj.pregunta.tipo in ['sis', 'sis2']:
#             try:
#                 datos_sis = json.loads(obj.respuesta)  # Convertir JSON string a diccionario
#                 return {
#                     "frecuencia": datos_sis.get("frecuencia", 0),
#                     "tiempo_apoyo": datos_sis.get("tiempo_apoyo", 0),
#                     "tipo_apoyo": datos_sis.get("tipo_apoyo", 0)
#                 }
#             except json.JSONDecodeError:
#                 return obj.respuesta  # Si hay error, devolver la respuesta original

#         # Si la pregunta no es de los tipos anteriores, devolver la respuesta normal
#         return obj.respuesta

        

######### SIS Serializer ############

class RespuestaSISSerializer(serializers.ModelSerializer):
    usuario_id = serializers.IntegerField(source='usuario.id')
    cuestionario_id = serializers.IntegerField(source='cuestionario.id')
    cuestionario_nombre = serializers.CharField(source='cuestionario.nombre')
    pregunta_id = serializers.IntegerField(source='pregunta.id')
    pregunta_texto = serializers.CharField(source='pregunta.texto')
    tipo_pregunta = serializers.CharField(source='pregunta.tipo')
    seccion_sis = serializers.IntegerField(source='pregunta.seccion_sis')
    nombre_seccion = serializers.CharField(source='pregunta.nombre_seccion')
    dato_personal = serializers.BooleanField(source='pregunta.actualiza_usuario')
    ficha_tecnica = serializers.BooleanField(source='pregunta.ficha_tecnica')
    campo_ficha_tecnica = serializers.CharField(source='pregunta.campo_ficha_tecnica')
    campo_datos_personales = serializers.CharField(source='pregunta.campo_datos_personales')
    respuesta = serializers.SerializerMethodField()
    desbloqueada = serializers.SerializerMethodField()

    class Meta:
        model = Respuesta
        fields = [
            'usuario_id',
            'cuestionario_id',
            'cuestionario_nombre',
            'pregunta_id',
            'pregunta_texto',
            'tipo_pregunta',
            'seccion_sis',
            'nombre_seccion',
            'respuesta',
            'ficha_tecnica',
            'campo_ficha_tecnica',
            'dato_personal',
            'campo_datos_personales',
            'desbloqueada'
        ]

    def get_respuesta(self, obj):
        """Devuelve la respuesta, asegurando que se procesen listas correctamente"""
        if obj.respuesta is None or obj.respuesta == '':
            return None

        if obj.pregunta.tipo in ['multiple', 'dropdown', 'checkbox']:
            respuesta_ids = obj.respuesta if isinstance(obj.respuesta, list) else [obj.respuesta]

            try:
                respuesta_ids = [int(value) for value in respuesta_ids if str(value).isdigit()]
            except ValueError:
                return obj.respuesta  

            opciones = obj.pregunta.opciones.filter(id__in=respuesta_ids)
            if opciones.exists():
                return [{'texto': opcion.texto, 'valor': opcion.valor} for opcion in opciones]

        return obj.respuesta

    def get_desbloqueada(self, obj):
        """Determina si la pregunta fue desbloqueada con base en las reglas de desbloqueo"""
        from .models import DesbloqueoPregunta

        pregunta_actual = obj.pregunta
        usuario = obj.usuario
        cuestionario = obj.cuestionario

        # Verificar si existen reglas de desbloqueo para esta pregunta
        desbloqueos = DesbloqueoPregunta.objects.filter(
            cuestionario=cuestionario,
            pregunta_desbloqueada=pregunta_actual
        )

        if not desbloqueos.exists():
            return "no_aplica"

        # Verificar si el usuario cumplió con alguna regla de desbloqueo
        for desbloqueo in desbloqueos:
            respuestas_origen = Respuesta.objects.filter(
                usuario=usuario,
                cuestionario=cuestionario,
                pregunta=desbloqueo.pregunta_origen
            )

            for respuesta in respuestas_origen:
                try:
                    respuesta_valor = int(respuesta.respuesta)
                    if respuesta_valor == desbloqueo.opcion_desbloqueadora.valor:
                        return "si"
                except (ValueError, TypeError):
                    continue  # Si la respuesta no es numérica, ignorar

        return "no"


####### Resumen del sis ######

# class ResumenSISSerializer(serializers.Serializer):
#     usuario_id = serializers.IntegerField()
#     nombre_seccion = serializers.CharField()
#     total_frecuencia = serializers.IntegerField()
#     total_tiempo_apoyo = serializers.IntegerField()
#     total_tipo_apoyo = serializers.IntegerField()
#     total_general = serializers.IntegerField()  # Nueva suma total

from discapacidad.models import SISAid  # Importamos el modelo correcto

class ResumenSISSerializer(serializers.Serializer):
    usuario_id = serializers.IntegerField()
    nombre_seccion = serializers.CharField()
    total_frecuencia = serializers.IntegerField()
    total_tiempo_apoyo = serializers.IntegerField()
    total_tipo_apoyo = serializers.IntegerField()
    total_general = serializers.IntegerField()  # Nueva suma total
    ayudas = serializers.SerializerMethodField()  # ✅ Aquí se generará la estructura
    items = serializers.SerializerMethodField()

    def get_ayudas(self, obj):
        """
        Genera la estructura de ayudas agrupadas por ítem con sus subitems y lista de ayudas.
        """
        respuestas_sis = Respuesta.objects.filter(
            usuario_id=obj["usuario_id"],
            pregunta__nombre_seccion=obj["nombre_seccion"],
            pregunta__tipo__in=["sis", "sis2"],
        )

        ayudas_por_item = {}

        for respuesta in respuestas_sis:
            try:
                datos_sis = json.loads(respuesta.respuesta)
                subitems_ids = datos_sis.get("subitems", [])
                subitems = SISAid.objects.filter(id__in=subitems_ids)
                
                for subitem in subitems:
                    item_name = subitem.item.name
                    if item_name not in ayudas_por_item:
                        ayudas_por_item[item_name] = {"item": item_name, "subitems": []}

                    ayudas_por_item[item_name]["subitems"].append({
                        "sub_item": subitem.sub_item,
                        "sub_item_id": subitem.id,
                        "ayudas": [
                            {"id": ayuda.id, "descripcion": ayuda.descripcion}
                            for ayuda in subitem.ayudas.all()
                        ]
                    })

            except json.JSONDecodeError:
                continue

        return list(ayudas_por_item.values())
    
    def get_items(self, obj):
        def safe_int(value):
            try:
                return int(value)
            except (ValueError, TypeError):
                return 0

        respuestas_sis = Respuesta.objects.filter(
            usuario_id=obj["usuario_id"],
            pregunta__nombre_seccion=obj["nombre_seccion"],
            pregunta__tipo__in=["sis", "sis2"],
        )

        desglose = {}

        for respuesta in respuestas_sis:
            try:
                datos_sis = json.loads(respuesta.respuesta)
                frecuencia = safe_int(datos_sis.get("frecuencia"))
                tiempo = safe_int(datos_sis.get("tiempo_apoyo"))
                tipo = safe_int(datos_sis.get("tipo_apoyo"))

                item = respuesta.pregunta.texto  # Agrupar por ítem
                if item not in desglose:
                    desglose[item] = {
                        "item": item,
                        "frecuencia": 0,
                        "tiempo_apoyo": 0,
                        "tipo_apoyo": 0,
                        "total_item": 0
                    }

                desglose[item]["frecuencia"] += frecuencia
                desglose[item]["tiempo_apoyo"] += tiempo
                desglose[item]["tipo_apoyo"] += tipo
                desglose[item]["total_item"] += (frecuencia + tiempo + tipo)

            except (json.JSONDecodeError, TypeError):
                continue

        return list(desglose.values())

    class Meta:
        fields = [
            "usuario_id",
            "nombre_seccion",
            "total_frecuencia",
            "total_tiempo_apoyo",
            "total_tipo_apoyo",
            "total_general",
            "ayudas",
            "items",
        ]

    def to_representation(self, obj):
        data = super().to_representation(obj)
        items = self.get_items(obj)

        data["items"] = items
        data["total_frecuencia"] = sum(item["frecuencia"] for item in items)
        data["total_tiempo_apoyo"] = sum(item["tiempo_apoyo"] for item in items)
        data["total_tipo_apoyo"] = sum(item["tipo_apoyo"] for item in items)
        data["total_general"] = sum(item["total_item"] for item in items)

        return data



################ Unlocked Path view nuevo ##############

from discapacidad.models import SISAid as SubItem


class RespuestaUnlockedPathSerializer(serializers.ModelSerializer):
    """
    Serializador para respuestas:
    - Convierte índices en 'multiple' y 'dropdown' a texto.
    - Convierte IDs en 'checkbox' y 'checklist' a texto separado por comas.
    - Limpia la estructura JSON en 'sis'.
    """

    cuestionario_id = serializers.IntegerField(source='cuestionario.id')
    cuestionario_nombre = serializers.CharField(source='cuestionario.nombre')
    pregunta_id = serializers.IntegerField(source='pregunta.id')
    pregunta_texto = serializers.CharField(source='pregunta.texto')
    tipo_pregunta = serializers.CharField(source='pregunta.tipo')
    respuesta = serializers.SerializerMethodField()

    class Meta:
        model = Respuesta
        fields = [
            'cuestionario_id',
            'cuestionario_nombre',
            'pregunta_id',
            'pregunta_texto',
            'tipo_pregunta',
            'respuesta',
        ]

    def get_respuesta(self, obj):
        """
        - 'multiple' y 'dropdown': Convierte índice a texto.
        - 'checkbox' y 'checklist': Convierte lista de IDs a texto separado por comas.
        - 'sis': Devuelve JSON estructurado con subitems.
        """

        # Si la respuesta está vacía o nula, devolver None
        if obj.respuesta is None or obj.respuesta == '':
            return None

        # ✅ Si la pregunta es de tipo 'multiple' o 'dropdown'
        if obj.pregunta.tipo in ['multiple', 'dropdown']:
            try:
                respuesta_index = int(obj.respuesta)
                opciones = Opcion.objects.filter(pregunta=obj.pregunta).order_by('id')

                if 0 <= respuesta_index < len(opciones):
                    return opciones[respuesta_index].texto

                return obj.respuesta  # Si no se encuentra, devolver la respuesta original
            except (ValueError, IndexError):
                return obj.respuesta

        # ✅ Si la pregunta es de tipo 'checkbox' o 'checklist'
        if obj.pregunta.tipo in ['checkbox', 'checklist']:
            try:
                if isinstance(obj.respuesta, str):
                    respuesta_ids = json.loads(obj.respuesta)
                elif isinstance(obj.respuesta, list):
                    respuesta_ids = obj.respuesta
                else:
                    return obj.respuesta  # Si el formato es inesperado, devolverlo como está

                opciones = Opcion.objects.filter(id__in=respuesta_ids)
                return ", ".join([opcion.texto for opcion in opciones])

            except (Opcion.DoesNotExist, json.JSONDecodeError, ValueError, TypeError):
                return obj.respuesta

        # ✅ Si la pregunta es de tipo 'sis' o 'sis2'
        if obj.pregunta.tipo in ['sis', 'sis2']:
            try:
                datos_sis = json.loads(obj.respuesta)

                subitems_ids = datos_sis.get("subitems", [])

                # 🔹 Filtrar subitems desde la app discapacidad
                subitems = SubItem.objects.filter(id__in=subitems_ids)

                return {
                    "frecuencia": datos_sis.get("frecuencia", 0),
                    "tiempo_apoyo": datos_sis.get("tiempo_apoyo", 0),
                    "tipo_apoyo": datos_sis.get("tipo_apoyo", 0),
                    "subitems": [{
                        "id": sub.id,
                        "texto": sub.sub_item,
                        "ayudas": [
                            {"id": ayuda.id, "descripcion": ayuda.descripcion}
                            for ayuda in sub.ayudas.all()
                        ]
                    } for sub in subitems]

                }
            except json.JSONDecodeError:
                return obj.respuesta  # Si hay error, devolver la respuesta original

        return obj.respuesta
    

class ReporteCuestionariosSerializer(serializers.ModelSerializer):
    """
    Serializador para reportes de cuestionarios con información detallada:
    - cuestionario_nombre
    - base_cuestionario
    - texto_pregunta
    - tipo_pregunta
    - respuesta
    
    Incluye IDs para backtracking completo:
    - usuario_id
    - cuestionario_id
    - base_cuestionario_id
    - pregunta_id
    """
    
    # IDs para backtracking
    usuario_id = serializers.IntegerField(source='usuario.id')
    cuestionario_id = serializers.IntegerField(source='cuestionario.id')
    base_cuestionario_id = serializers.IntegerField(source='cuestionario.base_cuestionario.id')
    pregunta_id = serializers.IntegerField(source='pregunta.id')
    
    # Información descriptiva
    cuestionario_nombre = serializers.CharField(source='cuestionario.nombre')
    base_cuestionario = serializers.CharField(source='cuestionario.base_cuestionario.nombre')
    texto_pregunta = serializers.CharField(source='pregunta.texto')
    tipo_pregunta = serializers.CharField(source='pregunta.tipo')
    respuesta = serializers.SerializerMethodField()

    class Meta:
        model = Respuesta
        fields = [
            # IDs para backtracking
            'usuario_id',
            'cuestionario_id',
            'base_cuestionario_id',
            'pregunta_id',
            # Información descriptiva
            'cuestionario_nombre',
            'base_cuestionario',
            'texto_pregunta',
            'tipo_pregunta',
            'respuesta',
        ]

    def get_respuesta(self, obj):
        """
        Procesa la respuesta según el tipo de pregunta:
        - 'multiple' y 'dropdown': Convierte índice a texto
        - 'checkbox' y 'checklist': Convierte lista de IDs a texto separado por comas
        - 'sis': Devuelve JSON estructurado con subitems
        - Otros tipos: Devuelve la respuesta tal como está
        """

        # Si la respuesta está vacía o nula, devolver None
        if obj.respuesta is None or obj.respuesta == '':
            return None

        # Para preguntas tipo 'multiple' o 'dropdown'
        if obj.pregunta.tipo in ['multiple', 'dropdown']:
            try:
                respuesta_index = int(obj.respuesta)
                opciones = Opcion.objects.filter(pregunta=obj.pregunta).order_by('id')

                if 0 <= respuesta_index < len(opciones):
                    return {
                        'texto': opciones[respuesta_index].texto,
                        'opcion_id': opciones[respuesta_index].id,
                        'valor_original': obj.respuesta
                    }

                return {
                    'texto': obj.respuesta,
                    'opcion_id': None,
                    'valor_original': obj.respuesta
                }
            except (ValueError, IndexError):
                return {
                    'texto': obj.respuesta,
                    'opcion_id': None,
                    'valor_original': obj.respuesta
                }

        # Para preguntas tipo 'checkbox' o 'checklist'
        if obj.pregunta.tipo in ['checkbox', 'checklist']:
            try:
                if isinstance(obj.respuesta, str):
                    respuesta_ids = json.loads(obj.respuesta)
                elif isinstance(obj.respuesta, list):
                    respuesta_ids = obj.respuesta
                else:
                    return {
                        'texto': obj.respuesta,
                        'opciones_ids': [],
                        'valor_original': obj.respuesta
                    }

                opciones = Opcion.objects.filter(id__in=respuesta_ids)
                return {
                    'texto': ", ".join([opcion.texto for opcion in opciones]),
                    'opciones_ids': [opcion.id for opcion in opciones],
                    'valor_original': obj.respuesta
                }

            except (Opcion.DoesNotExist, json.JSONDecodeError, ValueError, TypeError):
                return {
                    'texto': obj.respuesta,
                    'opciones_ids': [],
                    'valor_original': obj.respuesta
                }

        # Para preguntas tipo 'sis' o 'sis2'
        if obj.pregunta.tipo in ['sis', 'sis2']:
            try:
                datos_sis = json.loads(obj.respuesta)
                subitems_ids = datos_sis.get("subitems", [])
                
                # Filtrar subitems desde la app discapacidad
                subitems = SubItem.objects.filter(id__in=subitems_ids)

                return {
                    'frecuencia': datos_sis.get("frecuencia", 0),
                    'tiempo_apoyo': datos_sis.get("tiempo_apoyo", 0),
                    'tipo_apoyo': datos_sis.get("tipo_apoyo", 0),
                    'subitems': [{
                        'id': sub.id,
                        'texto': sub.sub_item,
                        'ayudas': [
                            {"id": ayuda.id, "descripcion": ayuda.descripcion}
                            for ayuda in sub.ayudas.all()
                        ]
                    } for sub in subitems],
                    'valor_original': obj.respuesta
                }
            except json.JSONDecodeError:
                return {
                    'texto': obj.respuesta,
                    'valor_original': obj.respuesta
                }

        # Para otros tipos de preguntas
        return {
            'texto': obj.respuesta,
            'valor_original': obj.respuesta
        }
    
