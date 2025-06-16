from rest_framework import viewsets, status, filters, permissions
from api.permissions import IsAdminUserOrReadOnly
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from collections import defaultdict
import pandas as pd
from django.shortcuts import get_object_or_404
from .models import SISHelp, DisabilityGroup, Disability, Impediment, TechnicalAid, TechnicalAidImpediment, TechnicalAidLink, SISGroup, SISItem, SISAid, CHGroup, CHItem
from .serializers import DisabilityGroupSerializer, DisabilitySerializer
from .serializers import ImpedimentSerializer, TechnicalAidSerializer
from .serializers import SISGroupSerializer, SISItemSerializer, SISAidSerializer, SISHelpSerializer, SISHelpFlatSerializer
from .serializers import CHGroupSerializer, CHItemSerializer
from collections import defaultdict


class DisabilityGroupViewSet(viewsets.ModelViewSet):
    queryset = DisabilityGroup.objects.all()
    serializer_class = DisabilityGroupSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOrReadOnly]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

class DisabilityViewSet(viewsets.ModelViewSet):
    queryset = Disability.objects.all()
    serializer_class = DisabilitySerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOrReadOnly]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class ImpedimentViewSet(viewsets.ModelViewSet):
    queryset = Impediment.objects.all()
    serializer_class = ImpedimentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOrReadOnly]

class TechnicalAidViewSet(viewsets.ModelViewSet):
    queryset = TechnicalAid.objects.all()
    serializer_class = TechnicalAidSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOrReadOnly]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.technicalaidimpediment_set.all().delete()  # Delete all impediment relationships
        instance.links.all().delete()  # Delete related links
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['put'], url_path='update-impediment')
    def update_impediment(self, request, pk=None):
        """
        Update (or create) the description for a single impediment relationship.
        Payload: { "impediment_id": <int>, "description": <str> }
        """
        technical_aid = self.get_object()
        impediment_id = request.data.get('impediment_id')
        description = request.data.get('description', '')
        if not impediment_id:
            return Response({"error": "impediment_id is required"},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            relation, created = TechnicalAidImpediment.objects.get_or_create(
                technical_aid=technical_aid,
                impediment_id=impediment_id,
                defaults={'description': description}
            )
            if not created:
                relation.description = description
                relation.save()
            serializer = self.get_serializer(technical_aid)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)},
                            status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['put'], url_path='remove-impediment')
    def remove_impediment(self, request, pk=None):
        """
        Remove the impediment connection for the given impediment_id.
        Payload: { "impediment_id": <int> }
        """
        technical_aid = self.get_object()
        impediment_id = request.data.get('impediment_id')
        if not impediment_id:
            return Response({"error": "impediment_id is required"},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            relation = technical_aid.technicalaidimpediment_set.filter(impediment_id=impediment_id).first()
            if relation:
                relation.delete()
            serializer = self.get_serializer(technical_aid)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)},
                            status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['put'], url_path='update-links')
    def update_links(self, request, pk=None):
        """
        Update the links for a technical aid.
        Payload: { "link_urls": [ "http://...", "http://..." ] }
        """
        technical_aid = self.get_object()
        link_urls = request.data.get('link_urls')
        if link_urls is None or not isinstance(link_urls, list):
            return Response({"error": "link_urls (a list) is required"},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            # Delete existing links
            technical_aid.links.all().delete()
            # Create new links
            for url in link_urls:
                TechnicalAidLink.objects.create(technical_aid=technical_aid, url=url)
            serializer = self.get_serializer(technical_aid)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)},
                            status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=True, methods=['put'], url_path='add-impediment')
    def add_impediment(self, request, pk=None):
        """
        Add one or more impediment connections to an existing technical aid
        without removing other relationships. Expects a payload containing a list:
          {
            "impediment_data": [
              {"impediment_id": 3, "description": ""},
              {"impediment_id": 5, "description": ""}
            ]
          }
        For each object, if a connection already exists, its description is updated (if provided).
        """
        technical_aid = self.get_object()
        impediment_data = request.data.get('impediment_data')
        if not impediment_data or not isinstance(impediment_data, list):
            return Response(
                {"error": "impediment_data (a list) is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        for item in impediment_data:
            impediment_id = item.get('impediment_id')
            description = item.get('description', '')
            if not impediment_id:
                continue  # Skip invalid entries
            relation, created = TechnicalAidImpediment.objects.get_or_create(
                technical_aid=technical_aid,
                impediment_id=impediment_id,
                defaults={'description': description}
            )
            if not created and description != '':
                # Update the description if provided (and if not already created)
                relation.description = description
                relation.save()

        serializer = self.get_serializer(technical_aid)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        """
        Override the default update so that relationships are not affected.
        Use custom actions for updating impediment connections and links.
        """
        partial = kwargs.pop('partial', False)
        technical_aid = self.get_object()
        serializer = self.get_serializer(technical_aid, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
    
class SISGroupViewSet(viewsets.ModelViewSet):
    queryset = SISGroup.objects.all()
    serializer_class = SISGroupSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOrReadOnly]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

class SISItemViewSet(viewsets.ModelViewSet):
    queryset = SISItem.objects.all()
    serializer_class = SISItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOrReadOnly]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
    

class SISAidViewSet(viewsets.ModelViewSet):
    queryset = SISAid.objects.select_related("item").prefetch_related("ayudas")
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOrReadOnly]
    serializer_class = SISAidSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        nuevas_ayudas = request.data.get("ayudas", [])

        if not isinstance(nuevas_ayudas, list):
            return Response({"error": "El campo 'ayudas' debe ser una lista de objetos."}, status=400)

        # Validar que cada ayuda tenga campo 'descripcion'
        for ayuda in nuevas_ayudas:
            if "descripcion" not in ayuda:
                return Response({"error": "Cada ayuda debe tener una clave 'descripcion'."}, status=400)

        # Borrar ayudas existentes
        instance.ayudas.all().delete()

        # Crear nuevas ayudas
        for ayuda in nuevas_ayudas:
            if ayuda["descripcion"].strip():
                instance.ayudas.create(descripcion=ayuda["descripcion"].strip())

        # Actualizar campos básicos del SISAid si vienen
        instance.sub_item = request.data.get("sub_item", instance.sub_item)
        if "item_id" in request.data:
            instance.item_id = request.data["item_id"]
        instance.save()

        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=200)
    
    @action(detail=False, methods=['get'], url_path='ayudas-flat')
    def list_ayudas_flat(self, request):
        """
        GET /api/sis-aids/ayudas-flat/?items=1,2
        returns all SISHelp rows (filtered by item_ids if provided)
        with .sub_item, .item and .group baked in.
        """
        helps = SISHelp.objects.select_related(
            'sis_aid__item__group'
        )
        if items := request.query_params.get('items'):
            ids = [int(i) for i in items.split(',') if i.isdigit()]
            helps = helps.filter(sis_aid__item__id__in=ids)

        page = self.paginate_queryset(helps)
        if page is not None:
            ser = SISHelpFlatSerializer(page, many=True)
            return self.get_paginated_response(ser.data)

        ser = SISHelpFlatSerializer(helps, many=True)
        return Response(ser.data, status=200)

