#!/bin/bash

# Set Django settings module
export DJANGO_SETTINGS_MODULE='backend.deployment'

# Run database migrations
python manage.py migrate --noinput

# Collect static files
python manage.py collectstatic --noinput

# Start Daphne server
daphne -b 0.0.0.0 -p 8000 backend.asgi:application 