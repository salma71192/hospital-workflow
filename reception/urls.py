from django.urls import path
from . import views

urlpatterns = [
    path('', views.reception_dashboard, name='reception_dashboard'),
]