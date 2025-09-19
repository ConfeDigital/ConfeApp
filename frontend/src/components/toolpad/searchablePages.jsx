import React from 'react';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import BlindIcon from '@mui/icons-material/Blind';
import AssistWalkerIcon from '@mui/icons-material/AssistWalker';
import DynamicFormOutlinedIcon from '@mui/icons-material/DynamicFormOutlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import UploadFileTwoTone from '@mui/icons-material/UploadFileTwoTone';
import SpeakerNotesOutlinedIcon from '@mui/icons-material/SpeakerNotesOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';

// Base pages available to all users
const basePages = [

];

// Pages available to personal users
const personalPages = [
    {
        title: "Inicio",
        path: "/dashboard",
        icon: <HomeOutlinedIcon />,
        description: "Panel principal y resumen del sistema",
        keywords: ["dashboard", "principal", "inicio", "home", "resumen"],
        groups: ["personal", "empleador"]
    },
    {
        title: "Calendario",
        path: "/calendar",
        icon: <CalendarTodayOutlinedIcon />,
        description: "Gestión de eventos, citas y programación",
        keywords: ["calendario", "eventos", "citas", "programación", "fechas", "agenda"],
        groups: ["personal", "empleador"]
    },
    {
        title: "Anuncios",
        path: "/anuncios",
        icon: <SpeakerNotesOutlinedIcon />,
        description: "Comunicados, noticias y avisos importantes",
        keywords: ["anuncios", "comunicados", "noticias", "avisos", "información", "mensajes"],
        groups: ["personal", "empleador"]
    },
    {
        title: "Foro",
        path: "/foro",
        icon: <ForumOutlinedIcon />,
        description: "Espacio de discusión y colaboración entre usuarios",
        keywords: ["foro", "discusión", "colaboración", "comunidad", "chat", "conversación"],
        groups: ["personal", "empleador"]
    },
    {
        title: "Consulta General",
        path: "/candidatos",
        icon: <PeopleOutlinedIcon />,
        description: "Búsqueda y consulta de información de candidatos",
        keywords: ["candidatos", "consulta", "búsqueda", "personas", "usuarios", "información", "crear candidatos", "agregar candidatos"],
        groups: ["personal"]
    },
    {
        title: "Discapacidades",
        path: "/discapacidades",
        icon: <BlindIcon />,
        description: "Catálogo y gestión de tipos de discapacidades",
        keywords: ["discapacidades", "catálogo", "tipos", "gestión", "clasificación"],
        groups: ["personal"]
    },
    {
        title: "Evaluación Diagnóstica",
        path: "/apoyos/evaluacion-diagnostica",
        icon: <AssistWalkerIcon />,
        description: "Apoyos Técnicos de Evaluación Diagnóstica",
        keywords: ["evaluación", "diagnóstico", "habilidades", "apoyos", "herramientas"],
        groups: ["personal"]
    },
    {
        title: "Cuadro de Habilidades",
        path: "/apoyos/cuadro-habilidades",
        icon: <AssistWalkerIcon />,
        description: "Apoyos de Cuadro de Habilidades",
        keywords: ["cuadro", "habilidades", "competencias", "matriz", "áreas", "apoyos"],
        groups: ["personal"]
    },
    {
        title: "SIS",
        path: "/apoyos/SIS",
        icon: <AssistWalkerIcon />,
        description: "Herramientas de Escala de Intensidad de Apoyos",
        keywords: ["sis", "sistema", "información", "seguimiento", "apoyos", "datos"],
        groups: ["personal"]
    },
    {
        title: "Configuración",
        path: "/configuracion",
        icon: <SettingsOutlinedIcon />,
        description: "Configuración del sistema",
        keywords: ["configuración", "sistema", "herramientas"],
        groups: ["personal"]
    },
    {
        title: "Mi Perfil",
        path: "/profile",
        icon: <PersonOutlinedIcon />,
        description: "Perfil del usuario",
        keywords: ["perfil", "usuario", "herramientas"],
        groups: ["personal"]
    },
    {
        title: "Ayuda y Soporte",
        path: "/help",
        icon: <HelpOutlineOutlinedIcon />,
        description: "Ayuda y soporte del sistema",
        keywords: ["ayuda", "soporte", "herramientas"],
        groups: ["personal"]
    }
];

