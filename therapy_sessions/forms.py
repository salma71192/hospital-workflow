from django import forms
from therapy_sessions.models import TherapySession
from django.contrib.auth import get_user_model

User = get_user_model()

class TherapySessionForm(forms.ModelForm):
    therapist = forms.ModelChoiceField(
        queryset=User.objects.filter(role='physiotherapist'),
        required=True,
        label="Assign Physiotherapist"
    )

    class Meta:
        model = TherapySession
        fields = ['therapist', 'session_date', 'notes']
        widgets = {
            'session_date': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'notes': forms.Textarea(attrs={'rows':3}),
        }