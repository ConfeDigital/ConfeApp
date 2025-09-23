#!/bin/bash

# Activate virtual environment if it exists
echo "Activating virtual environment..."
if [ -d "venv" ]; then
    echo "Virtual environment found, activating..."
    source venv/bin/activate
    echo "Virtual environment activated"
    echo "Python version: $(python --version)"
    echo "Python location: $(which python)"
    echo "Pip list (first 10 packages):"
    pip list | head -10
else
    echo "No virtual environment found"
fi

export DJANGO_SETTINGS_MODULE='backend.deployment'

# Only run migrations if needed (check if migrations are pending)
echo "Checking for pending migrations..."
python manage.py showmigrations --plan | grep -q '\[ \]' && {
    echo "Running pending migrations..."
    python manage.py migrate --noinput
} || {
    echo "No pending migrations found, skipping..."
}

# Only collect static files if they don't exist or are outdated
echo "Checking static files..."
if [ ! -d "staticfiles" ] || [ "staticfiles" -ot "static" ]; then
    echo "Collecting static files..."
    python manage.py collectstatic --noinput
else
    echo "Static files up to date, skipping..."
fi

# Start Daphne server
echo "Starting Daphne server..."
daphne -b 0.0.0.0 -p 8000 backend.asgi:application 