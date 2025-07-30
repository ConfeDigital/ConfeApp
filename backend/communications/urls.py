# communications/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CenterMessageViewSet, CommunicationPostViewSet

router = DefaultRouter()
router.register(r'comunicados', CommunicationPostViewSet)
router.register(r'center-chat', CenterMessageViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
