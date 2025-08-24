# communications/serializers.py
from rest_framework import serializers
from .models import CenterMessage, CommunicationPost, ForumTopic, ForumReply, ForumFile
from django.contrib.auth import get_user_model

User = get_user_model()

class CreatedBySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email']

class CommunicationPostSerializer(serializers.ModelSerializer):
    created_by = CreatedBySerializer(read_only=True)

    class Meta:
        model = CommunicationPost
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']


class ForumFileSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    file_size = serializers.SerializerMethodField()

    class Meta:
        model = ForumFile
        fields = ['id', 'file_url', 'file_type', 'original_name', 'file_size', 'uploaded_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

    def get_file_size(self, obj):
        try:
            return obj.file.size
        except:
            return 0

class ForumReplySerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_center = serializers.SerializerMethodField()
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    files = ForumFileSerializer(many=True, read_only=True)
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = ForumReply
        fields = [
            'id', 'author_id', 'author_name', 'author_center', 'content', 
            'created_at', 'updated_at', 'is_edited', 'files', 'can_edit'
        ]

    def get_author_name(self, obj):
        return f"{obj.author.first_name} {obj.author.last_name}"

    def get_author_center(self, obj):
        return obj.author.center.name if obj.author.center else "Sin centro"

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.author == request.user
        return False

class ForumTopicSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_center = serializers.SerializerMethodField()
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    reply_count = serializers.ReadOnlyField()
    last_reply_at = serializers.SerializerMethodField()
    last_reply_author = serializers.SerializerMethodField()
    files = ForumFileSerializer(many=True, read_only=True)
    can_edit = serializers.SerializerMethodField()
    
    class Meta:
        model = ForumTopic
        fields = [
            'id', 'title', 'description', 'author_id', 'author_name', 'author_center',
            'created_at', 'updated_at', 'is_pinned', 'is_locked', 'views',
            'reply_count', 'last_reply_at', 'last_reply_author', 'files', 'can_edit'
        ]

    def get_author_name(self, obj):
        return f"{obj.author.first_name} {obj.author.last_name}"

    def get_author_center(self, obj):
        return obj.author.center.name if obj.author.center else "Sin centro"

    def get_last_reply_at(self, obj):
        last_reply = obj.last_reply
        return last_reply.created_at if last_reply else obj.created_at

    def get_last_reply_author(self, obj):
        last_reply = obj.last_reply
        if last_reply:
            return f"{last_reply.author.first_name} {last_reply.author.last_name}"
        return f"{obj.author.first_name} {obj.author.last_name}"

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.author == request.user
        return False

class ForumTopicDetailSerializer(ForumTopicSerializer):
    replies = ForumReplySerializer(many=True, read_only=True)
    
    class Meta(ForumTopicSerializer.Meta):
        fields = ForumTopicSerializer.Meta.fields + ['replies']


class CenterMessageSerializer(serializers.ModelSerializer):
    center = serializers.SerializerMethodField()
    sender_name = serializers.SerializerMethodField()
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)

    class Meta:
        model = CenterMessage
        fields = ['id', 'sender_id', 'sender_name', 'center', 'text', 'sent_at']

    def get_center(self, obj):
        return obj.sender.center.name if obj.sender.center else "Sin centro"

    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}"