from datetime import timedelta

from django.http import JsonResponse
from django.utils import timezone
from django.db.models import Count, Q
from django.contrib.auth import get_user_model

from patients.models import Patient
from reception.models import PatientAssignment
from callcenter.models import Appointment   # ✅ IMPORTANT

User = get_user_model()


# ================= DASHBOARD =================

def dashboard(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authorized"}, status=403)

    today = timezone.localdate()

    patients_today = Patient.objects.filter(
        created_by=request.user,
        created_at__date=today,
    ).count()

    patients_month = Patient.objects.filter(
        created_by=request.user,
        created_at__month=today.month,
        created_at__year=today.year,
    ).count()

    physios = User.objects.filter(role__in=["physio", "physiotherapist"])

    return JsonResponse({
        "patients_today": patients_today,
        "patients_month": patients_month,
        "tasks": [],
        "physios": [
            {
                "id": p.id,
                "username": p.username,
                "name": getattr(p, "name", p.username),
            }
            for p in physios
        ],
    })


# ================= REGISTRATION STATS =================

def my_registration_stats_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authorized"}, status=403)

    today_value = timezone.localdate()
    month_start = today_value.replace(day=1)

    today_files_qs = Patient.objects.filter(
        created_by=request.user,
        created_at__date=today_value,
    )

    month_files_qs = Patient.objects.filter(
        created_by=request.user,
        created_at__date__gte=month_start,
        created_at__date__lte=today_value,
    )

    today_assignments_qs = PatientAssignment.objects.filter(
        created_by=request.user,
        assignment_date=today_value,
    )

    month_assignments_qs = PatientAssignment.objects.filter(
        created_by=request.user,
        assignment_date__gte=month_start,
        assignment_date__lte=today_value,
    )

    daily_rows = []

    for i in range(6, -1, -1):
        day = today_value - timedelta(days=i)

        file_count = Patient.objects.filter(
            created_by=request.user,
            created_at__date=day,
        ).count()

        assignment_count = PatientAssignment.objects.filter(
            created_by=request.user,
            assignment_date=day,
        ).count()

        daily_rows.append({
            "date": str(day),
            "label": day.strftime("%d %b"),
            "count": file_count + assignment_count,
            "new_files": file_count,
            "assignments": assignment_count,
        })

    today_total = today_files_qs.count() + today_assignments_qs.count()
    monthly_total = month_files_qs.count() + month_assignments_qs.count()

    return JsonResponse({
        "today": today_total,
        "monthly": monthly_total,
        "daily": daily_rows,
    })


# ================= LEADERBOARD =================

def leaderboard_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authorized"}, status=403)

    scope = (request.GET.get("scope") or "reception").lower()

    today = timezone.localdate()
    month_start = today.replace(day=1)

    rows = []

    # ================= CALL CENTER =================
    if scope == "callcenter":
        users = User.objects.filter(role__icontains="call")

        for user in users:
            rows.append({
                "user_id": user.id,
                "name": user.username,
                "role": user.role,
                "today": Appointment.objects.filter(
                    created_by=user,
                    created_at__date=today,
                ).count(),
                "monthly": Appointment.objects.filter(
                    created_by=user,
                    created_at__date__gte=month_start,
                    created_at__date__lte=today,
                ).count(),
            })

    # ================= RECEPTION =================
    elif scope == "reception":
        users = User.objects.filter(role__icontains="reception")

        for user in users:
            today_files = Patient.objects.filter(
                created_by=user,
                created_at__date=today,
            ).count()

            month_files = Patient.objects.filter(
                created_by=user,
                created_at__date__gte=month_start,
                created_at__date__lte=today,
            ).count()

            today_assignments = PatientAssignment.objects.filter(
                created_by=user,
                assignment_date=today,
            ).count()

            month_assignments = PatientAssignment.objects.filter(
                created_by=user,
                assignment_date__gte=month_start,
                assignment_date__lte=today,
            ).count()

            rows.append({
                "user_id": user.id,
                "name": user.username,
                "role": user.role,
                "today": today_files + today_assignments,
                "monthly": month_files + month_assignments,
            })

    # ================= PHYSIO =================
    elif scope == "physio":
        users = User.objects.filter(role__icontains="physio")

        for user in users:
            rows.append({
                "user_id": user.id,
                "name": user.username,
                "role": user.role,
                "today": Appointment.objects.filter(
                    therapist=user,
                    appointment_date=today,
                ).count(),
                "monthly": Appointment.objects.filter(
                    therapist=user,
                    appointment_date__gte=month_start,
                    appointment_date__lte=today,
                ).count(),
            })

    else:
        return JsonResponse({"error": "Invalid scope"}, status=400)

    # ✅ sort by monthly performance
    rows = sorted(rows, key=lambda x: x["monthly"], reverse=True)

    return JsonResponse({
        "scope": scope,
        "leaderboard": rows,
    })
