# physio/urls.py
from django.urls import path
from . import views  # import views locally

urlpatterns = [
    path('', views.physio_dashboard, name='physio_dashboard'),
]