# rcm/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='rcm_dashboard'),  # main dashboard for RCM
]