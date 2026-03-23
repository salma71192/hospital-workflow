from django.shortcuts import render
from users.decorators import role_required

@role_required(['visitors'])
def visitors_dashboard(request):
    # Add your dashboard logic here
    # Example: list visitor logs or appointments
    visitors_data = []  # Replace with real query
    context = {
        'visitors_data': visitors_data,
    }
    return render(request, "visitors/dashboard.html", context)