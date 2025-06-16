from django.db import models
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.postgres.fields import ArrayField
from api.models import CustomUser
from candidatos.models import UserProfile  # Asegúrate de importar el modelo UserProfile
from django.apps import apps  # Importación diferida para evitar ciclos

class PercentilesPorCuestionario(models.Model):
    """
    Modelo que agrupa todas las secciones de percentiles por grupo bajo un cuestionario base.
    """
    base_cuestionario = models.OneToOneField(  # Asegura que sea único
        "cuestionarios.BaseCuestionarios",
        on_delete=models.CASCADE,
        related_name="percentiles_cuestionario",
        unique=True  # Restricción de unicidad
    )

    class Meta:
        verbose_name = "Percentiles por Cuestionario"
        verbose_name_plural = "Percentiles por Cuestionarios"

    def __str__(self):
        return f"{self.base_cuestionario.nombre} (ID: {self.id})"



class SeccionDePercentilesPorGrupo(models.Model):
    """
    Modelo que representa una sección con percentiles agrupados, enlazada a un cuestionario base.
    """
    percentiles_cuestionario = models.ForeignKey(
        PercentilesPorCuestionario,
        on_delete=models.CASCADE,
        related_name="secciones_percentiles"
    )
    nombre_seccion = models.CharField(max_length=255, unique=True)
    grupo = models.CharField(max_length=50, default="todos")

    class Meta:
        verbose_name = "Sección de Percentiles por Grupo"
        verbose_name_plural = "Secciones de Percentiles por Grupo"

    def __str__(self):
        return f"{self.nombre_seccion} - Grupo: {self.grupo}"


class RelacionDePuntuacionesYPercentiles(models.Model):
    """
    Modelo que relaciona puntuaciones directas, estándar y percentiles con una sección.
    """
    seccion = models.ForeignKey(
        SeccionDePercentilesPorGrupo,
        on_delete=models.CASCADE,
        related_name="puntuaciones"
    )
    puntuacion_directa = models.CharField(
        max_length=10,
        help_text="Ejemplo: '<1', '1-5', '6-10'"
    )
    puntuacion_estandar = models.IntegerField(validators=[MinValueValidator(0)])
    percentil = models.CharField(
        max_length=10,
        help_text="Ejemplo: '<1', '5-10', '>99'"
    )

    class Meta:
        verbose_name = "Relación de Puntuaciones y Percentiles"
        verbose_name_plural = "Relaciones de Puntuaciones y Percentiles"

    def __str__(self):
        return (f"Sección: {self.seccion.nombre_seccion} | "
                f"P. Directa: {self.puntuacion_directa} | "
                f"P. Estándar: {self.puntuacion_estandar} | "
                f"Percentil: {self.percentil}")


class CalculoDeIndiceDeNecesidadesDeApoyo(models.Model):
    """
    Modelo que calcula el índice de necesidades de apoyo basado en percentiles por cuestionario.
    """
    percentiles_por_cuestionario = models.ForeignKey(
        PercentilesPorCuestionario,
        on_delete=models.CASCADE,
        related_name="indice_necesidades_apoyo"
    )
    total_suma_estandar = models.IntegerField(
        help_text="Valor numérico de la suma de puntuaciones estándar"
    )
    percentil = models.CharField(
        max_length=10,
        help_text="Ejemplo: '5-10', '<1', '>99'"
    )
    indice_de_necesidades_de_apoyo = models.IntegerField(
        help_text="Valor numérico que representa el índice de necesidades de apoyo"
    )

    class Meta:
        verbose_name = "Cálculo de Índice de Necesidades de Apoyo"
        verbose_name_plural = "Cálculos de Índice de Necesidades de Apoyo"

    def __str__(self):
        return (f"Cuestionario: {self.percentiles_por_cuestionario.base_cuestionario.nombre} | "
                f"Suma Estándar: {self.total_suma_estandar} | "
                f"Percentil: {self.percentil} | "
                f"Índice: {self.indice_de_necesidades_de_apoyo}")