# ---- ReadOnly viewsets for TechnicalAid and CHItem ----
class TechnicalAidViewReadOnly(viewsets.ReadOnlyModelViewSet):
    queryset = TechnicalAid.objects.prefetch_related(
        "technicalaidimpediment_set__impediment", "links"
    )
    serializer_class = TechnicalAidSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOrReadOnly]



class CHItemViewReadOnly(viewsets.ReadOnlyModelViewSet):
    queryset = CHItem.objects.select_related("group")
    serializer_class = CHItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOrReadOnly]


class SISHelpViewSet(viewsets.ModelViewSet):
    """
    List, retrieve, create, update & delete SISHelp objects directly.
    """
    queryset = SISHelp.objects.select_related(
        'sis_aid__item__group'
    ).all()
    serializer_class = SISHelpSerializer

    permission_classes = [permissions.IsAuthenticated, IsAdminUserOrReadOnly]


class SISAidViewCOMPLETOSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOrReadOnly]

    def list(self, request):
        item_ids = request.query_params.get("items")
        queryset = SISAid.objects.select_related("item").prefetch_related("ayudas")

        if item_ids:
            try:
                item_ids_list = [int(i) for i in item_ids.split(",") if i.isdigit()]
                queryset = queryset.filter(item_id__in=item_ids_list)
            except ValueError:
                return Response({"error": "Parámetro inválido en 'items'"}, status=status.HTTP_400_BAD_REQUEST)

        serialized = SISAidSerializer(queryset, many=True).data

        grouped = defaultdict(list)
        for aid in serialized:
            item_name = aid["item"]["name"]
            grouped[item_name].append(aid)

        return Response(grouped)
    
#######
    
class CHGroupViewSet(viewsets.ModelViewSet):
    queryset = CHGroup.objects.all()
    serializer_class = CHGroupSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOrReadOnly]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

class CHItemViewSet(viewsets.ModelViewSet):
    queryset = CHItem.objects.all()
    serializer_class = CHItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOrReadOnly]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

#######