// Pages available to admin users
const adminPages = [
    {
        title: "Estadísticas",
        path: "/estadisticas",
        icon: <BarChartOutlinedIcon />,
        description: "Reportes, gráficos y análisis de datos del sistema",
        keywords: ["estadísticas", "reportes", "gráficos", "análisis", "datos", "métricas"],
        groups: ["admin"]
    },
    {
        title: "Base Cuestionarios",
        path: "/baseCuestionarios",
        icon: <DynamicFormOutlinedIcon />,
        description: "Gestión de cuestionarios y formularios del sistema",
        keywords: ["cuestionarios", "formularios", "base", "gestión", "preguntas", "encuestas"],
        groups: ["admin"]
    },
    {
        title: "Tablas de equivalencia",
        path: "/tablas-de-equivalencia",
        icon: <DynamicFormOutlinedIcon />,
        description: "Configuración de equivalencias y correspondencias",
        keywords: ["tablas", "equivalencia", "correspondencias", "configuración", "mapeo"],
        groups: ["admin"]
    },
    {
        title: "Carga Masiva Candidatos",
        path: "/cargaMasiva",
        icon: <UploadFileTwoTone />,
        description: "Importación masiva de datos de candidatos desde archivos",
        keywords: ["carga", "masiva", "candidatos", "importación", "archivos", "excel", "csv"],
        groups: ["admin"]
    },
    {
        title: "Carga Masiva Respuestas",
        path: "/carga-masiva-respuestas",
        icon: <UploadFileTwoTone />,
        description: "Importación masiva de respuestas a cuestionarios",
        keywords: ["carga", "masiva", "respuestas", "cuestionarios", "importación", "datos"],
        groups: ["admin"]
    },
    {
        title: "Panel de Administración",
        path: "/panel-de-administracion",
        icon: <AdminPanelSettingsOutlinedIcon />,
        description: "Panel de administración del sistema",
        keywords: ["administración", "sistema", "herramientas"],
        groups: ["admin"]
    }
];

// Pages available to agencia laboral users
const agenciaLaboralPages = [
    {
        title: "Agencia Laboral - Administración",
        path: "/agencia-laboral/administracion",
        icon: <BusinessCenterOutlinedIcon />,
        description: "Gestión administrativa de la agencia laboral",
        keywords: ["agencia", "laboral", "administración", "gestión", "empleos", "trabajo"],
        groups: ["agencia_laboral"]
    },
    {
        title: "Agencia Laboral - Habilidades",
        path: "/agencia-laboral/habilidades",
        icon: <BusinessCenterOutlinedIcon />,
        description: "Catálogo de habilidades laborales y competencias",
        keywords: ["agencia", "laboral", "habilidades", "competencias", "trabajo", "empleos"],
        groups: ["agencia_laboral"]
    },
];

// Pages available to gerente users
const gerentePages = [
    {
        title: "Configuración del Centro",
        path: "/configuracion-del-centro",
        icon: <ManageAccountsOutlinedIcon />,
        description: "Configuración del centro",
        keywords: ["configuración", "centro", "sistema", "herramientas"],
        groups: ["gerente"]
    },
];

/**
 * Get all searchable pages based on user permissions
 * @param {Function} hasGroup - Function to check if user has a specific group
 * @param {boolean} isStaff - Whether the user is staff (can see all pages)
 * @returns {Array} Array of searchable pages filtered by user permissions
 */
export const getSearchablePages = (hasGroup, isStaff) => {
    let pages = [...basePages];

    // Add personal pages
    if (hasGroup("personal")) {
        pages = [...pages, ...personalPages];
    }

    // Add admin pages
    if (hasGroup("admin")) {
        pages = [...pages, ...adminPages];
    }

    // Add agencia laboral pages
    if (hasGroup("agencia_laboral")) {
        pages = [...pages, ...agenciaLaboralPages];
    }

    // Add gerente pages
    if (hasGroup("gerente")) {
        pages = [...pages, ...gerentePages];
    }

    // Filter pages based on user's groups
    return pages.filter(page => {
        if (isStaff) return true; // Staff can see all pages
        return page.groups.some(group => hasGroup(group));
    });
};

/**
 * Search pages based on search term
 * @param {Array} pages - Array of pages to search through
 * @param {string} searchTerm - The search term
 * @returns {Array} Filtered array of pages matching the search term
 */
export const searchPages = (pages, searchTerm) => {
    if (!searchTerm.trim()) return [];

    const searchLower = searchTerm.toLowerCase();
    return pages.filter(page => (
        page.title.toLowerCase().includes(searchLower) ||
        page.description.toLowerCase().includes(searchLower) ||
        page.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
    ));
};

export default {
    getSearchablePages,
    searchPages,
    basePages,
    personalPages,
    adminPages,
    agenciaLaboralPages,
};
