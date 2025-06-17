import os
import logging
from .settings import * # Importa todo de settings.py
from .settings import BASE_DIR # Asegura que BASE_DIR esté disponible

logger = logging.getLogger(__name__)

# --- Configuración del Host y CSRF ---
ALLOWED_HOSTS = [os.environ['WEBSITE_HOSTNAME'], 'localhost', '127.0.0.1']
CSRF_TRUSTED_ORIGINS = ['https://'+os.environ['WEBSITE_HOSTNAME']]
DEBUG = False # Crucial para producción
SECRET_KEY = os.environ['MY_SECRET_KEY']

# Verificar WEBSITE_HOSTNAME (temporalmente para depuración)
try:
    hostname_check = os.environ['WEBSITE_HOSTNAME']
    logger.warning(f"DEBUGGING: WEBSITE_HOSTNAME is: {hostname_check}")
except KeyError:
    logger.error("DEBUGGING: WEBSITE_HOSTNAME environment variable not found!")

# --- Middlewares (se mantiene como lo tenías) ---
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # Importante para estáticos
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

# --- Configuración de la Base de Datos (AZURE SQL con Managed Identity) ---
# Necesitas estas importaciones para Managed Identity
from azure.identity import DefaultAzureCredential
import pyodbc

CONNECTION_STRING_RAW = os.environ['AZURE_SQL_CONNECTIONSTRING']

# Parsear la cadena de conexión correctamente
CONNECTION_PARAMS = {}
for part in CONNECTION_STRING_RAW.split(';'):
    if '=' in part:
        key, value = part.split('=', 1)
        CONNECTION_PARAMS[key.strip()] = value.strip()

SQL_SERVER_HOST = CONNECTION_PARAMS.get('Server', '').split(',')[0].strip()
SQL_SERVER_PORT = CONNECTION_PARAMS.get('Port', '1433').strip()
SQL_SERVER_DATABASE = CONNECTION_PARAMS.get('Initial Catalog', '').strip()

# Obtener token de acceso para Managed Identity
def get_access_token():
    try:
        credential = DefaultAzureCredential()
        token = credential.get_token("https://database.windows.net/.default")
        return token.token
    except Exception as e:
        logger.error(f"Error getting Azure AD token: {e}")
        return None

# Función para la conexión de Django con el token
class AzureSQLDatabaseWrapper:
    def __init__(self, *args, **kwargs):
        self.access_token = get_access_token()
        if not self.access_token:
            raise Exception("Failed to get Azure AD access token for database connection.")
        kwargs['OPTIONS'] = kwargs.get('OPTIONS', {})
        kwargs['OPTIONS']['attrs_before'] = {1256: self.access_token}
        super().__init__(*args, **kwargs)

# Configuración DATABASES
DATABASES = {
    "default": {
        "ENGINE": "mssql",
        "NAME": SQL_SERVER_DATABASE,
        "HOST": SQL_SERVER_HOST,
        "PORT": SQL_SERVER_PORT,
        "OPTIONS": {
            "driver": "ODBC Driver 17 for SQL Server",
            "TrustServerCertificate": "yes",
            "Encrypt": "yes",
        },
        "AUTOCOMMIT": True,
        "ATOMIC_REQUESTS": True,
        "CLIENT_CLASS": "backend.deployment.AzureSQLDatabaseWrapper",
    }
}

# --- Configuración de Redis Cache y Channels ---
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

# Asegúrate de que estas variables estén en settings.py o aquí si las usas.
# AD_TENANT_ID = os.environ.get('TENANT_ID')
# AD_CLIENT_ID = os.environ.get('CLIENT_ID')
# AD_CLIENT_SECRET = os.environ.get('CLIENT_SECRET')

# Asegúrate de que AUTH_ADFS en settings.py use variables de entorno si están ahí.
# Por ejemplo, si client_id, client_secret y tenant_id se definen usando os.getenv en settings.py,
# esos valores de environment variables deben estar configurados en Azure App Service.