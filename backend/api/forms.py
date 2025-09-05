from django import forms
from django.contrib.auth.forms import UserChangeForm
from .models import CustomUser

class CustomUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = CustomUser

    # Override the username field to be not required on the form
    # and to allow it to be empty.
    username = forms.CharField(required=False)