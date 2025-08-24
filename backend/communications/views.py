from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import Group
from django.db.models import Q

from .models import CenterMessage, CommunicationPost, ForumTopic, ForumReply, ForumFile
from .serializers import CenterMessageSerializer, CommunicationPostSerializer, ForumTopicSerializer, ForumTopicDetailSerializer, ForumReplySerializer, ForumFileSerializer
from api.permissions import GerentePermission, IsAdminUserOrReadOnly, PersonalPermission
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


class ForumTopicViewSet(viewsets.ModelViewSet):
    queryset = ForumTopic.objects.all()
    serializer_class = ForumTopicSerializer
    permission_classes = [IsAuthenticated, PersonalPermission]  # Add GerentePermission if needed
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return ForumTopic.objects.all().order_by('-is_pinned', '-updated_at')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ForumTopicDetailSerializer
        return ForumTopicSerializer

    def perform_create(self, serializer):
        topic = serializer.save(author=self.request.user)
        
        # Handle file uploads
        files = self.request.FILES.getlist('files')
        for file in files:
            ForumFile.objects.create(
                topic=topic,
                file=file,
                original_name=file.name
            )

    def retrieve(self, request, *args, **kwargs):
        topic = self.get_object()
        # Increment view count
        topic.views += 1
        topic.save(update_fields=['views'])
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        """Add a reply to a topic"""
        topic = self.get_object()
        
        if topic.is_locked:
            return Response(
                {'error': 'This topic is locked'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        content = request.data.get('content', '').strip()
        if not content:
            return Response(
                {'error': 'Content cannot be empty'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            reply = ForumReply.objects.create(
                topic=topic,
                author=request.user,
                content=content
            )
            
            # Handle file uploads for reply
            files = request.FILES.getlist('files')
            for file in files:
                ForumFile.objects.create(
                    reply=reply,
                    file=file,
                    original_name=file.name
                )
            
            # Update topic's updated_at timestamp
            topic.save(update_fields=['updated_at'])
        
        serializer = ForumReplySerializer(reply, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def toggle_pin(self, request, pk=None):
        """Toggle pin status (admin only)"""
        topic = self.get_object()
        if not request.user.is_staff:  # Add proper admin check
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        topic.is_pinned = not topic.is_pinned
        topic.save(update_fields=['is_pinned'])
        
        return Response({'is_pinned': topic.is_pinned})

    @action(detail=True, methods=['post'])
    def toggle_lock(self, request, pk=None):
        """Toggle lock status (admin only)"""
        topic = self.get_object()
        if not request.user.is_staff:  # Add proper admin check
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        topic.is_locked = not topic.is_locked
        topic.save(update_fields=['is_locked'])
        
        return Response({'is_locked': topic.is_locked})

class ForumReplyViewSet(viewsets.ModelViewSet):
    queryset = ForumReply.objects.all()
    serializer_class = ForumReplySerializer
    permission_classes = [IsAuthenticated, PersonalPermission]  # Add GerentePermission if needed
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return ForumReply.objects.all().order_by('created_at')

    def perform_create(self, serializer):
        reply = serializer.save(author=self.request.user)
        
        # Handle file uploads
        files = self.request.FILES.getlist('files')
        for file in files:
            ForumFile.objects.create(
                reply=reply,
                file=file,
                original_name=file.name
            )

    def perform_update(self, serializer):
        reply = serializer.save(is_edited=True)

    def update(self, request, *args, **kwargs):
        reply = self.get_object()
        
        # Check if user can edit this reply
        if reply.author != request.user:
            return Response(
                {'error': 'You can only edit your own replies'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        reply = self.get_object()
        
        # Check if user can delete this reply
        if reply.author != request.user and not request.user.is_staff:
            return Response(
                {'error': 'You can only delete your own replies'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)


class CenterMessageViewSet(viewsets.ModelViewSet):
    queryset = CenterMessage.objects.all().order_by('sent_at')
    serializer_class = CenterMessageSerializer
    permission_classes = [IsAuthenticated, GerentePermission]

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)