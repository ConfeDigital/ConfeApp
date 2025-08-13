from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from .views import home_view

urlpatterns = [
    path("", home_view, name="home"),
    path("admin/", admin.site.urls),
    path("api/token/", TokenObtainPairView.as_view(), name="get_token"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="refresh"),
    #path("api-auth/", include("rest_framework.urls")),
    path("api/auth/", include('djoser.urls')),
    path("api/auth/", include('djoser.urls.jwt')),
    path("api/", include("api.urls")),
    path('api/appointments/', include('mycalendar.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/cuestionarios/', include('cuestionarios.urls')),
    path('api/oauth2/', include('django_auth_adfs.urls')),
    path('api/discapacidad/', include('discapacidad.urls')),
    path('api/candidatos/', include('candidatos.urls')),
    path('api/postal-code/', include('postalcodes_mexico.urls')),
    path('api/tablas-de-equivalencia/', include('tablas_de_equivalencia.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/agencia/', include('agencia.urls')),
    path('api/seguimiento/', include('seguimiento.urls')),
    path('api/centros/', include('centros.urls')),
    path('api/communications/', include('communications.urls')),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
