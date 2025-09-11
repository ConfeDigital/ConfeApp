import logging
from datetime import datetime, timedelta
from django.utils import timezone
from candidatos.models import JobHistory
from agencia.models import Employer
from notifications.models import BimonthlyCommentReminder

logger = logging.getLogger(__name__)


def process_bimonthly_reminders(dry_run=False, force=False, stdout=None):
    """
    Core logic for sending bimonthly reminders.
    Can be called from management commands or Celery tasks.
    """
    today = timezone.now().date()

    # Determine bimonthly period
    current_month = today.month
    current_year = today.year

    if current_month in [1, 2]:
        period_start = datetime(current_year, 1, 1).date()
        period_end = datetime(current_year, 2, 29 if (current_year % 4 == 0 and (current_year % 100 != 0 or current_year % 400 == 0)) else 28).date()
    elif current_month in [3, 4]:
        period_start = datetime(current_year, 3, 1).date()
        period_end = datetime(current_year, 4, 30).date()
    elif current_month in [5, 6]:
        period_start = datetime(current_year, 5, 1).date()
        period_end = datetime(current_year, 6, 30).date()
    elif current_month in [7, 8]:
        period_start = datetime(current_year, 7, 1).date()
        period_end = datetime(current_year, 8, 31).date()
    elif current_month in [9, 10]:
        period_start = datetime(current_year, 9, 1).date()
        period_end = datetime(current_year, 10, 31).date()
    else:
        period_start = datetime(current_year, 11, 1).date()
        period_end = datetime(current_year, 12, 31).date()

    _out(stdout, f"Current bimonthly period: {period_start} to {period_end}")

    # Active job histories
    active_job_histories = JobHistory.objects.filter(
        end_date__isnull=True,
        job__isnull=False,
        job__company__isnull=False
    ).select_related("candidate", "job", "job__company")

    _out(stdout, f"Found {active_job_histories.count()} active job assignments")

    reminders_created = 0
    reminders_sent = 0
    errors = 0

    for job_history in active_job_histories:
        try:
            # Find employer
            try:
                employer = Employer.objects.get(company=job_history.job.company)
            except Employer.DoesNotExist:
                _warn(stdout, f"No employer found for company {job_history.job.company.name}")
                continue
            except Employer.MultipleObjectsReturned:
                employer = Employer.objects.filter(company=job_history.job.company).first()
                _warn(stdout, f"Multiple employers found for company {job_history.job.company.name}, using first one")

            reminder, created = BimonthlyCommentReminder.objects.get_or_create(
                employer=employer,
                candidate=job_history.candidate,
                job=job_history.job,
                period_start=period_start,
                defaults={"period_end": period_end},
            )

            if created:
                reminders_created += 1
                _out(stdout, f"Created reminder: {employer.user.get_full_name()} -> {job_history.candidate.user.get_full_name()}")

            should_send = False

            if not reminder.comment_provided:
                notification_date = period_start + timedelta(days=15)

                if today >= notification_date and (not reminder.notification_sent or force):
                    should_send = True
                elif reminder.notification_sent and reminder.last_reminder_sent:
                    if (today - reminder.last_reminder_sent.date()).days >= 7:
                        should_send = True
                elif reminder.days_until_due <= 3 and reminder.days_until_due >= 0:
                    if not reminder.last_reminder_sent or (today - reminder.last_reminder_sent.date()).days >= 1:
                        should_send = True
                elif reminder.is_overdue:
                    if not reminder.last_reminder_sent or (today - reminder.last_reminder_sent.date()).days >= 1:
                        should_send = True

            if should_send and not dry_run:
                reminder.send_reminder()
                reminders_sent += 1
                _success(stdout, f"Sent reminder to {employer.user.get_full_name()} about {job_history.candidate.user.get_full_name()}")
            elif should_send and dry_run:
                reminders_sent += 1
                _out(stdout, f"[DRY RUN] Would send reminder to {employer.user.get_full_name()} about {job_history.candidate.user.get_full_name()}")

        except Exception as e:
            errors += 1
            logger.error(f"Error processing job history {job_history.id}: {str(e)}")
            _error(stdout, f"Error processing {job_history.candidate.user.get_full_name()}: {str(e)}")

    # Summary
    _success(stdout, f"\nSummary {'(DRY RUN)' if dry_run else ''}:\n- Reminders created: {reminders_created}\n- Reminders sent: {reminders_sent}\n- Errors: {errors}")

    overdue_reminders = BimonthlyCommentReminder.objects.filter(
        period_end__lt=today, comment_provided=False
    ).count()
    if overdue_reminders > 0:
        _warn(stdout, f"\nWarning: {overdue_reminders} overdue comment periods found!")


def _out(stdout, msg):
    if stdout:
        stdout.write(msg)
    else:
        print(msg)


def _success(stdout, msg):
    if stdout:
        stdout.write(msg)
    else:
        print(f"[SUCCESS] {msg}")


def _warn(stdout, msg):
    if stdout:
        stdout.write(msg)
    else:
        print(f"[WARNING] {msg}")


def _error(stdout, msg):
    if stdout:
        stdout.write(msg)
    else:
        print(f"[ERROR] {msg}")
