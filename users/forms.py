from django import forms
from django.contrib.auth import get_user_model

User = get_user_model()

ROLE_CHOICES = [
    ('reception', 'Reception'),
    ('physiotherapist', 'Physiotherapist'),
    ('callcenter', 'Call Center'),
    ('approvals', 'Approvals'),
    ('rcm', 'RCM'),
    ('visitors', 'Visitors'),
    ('admin', 'Admin'),
]

class UserCreateForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput, label="Password")
    confirm_password = forms.CharField(widget=forms.PasswordInput, label="Confirm Password")
    role = forms.ChoiceField(choices=ROLE_CHOICES)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 'role']

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        confirm_password = cleaned_data.get("confirm_password")

        if password != confirm_password:
            raise forms.ValidationError("Passwords do not match!")