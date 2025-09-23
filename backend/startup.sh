#!/bin/bash

# Define the absolute path to the virtual environment's bin directory
VENV_BIN="./venv/bin"

echo "Using virtual environment at: $VENV_BIN"

# Check for pending migrations using the venv's python executable
echo "Checking for pending migrations..."
$VENV_BIN/python manage.py showmigrations --plan | grep -q '\[ \]' && {
    echo "Running pending migrations..."
    $VENV_BIN/python manage.py migrate --noinput
} || {
    echo "No pending migrations found, skipping..."
}

# Check static files using the venv's python executable
echo "Checking static files..."
if [ ! -d "staticfiles" ] || [ "staticfiles" -ot "static" ]; then
    echo "Collecting static files..."
    $VENV_BIN/python manage.py collectstatic --noinput
else
    echo "Static files up to date, skipping..."
fi

# Start Daphne server using the venv's daphne executable
echo "Starting Daphne server..."
$VENV_BIN/daphne -b 0.0.0.0 -p 8000 backend.asgi:application