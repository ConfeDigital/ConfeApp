from rest_framework import serializers
from .models import Appointment
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name')  # Include other fields if needed

class AppointmentSerializer(serializers.ModelSerializer):
    attendees = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), many=True, write_only=True)
    attendees_details = UserSerializer(source='attendees', many=True, read_only=True)
    organizer_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True, source='organizer')
    organizer_details = UserSerializer(source='organizer', read_only=True)

    class Meta:
        model = Appointment
        fields = (
            'id', 'start_time', 'category', 'end_time', 'subject', 'is_all_day', 'attendees',
            'attendees_details', 'organizer_id', 'organizer_details', 'location',
            'body', 'sensitivity', 'importance', 'reminder_is_set',
            'reminder_minutes_before_start'
        )

    def create(self, validated_data):
        attendees_data = validated_data.pop('attendees', [])
        organizer_data = validated_data.pop('organizer')
        appointment = Appointment.objects.create(organizer=organizer_data, **validated_data)
        appointment.attendees.set(attendees_data)
        return appointment

    def update(self, instance, validated_data):
        attendees_data = validated_data.pop('attendees', instance.attendees.all())
        organizer_data = validated_data.pop('organizer', instance.organizer)

        instance.subject = validated_data.get('subject', instance.subject)
        instance.location = validated_data.get('location', instance.location)
        instance.start_time = validated_data.get('start_time', instance.start_time)
        instance.end_time = validated_data.get('end_time', instance.end_time)
        instance.is_all_day = validated_data.get('is_all_day', instance.is_all_day)
        instance.body = validated_data.get('body', instance.body)
        instance.sensitivity = validated_data.get('sensitivity', instance.sensitivity)
        instance.importance = validated_data.get('importance', instance.importance)
        instance.reminder_is_set = validated_data.get('reminder_is_set', instance.reminder_is_set)
        instance.reminder_minutes_before_start = validated_data.get('reminder_minutes_before_start', instance.reminder_minutes_before_start)
        instance.category = validated_data.get('category', instance.category)
        instance.organizer = organizer_data
        instance.attendees.set(attendees_data)
        instance.save()
        return instance