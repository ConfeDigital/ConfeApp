from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from rest_framework import status
from .models import Appointment
from .serializers import AppointmentSerializer, UserSerializer
from django.contrib.auth import get_user_model
from notifications.views import send_notification_to_user

User = get_user_model()


class AppointmentListCreate(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        appointments = Appointment.objects.filter(attendees=request.user) | Appointment.objects.filter(organizer=request.user)
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()

        # Automatically set the creating user as the organizer
        data['organizer_id'] = request.user.id

        serializer = AppointmentSerializer(data=data)
        if serializer.is_valid():
            appointment = serializer.save()

            # Send notifications to attendees (excluding the organizer)
            for attendee in appointment.attendees.all():
                if attendee != request.user:
                    send_notification_to_user(
                        attendee.id,
                        f"Te han agregado al evento de calendario: {appointment.subject}",
                        link='/calendar'
                    )

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AppointmentRetrieve(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk)
            # Ensure the requesting user is either an attendee or the organizer
            if request.user in appointment.attendees.all() or request.user == appointment.organizer:
                serializer = AppointmentSerializer(appointment)
                return Response(serializer.data)
            else:
                return Response(status=status.HTTP_403_FORBIDDEN, data={"detail": "You do not have permission to view this appointment."})
        except Appointment.DoesNotExist:
            raise NotFound(detail="Appointment not found", code=404)

class AppointmentDelete(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk)
            if appointment.organizer == request.user:
                appointment.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)
            else:
                return Response(status=status.HTTP_403_FORBIDDEN, data={"detail": "Only the organizer can delete this appointment."})
        except Appointment.DoesNotExist:
            raise NotFound(detail="Appointment not found", code=404)

class AppointmentUpdate(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            raise NotFound("Evento no encontrado")

        if appointment.organizer != request.user:
            return Response(
                {"detail": "Solo el organizador puede actualizar este evento."},
                status=status.HTTP_403_FORBIDDEN
            )

        original_attendees = set(appointment.attendees.values_list('id', flat=True))

        serializer = AppointmentSerializer(
            appointment, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        updated_appointment = serializer.save()

        updated_appointment.refresh_from_db()

        new_attendees = set(
            updated_appointment.attendees.values_list('id', flat=True)
        )
        added_attendees = new_attendees - original_attendees

        for attendee_id in added_attendees:
            if attendee_id == request.user.id:
                continue
            send_notification_to_user(
                attendee_id,
                f"Te han agregado al evento: {updated_appointment.subject}",
                link='/calendar'
            )

        return Response(serializer.data, status=status.HTTP_200_OK)