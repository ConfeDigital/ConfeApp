from django.urls import path, include 
from .views import VerUsuarios, get_current_user, UserViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('usuarios/', VerUsuarios.as_view(), name='VerUsuarios'),
    path('usuarios/<uuid:user_id>/', VerUsuarios.as_view(), name='usuarios-detail'),  # Para obtener un usuario por ID
    path('current-user/', get_current_user, name='get_current_user'),
    path('', include(router.urls)),
]
