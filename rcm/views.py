# rcm/views.py
from django.shortcuts import render
from django.http import HttpResponse

def dashboard(request):
    # For now, just a simple page
    return HttpResponse("RCM Dashboard")