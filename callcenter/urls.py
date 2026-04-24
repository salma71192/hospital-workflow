from django.urls import path

from callcenter.api.booking_views import (
    therapists_api,
    slots_api,
    bookings_api,
    booking_detail_api,
    booking_tracker_api,
    today_appointments_api,
    today_statistics_api,
    monthly_statistics_api,
)

urlpatterns = [
    path("therapists/", therapists_api, name="therapists_api"),
    path("slots/", slots_api, name="slots_api"),

    path("bookings/", bookings_api, name="bookings_api"),
    path("bookings/<int:booking_id>/", booking_detail_api, name="booking_detail_api"),

    path("bookings/tracker/", booking_tracker_api, name="booking_tracker_api"),
    path("bookings/today-appointments/", today_appointments_api, name="today_appointments_api"),

    path("bookings/today-statistics/", today_statistics_api, name="today_statistics_api"),
    path("bookings/monthly-statistics/", monthly_statistics_api, name="monthly_statistics_api"),
]