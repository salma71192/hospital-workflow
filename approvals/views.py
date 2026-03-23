from django.shortcuts import render
from users.decorators import role_required

@role_required(['approvals'])
def approvals_dashboard(request):
    # Add your dashboard logic here
    # Example: pending approvals
    pending_approvals = []  # Replace with real query
    context = {
        'pending_approvals': pending_approvals,
    }
    return render(request, "approvals/dashboard.html", context)