class UploadDisabilitiesViewSet(viewsets.ViewSet):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [permissions.IsAdminUser]

    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_excel(file_obj) if file_obj.name.endswith('.xlsx') else pd.read_csv(file_obj)
        except Exception as e:
            return Response({"error": f"File could not be read: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        for _, row in df.iterrows():
            group_name = row.get('grupo_discapacidad')
            disability_name = row.get('discapacidad')

            if not all([group_name, disability_name]):
                continue  # Skip rows with missing data

            group, _ = DisabilityGroup.objects.get_or_create(name=group_name)
            Disability.objects.get_or_create(name=disability_name, group=group)

        return Response({"message": "Disabilities uploaded successfully"}, status=status.HTTP_201_CREATED)
    
class UploadTechnicalAidsViewSet(viewsets.ViewSet):
    """
    Espera un archivo Excel/CSV con las siguientes columnas:
      - apoyo: nombre de la ayuda técnica.
      - grupo: nombre del impedimento.
      - descripción: descripción de la relación.
      - link o links: (opcional) lista separada por comas de URLs.
    """
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [permissions.IsAdminUser]

    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if file_obj.name.endswith('.xlsx'):
                df = pd.read_excel(file_obj)
            else:
                df = pd.read_csv(file_obj)
        except Exception as e:
            return Response(
                {"error": f"File could not be read: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Diccionario para agrupar la información por 'apoyo'
        # Para cada ayuda se acumulan:
        #   - impediment_data: un diccionario { impediment_id: relationship_description }
        #   - links: un conjunto (set) de URLs para evitar duplicados
        technical_aid_dict = {}

        for _, row in df.iterrows():
            aid_name_raw = row.get('apoyo')
            impediment_name_raw = row.get('grupo_ed')
            relationship_description = row.get('descripción', '')
            # Intentamos obtener el valor de "links", y si no existe, de "link"
            links_str = row.get('links', None)
            if links_str is None:
                links_str = row.get('link', '')

            # Validar datos mínimos y normalizar: solo se eliminan espacios al final
            if not aid_name_raw or not impediment_name_raw:
                continue

            aid_name = aid_name_raw.rstrip()
            impediment_name = impediment_name_raw.rstrip()

            # Recupera o crea el impedimento
            impediment, _ = Impediment.objects.get_or_create(name=impediment_name)

            # Inicializa la entrada para esta ayuda técnica si no existe
            if aid_name not in technical_aid_dict:
                technical_aid_dict[aid_name] = {
                    "impediment_data": {},
                    "links": set()
                }

            # Guarda la relación (si ya existe el mismo impedimento, se conservará la última descripción)
            technical_aid_dict[aid_name]["impediment_data"][impediment.id] = relationship_description

            # Procesa los links y agrégalos al set para evitar duplicados
            if pd.notnull(links_str):
                links = [x.strip() for x in str(links_str).split(' ') if x.strip()]
                technical_aid_dict[aid_name]["links"].update(links)

        # Itera sobre cada ayuda técnica agrupada para crear/actualizar registros en la BD
        for aid_name, data in technical_aid_dict.items():
            # Obtiene o crea la ayuda técnica utilizando el nombre normalizado
            technical_aid, created = TechnicalAid.objects.get_or_create(name=aid_name)
            # Se eliminan las relaciones y links existentes para sobreescribirlos
            technical_aid.technicalaidimpediment_set.all().delete()
            technical_aid.links.all().delete()

            # Crea las relaciones sin duplicados
            for imp_id, description in data["impediment_data"].items():
                TechnicalAidImpediment.objects.create(
                    technical_aid=technical_aid,
                    impediment_id=imp_id,
                    description=description
                )

            # Crea los registros de links
            for url in data["links"]:
                TechnicalAidLink.objects.create(technical_aid=technical_aid, url=url)

        return Response(
            {"message": "Technical aids uploaded successfully"},
            status=status.HTTP_201_CREATED
        )
    

########## Carga masiva modificada sis aid #################

class UploadSISAidsViewSet(viewsets.ViewSet):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [permissions.IsAdminUser]

    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if file_obj.name.endswith('.xlsx'):
                df = pd.read_excel(file_obj)
            else:
                df = pd.read_csv(file_obj)
        except Exception as e:
            return Response({"error": f"File could not be read: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        for _, row in df.iterrows():
            group_name = row.get('grupo_sis')
            item_name = row.get('item')
            sub_item = row.get('sub_item')
            ayuda = row.get('apoyo')

            if not group_name or not item_name or not sub_item or not ayuda:
                continue

            # Crear o recuperar grupo
            group, _ = SISGroup.objects.get_or_create(name=group_name)

            # Crear o recuperar ítem
            item, _ = SISItem.objects.get_or_create(name=item_name, group=group)

            # Crear o recuperar sub_item sin usar el campo `aid`
            sis_aid, _ = SISAid.objects.get_or_create(sub_item=sub_item, item=item)

            # Crear la ayuda (SISHelp) asociada
            SISHelp.objects.create(sis_aid=sis_aid, descripcion=ayuda)

        return Response({"message": "SIS aids uploaded successfully"}, status=status.HTTP_201_CREATED)
    
class UploadCHAidsViewSet(viewsets.ViewSet):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [permissions.IsAdminUser]

    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_excel(file_obj) if file_obj.name.endswith('.xlsx') else pd.read_csv(file_obj)
        except Exception as e:
            return Response({"error": f"File could not be read: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        for _, row in df.iterrows():
            group_name = row.get('grupo_ch')
            item_name = row.get('item')
            aid = row.get('apoyo')

            if not all([group_name, item_name]):
                continue  # Skip rows with missing data

            group, _ = CHGroup.objects.get_or_create(name=group_name)
            CHItem.objects.get_or_create(name=item_name, group=group, aid=aid)

        return Response({"message": "CH(Cuadro de Habilidades) Aids uploaded successfully"}, status=status.HTTP_201_CREATED)