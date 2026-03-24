from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate, login, logout
from rest_framework.response import Response

@api_view(['POST'])
@permission_classes([AllowAny])
def login_api(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)

    if user is not None:
        login(request, user)
        return Response({
            'success': True,
            'role': user.role,
            'is_superuser': user.is_superuser
        })
    else:
        return Response({'success': False, 'error': 'Invalid credentials'}, status=400)


@api_view(['POST'])
def logout_api(request):
    logout(request)
    return Response({'success': True})