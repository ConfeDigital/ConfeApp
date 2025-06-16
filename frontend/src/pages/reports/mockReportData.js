const mockReportData = {
    user: {
      id: 17,
      nombre_completo: "María Fernanda López Pérez",
      email: "maria.lopez@example.com",
      fecha_nacimiento: "2002-08-14",
      edad: 22,
      sexo: "Femenino",
      discapacidad: "Síndrome de Down",
      ciclo: {
        nombre: "Ciclo 2024-B",
        fecha_inicio: "2024-07-01",
        fecha_fin: "2024-12-15",
      },
      domicilio: {
        calle: "Av. Revolución 120",
        colonia: "San Ángel",
        cp: "01000",
        alcaldia: "Álvaro Obregón",
        ciudad: "Ciudad de México",
      },
      contacto_emergencia: {
        nombre: "Luz María Pérez",
        telefono: "555-123-4567",
        parentesco: "Madre",
      },
    },
  
    timeline: [
      { fecha: "2024-08-15", evento: "Inicio de talleres" },
      { fecha: "2024-09-03", evento: "Evaluación diagnóstica aplicada" },
      { fecha: "2024-10-21", evento: "Taller de habilidades sociales" },
      { fecha: "2024-11-10", evento: "Visita a empresa colaboradora" },
    ],
  
    respuestasDiagnostico: [
      {
        seccion: "Matemáticas",
        pregunta: "¿Sabe sumar y restar?",
        tipo: "checkbox",
        respuestas: ["Sabe todos los números", "Suma con apoyo"],
      },
      {
        seccion: "Comunicación",
        pregunta: "¿Sabe expresarse verbalmente?",
        tipo: "dropdown",
        respuesta: "Puede comunicarse con oraciones simples",
      },
      {
        seccion: "Social",
        pregunta: "¿Interactúa con otros estudiantes?",
        tipo: "multiple",
        respuesta: "Frecuentemente",
      },
    ],
  
    habilidadesAdaptativas: {
      "Vida en el hogar": 3,
      "Vida en la comunidad": 4,
      "Aprendizaje a lo largo de la vida": 2,
      "Empleo": 1,
      "Salud y seguridad": 4,
      "Social": 3,
      "Índice de Necesidades de Apoyo": 35,
      "Percentil general": 60,
    },
  
    sisProteccionDefensa: [
      {
        actividad: "Evitar peligros físicos",
        frecuencia: 3,
        tiempo_apoyo: 2,
        tipo_apoyo: 1,
        total: 6,
      },
      {
        actividad: "Identificar abuso o acoso",
        frecuencia: 2,
        tiempo_apoyo: 2,
        tipo_apoyo: 2,
        total: 6,
      },
      {
        actividad: "Proteger información personal",
        frecuencia: 3,
        tiempo_apoyo: 1,
        tipo_apoyo: 1,
        total: 5,
      },
    ],
  
    consideraciones: [
      "Buena participación en talleres",
      "Se recomienda apoyo adicional en lectura",
      "Responde positivamente a actividades grupales",
    ],
  
    logos: {
      institucion: "/assets/logo_confe.png",
      patrocinador: "/assets/logo_patrocinador.png",
      sistema: "/assets/logo_sistema.png",
    },
  };
  
  export default mockReportData;