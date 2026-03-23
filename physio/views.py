# physio/views.py
from django.shortcuts import render
from users.decorators import role_required

@role_required(['physiotherapist'])
def physio_dashboard(request):
    # Your physio dashboard logic
    return render(request, "physio/dashboard.html")