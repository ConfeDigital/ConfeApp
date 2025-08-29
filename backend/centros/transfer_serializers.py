from rest_framework import serializers
from .models import TransferRequest, Center
from api.serializers import UserSerializer
from centros.serializers import CenterSerializer
from django.contrib.auth import get_user_model
from api.fields import SASImageField

User = get_user_model()

class TransferRequestSerializer(serializers.ModelSerializer):
    requester = UserSerializer(read_only=True)
    requested_user = UserSerializer(read_only=True)
    source_center = CenterSerializer(read_only=True)
    destination_center = CenterSerializer(read_only=True)
    responder = UserSerializer(read_only=True)

    requested_user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True, source='requested_user')
    destination_center_id = serializers.PrimaryKeyRelatedField(queryset=Center.objects.all(), write_only=True, source='destination_center')

    photo = SASImageField(read_only=True, required=False, source='requested_user.userprofile.photo')

    class Meta:
        model = TransferRequest
        fields = '__all__'
        read_only_fields = ['status', 'requested_at', 'responded_at', 'responder', 'source_center', 'requester', 'photo']

    def create(self, validated_data):
        validated_data['requester'] = self.context['request'].user
        validated_data['source_center'] = self.context['request'].user.center
        return super().create(validated_data)

    def validate(self, data):
        """
        Check for duplicate pending requests.  This is necessary because we can't express
        the conditional uniqueness in the Meta class.
        """
        # When creating, the status will be the default 'pending'.
        # When updating, the status might be in the data.
        status = data.get('status', 'pending')

        if status == 'pending':
            requested_user = data['requested_user']
            destination_center = data['destination_center']

            existing_pending_request = TransferRequest.objects.filter(
                requested_user=requested_user,
                destination_center=destination_center,
                status='pending'
            )
            if self.instance:
                existing_pending_request = existing_pending_request.exclude(pk=self.instance.pk)

            if existing_pending_request.exists():
                raise serializers.ValidationError(
                    "A pending transfer request already exists for this user and destination center."
                )

        if 'requested_user' in data and 'request' in self.context and self.context['request'].user:
            if data['requested_user'] == self.context['request'].user:
                raise serializers.ValidationError("No puedes solicitar una transferencia para ti mismo.")

            if data['requested_user'].center != self.context['request'].user.center:
                raise serializers.ValidationError("Solo puedes solicitar una transferencia para usuarios que pertenecen a tu centro actual.")

            if data['requested_user'].center == data['destination_center']:
                raise serializers.ValidationError("El usuario ya pertenece al centro de destino.")

            if data['destination_center'] == self.context['request'].user.center:
                raise serializers.ValidationError("El centro de destino no puede ser tu centro actual.")

        return data