
from django.urls import path
from . import views

urlpatterns = [
    path("claims/", views.claims_list_create, name="rcm-claims"),
    path(
        "renewal-alerts/",
        views.renewal_alerts_list_create,
        name="rcm-renewal-alerts",
    ),
]
