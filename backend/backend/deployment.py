import os 
from .settings import *
from .settings import BASE_DIR

ALLOWED_HOSTS = [os.environ['WEBSITE_HOSTNAME']]
CSRF_TRUSTED_ORIGINS = ['https://'+os.environ['WEBSITE_HOSTNAME']]
DEBUG = False
SECRET_KEY = os.environ['MY_SECRET_KEY']

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
]

CORS_ALLOWED_ORIGINS = [
    'https://kaiuki.com',
    'https://zealous-desert-08853fc0f.6.azurestaticapps.net'
]


STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

# CONNECTION = os.environ['AZURE_POSTGRESQL_CONNECTIONSTRING']
CONNECTION = os.environ['AZURE_SQL_CONNECTIONSTRING']
CONNECTION_STR = {pair.split('=')[0]:pair.split('=')[1] for pair in CONNECTION.split(' ')}

# En deployment.py
DATABASES = {
    "default": {
        "ENGINE": "mssql", # o 'sqlserver_pyodbc' si usas el paquete django-sqlserver
        "NAME": CONNECTION_STR['Database'], # Usar 'Database' en lugar de 'dbname'
        "HOST": CONNECTION_STR['Server'].split(',')[0], # Extraer solo el host, sin el puerto
        "PORT": CONNECTION_STR['Port'] if 'Port' in CONNECTION_STR else '1433', # El puerto suele ser 1433
        "USER": CONNECTION_STR['User ID'],
        "PASSWORD": CONNECTION_STR['Password'],
        "OPTIONS": {
            "driver": "ODBC Driver 17 for SQL Server", # Asegúrate de que este driver esté disponible en el contenedor de Azure
        }
    }
}

# Redis Cache Configuration for Azure
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

    # Channels Redis Configuration for Azure
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
    # Fallback to in-memory or other default if Redis environment variables are not set
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

# LOGGING = {
#     'version': 1,
#     'disable_existing_loggers': False,
#     'handlers': {
#         'mail_admins': {
#             'level': 'ERROR',
#             'class': 'django.utils.log.AdminEmailHandler',
#         },
#     },
#     'loggers': {
#         'django': {
#             'handlers': ['mail_admins'],
#             'level': 'ERROR',
#             'propagate': True,
#         },
#     },
# }



# ADMINS = [("Nick", "YOURMAIL.com")]

# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# EMAIL_HOST = 'smtp.gmail.com'
# EMAIL_PORT = 587
# EMAIL_USE_TLS = True
# EMAIL_HOST_USER = os.environ.get('EMAIL_USER')
# EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_PASSWORD')
# DEFAULT_FROM_EMAIL = 'default from email'



# STATIC_ROOT = BASE_DIR/'staticfiles'