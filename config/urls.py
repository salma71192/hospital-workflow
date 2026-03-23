# config/urls.py
from django.contrib import admin  # ← THIS IS IMPORTANT
from django.urls import path, include

from django.shortcuts import redirect
from django.contrib.auth import views as auth_views


def root_redirect(request):
    # Redirect root URL to your dashboard (reception example)
    return redirect('dashboard_redirect')

from users.views import dashboard_redirect  # import the view

urlpatterns = [
    path('', root_redirect),  # <--- this makes http://localhost:8000/ work
    path('accounts/login/', auth_views.LoginView.as_view(template_name='users/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),  # uses LOGOUT_REDIRECT_URL

    path('dashboard/', dashboard_redirect, name='dashboard_redirect'),
    path('admin-panel/', admin.site.urls),
    path('users/', include('users.urls')),  # <--- include the user creation URL
    path('reception/', include('reception.urls')),
    path('physio/', include('physio.urls')),  # Include the physio app
    path('callcenter/', include('callcenter.urls')),
    path('approvals/', include('approvals.urls')),
    path('rcm/', include('rcm.urls')),
    path('visitors/', include('visitors.urls')),
    # ... other apps
]