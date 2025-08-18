# 🔍 Debug del Problema de Mapeo

## 📊 **Análisis de los Logs**

Basándome en los logs que proporcionaste:

### ✅ **Lo que funciona:**
- El Excel se lee correctamente en el frontend
- Las preguntas "Nombre" y "Apellido" se detectan
- Los candidatos se crean exitosamente (2 candidatos)
- No hay errores en el proceso

### ❌ **El problema:**
- Los candidatos se crean con "Sin especificar Sin especificar" en lugar de los nombres reales
- Los datos mapeados no se están guardando

## 🧪 **Prueba de Debug**

### **1. Crear un Excel de Prueba Mínimo**
```
A1: Nombre
B1: Apellido

A2: Juan
B2: García
```

### **2. Mapear Campos**
- "Nombre" → `first_name`
- "Apellido" → `last_name`

### **3. Revisar los Logs del Backend**

Después de subir el archivo, deberías ver en la consola del servidor:

```
🔍 Iniciando procesamiento de archivo Excel
📋 Tipo de cuestionario: preentrevista
🗂️ Mapeos de campos: {'Nombre': 'first_name', 'Apellido': 'last_name'}
📊 DataFrame leído - Shape: (1, 2)
📋 Columnas originales: ['Nombre', 'Apellido']
🔄 Procesando como cuestionario tipo: preentrevista

🔍 Procesando cuestionario tipo: preentrevista
📊 DataFrame shape: (1, 2)
📋 Columnas originales: ['Nombre', 'Apellido']
🗺️ Field mappings recibidos: {'Nombre': 'first_name', 'Apellido': 'last_name'}
📝 Preguntas encontradas: ['Nombre', 'Apellido']

👤 Procesando candidato: Juan
📋 Fila completa: {'Nombre': 'Juan', 'Apellido': 'García'}
  🔍 Procesando pregunta: 'Nombre' = 'Juan'
  🗺️ Pregunta 'Nombre' mapeada a campo 'first_name'
  ✅ Mapeado 'Nombre' → 'first_name': Juan
  🔍 Procesando pregunta: 'Apellido' = 'García'
  🗺️ Pregunta 'Apellido' mapeada a campo 'last_name'
  ✅ Mapeado 'Apellido' → 'last_name': García
  📊 Datos finales del candidato: {'first_name': 'Juan', 'last_name': 'García'}
✅ Candidato Juan procesado exitosamente

🔍 Procesando candidato 1: {'first_name': 'Juan', 'last_name': 'García'}
✅ Serializer válido para candidato 1
✅ Usuario creado: Juan García (ID: 123)

🔍 create_new_user_with_profile - Datos recibidos: {'first_name': 'Juan', 'last_name': 'García'}
👤 Datos del usuario a crear: {'email': 'juan.garcia@placeholder.com', 'first_name': 'Juan', 'last_name': 'García', 'second_last_name': ''}
✅ Usuario creado: Juan García
🎯 Usuario final creado: Juan García (ID: 123)
```

## 🚨 **Si los logs no aparecen así:**

### **Problema 1: No aparecen logs del backend**
- Verificar que el servidor esté corriendo
- Verificar que los logs estén habilitados
- Revisar la consola donde corre el servidor Django

### **Problema 2: Los field_mappings están vacíos**
```
🗂️ Mapeos de campos: {}
```
- El frontend no está enviando los mapeos correctamente
- Verificar que el mapeo se esté guardando en el frontend

### **Problema 3: Las preguntas no se mapean**
```
❌ Pregunta 'Nombre' NO está mapeada
```
- Los field_mappings no contienen las preguntas del Excel
- Verificar que el mapeo coincida exactamente con las preguntas

### **Problema 4: Los datos llegan vacíos al serializer**
```
🔍 create_new_user_with_profile - Datos recibidos: {}
```
- El procesamiento del Excel no está funcionando
- Verificar que el Excel tenga el formato correcto

## 🔧 **Comandos de Verificación**

### **Verificar candidatos creados:**
```bash
python3 manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.filter(groups__name='candidatos').order_by('-id')[:5].values('id', 'first_name', 'last_name', 'email')
```

### **Verificar el último candidato creado:**
```bash
>>> latest_user = User.objects.filter(groups__name='candidatos').latest('id')
>>> print(f"ID: {latest_user.id}")
>>> print(f"Nombre: {latest_user.first_name}")
>>> print(f"Apellido: {latest_user.last_name}")
>>> print(f"Email: {latest_user.email}")
>>> print(f"Center: {latest_user.center}")
```

## 📋 **Próximos Pasos**

1. **Subir el Excel de prueba mínimo** con los logs habilitados
2. **Revisar TODOS los logs** del backend en la consola del servidor
3. **Identificar en qué paso** se pierden los datos
4. **Reportar los logs específicos** que aparezcan

**¡Los logs detallados nos dirán exactamente dónde está el problema!** 🔍 