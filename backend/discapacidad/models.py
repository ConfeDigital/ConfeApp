from django.db import models

class DisabilityGroup(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

class Disability(models.Model):
    name = models.CharField(max_length=255, unique=True)
    group = models.ForeignKey(DisabilityGroup, on_delete=models.CASCADE, related_name="disabilities")

    def __str__(self):
        return self.name

# Evaluación Diagnóstica
class Impediment(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

class TechnicalAid(models.Model):
    name = models.CharField(max_length=255, unique=True)
    impediments = models.ManyToManyField(Impediment, through='TechnicalAidImpediment', related_name="technical_aids")

    def __str__(self):
        return self.name

class TechnicalAidImpediment(models.Model):
    technical_aid = models.ForeignKey(TechnicalAid, on_delete=models.CASCADE)
    impediment = models.ForeignKey(Impediment, on_delete=models.CASCADE)
    description = models.TextField()

    class Meta:
        unique_together = ('technical_aid', 'impediment')

    def __str__(self):
        return f"{self.technical_aid.name} - {self.impediment.name}"

class TechnicalAidLink(models.Model):
    technical_aid = models.ForeignKey(TechnicalAid, on_delete=models.CASCADE, related_name="links")
    url = models.URLField()

    def __str__(self):
        return self.url

# SIS
class SISGroup(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name
    
class SISItem(models.Model):
    name = models.CharField(max_length=255, unique=True)
    group = models.ForeignKey(SISGroup, on_delete=models.CASCADE, related_name="items")

    def __str__(self):
        return self.name

# class SISAid(models.Model):
#     sub_item = models.CharField(max_length=255, unique=True)
#     item = models.ForeignKey(SISItem, on_delete=models.CASCADE, related_name="sis_aids")
#     aid = models.TextField()

#     def __str__(self):
#         return self.sub_item

class SISAid(models.Model):
    sub_item = models.CharField(max_length=255)
    item = models.ForeignKey(SISItem, on_delete=models.CASCADE, related_name="sis_aids")

    def __str__(self):
        return f"{self.sub_item} - {self.item.name}"

class SISHelp(models.Model):
    sis_aid = models.ForeignKey(SISAid, on_delete=models.CASCADE, related_name="ayudas")
    descripcion = models.TextField()

    def __str__(self):
        return f"Ayuda para {self.sis_aid.sub_item} - {self.descripcion}"
    
# Cuadro de Habilidades
class CHGroup(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

class CHItem(models.Model):
    name = models.CharField(max_length=255, unique=True)
    group = models.ForeignKey(CHGroup, on_delete=models.CASCADE, related_name="items")
    aid = models.TextField()

    def __str__(self):
        return self.name