from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Patient
from users.models import User  # To assign physio

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_patient_api(request):
    data = request.data
    full_name = data.get('full_name')
    file_number = data.get('file_number')
    therapist_id = data.get('therapist')  # optional

    if not full_name or not file_number:
        return Response({'success': False, 'error': 'Missing fields'}, status=400)

    patient = Patient.objects.create(
        full_name=full_name,
        file_number=file_number,
    )

    # Assign physiotherapist if given
    if therapist_id:
        try:
            physio = User.objects.get(id=therapist_id, role='physiotherapist')
            patient.assigned_physio = physio
            patient.save()
        except User.DoesNotExist:
            return Response({'success': False, 'error': 'Invalid physiotherapist'}, status=400)

    return Response({'success': True, 'patient_id': patient.id})