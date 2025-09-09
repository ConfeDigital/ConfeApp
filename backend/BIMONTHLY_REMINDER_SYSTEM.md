# Bimonthly Comment Reminder System

## Overview

The bimonthly comment reminder system automatically reminds employers to provide observations/comments about candidates who are currently employed in their company. The system runs on a bimonthly schedule (every 2 months) and sends notifications to employers when it's time to evaluate their active candidates.

## How It Works

### Bimonthly Periods
The system divides the year into 6 bimonthly periods:
- **January-February** (Jan 1 - Feb 28/29)
- **March-April** (Mar 1 - Apr 30)
- **May-June** (May 1 - Jun 30)
- **July-August** (Jul 1 - Aug 31)
- **September-October** (Sep 1 - Oct 31)
- **November-December** (Nov 1 - Dec 31)

### Notification Schedule
1. **Initial Notification**: Sent 15 days after the start of each bimonthly period
2. **Follow-up Reminders**: Sent every 7 days after the initial notification
3. **Urgent Reminders**: Sent daily in the last 3 days before the period ends
4. **Overdue Reminders**: Sent daily after the period ends until a comment is provided

### Comment Completion
When an employer adds a comment to a candidate's job history, the system automatically:
- Marks the corresponding bimonthly reminder as completed
- Sends a success notification to the employer
- Stops sending further reminders for that period

## Components

### 1. Database Models

#### BimonthlyCommentReminder
Located in `notifications/models.py`, this model tracks:
- Which employer needs to provide comments
- Which candidate needs evaluation
- Which job the candidate is assigned to
- The bimonthly period dates
- Notification status and timing
- Comment completion status

### 2. Management Command

#### send_bimonthly_reminders
Located in `notifications/management/commands/send_bimonthly_reminders.py`

**Usage:**
```bash
# Dry run (show what would be done without sending notifications)
python manage.py send_bimonthly_reminders --dry-run

# Force send reminders (for testing)
python manage.py send_bimonthly_reminders --force

# Normal run (sends notifications according to schedule)
python manage.py send_bimonthly_reminders
```

**Options:**
- `--dry-run`: Show what would be done without actually sending notifications
- `--force`: Force send reminders even if already sent for this period

### 3. Signal Handlers

#### JobHistoryComment Signal
Located in `notifications/signals.py`, automatically processes when comments are created:
- Detects if the comment author is an employer
- Verifies the comment is for a job in the employer's company
- Marks the corresponding bimonthly reminder as completed

### 4. Frontend Integration

The system integrates with the existing `JobCandidatesPage.jsx` where employers can:
- View their assigned candidates
- Add comments/observations to candidate job histories
- See existing comments with proper categorization

## Setup and Configuration

### 1. Database Migration
The system requires a database migration for the `BimonthlyCommentReminder` model:
```bash
python manage.py makemigrations notifications
python manage.py migrate notifications
```

### 2. Cron Job Setup
To automate the reminder process, set up a cron job to run daily:

```bash
# Run the setup script
./setup_bimonthly_cron.sh

# Or manually add to crontab:
# 0 9 * * * cd /path/to/project/backend && /path/to/venv/bin/python manage.py send_bimonthly_reminders >> /var/log/bimonthly_reminders.log 2>&1
```

### 3. Admin Interface
The system includes a Django admin interface for managing reminders:
- View all bimonthly reminders
- Filter by employer, candidate, job, or period
- See completion status and reminder counts
- Monitor overdue reminders

## Testing

### Manual Testing
```bash
# Test the system with existing data
python test_bimonthly_system.py

# Test the management command
python manage.py send_bimonthly_reminders --dry-run --force

# Test notification sending
python manage.py send_bimonthly_reminders --force
```

### Test Scenarios
1. **Create Test Data**: Ensure there are active job histories with proper employer relationships
2. **Run Command**: Execute the management command to create reminders
3. **Send Notifications**: Test notification sending functionality
4. **Add Comments**: Simulate employer adding comments via the frontend
5. **Verify Completion**: Check that reminders are marked as completed

## Monitoring and Maintenance

### Logs
- Cron job logs: `/var/log/bimonthly_reminders.log`
- Django logs: Check your Django logging configuration

### Admin Interface
Access the Django admin to monitor:
- Reminder creation and status
- Notification sending history
- Comment completion rates
- Overdue reminders

### Key Metrics to Monitor
- Number of active job assignments
- Reminder creation rate
- Notification delivery success
- Comment completion rate
- Overdue reminders count

## Troubleshooting

### Common Issues

1. **No Notifications Sent**
   - Check if there are active job histories
   - Verify employer-company relationships
   - Ensure the command is running at the right time (15+ days into period)

2. **Comments Not Marking Reminders Complete**
   - Verify the signal handler is properly connected
   - Check that the comment author is an employer
   - Ensure the job belongs to the employer's company

3. **Cron Job Not Running**
   - Check cron service status
   - Verify the cron job entry is correct
   - Check log files for errors

### Debug Commands
```bash
# Check active job histories
python manage.py shell -c "from candidatos.models import JobHistory; print(JobHistory.objects.filter(end_date__isnull=True).count())"

# Check existing reminders
python manage.py shell -c "from notifications.models import BimonthlyCommentReminder; print(BimonthlyCommentReminder.objects.count())"

# Test notification sending
python manage.py shell -c "from notifications.models import BimonthlyCommentReminder; r = BimonthlyCommentReminder.objects.first(); r.send_reminder() if r else print('No reminders')"
```

## Future Enhancements

Potential improvements to consider:
1. **Email Notifications**: Add email support in addition to in-app notifications
2. **Customizable Reminder Intervals**: Allow configuration of reminder timing
3. **Bulk Comment Interface**: Allow employers to comment on multiple candidates at once
4. **Analytics Dashboard**: Create reports on evaluation completion rates
5. **Integration with Performance Reviews**: Link with formal performance review systems
