# 🔧 Problemas Encontrados y Soluciones

## ❌ **Problema 1: No se toma el mapeo de campos**

### **Descripción:**
Los campos mapeados desde el Excel no se están procesando correctamente y no se ven reflejados en los candidatos creados.

### **Causa:**
- Los logs muestran que el mapeo se está procesando correctamente
- El problema puede estar en la validación del serializer o en el procesamiento de datos

### **Solución Implementada:**
1. **Agregué logs detallados** en `utils.py` para debuggear el procesamiento
2. **Verifico el mapeo** en cada paso del procesamiento
3. **Muestro los datos finales** del candidato antes de la creación

### **Para Debuggear:**
```python
# En utils.py, línea 200+
print(f"  🔍 Procesando pregunta: '{question}' = '{answer}'")
print(f"  ✅ Mapeado '{question}' → '{field_name}': {answer}")
print(f"  📊 Datos finales del candidato: {candidate_data}")
```

## ❌ **Problema 2: Los candidatos no aparecen en la plataforma**

### **Descripción:**
Los candidatos se crean correctamente en el backend (Django admin) pero no son visibles en el frontend de la plataforma.

### **Causa:**
El modelo `CustomUser` tiene un campo `center` que es obligatorio para que los candidatos aparezcan en las listas de la plataforma. Los candidatos creados por carga masiva no tenían asignado un center.

### **Solución Implementada:**
1. **Asignar el center automáticamente** en el serializer
2. **Usar el center del usuario que está creando** los candidatos
3. **Fallback al primer center disponible** si el usuario no tiene center

### **Código de la Solución:**
```python
# En serializers.py, método create_new_user_with_profile
# Asignar el center del usuario que está creando los candidatos
if hasattr(self, 'context') and self.context.get('request'):
    creating_user = self.context['request'].user
    if hasattr(creating_user, 'center') and creating_user.center:
        user.center = creating_user.center
    else:
        # Si el usuario que crea no tiene center, usar el primer center disponible
        from centros.models import Center
        first_center = Center.objects.first()
        if first_center:
            user.center = first_center
```

## 🔍 **Verificación de Soluciones**

### **Para el Problema 1 (Mapeo):**
1. **Revisar los logs** del servidor cuando subas un archivo Excel
2. **Verificar que aparezcan los logs** de mapeo:
   ```
   🔍 Procesando pregunta: 'Nombre' = 'Juan'
   ✅ Mapeado 'Nombre' → 'first_name': Juan
   📊 Datos finales del candidato: {'first_name': 'Juan', ...}
   ```

### **Para el Problema 2 (Center):**
1. **Verificar en Django Admin** que los candidatos tengan un center asignado
2. **Revisar en la plataforma** que los candidatos aparezcan en las listas
3. **Verificar que el usuario que sube** el archivo tenga un center asignado

## 📊 **Campos Mínimos Requeridos**

### **Obligatorios (2 campos):**
- `first_name` - Nombre del candidato
- `last_name` - Apellido paterno

### **Generados Automáticamente:**
- `email` - Email único
- `password` - Contraseña aleatoria
- `cycle` - Siempre "carga_masiva"
- `stage` - Siempre "Pre"
- `center` - Center del usuario que sube el archivo

## 🧪 **Prueba de Funcionamiento**

### **Archivo Excel de Prueba:**
```
| A1: Nombre | B1: Apellido |
|------------|--------------|
| A2: Juan   | B2: García   |
| A3: María  | B3: López    |
```

### **Mapeo de Prueba:**
- "Nombre" → `first_name`
- "Apellido" → `last_name`

### **Resultado Esperado:**
1. ✅ **Logs detallados** en la consola del servidor
2. ✅ **Candidatos creados** con nombre y apellido correctos
3. ✅ **Center asignado** automáticamente
4. ✅ **Candidatos visibles** en la plataforma

## 🚀 **Próximos Pasos**

### **Si el mapeo sigue sin funcionar:**
1. Revisar los logs del servidor
2. Verificar que el frontend esté enviando los `field_mappings` correctamente
3. Agregar más logs en el serializer para debuggear

### **Si los candidatos siguen sin aparecer:**
1. Verificar que el usuario que sube el archivo tenga un center asignado
2. Verificar que exista al menos un center en la base de datos
3. Revisar los permisos de la plataforma

## 📋 **Comandos de Verificación**

### **Verificar Centers:**
```bash
python3 manage.py shell
>>> from centros.models import Center
>>> Center.objects.all()
```

### **Verificar Candidatos Creados:**
```bash
python3 manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.filter(groups__name='candidatos').values('id', 'first_name', 'last_name', 'center__name')
```

### **Verificar Logs:**
```bash
# Revisar los logs del servidor cuando subas un archivo Excel
# Buscar los mensajes de debug que agregamos
```

**¡Las soluciones están implementadas y listas para probar!** 🎯 