# models.py
from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
import json

User = get_user_model()

class SeguimientoApoyos(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='seguimientos_apoyos')
    seccion = models.CharField(max_length=255)
    item = models.CharField(max_length=255)
    subitem = models.CharField(max_length=255)
    ayuda_id = models.IntegerField()
    ayuda_descripcion = models.TextField()
    resultado = models.CharField(max_length=20, choices=[
        ('funciono', 'Le funcionó'),
        ('no_funciono', 'No le funcionó'),
        ('no_especificado', 'No especificado')
    ])
    comentario = models.TextField(blank=True, null=True)
    fecha_sesion = models.DateTimeField(auto_now_add=True)
    ultima_actualizacion = models.DateTimeField(auto_now=True)
    sesion_seguimiento = models.CharField(max_length=50)  # Identificador de sesión

    class Meta:
        ordering = ['-fecha_sesion']
        indexes = [
            models.Index(fields=['usuario', 'sesion_seguimiento']),
            models.Index(fields=['fecha_sesion']),
        ]

    def __str__(self):
        return f"{self.usuario} - {self.seccion} - {self.item}"



class SeguimientoProyectoVida(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, 
        related_name='seguimientos_proyecto_vida'
    )
    metas = models.JSONField(
        default=list,
        help_text="Lista de metas con su estado y pasos"
    )
    comentarios = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Seguimiento de Proyecto de Vida"
        verbose_name_plural = "Seguimientos de Proyectos de Vida"
        ordering = ['-fecha_actualizacion']

    def __str__(self):
        return f"Seguimiento PV - {self.usuario} - {self.fecha_actualizacion}"