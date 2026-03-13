from django.urls import path
from . import views

urlpatterns = [
    path('search/', views.search_patient, name='search_patient'),
    path("<int:patient_id>/", views.patient_profile, name="patient_profile"),
]