from django.shortcuts import render
from users.decorators import role_required

@role_required(['callcenter'])
def callcenter_dashboard(request):
    # Example: tasks, calls, or appointments for call center
    call_tasks = []  # Replace with your query or logic
    context = {
        'call_tasks': call_tasks,
    }
    return render(request, "callcenter/dashboard.html", context)