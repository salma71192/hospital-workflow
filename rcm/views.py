from django.shortcuts import render
from users.decorators import role_required

@role_required(['rcm'])
def rcm_dashboard(request):
    # Add your dashboard logic here
    # Example: revenue cycle management tasks
    rcm_tasks = []  # Replace with real query
    context = {
        'rcm_tasks': rcm_tasks,
    }
    return render(request, "rcm/dashboard.html", context)