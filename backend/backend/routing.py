from django.urls import path
from notifications.consumers import NotificationConsumer
from api.consumers import UserUpdateConsumer

websocket_urlpatterns = [
    path("ws/notifications/", NotificationConsumer.as_asgi()),
    path("ws/user-updates/", UserUpdateConsumer.as_asgi()),
]
