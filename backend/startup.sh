#!/bin/bash

# Debug information
echo "=== Startup Script Debug Info ==="
echo "Current directory: $(pwd)"
echo "Script location: $0"
echo "================================"

# Set Django settings module for deployment
export DJANGO_SETTINGS_MODULE='backend.deployment'

# Activate virtual environment if it exists (for WEBSITE_RUN_FROM_PACKAGE=1)
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
    echo "Virtual environment activated"
    echo "Python version: $(python --version)"
    echo "Python location: $(which python)"
else
    echo "No virtual environment found, using system Python"
    echo "Python version: $(python3.12 --version)"
    echo "Python location: $(which python3.12)"
fi

# Only run migrations if needed (check if migrations are pending)
echo "Checking for pending migrations..."
if [ -d "venv" ]; then
    python manage.py showmigrations --plan | grep -q '\[ \]' && {
        echo "Running pending migrations..."
        python manage.py migrate --noinput
    } || {
        echo "No pending migrations found, skipping..."
    }
else
    python3.12 manage.py showmigrations --plan | grep -q '\[ \]' && {
        echo "Running pending migrations..."
        python3.12 manage.py migrate --noinput
    } || {
        echo "No pending migrations found, skipping..."
    }
fi

# Only collect static files if they don't exist or are outdated
echo "Checking static files..."
if [ ! -d "staticfiles" ] || [ "staticfiles" -ot "static" ]; then
    echo "Collecting static files..."
    if [ -d "venv" ]; then
        python manage.py collectstatic --noinput
    else
        python3.12 manage.py collectstatic --noinput
    fi
else
    echo "Static files up to date, skipping..."
fi

# Start Daphne server
echo "Starting Daphne server..."
if [ -d "venv" ]; then
    echo "Daphne location: $(which daphne)"
    daphne -b 0.0.0.0 -p 8000 backend.asgi:application
else
    echo "Daphne location: $(which daphne)"
    python3.12 -m daphne -b 0.0.0.0 -p 8000 backend.asgi:application
fi 