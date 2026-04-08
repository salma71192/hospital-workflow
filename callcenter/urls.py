from django.urls import path
from .api_views import (
    therapists_api,
    slots_api,
    bookings_api,
    booking_detail_api,  # ✅ ADD THIS
    today_bookings_api,
    monthly_bookings_api,
    future_bookings_api,
)

urlpatterns = [
    path("therapists/", therapists_api),
    path("slots/", slots_api),
    path("bookings/", bookings_api),

    # ✅ IMPORTANT (EDIT / DELETE)
    path("bookings/<int:booking_id>/", booking_detail_api),

    path("bookings/today/", today_bookings_api),
    path("bookings/monthly/", monthly_bookings_api),
    path("bookings/future/", future_bookings_api),
]