# users/views.py
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required

@login_required
def dashboard_redirect(request):
    user = request.user
    if user.is_superuser:
        return redirect('/admin-panel/')  # Use your actual admin URL
    # Check role first
    if user.role == 'reception':
        return redirect('reception_dashboard')
    elif user.role == 'physiotherapist':
        return redirect('physio_dashboard')
    elif user.role == 'callcenter':
        return redirect('callcenter_dashboard')
    elif user.role == 'approvals':
        return redirect('approvals_dashboard')
    elif user.role == 'rcm':
        return redirect('rcm_dashboard')
    elif user.role == 'visitors':
        return redirect('visitors_dashboard')

    # Finally fallback to admin if superuser
    if user.is_superuser:
        return redirect('/admin/')

    # fallback for other users
    return redirect('/')