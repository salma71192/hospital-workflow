from django.urls import path

from callcenter.api.booking_views import (
    therapists_api,
    slots_api,
    bookings_api,
    booking_detail_api,
    today_bookings_api,
    today_appointments_api,
    today_statistics_api,
    monthly_bookings_api,
    future_bookings_api,
)

urlpatterns = [
    path("therapists/", therapists_api, name="therapists_api"),
    path("slots/", slots_api, name="slots_api"),
    path("bookings/", bookings_api, name="bookings_api"),
    path("bookings/<int:booking_id>/", booking_detail_api, name="booking_detail_api"),
    path("bookings/today/", today_bookings_api, name="today_bookings_api"),
    path("bookings/today-appointments/", today_appointments_api, name="today_appointments_api"),
    path("bookings/today-statistics/", today_statistics_api, name="today_statistics_api"),
    path("bookings/monthly/", monthly_bookings_api, name="monthly_bookings_api"),
    path("bookings/future/", future_bookings_api, name="future_bookings_api"),
]