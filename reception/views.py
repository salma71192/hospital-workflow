from django.shortcuts import render
from users.decorators import role_required
from django.utils import timezone
from patients.models import Patient
from django.contrib.auth import get_user_model

User = get_user_model()


@role_required(['reception'])
def reception_dashboard(request):

    today = timezone.now().date()

    patients_today = Patient.objects.filter(
        created_by=request.user,
        created_at__date=today
    ).count()

    patients_month = Patient.objects.filter(
        created_by=request.user,
        created_at__month=today.month,
        created_at__year=today.year
    ).count()

    physios = User.objects.filter(role='physiotherapist')

    context = {
        "patients_today": patients_today,
        "patients_month": patients_month,
        "tasks": [],
        "physios": physios,
    }

    return render(request, "reception/dashboard.html", context)