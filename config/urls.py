# config/urls.py
from django.contrib import admin  # ← THIS IS IMPORTANT
from django.urls import path, include

from users.views import dashboard_redirect  # import the view

urlpatterns = [
    path('dashboard/', dashboard_redirect, name='dashboard_redirect'),
    path('admin/', admin.site.urls),
    path('reception/', include('reception.urls')),
    path('physio/', include('physio.urls')),
    path('callcenter/', include('callcenter.urls')),
    path('approvals/', include('approvals.urls')),
    path('rcm/', include('rcm.urls')),
    path('visitors/', include('visitors.urls')),
    # ... other apps
]