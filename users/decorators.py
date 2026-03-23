from django.shortcuts import redirect
from functools import wraps

def role_required(allowed_roles):
    """
    Decorator for views that only allows users with certain roles.
    If user role is not allowed, redirect to their own dashboard.
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            user = request.user

            # Redirect anonymous users to login
            if not user.is_authenticated:
                return redirect('/accounts/login/')

            # Superusers always go to admin panel
            if user.is_superuser:
                return view_func(request, *args, **kwargs)

            # Check if user's role is allowed
            if user.role not in allowed_roles:
                # Redirect to their dashboard if not allowed
                from users.views import dashboard_redirect
                return dashboard_redirect(request)

            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator