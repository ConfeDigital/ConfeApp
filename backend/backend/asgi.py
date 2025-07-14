import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

settings_module = 'backend.deployment' if 'WEBSITE_HOSTNAME' in os.environ else 'backend.settings'
os.environ.setdefault("DJANGO_SETTINGS_MODULE", settings_module)

django.setup()

from middleware.jwt_auth import JWTAuthMiddlewareStack
from .routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddlewareStack(
        AuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})