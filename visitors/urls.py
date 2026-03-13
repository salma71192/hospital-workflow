# <app>/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='visitors_dashboard'),  # main dashboard for Visitors
]