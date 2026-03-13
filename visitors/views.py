# <app>/views.py
from django.shortcuts import render
from django.http import HttpResponse

def dashboard(request):
    return HttpResponse("<h1>Visitors Dashboard</h1>")  # main dashboard for Visitors