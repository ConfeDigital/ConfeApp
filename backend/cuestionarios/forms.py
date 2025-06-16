from django import forms
from .models import DesbloqueoPregunta, Opcion, Pregunta

class DesbloqueoPreguntaForm(forms.ModelForm):
    class Meta:
        model = DesbloqueoPregunta
        fields = ['cuestionario', 'pregunta_origen', 'opcion_desbloqueadora', 'pregunta_desbloqueada']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'pregunta_origen' in self.data:
            try:
                pregunta_id = int(self.data.get('pregunta_origen'))
                self.fields['opcion_desbloqueadora'].queryset = Opcion.objects.filter(pregunta_id=pregunta_id)
            except (ValueError, TypeError):
                pass  # Invalid input; ignore and use empty queryset
        elif self.instance.pk:
            self.fields['opcion_desbloqueadora'].queryset = self.instance.pregunta_origen.opciones.all()
        else:
            self.fields['opcion_desbloqueadora'].queryset = Opcion.objects.none()