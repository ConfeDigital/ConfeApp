import os
import logging
import socket
from .settings import *
from .settings import BASE_DIR
import sys

logger = logging.getLogger(__name__)

# --- Function to get container's internal IP ---
def get_container_ip():
    """Get the container's internal IP address"""
    try:
        hostname = socket.gethostname()
        container_ip = socket.gethostbyname(hostname)
        logger.info(f"Container IP detected: {container_ip}")
        return container_ip
    except Exception as e:
        logger.warning(f"Could not detect container IP: {e}")
        return None

# --- Configuración del Host y CSRF ---
base_allowed_hosts = [os.environ['WEBSITE_HOSTNAME'], 'localhost', '127.0.0.1', 'api.institucionconfe.org.mx']

# Add container IP dynamically
container_ip = get_container_ip()
if container_ip:
    base_allowed_hosts.append(container_ip)

ALLOWED_HOSTS = base_allowed_hosts

CSRF_TRUSTED_ORIGINS = ['https://'+os.environ['WEBSITE_HOSTNAME'], 'https://api.institucionconfe.org.mx']
DEBUG = False
SECRET_KEY = os.environ['MY_SECRET_KEY']

try:
    hostname_check = os.environ['WEBSITE_HOSTNAME']
    logger.warning(f"DEBUGGING: WEBSITE_HOSTNAME is: {hostname_check}")
except KeyError:
    logger.error("DEBUGGING: WEBSITE_HOSTNAME environment variable not found!")

# Log the allowed hosts for debugging
logger.info(f"DEBUGGING: ALLOWED_HOSTS configured: {ALLOWED_HOSTS}")

# --- Middlewares (ADD DynamicHostMiddleware FIRST) ---
MIDDLEWARE = [
    'middleware.dynamic_host.DynamicHostMiddleware',  # Add this first
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
    'https://zealous-desert-08853fc0f.6.azurestaticapps.net',
    'https://ceil.institucionconfe.org.mx'
]

# --- Configuración de Media y Static Files ---

STORAGE_CONNECTION_STRING = os.getenv('AZURE_STORAGE_CONNECTIONSTRING')
AZURE_CONTAINER = os.getenv('AZURE_CONTAINER', 'media')

STORAGES = {
    "default": {
        "BACKEND": "storages.backends.azure_storage.AzureStorage",
        "OPTIONS": {
            "account_name": "saconfevm",
            "account_key": os.getenv('AZURE_STORAGE_KEY'),  # Just the key part
            "azure_container": AZURE_CONTAINER,
            "azure_ssl": True,
        },
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

MEDIA_URL = f"/{AZURE_CONTAINER}/"

STATIC_ROOT = BASE_DIR / 'staticfiles'
STATIC_URL = '/static/'

# --- Configuración de la Base de Datos (AZURE SQL con SQL Authentication) ---
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

# --- Configuración de Redis Cache y Channels (usando la nueva variable de conexión) ---
AZURE_REDIS_CONNECTIONSTRING = os.environ.get('AZURE_REDIS_CONNECTIONSTRING')

if AZURE_REDIS_CONNECTIONSTRING:
    # Parse Azure Redis connection string (e.g., "host:port,password=...,ssl=True")
    redis_parts = AZURE_REDIS_CONNECTIONSTRING.split(',')
    
    redis_host_port = redis_parts[0]
    redis_host = redis_host_port.split(':')[0]
    redis_port = redis_host_port.split(':')[1]
    
    redis_password = ""
    ssl_enabled = False

    for part in redis_parts[1:]:
        if part.strip().lower().startswith('password='):
            redis_password = part.split('=', 1)[1].strip()
        elif part.strip().lower().startswith('ssl=true'):
            ssl_enabled = True

    # Construct a redis:// URL for Django
    protocol = "rediss" if ssl_enabled else "redis"
    REDIS_URL = f"{protocol}://:{redis_password}@{redis_host}:{redis_port}/1"
    
    # Log the constructed URL for debugging (without the full password)
    logger.info(f"DEBUGGING: Redis URL constructed: {protocol}://:***@{redis_host}:{redis_port}/1")
    
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': REDIS_URL,
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
                'hosts': [REDIS_URL],
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

# --- Configuración de Logging ---
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console_info': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'stream': sys.stdout,  # Send INFO/DEBUG to stdout
            'formatter': 'verbose',
        },
        'console_error': {
            'level': 'ERROR',
            'class': 'logging.StreamHandler',
            'stream': sys.stderr,  # Send only real errors to stderr
            'formatter': 'verbose',
        },
        'console_warning': {
            'level': 'WARNING',
            'class': 'logging.StreamHandler',
            'stream': sys.stdout,  # Send warnings to stdout too
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console_info', 'console_error'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console_info', 'console_error'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console_warning'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['console_warning'],
            'level': 'WARNING',
            'propagate': False,
        },
        # Your app loggers
        'middleware.dynamic_host': {
            'handlers': ['console_info'],
            'level': 'INFO',
            'propagate': False,
        },
        # Add your app name here
        'backend': {  # Replace 'backend' with your app name
            'handlers': ['console_info', 'console_error'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# --- Configuración de ASGI ---
ASGI_APPLICATION = "backend.asgi.application"