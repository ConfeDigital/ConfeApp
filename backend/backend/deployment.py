import os
import logging
from .settings import *
from .settings import BASE_DIR

logger = logging.getLogger(__name__)

# --- Configuración del Host y CSRF ---
ALLOWED_HOSTS = [os.environ['WEBSITE_HOSTNAME'], 'localhost', '127.0.0.1']
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

# --- Configuración de la Base de Datos (AZURE SQL con Managed Identity - REVISADO) ---
from azure.identity import DefaultAzureCredential
import pyodbc

CONNECTION_STRING_RAW = os.environ['AZURE_SQL_CONNECTIONSTRING']

CONNECTION_PARAMS = {}
for part in CONNECTION_STRING_RAW.split(';'):
    if '=' in part:
        key, value = part.split('=', 1)
        CONNECTION_PARAMS[key.strip()] = value.strip()

SQL_SERVER_HOST = CONNECTION_PARAMS.get('Server', '').split(',')[0].strip()
SQL_SERVER_PORT = CONNECTION_PARAMS.get('Port', '1433').strip()
SQL_SERVER_DATABASE = CONNECTION_PARAMS.get('Initial Catalog', '').strip()

# --- Clase Wrapper para inyectar el token de acceso ---
class AzureADAccessTokenDatabaseWrapper(pyodbc.connect): # Hereda directamente de pyodbc.connect
    def __init__(self, dsn, **kwargs):
        self.access_token_str = None
        try:
            credential = DefaultAzureCredential()
            # El scope para Azure SQL Database es https://database.windows.net/.default
            token = credential.get_token("https://database.windows.net/.default")
            self.access_token_str = token.token
            logger.info("Successfully obtained Azure AD access token.")
        except Exception as e:
            logger.error(f"Failed to obtain Azure AD access token: {e}")
            raise

        # Modifica la cadena de conexión DSN para incluir el token
        # Asegúrate de que la cadena base no incluya 'Authentication=' si vas a añadir 'AccessToken='
        # Tu cadena AZURE_SQL_CONNECTIONSTRING ya tiene Authentication="Active Directory Default";
        # La eliminamos para añadir AccessToken
        if "Authentication" in CONNECTION_PARAMS:
            del CONNECTION_PARAMS["Authentication"]

        # Reconstruir la cadena DSN sin Authentication y con AccessToken
        dsn_parts = [f"{k}={v}" for k, v in CONNECTION_PARAMS.items()]
        # Agregamos el token directamente aquí
        dsn_parts.append(f"Authentication=ActiveDirectoryAccessToken")
        dsn_parts.append(f"AccessToken={self.access_token_str}")

        final_dsn = ";".join(dsn_parts)
        
        logger.info(f"Connecting to SQL with DSN: {final_dsn.split('AccessToken=')[0]}...") # Evita loguear el token completo

        super().__init__(final_dsn, **kwargs) # Llama al constructor de pyodbc.connect


# Configuración DATABASES
DATABASES = {
    "default": {
        "ENGINE": "mssql", # Asegúrate de que django-mssql esté instalado
        "NAME": SQL_SERVER_DATABASE,
        "HOST": SQL_SERVER_HOST,
        "PORT": SQL_SERVER_PORT,
        "OPTIONS": {
            "driver": "ODBC Driver 17 for SQL Server", # Confirma este driver en App Service
            "TrustServerCertificate": "yes",
            "Encrypt": "yes",
            # "Connection Timeout": "30", # Ya está en la cadena base, no es necesario aquí a menos que quieras sobrescribir
            # 'Authentication': 'ActiveDirectoryAccessToken', # No se necesita aquí, ya lo manejamos en el wrapper
        },
        # NO ESPECIFICAR USER NI PASSWORD PARA MANAGED IDENTITY
        "AUTOCOMMIT": True,
        "ATOMIC_REQUESTS": True,
        # Usar el wrapper personalizado para la conexión
        "CLIENT_CLASS": "backend.deployment.AzureADAccessTokenDatabaseWrapper",
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

# --- Configuración de ADFS (revisada ligeramente para `SERVER` y `REDIRECT_URIS` si no están en settings.py general) ---
# Asegúrate de que estos valores se carguen desde variables de entorno correctamente
client_id = os.environ.get('CLIENT_ID') # Asumo que CLIENT_ID, CLIENT_SECRET, TENANT_ID también son variables de entorno en Azure
client_secret = os.environ.get('CLIENT_SECRET')
tenant_id = os.environ.get('TENANT_ID')


AUTH_ADFS = {
    "SERVER": "login.microsoftonline.com", # <--- ¡Añadir o confirmar si no está en settings.py general!
    "AUDIENCE": client_id, # Revisa esto con tu URI de App ID si lo tienes. Podría ser "api://<tu_app_id>"
    "CLIENT_ID": client_id,
    'CLIENT_SECRET': client_secret, # Solo si tu App Registration es Web/Confidential. Para MSI, no es ideal.
    "CLAIM_MAPPING": {
        "first_name": "given_name", # common for Azure AD
        "last_name": "family_name", # common for Azure AD
        "email": "upn", # common for Azure AD, or use "email"
    },
    "USERNAME_CLAIM": "preferred_username", # Asegura que este claim exista en los tokens de ADFS
    'GROUPS_CLAIM': None, # Si no usas grupos de ADFS, déjalo en None
    "TENANT_ID": tenant_id,
    "RELYING_PARTY_ID": client_id, # A menudo el CLIENT_ID para Azure AD
    'LOGIN_EXEMPT_URLS': [
        r'^api', r"^admin", r"^auth", r"public/", r"^media", r"^static", # Expresiones regulares. Añade r'^$' si la raíz es pública
        r"^oauth2/callback$", # <--- ¡CRUCIAL! Asegúrate que la URL de callback esté exenta
        r"^oauth2/login/$", # <--- Opcional, pero bueno para asegurar que la página de login de ADFS no pida login
        r"^accounts/login/$", # Si usas alguna vista de login default de Django
    ],
    'CREATE_NEW_USERS': True,
    'SCOPES': [
        'openid', # Requerido
        'profile', # Para claims de perfil
        'email', # Para claim de email
        # 'api://<your_app_id_uri>/read', # Si tienes un scope de API personalizado como el que comentaste
    ],
    'VERSION': 'v2.0',
    "REDIRECT_URIS": [ # <--- ¡Añadir o confirmar si no está en settings.py general!
        f"https://{os.environ['WEBSITE_HOSTNAME']}/oauth2/callback",
        # Agrega cualquier otro dominio personalizado si lo tienes, ej: "https://yourcustomdomain.com/oauth2/callback"
    ],
}
