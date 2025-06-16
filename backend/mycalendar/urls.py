from django.urls import path
from . import views

urlpatterns = [
    path("", views.AppointmentListCreate.as_view(), name="appointment-list-create"),
    path("<int:pk>/", views.AppointmentRetrieve.as_view(), name="appointment-retrieve"),
    path("delete/<int:pk>/", views.AppointmentDelete.as_view(), name="appointment-delete"),
    path("update/<int:pk>/", views.AppointmentUpdate.as_view(), name="appointment-update"),
]
