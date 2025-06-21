import os
import logging
from .settings import *
from .settings import BASE_DIR

logger = logging.getLogger(__name__)

# --- Configuración del Host y CSRF ---
ALLOWED_HOSTS = [os.environ['WEBSITE_HOSTNAME'], 'localhost', '127.0.0.1', '169.254.130.2']
CSRF_TRUSTED_ORIGINS = ['https://'+os.environ['WEBSITE_HOSTNAME']]
DEBUG = False
SECRET_KEY = os.environ['MY_SECRET_KEY']

try:
    hostname_check = os.environ['WEBSITE_HOSTNAME']
    logger.warning(f"DEBUGGING: WEBSITE_HOSTNAME is: {hostname_check}")
except KeyError:
    logger.error("DEBUGGING: WEBSITE_HOSTNAME environment variable not found!")

# --- Middlewares ---
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django_auth_adfs.middleware.LoginRequiredMiddleware',
    'simple_history.middleware.HistoryRequestMiddleware',
]

CORS_ALLOWED_ORIGINS = [
    'https://kaiuki.com',
    'https://zealous-desert-08853fc0f.6.azurestaticapps.net'
]

# --- Configuración de Static Files ---
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATIC_URL = '/static/'

# --- Configuración de la Base de Datos (AZURE SQL con SQL Authentication) ---
# Ya no necesitamos DefaultAzureCredential ni pyodbc importados aquí,
# ni la clase AzureADAccessTokenDatabaseWrapper.

CONNECTION_STRING_RAW = os.environ['AZURE_SQL_CONNECTIONSTRING']

# Parsear la cadena de conexión SQL Server (usando ';')
CONNECTION_PARAMS = {}
for part in CONNECTION_STRING_RAW.split(';'):
    if '=' in part:
        key, value = part.split('=', 1)
        CONNECTION_PARAMS[key.strip()] = value.strip()

# Extraer los parámetros de la cadena de conexión
SQL_SERVER_HOST_FULL = CONNECTION_PARAMS.get('Server', '').strip()
SQL_SERVER_HOST = SQL_SERVER_HOST_FULL.split(',')[0].replace('tcp:', '').strip() # Remove tcp:
SQL_SERVER_PORT = SQL_SERVER_HOST_FULL.split(',')[-1].strip() if ',' in SQL_SERVER_HOST_FULL else '1433'
SQL_SERVER_DATABASE = CONNECTION_PARAMS.get('Initial Catalog', '').strip()
SQL_SERVER_USER = CONNECTION_PARAMS.get('User ID', '').strip()
SQL_SERVER_PASSWORD = CONNECTION_PARAMS.get('Password', '').strip()

# --- ADD THESE DEBUGGING LOGS HERE (IMPORTANT: DO NOT LOG FULL PASSWORD) ---
logger.info(f"DEBUG DB Config (Raw Connection String Part): {CONNECTION_STRING_RAW.split('Password=')[0]}Password=*****")
logger.info(f"DEBUG DB Config - Host: {SQL_SERVER_HOST}")
logger.info(f"DEBUG DB Config - Port: {SQL_SERVER_PORT}")
logger.info(f"DEBUG DB Config - Database: {SQL_SERVER_DATABASE}")
logger.info(f"DEBUG DB Config - User: {SQL_SERVER_USER}")
logger.info(f"DEBUG DB Config - Password (first 3 chars): {SQL_SERVER_PASSWORD[:3]}*****")
logger.info(f"DEBUG DB Config - TrustServerCertificate: {CONNECTION_PARAMS.get('TrustServerCertificate', 'False').lower()}")
logger.info(f"DEBUG DB Config - Encrypt: {CONNECTION_PARAMS.get('Encrypt', 'True').lower()}")
# --- END DEBUGGING LOGS ---

# Configuración DATABASES
DATABASES = {
    "default": {
        "ENGINE": "mssql", # Requires django-mssql
        "NAME": SQL_SERVER_DATABASE,
        "HOST": SQL_SERVER_HOST,
        "PORT": SQL_SERVER_PORT,
        "USER": SQL_SERVER_USER,
        "PASSWORD": SQL_SERVER_PASSWORD,
        "OPTIONS": {
            "driver": "ODBC Driver 17 for SQL Server", # Confirma este driver en App Service
            "TrustServerCertificate": CONNECTION_PARAMS.get('TrustServerCertificate', 'False').lower(), # Should be 'false' for Azure
            "Encrypt": CONNECTION_PARAMS.get('Encrypt', 'True').lower(), # Should be 'true' for Azure
            "Connection Timeout": CONNECTION_PARAMS.get('Connection Timeout', '30'), # Use parsed value
        },
        "AUTOCOMMIT": True,
        "ATOMIC_REQUESTS": True,
    }
}


# --- Configuración de Redis Cache y Channels (sin cambios) ---
REDISCACHE_HOST = os.environ.get('REDISCACHE_HOST')
REDISCACHE_PORT = os.environ.get('REDISCACHE_PORT', 6379)
REDISCACHE_PASSWORD = os.environ.get('REDISCACHE_PASSWORD')

if REDISCACHE_HOST and REDISCACHE_PASSWORD:
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': f'redis://:{REDISCACHE_PASSWORD}@{REDISCACHE_HOST}:{REDISCACHE_PORT}/1',
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            },
            'KEY_PREFIX': 'my_app'
        }
    }

    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                'hosts': [(REDISCACHE_HOST, REDISCACHE_PORT)],
                'password': REDISCACHE_PASSWORD,
            },
        },
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'default-locmem',
        }
    }
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }

# --- Configuración de ASGI ---
ASGI_APPLICATION = "backend.asgi.application"
