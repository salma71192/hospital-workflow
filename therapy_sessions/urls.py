from django.urls import path
from . import views  # <- make sure this exists

urlpatterns = [
    path('assign/<int:patient_id>/', views.assign_session, name='assign_session'),
]