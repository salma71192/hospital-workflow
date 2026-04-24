def serialize_booking(booking):
    return {
        "id": booking.id,

        # Patient
        "patient_db_id": booking.patient.id if booking.patient else None,
        "patient_name": booking.patient.name if booking.patient else "",
        "patient_id": booking.patient.patient_id if booking.patient else "",

        # Therapist
        "therapist_id": booking.therapist.id if booking.therapist else None,
        "therapist_name": booking.therapist.username if booking.therapist else "",

        # Appointment
        "appointment_date": str(booking.appointment_date) if booking.appointment_date else "",
        "appointment_time": (
            booking.appointment_time.strftime("%H:%M")
            if booking.appointment_time else ""
        ),

        # Booking details
        "notes": booking.notes or "",

        # Created by (IMPORTANT for filters)
        "created_by_id": booking.created_by.id if booking.created_by else None,
        "created_by_name": booking.created_by.username if booking.created_by else "",

        # Status
        "attendance_status": getattr(booking, "attendance_status", "no_show"),
        "attended_at": (
            booking.attended_at.isoformat()
            if getattr(booking, "attended_at", None)
            else None
        ),
    }


def serialize_user(user):
    return {
        "id": user.id,
        "name": user.username or "",
    }