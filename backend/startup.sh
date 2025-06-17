#!/bin/bash

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Collect static files
python manage.py collectstatic --noinput

# Start Daphne server
daphne -b 0.0.0.0 -p 8000 backend.asgi:application 