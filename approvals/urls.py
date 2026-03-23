from django.urls import path
from . import views

urlpatterns = [
    path('', views.approvals_dashboard, name='approvals_dashboard'),
]