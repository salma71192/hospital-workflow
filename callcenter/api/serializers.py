def serialize_booking(booking):
    return {
        "id": booking.id,
        "patient_db_id": booking.patient.id,
        "patient_name": booking.patient.name,
        "patient_id": booking.patient.patient_id,
        "therapist_name": booking.therapist.username,
        "therapist_id": booking.therapist.id,
        "appointment_date": str(booking.appointment_date),
        "appointment_time": booking.appointment_time.strftime("%H:%M"),
        "notes": booking.notes or "",
        "created_by_name": booking.created_by.username if booking.created_by else "",
        "created_by_id": booking.created_by.id if booking.created_by else None,
        "attendance_status": getattr(booking, "attendance_status", "no_show"),
        "attended_at": booking.attended_at.isoformat() if getattr(booking, "attended_at", None) else None,
    }


def serialize_user(user):
    return {
        "id": user.id,
        "name": user.username,
    }