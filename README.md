<p align="center">
  <h1>ConfeApp</h1>
  <img src="logoConfe.png" alt="ConfeApp Logo" />
</p>

## Overview / Descripción General

**English:**
A web application for managing and evaluating users, with a Django backend and a React frontend. It includes user authentication (with Azure AD/ADFS), questionnaires, reporting, notifications, and more.

**Español:**
Aplicación web para la gestión y evaluación de usuarios, con backend en Django y frontend en React. Incluye autenticación de usuarios (Azure AD/ADFS), cuestionarios, reportes, notificaciones y más.

---

## Features / Características

- **User authentication / Autenticación de usuarios** (Azure AD/ADFS, JWT, Djoser)
- **Questionnaire management and reporting / Gestión de cuestionarios y reportes**
- **Real-time notifications / Notificaciones en tiempo real** (Django Channels, Redis)
- **User evaluation and progress tracking / Evaluación y seguimiento de usuarios**
- **PDF and PPTX report generation / Generación de reportes en PDF y PPTX**
- **Admin panel and REST API / Panel de administración y API REST**

---

## Tech Stack / Tecnologías

- **Backend:** Django, Django REST Framework, Channels, Redis, PostgreSQL/SQLite, Djoser, PyJWT, Pandas, Openpyxl, PyPDF2, python-pptx
- **Frontend:** React, Vite, MUI, Redux, FullCalendar, Axios, Formik, Yup, and more / y más

---

## Installation & Setup / Instalación y Configuración

### Backend
**English:**
1. `cd backend`
2. Create a virtual environment and activate it.
3. Install dependencies: `pip install -r requirements.txt`
4. Set up environment variables (`.env` file) for Azure AD/ADFS and Django settings.
5. Run migrations: `python manage.py migrate`
6. Get postal codes data base: `python manage.py importpostalcodesmx`
7. Start the server: `python manage.py runserver`

**Español:**
1. `cd backend`
2. Crear y activar un entorno virtual.
3. Instalar dependencias: `pip install -r requirements.txt`
4. Configurar variables de entorno (`.env`) para Azure AD/ADFS y Django.
5. Ejecutar migraciones: `python manage.py migrate`
6. Obtener base de datos de códigos postales: `python manage.py importpostalcodesmx`
7. Iniciar el servidor: `python manage.py runserver`

### Frontend
**English:**
1. `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

**Español:**
1. `cd frontend`
2. Instalar dependencias: `npm install`
3. Iniciar el servidor de desarrollo: `npm run dev`

---

## Usage / Uso

- **Frontend:** http://localhost:5173 (or as configured / o según configuración)
- **Backend API:** http://localhost:8000
- **Admin panel / Panel de administración:** `/admin`
- **API docs / Documentación de la API:** `/api`

---

## Development / Desarrollo

- **Backend code / Código backend:** `backend/`
- **Frontend code / Código frontend:** `frontend/src/`
- **Environment variables required for backend / Variables de entorno requeridas para backend:**
  - `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID`, `DOMAIN`, `SITE_NAME`
- **Environment variables required for frontend / Variables de entorno requeridas para frontend:**
  - `VITE_API_BASE_URL_LOCAL`, `VITE_API_BASE_URL_PROD`, `VITE_MSAL_CLIENT_ID`, `VITE_MSAL_TENANT_ID`, `VITE_GOOGLE_MAPS_API_KEY`

---

## License / Licencia

Specify your license here / Especifique su licencia aquí. 