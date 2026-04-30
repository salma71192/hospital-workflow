from datetime import timedelta

from django.shortcuts import render
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
        created_at__date=today
    ).count()

    patients_month = Patient.objects.filter(
        created_by=request.user,
        created_at__month=today.month,
        created_at__year=today.year
    ).count()

    physios = User.objects.filter(role__in=["physio", "physiotherapist"])

    context = {
        "patients_today": patients_today,
        "patients_month": patients_month,
        "tasks": [],
        "physios": physios,
    }

    # If using template:
    # return render(request, "reception/dashboard.html", context)

    # If using React frontend:
    return JsonResponse(context)


# ================= REGISTRATION STATS =================

def my_registration_stats_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authorized"}, status=403)

    today_value = timezone.localdate()
    month_start = today_value.replace(day=1)

    # ================= BASE QUERYSETS =================

    today_qs = PatientAssignment.objects.filter(
        created_by=request.user,
        assignment_date=today_value,
    )

    month_qs = PatientAssignment.objects.filter(
        created_by=request.user,
        assignment_date__gte=month_start,
        assignment_date__lte=today_value,
    )

    # ================= DAILY CHART (LAST 7 DAYS) =================

    daily_rows = []

    for i in range(6, -1, -1):
        day = today_value - timedelta(days=i)

        count = PatientAssignment.objects.filter(
            created_by=request.user,
            assignment_date=day,
        ).count()

        daily_rows.append({
            "date": str(day),
            "label": day.strftime("%d %b"),
            "count": count,
        })

    # ================= PER PHYSIO =================

    therapist_rows = (
        month_qs.values("therapist_id", "therapist__username")
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

    # ================= CATEGORY BREAKDOWN =================

    category_rows = (
        month_qs.values("category")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    categories_data = [
        {
            "category": row["category"] or "unknown",
            "label": (row["category"] or "unknown").replace("_", " ").title(),
            "count": row["count"],
        }
        for row in category_rows
    ]

    # ================= CONVERSION =================

    appointment_count = month_qs.filter(category="appointment").count()

    walk_in_count = month_qs.filter(category="walk_in").count()

    initial_eval_count = month_qs.filter(
        Q(category="initial_evaluation") | Q(category="initial_eval")
    ).count()

    total_count = month_qs.count()

    # ================= RESPONSE =================

    return JsonResponse({
        "today": today_qs.count(),
        "monthly": total_count,
        "daily": daily_rows,
        "therapists": therapists_data,
        "categories": categories_data,
        "conversion": {
            "appointment": appointment_count,
            "walk_in": walk_in_count,
            "initial_eval": initial_eval_count,
            "total": total_count,
        },
    })