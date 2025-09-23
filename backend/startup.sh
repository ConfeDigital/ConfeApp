#!/bin/bash

# Debug information
echo "=== Startup Script Debug Info ==="
echo "Current directory: $(pwd)"
echo "Script location: $0"
echo "Python version: $(python3.12 --version)"
echo "Available Python: $(which python3.12)"
echo "================================"

# Set Django settings module for deployment
export DJANGO_SETTINGS_MODULE='backend.deployment'

# For WEBSITE_RUN_FROM_PACKAGE=1, we use system Python directly
# No virtual environment activation needed as packages are installed globally

# Only run migrations if needed (check if migrations are pending)
echo "Checking for pending migrations..."
python3.12 manage.py showmigrations --plan | grep -q '\[ \]' && {
    echo "Running pending migrations..."
    python3.12 manage.py migrate --noinput
} || {
    echo "No pending migrations found, skipping..."
}

# Only collect static files if they don't exist or are outdated
echo "Checking static files..."
if [ ! -d "staticfiles" ] || [ "staticfiles" -ot "static" ]; then
    echo "Collecting static files..."
    python3.12 manage.py collectstatic --noinput
else
    echo "Static files up to date, skipping..."
fi

# Start Daphne server using system Python
echo "Starting Daphne server..."
echo "Daphne location: $(which daphne)"
python3.12 -m daphne -b 0.0.0.0 -p 8000 backend.asgi:application 