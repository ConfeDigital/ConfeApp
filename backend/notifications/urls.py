from django.urls import path
from . import views

urlpatterns = [
    path("", views.NotificationListView.as_view(), name="notifications-list"),
    path("<int:notification_id>/", views.NotificationListView.as_view(), name="notification-detail"),
]
