import os
from django.core.asgi import get_asgi_application

settings_module = 'backend.deployment' if 'WEBSITE_HOSTNAME' in os.environ else 'backend.settings'
os.environ.setdefault("DJANGO_SETTINGS_MODULE", settings_module)

# Initialize Django ASGI application early to avoid double setup
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from middleware.jwt_auth import JWTAuthMiddlewareStack
from .routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddlewareStack(
        AuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})