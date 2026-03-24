from rest_framework.decorators import api_view
from django.contrib.auth import logout
from rest_framework.response import Response

@api_view(['POST'])
def logout_api(request):
    logout(request)
    return Response({'success': True})