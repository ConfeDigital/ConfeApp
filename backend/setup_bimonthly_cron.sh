#!/bin/bash

# Setup script for bimonthly comment reminder cron job
# This script sets up a cron job to run the bimonthly reminder command daily

# Get the absolute path to the project
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$PROJECT_DIR/../env"
MANAGE_PY="$PROJECT_DIR/manage.py"

echo "Setting up bimonthly comment reminder cron job..."
echo "Project directory: $PROJECT_DIR"
echo "Virtual environment: $VENV_DIR"
echo "Manage.py: $MANAGE_PY"

# Check if virtual environment exists
if [ ! -d "$VENV_DIR" ]; then
    echo "Error: Virtual environment not found at $VENV_DIR"
    echo "Please make sure the virtual environment is set up correctly."
    exit 1
fi

# Check if manage.py exists
if [ ! -f "$MANAGE_PY" ]; then
    echo "Error: manage.py not found at $MANAGE_PY"
    exit 1
fi

# Create the cron job entry
CRON_ENTRY="0 9 * * * cd $PROJECT_DIR && $VENV_DIR/bin/python $MANAGE_PY send_bimonthly_reminders >> /var/log/bimonthly_reminders.log 2>&1"

echo ""
echo "Cron job entry to add:"
echo "$CRON_ENTRY"
echo ""

# Ask user if they want to add it to crontab
read -p "Do you want to add this cron job to your crontab? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Add to crontab
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
    echo "Cron job added successfully!"
    echo "The command will run daily at 9:00 AM"
    echo "Logs will be written to /var/log/bimonthly_reminders.log"
else
    echo "Cron job not added. You can add it manually later using:"
    echo "crontab -e"
    echo "Then add this line:"
    echo "$CRON_ENTRY"
fi

echo ""
echo "To test the command manually, run:"
echo "cd $PROJECT_DIR && $VENV_DIR/bin/python $MANAGE_PY send_bimonthly_reminders --dry-run"
echo ""
echo "To force send reminders (for testing), run:"
echo "cd $PROJECT_DIR && $VENV_DIR/bin/python $MANAGE_PY send_bimonthly_reminders --force"
