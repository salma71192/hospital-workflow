from django.shortcuts import redirect
from django.urls import reverse

class RoleRedirectMiddleware:
    """
    Redirect users trying to access panels that are not allowed for their role.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only check authenticated users
        if request.user.is_authenticated:
            path = request.path

            # Admin panel: only superuser
            if path.startswith('/admin-panel/') and not request.user.is_superuser:
                return redirect('dashboard_redirect')

            # Reception panel
            if path.startswith('/reception/') and request.user.role != 'reception':
                return redirect('dashboard_redirect')

            # Physio panel
            if path.startswith('/physio/') and request.user.role != 'physiotherapist':
                return redirect('dashboard_redirect')

            # Callcenter panel
            if path.startswith('/callcenter/') and request.user.role != 'callcenter':
                return redirect('dashboard_redirect')

            # Approvals panel
            if path.startswith('/approvals/') and request.user.role != 'approvals':
                return redirect('dashboard_redirect')

            # RCM panel
            if path.startswith('/rcm/') and request.user.role != 'rcm':
                return redirect('dashboard_redirect')

            # Visitors panel
            if path.startswith('/visitors/') and request.user.role != 'visitors':
                return redirect('dashboard_redirect')

        response = self.get_response(request)
        return response