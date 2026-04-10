from django.urls import path
from .api_views import (
    therapists_api,
    slots_api,
    bookings_api,
    booking_detail_api,
    today_bookings_api,
    monthly_bookings_api,
    future_bookings_api,
)

urlpatterns = [
    path("therapists/", therapists_api, name="therapists_api"),
    path("slots/", slots_api, name="slots_api"),

    # CREATE
    path("bookings/", bookings_api, name="bookings_api"),

    # UPDATE / DELETE
    path("bookings/<int:booking_id>/", booking_detail_api, name="booking_detail_api"),

    # TRACKERS
    path("bookings/today/", today_bookings_api, name="today_bookings_api"),
    path("bookings/monthly/", monthly_bookings_api, name="monthly_bookings_api"),
    path("bookings/future/", future_bookings_api, name="future_bookings_api"),
]