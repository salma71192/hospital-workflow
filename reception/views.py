from datetime import timedelta

from django.http import JsonResponse
from django.utils import timezone
from django.db.models import Count, Q
from django.contrib.auth import get_user_model

from patients.models import Patient
from reception.models import PatientAssignment

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

    # New patient files opened by receptionist
    today_files_qs = Patient.objects.filter(
        created_by=request.user,
        created_at__date=today_value,
    )

    month_files_qs = Patient.objects.filter(
        created_by=request.user,
        created_at__date__gte=month_start,
        created_at__date__lte=today_value,
    )

    # Assignments made by receptionist
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

    therapist_rows = (
        month_assignments_qs.values("therapist_id", "therapist__username")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    therapists_data = [
        {
            "therapist_id": row["therapist_id"],
            "therapist_name": row["therapist__username"] or "No Physio",
            "count": row["count"],
        }
        for row in therapist_rows
    ]

    category_rows = (
        month_assignments_qs.values("category")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    categories_data = [
        {
            "category": "new_files",
            "label": "New Files",
            "count": month_files_qs.count(),
        }
    ]

    categories_data += [
        {
            "category": row["category"] or "unknown",
            "label": (row["category"] or "unknown").replace("_", " ").title(),
            "count": row["count"],
        }
        for row in category_rows
    ]

    appointment_count = month_assignments_qs.filter(category="appointment").count()
    walk_in_count = month_assignments_qs.filter(category="walk_in").count()
    initial_eval_count = month_assignments_qs.filter(
        Q(category="initial_evaluation") | Q(category="initial_eval")
    ).count()

    today_total = today_files_qs.count() + today_assignments_qs.count()
    monthly_total = month_files_qs.count() + month_assignments_qs.count()

    return JsonResponse({
        "today": today_total,
        "monthly": monthly_total,
        "daily": daily_rows,
        "therapists": therapists_data,
        "categories": categories_data,
        "conversion": {
            "new_files": month_files_qs.count(),
            "appointment": appointment_count,
            "walk_in": walk_in_count,
            "initial_eval": initial_eval_count,
            "assignments": month_assignments_qs.count(),
            "total": monthly_total,
        },
    })