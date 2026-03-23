from django.urls import path
from . import views

urlpatterns = [
    path('', views.callcenter_dashboard, name='callcenter_dashboard'),
]