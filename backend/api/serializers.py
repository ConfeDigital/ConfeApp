from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from centros.serializers import CenterSerializer
from centros.models import Center

User = get_user_model()

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name']

class UserSerializer(serializers.ModelSerializer):
    groups = GroupSerializer(many=True, read_only=True)
    groups_names = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
    )
    # Make password write-only *and* not required
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,        # blank means “don’t change”
        style={'input_type': 'password'}
    )

    center = CenterSerializer(read_only=True)
    center_id = serializers.PrimaryKeyRelatedField(queryset=Center.objects.all(), write_only=True, source='center', required=False)

    class Meta:
        model = User
        fields = [
            "id", "email", "password", "is_active",
            "first_name", "second_last_name", "last_name",
            "is_staff", "groups", "groups_names", "center", "center_id"
        ]
        extra_kwargs = {
            # we already declared password above, but just in case:
            "password": {"write_only": True},
        }

    def validate_password(self, value):
        # only validate length if non-blank
        if value and len(value) < 6:
            raise serializers.ValidationError("Password must be at least 6 characters long.")
        return value

    def create(self, validated_data):
        groups_names = validated_data.pop('groups_names', ["personal"])
        is_staff     = validated_data.pop('is_staff', False)

        # pop password (it *must* be present on create!)
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({"password": "This field is required."})

        # use your custom manager
        user = User.objects.create_user(
            **validated_data,
            password=password,
            is_staff=is_staff
        )

        # assign groups
        for name in groups_names:
            grp, _ = Group.objects.get_or_create(name=name.lower())
            user.groups.add(grp)

        return user

    def update(self, instance, validated_data):
        # handle password if provided
        password      = validated_data.pop('password', None)
        groups_names  = validated_data.pop('groups_names', None)
        is_staff      = validated_data.pop('is_staff', None)

        # update normal fields
        for attr, val in validated_data.items():
            setattr(instance, attr, val)

        # update staff flag
        if is_staff is not None:
            instance.is_staff = is_staff

        # update groups if sent
        if groups_names is not None:
            instance.groups.clear()
            for name in groups_names:
                grp, _ = Group.objects.get_or_create(name=name.lower())
                instance.groups.add(grp)

        instance.save()

        # finally, change password if non-blank
        if password:
            instance.set_password(password)
            instance.save()

        return instance
