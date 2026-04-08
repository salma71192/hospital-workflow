from django.urls import path
from .api_views import (
    therapists_api,
    slots_api,
    bookings_api,
    today_bookings_api,
    monthly_bookings_api,
    future_bookings_api,
)

urlpatterns = [
    path("therapists/", therapists_api, name="callcenter_therapists_api"),
    path("slots/", slots_api, name="callcenter_slots_api"),
    path("bookings/", bookings_api, name="callcenter_bookings_api"),
    path("bookings/today/", today_bookings_api, name="callcenter_today_bookings_api"),
    path("bookings/monthly/", monthly_bookings_api, name="callcenter_monthly_bookings_api"),
    path("bookings/future/", future_bookings_api, name="callcenter_future_bookings_api"),
]