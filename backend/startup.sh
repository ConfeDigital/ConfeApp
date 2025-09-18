#!/bin/bash

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

export DJANGO_SETTINGS_MODULE='backend.deployment'

# Run migrations
python manage.py migrate --noinput

# Collect static files
python manage.py collectstatic --noinput

# Start Celery Beat (DatabaseScheduler)
celery -A backend beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler &

# Start Celery Worker
celery -A backend worker -l info &

# Start Daphne server
daphne -b 0.0.0.0 -p 8000 backend.asgi:application
