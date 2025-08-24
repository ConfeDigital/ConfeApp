# communications/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CenterMessageViewSet, CommunicationPostViewSet, ForumTopicViewSet, ForumReplyViewSet

router = DefaultRouter()
router.register(r'comunicados', CommunicationPostViewSet)
router.register(r'center-chat', CenterMessageViewSet)
router.register(r'forum/topics', ForumTopicViewSet, basename='forumtopic')
router.register(r'forum/replies', ForumReplyViewSet, basename='forumreply')

urlpatterns = [
    path('', include(router.urls)),
]