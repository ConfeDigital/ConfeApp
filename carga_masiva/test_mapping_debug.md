# 🧪 Debug del Mapeo de Campos

## 🔍 **Problema Identificado**
Los candidatos se crean pero sin la información mapeada del Excel. Los logs agregados nos ayudarán a identificar dónde se pierde la información.

## 📋 **Pasos para Debuggear**

### **1. Crear un Excel de Prueba Simple**
```
A1: Nombre
B1: Apellido
C1: Telefono

A2: Juan
B2: García
C2: 555-1234
```

### **2. Mapear Campos**
- "Nombre" → `first_name`
- "Apellido" → `last_name`
- "Telefono" → `phone_number`

### **3. Revisar los Logs del Servidor**

#### **Logs en `utils.py`:**
```
🔍 Procesando pregunta: 'Nombre' = 'Juan'
✅ Mapeado 'Nombre' → 'first_name': Juan
📊 Datos finales del candidato: {'first_name': 'Juan', 'last_name': 'García', 'phone_number': '555-1234'}
```

#### **Logs en `views.py`:**
```
🔍 Procesando candidato 1: {'first_name': 'Juan', 'last_name': 'García', 'phone_number': '555-1234'}
✅ Serializer válido para candidato 1
✅ Usuario creado: Juan García (ID: 123)
```

#### **Logs en `serializers.py`:**
```
🔍 create_new_user_with_profile - Datos recibidos: {'first_name': 'Juan', 'last_name': 'García', 'phone_number': '555-1234'}
👤 Datos del usuario a crear: {'email': 'juan.garcia@placeholder.com', 'first_name': 'Juan', 'last_name': 'García', 'second_last_name': ''}
✅ Usuario creado: Juan García
👤 Datos del perfil extraídos: {'phone_number': '555-1234', 'domicile': None, 'cycle': <Cycle: carga_masiva>, 'stage': 'Pre'}
📝 Creando nuevo perfil para usuario 123
✅ Perfil creado: <UserProfile: Juan García>
🎯 Usuario final creado: Juan García (ID: 123)
```

## 🚨 **Posibles Problemas y Soluciones**

### **Problema 1: Datos no llegan al serializer**
**Síntoma:** Los logs de `utils.py` muestran mapeo correcto pero los logs de `views.py` muestran datos vacíos.

**Solución:** Verificar que `process_excel_file` esté retornando los datos correctamente.

### **Problema 2: Serializer rechaza los datos**
**Síntoma:** Los logs de `views.py` muestran "Serializer inválido" con errores.

**Solución:** Revisar la validación del serializer y los campos requeridos.

### **Problema 3: Datos se pierden en la creación**
**Síntoma:** Los logs de `serializers.py` muestran datos vacíos en `create_new_user_with_profile`.

**Solución:** Verificar que el método `create` esté pasando los datos correctamente.

### **Problema 4: Perfil no se crea con los datos**
**Síntoma:** Los logs muestran que el usuario se crea pero el perfil no tiene los datos mapeados.

**Solución:** Verificar que los campos del perfil se estén extrayendo correctamente.

## 🔧 **Comandos para Verificar**

### **Verificar candidatos creados:**
```bash
python3 manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.filter(groups__name='candidatos').values('id', 'first_name', 'last_name', 'email')
```

### **Verificar perfiles:**
```bash
>>> from candidatos.models import UserProfile
>>> UserProfile.objects.all().values('user__first_name', 'user__last_name', 'phone_number', 'stage', 'cycle__name')
```

### **Verificar centers:**
```bash
>>> from centros.models import Center
>>> Center.objects.all()
```

## 📊 **Resultado Esperado**

Después de subir el Excel de prueba, deberías ver:

1. **En Django Admin:**
   - Usuario: Juan García
   - Email: juan.garcia@placeholder.com
   - Center: [Center del usuario que subió el archivo]
   - Grupo: candidatos

2. **En UserProfile:**
   - Phone: 555-1234
   - Stage: Pre
   - Cycle: carga_masiva

3. **En la plataforma:**
   - Candidato visible en las listas
   - Información correcta mostrada

## 🎯 **Próximos Pasos**

1. **Subir el Excel de prueba** con los logs habilitados
2. **Revisar todos los logs** en la consola del servidor
3. **Identificar en qué paso** se pierden los datos
4. **Aplicar la corrección** correspondiente

**¡Los logs detallados nos ayudarán a encontrar exactamente dónde se pierde la información!** 🔍 