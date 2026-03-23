from django.urls import path
from . import views

urlpatterns = [
    path('', views.visitors_dashboard, name='visitors_dashboard'),
]