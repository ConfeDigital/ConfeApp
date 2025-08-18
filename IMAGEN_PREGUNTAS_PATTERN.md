# Patrón de Subida de Imágenes para Preguntas Tipo "Imagen"

## Resumen

Se implementó un patrón similar al usado para subir fotos de perfil de candidatos, adaptado para las preguntas tipo "imagen" en cuestionarios.

## Patrón Implementado

### 1. **Backend - Serializer**

```python
# backend/cuestionarios/serializers.py
class PreguntaImagenSerializer(serializers.ModelSerializer):
    """
    Serializer para subir imágenes de preguntas tipo "imagen"
    Similar al CandidatePhotoSerializer
    """
    class Meta:
        model = ImagenOpcion
        fields = ['imagen']
```

### 2. **Backend - Vista**

```python
# backend/cuestionarios/views.py
class PreguntaImagenUploadAPIView(generics.UpdateAPIView):
    """
    Vista para subir imágenes de preguntas tipo "imagen"
    Similar a CandidatePhotoUploadAPIView
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PreguntaImagenSerializer

    def get_object(self):
        pregunta_id = self.kwargs.get('pregunta_id')
        try:
            imagen_opcion = ImagenOpcion.objects.get(pregunta_id=pregunta_id)
            return imagen_opcion
        except ImagenOpcion.DoesNotExist:
            pregunta = get_object_or_404(Pregunta, id=pregunta_id)
            return ImagenOpcion.objects.create(
                pregunta=pregunta,
                descripcion=f'Imagen para pregunta: {pregunta.texto}'
            )
```

### 3. **Backend - URL**

```python
# backend/cuestionarios/urls.py
path('subir-imagen-pregunta/<int:pregunta_id>/', PreguntaImagenUploadAPIView.as_view(), name='subir_imagen_pregunta'),
```

### 4. **Frontend - Componente PreguntaCard**

```jsx
// frontend/src/pages/cuestionarios/questionnaireInterface/PreguntaCard.jsx
const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    updatePregunta(index, { ...pregunta, imagen: file });
  }
};

// En el render:
<Box>
  {pregunta.imagen && typeof pregunta.imagen === "string" && (
    <Box mb={1}>
      <img
        src={pregunta.imagen}
        alt="Imagen de pregunta"
        style={{ maxWidth: "200px", display: "block", borderRadius: 8 }}
      />
    </Box>
  )}
  <input type="file" accept="image/*" onChange={handleImageChange} />
</Box>;
```

### 5. **Frontend - Subida Después de Guardar Cuestionario**

```jsx
// frontend/src/pages/cuestionarios/questionnaireInterface/QuestionnaireInterface.jsx
const handleGuardar = async () => {
  // Guardar las referencias a las imágenes para subirlas después
  const imagenesPendientes = preguntas
    .filter(
      (p) => p.tipo === "imagen" && p.imagen && typeof p.imagen === "object"
    )
    .map((p) => ({ pregunta: p, imagen: p.imagen }));

  // Guardar el cuestionario primero
  const response = await api.post(
    "/api/cuestionarios/guardar-cuestionario/",
    data
  );

  // Ahora subir las imágenes después de que las preguntas tengan ID
  if (imagenesPendientes.length > 0) {
    // Obtener las preguntas actualizadas con sus IDs
    const preguntasActualizadas = await api.get(
      `/api/cuestionarios/${id}/preguntas/`
    );
    const preguntasConIds = preguntasActualizadas.data;

    for (const item of imagenesPendientes) {
      // Buscar la pregunta correspondiente por texto
      const preguntaConId = preguntasConIds.find(
        (p) => p.texto === item.pregunta.texto
      );

      if (preguntaConId) {
        const imagenData = new FormData();
        imagenData.append("imagen", item.imagen);

        await api.put(
          `/api/cuestionarios/subir-imagen-pregunta/${preguntaConId.id}/`,
          imagenData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      }
    }
  }
};
```

## Flujo de Trabajo

1. **Usuario selecciona imagen** en PreguntaCard
2. **Se guarda en estado local** como objeto File
3. **Al guardar cuestionario** primero se guardan las preguntas (obtienen ID)
4. **Después se suben las imágenes** usando los IDs de las preguntas
5. **Se usa PUT** al endpoint `/api/cuestionarios/subir-imagen-pregunta/<id>/`
6. **Se crea/actualiza** ImagenOpcion en la base de datos
7. **Se puede visualizar** usando el endpoint `/api/cuestionarios/ver-imagen-pregunta/<id>/`

## Diferencias con el Patrón de Fotos de Perfil

### Fotos de Perfil (Candidatos)

- **Endpoint**: `/api/candidatos/upload-photo/<uid>/`
- **Método**: PUT
- **Modelo**: UserProfile.photo
- **Subida**: Después de crear el candidato

### Imágenes de Preguntas

- **Endpoint**: `/api/cuestionarios/subir-imagen-pregunta/<pregunta_id>/`
- **Método**: PUT
- **Modelo**: ImagenOpcion.imagen
- **Subida**: Al guardar el cuestionario completo

## Ventajas del Patrón

1. **Consistencia**: Usa el mismo patrón que ya funciona
2. **Simplicidad**: Reutiliza componentes y lógica existente
3. **Mantenibilidad**: Fácil de mantener y extender
4. **Seguridad**: Usa los mismos permisos y validaciones
5. **Escalabilidad**: Funciona en Azure App Service

## Configuración para Azure

El patrón funciona con la configuración actual de Django:

- **MEDIA_URL**: `/media/`
- **MEDIA_ROOT**: `os.path.join(BASE_DIR, 'media')`
- **Almacenamiento**: Sistema de archivos local (funciona en contenedores)

Para producción en Azure, se puede configurar Azure Blob Storage modificando `settings.py`:

```python
if not DEBUG:
    DEFAULT_FILE_STORAGE = 'storages.backends.azure_storage.AzureStorage'
    AZURE_ACCOUNT_NAME = os.getenv('AZURE_ACCOUNT_NAME')
    AZURE_ACCOUNT_KEY = os.getenv('AZURE_ACCOUNT_KEY')
    AZURE_CONTAINER = os.getenv('AZURE_CONTAINER', 'media')
```

## Uso

1. **Crear pregunta tipo "imagen"** en el editor de cuestionarios
2. **Seleccionar archivo de imagen** usando el input file
3. **Guardar cuestionario** - las imágenes se subirán automáticamente
4. **Visualizar en cuestionarios** - las imágenes se mostrarán con el slider
