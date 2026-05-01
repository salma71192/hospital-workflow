from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required, user_passes_test
from .forms import UserCreateForm

# ----------------------------
# Dashboard redirect
# ----------------------------
@login_required
def dashboard_redirect(request):
    user = request.user
    if user.is_superuser:
        return redirect('/admin-panel/')  # change if your admin URL is different

    role_dashboards = {
        'reception': 'reception_dashboard',
        'physiotherapist': 'physio_dashboard',
        'callcenter': 'callcenter_dashboard',
        'approvals': 'approvals_dashboard',
        'rcm': 'rcm_dashboard',
        'visitors': 'visitors_dashboard',
        'admin': '/admin-panel/',
    }

    return redirect(role_dashboards.get(user.role, '/'))

# ----------------------------
# Create new user
# ----------------------------
def is_admin(user):
    return user.is_superuser

@user_passes_test(is_admin)
def create_user(request):
    if request.method == 'POST':
        form = UserCreateForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password'])
            if user.role == 'admin':
                user.is_superuser = True
                user.is_staff = True
            else:
                user.is_superuser = False
                user.is_staff = False
            user.save()
            return redirect('dashboard_redirect')
    else:
        form = UserCreateForm()
    return render(request, 'users/create_user.html', {'form': form})


