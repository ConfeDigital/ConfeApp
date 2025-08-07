from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import Group
from django.db.models import Q

from .models import CenterMessage, CommunicationPost
from .serializers import CenterMessageSerializer, CommunicationPostSerializer
from api.permissions import GerentePermission, IsAdminUserOrReadOnly
from notifications.views import send_notification_to_user  # adjust import path if needed
from django.contrib.auth import get_user_model

User = get_user_model()

class CommunicationPostViewSet(viewsets.ModelViewSet):
    queryset = CommunicationPost.objects.all().order_by('-created_at')
    serializer_class = CommunicationPostSerializer
    permission_classes = [IsAuthenticated, IsAdminUserOrReadOnly]

    def perform_create(self, serializer):
        post = serializer.save(created_by=self.request.user)

        try:
            personal_group = Group.objects.get(name='personal')
            recipients = User.objects.filter(groups=personal_group).exclude(id=self.request.user.id).distinct()

            mensaje = f"Nuevo comunicado: {post.title}"

            for user in recipients:
                send_notification_to_user(user.id, mensaje, link='/anuncios')

        except Group.DoesNotExist:
            pass  # optionally log this

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class CenterMessageViewSet(viewsets.ModelViewSet):
    queryset = CenterMessage.objects.all().order_by('sent_at')
    serializer_class = CenterMessageSerializer
    permission_classes = [IsAuthenticated, GerentePermission]

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)