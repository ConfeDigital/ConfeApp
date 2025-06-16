from rest_framework import serializers
from .models import SISHelp, DisabilityGroup, Disability, Impediment, TechnicalAid, SISGroup, SISItem, SISAid, TechnicalAidImpediment, TechnicalAidLink, CHGroup, CHItem

class DisabilityGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = DisabilityGroup
        fields = '__all__'

class DisabilitySerializer(serializers.ModelSerializer):
    group = DisabilityGroupSerializer(read_only=True)
    group_id = serializers.PrimaryKeyRelatedField(
        queryset=DisabilityGroup.objects.all(), source="group", write_only=True
    )

    class Meta:
        model = Disability
        fields = ['id', 'name', 'group', 'group_id']

class ImpedimentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Impediment
        fields = ['id', 'name']

class TechnicalAidLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = TechnicalAidLink
        fields = ['id', 'url']

class TechnicalAidImpedimentSerializer(serializers.ModelSerializer):
    impediment = ImpedimentSerializer(read_only=True)
    impediment_id = serializers.PrimaryKeyRelatedField(
        queryset=Impediment.objects.all(), source="impediment", write_only=True
    )

    class Meta:
        model = TechnicalAidImpediment
        fields = ['id', 'impediment', 'impediment_id', 'description']

class TechnicalAidSerializer(serializers.ModelSerializer):
    impediments = TechnicalAidImpedimentSerializer(many=True, read_only=True, source="technicalaidimpediment_set")
    impediment_data = serializers.ListField(write_only=True, child=serializers.DictField())
    links = TechnicalAidLinkSerializer(many=True, read_only=True)
    link_urls = serializers.ListField(write_only=True, child=serializers.URLField())

    class Meta:
        model = TechnicalAid
        fields = ['id', 'name', 'impediments', 'impediment_data', 'links', 'link_urls']

    def create(self, validated_data):
        impediment_data = validated_data.pop('impediment_data', [])
        link_urls = validated_data.pop('link_urls', [])

        technical_aid = TechnicalAid.objects.create(**validated_data)

        for item in impediment_data:
            impediment_id = item.get('impediment_id')
            description = item.get('description', '')

            if impediment_id:
                TechnicalAidImpediment.objects.create(
                    technical_aid=technical_aid,
                    impediment_id=impediment_id,
                    description=description
                )

        for url in link_urls:
            TechnicalAidLink.objects.create(technical_aid=technical_aid, url=url)

        return technical_aid

    def update(self, instance, validated_data):
        impediment_data = validated_data.pop('impediment_data', [])
        link_urls = validated_data.pop('link_urls', [])

        instance.name = validated_data.get('name', instance.name)
        instance.save()

        if impediment_data:
            instance.technicalaidimpediment_set.all().delete()
            for item in impediment_data:
                impediment_id = item.get('impediment_id')
                description = item.get('description', '')

                if impediment_id:
                    TechnicalAidImpediment.objects.create(
                        technical_aid=instance,
                        impediment_id=impediment_id,
                        description=description
                    )

        if link_urls:
            instance.links.all().delete()
            for url in link_urls:
                TechnicalAidLink.objects.create(technical_aid=instance, url=url)

        return instance

class SISGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = SISGroup
        fields = '__all__'

class SISItemSerializer(serializers.ModelSerializer):
    group = SISGroupSerializer(read_only=True)
    group_id = serializers.PrimaryKeyRelatedField(
        queryset=SISGroup.objects.all(), source="group", write_only=True
    )

    class Meta:
        model = SISItem
        fields = ['id', 'name', 'group', 'group_id']



class SISHelpSerializer(serializers.ModelSerializer):
    class Meta:
        model = SISHelp
        fields = ['id', 'descripcion']

class SISHelpFlatSerializer(serializers.ModelSerializer):
    # pull in the parent SISAid.sub_item
    sub_item = serializers.CharField(source='sis_aid.sub_item', read_only=True)
    # nest the SISItem
    item     = SISItemSerializer(source='sis_aid.item',        read_only=True)

    class Meta:
        model  = SISHelp
        fields = ['id', 'descripcion', 'sub_item', 'item']

# class SISAidSerializer(serializers.ModelSerializer):
#     item = SISItemSerializer(read_only=True)  # ✅ Incluir detalles del ítem relacionado
#     item_id = serializers.PrimaryKeyRelatedField(
#         queryset=SISItem.objects.all(), source="item", write_only=True
#     )

#     class Meta:
#         model = SISAid
#         fields = ['id', 'sub_item', 'aid', 'item', 'item_id']


# class SISAidSerializer(serializers.ModelSerializer):
#     item = SISItemSerializer(read_only=True)
#     item_id = serializers.PrimaryKeyRelatedField(
#         queryset=SISItem.objects.all(), source="item", write_only=True
#     )
#     ayudas = SISHelpSerializer(many=True, read_only=True)

#     class Meta:
#         model = SISAid
#         fields = ['id', 'sub_item', 'item', 'item_id', 'ayudas']




class SISAidSerializer(serializers.ModelSerializer):
    item = SISItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=SISItem.objects.all(), source="item", write_only=True
    )

    ayudas = SISHelpSerializer(many=True)

    class Meta:
        model = SISAid
        fields = ['id', 'sub_item', 'item', 'item_id', 'ayudas']

    def create(self, validated_data):
        ayudas_data = validated_data.pop("ayudas", [])
        sis_aid = SISAid.objects.create(**validated_data)
        for ayuda_data in ayudas_data:
            SISHelp.objects.create(sis_aid=sis_aid, **ayuda_data)
        return sis_aid

    def update(self, instance, validated_data):
        ayudas_data = validated_data.pop("ayudas", [])

        # Actualiza campos básicos
        instance.sub_item = validated_data.get("sub_item", instance.sub_item)
        instance.item = validated_data.get("item", instance.item)
        instance.save()

        # Elimina ayudas previas y reemplaza por las nuevas
        instance.ayudas.all().delete()
        for ayuda_data in ayudas_data:
            SISHelp.objects.create(sis_aid=instance, **ayuda_data)

        return instance

class CHGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = CHGroup
        fields = '__all__'

class CHItemSerializer(serializers.ModelSerializer):
    group = CHGroupSerializer(read_only=True)
    group_id = serializers.PrimaryKeyRelatedField(
        queryset=CHGroup.objects.all(), source="group", write_only=True
    )

    class Meta:
        model = CHItem
        fields = ['id', 'name', 'group', 'group_id', 'aid']