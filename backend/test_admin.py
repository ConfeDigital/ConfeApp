#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append('/Users/quiquejimenez/Documents/EJG/AMPSolutions/CONFE/ConfeApp/backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from agencia.models import Habilidad, Job, JobHabilidadRequerida
from candidatos.models import CandidatoHabilidadEvaluada

print("=== VERIFICACIÓN DEL SISTEMA DE HABILIDADES ===")
print()

print("1. Habilidades disponibles:")
habilidades = Habilidad.objects.all()
for h in habilidades:
    print(f"   - {h.nombre} ({h.categoria}) - {'Activa' if h.es_activa else 'Inactiva'}")
print(f"   Total: {habilidades.count()} habilidades")
print()

print("2. Empleos existentes:")
jobs = Job.objects.all()
for job in jobs:
    print(f"   - {job.name} ({job.company.name if job.company else 'Sin compañía'})")
    print(f"     Horario: {job.horario or 'No especificado'}")
    print(f"     Sueldo: ${job.sueldo_base or 'No especificado'}")
    print(f"     Prestaciones: {job.prestaciones or 'No especificadas'}")
    print()
print(f"   Total: {jobs.count()} empleos")
print()

print("3. Habilidades requeridas por empleo:")
for job in jobs:
    habilidades_requeridas = JobHabilidadRequerida.objects.filter(job=job)
    if habilidades_requeridas.exists():
        print(f"   {job.name}:")
        for hr in habilidades_requeridas:
            print(f"     - {hr.habilidad.nombre} ({hr.get_nivel_importancia_display()})")
    else:
        print(f"   {job.name}: Sin habilidades requeridas")
print()

print("4. Habilidades evaluadas de candidatos:")
candidatos_habilidades = CandidatoHabilidadEvaluada.objects.all()
for ch in candidatos_habilidades:
    print(f"   - {ch.candidato.user.get_full_name()}: {ch.habilidad.nombre} ({ch.get_nivel_competencia_display()})")
print(f"   Total: {candidatos_habilidades.count()} evaluaciones")
print()

print("=== VERIFICACIÓN COMPLETADA ===")
