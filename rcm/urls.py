from django.urls import path
from . import views

urlpatterns = [
    path('', views.rcm_dashboard, name='rcm_dashboard'),
]