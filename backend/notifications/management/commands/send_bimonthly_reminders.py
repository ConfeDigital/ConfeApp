from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from candidatos.models import UserProfile, JobHistory
from agencia.models import Employer
from notifications.models import BimonthlyCommentReminder
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Send bimonthly comment reminders to employers about their active candidates'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without actually sending notifications',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force send reminders even if already sent for this period',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Starting bimonthly reminder process {'(DRY RUN)' if dry_run else ''}"
            )
        )
        
        # Get current date
        today = timezone.now().date()
        
        # Calculate current bimonthly period
        # Periods: Jan-Feb, Mar-Apr, May-Jun, Jul-Aug, Sep-Oct, Nov-Dec
        current_month = today.month
        current_year = today.year
        
        # Determine which bimonthly period we're in
        if current_month in [1, 2]:
            period_start = datetime(current_year, 1, 1).date()
            period_end = datetime(current_year, 2, 28).date()
            if current_year % 4 == 0 and (current_year % 100 != 0 or current_year % 400 == 0):
                period_end = datetime(current_year, 2, 29).date()
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
        else:  # Nov-Dec
            period_start = datetime(current_year, 11, 1).date()
            period_end = datetime(current_year, 12, 31).date()
        
        self.stdout.write(f"Current bimonthly period: {period_start} to {period_end}")
        
        # Find all active job histories (candidates currently employed)
        active_job_histories = JobHistory.objects.filter(
            end_date__isnull=True,  # Currently active
            job__isnull=False,      # Has a job assigned
            job__company__isnull=False  # Job has a company
        ).select_related('candidate', 'job', 'job__company')
        
        self.stdout.write(f"Found {active_job_histories.count()} active job assignments")
        
        reminders_created = 0
        reminders_sent = 0
        errors = 0
        
        for job_history in active_job_histories:
            try:
                # Find the employer for this job's company
                try:
                    employer = Employer.objects.get(company=job_history.job.company)
                except Employer.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f"No employer found for company {job_history.job.company.name}"
                        )
                    )
                    continue
                except Employer.MultipleObjectsReturned:
                    # If multiple employers, get the first one (you might want to handle this differently)
                    employer = Employer.objects.filter(company=job_history.job.company).first()
                    self.stdout.write(
                        self.style.WARNING(
                            f"Multiple employers found for company {job_history.job.company.name}, using first one"
                        )
                    )
                
                # Check if reminder already exists for this period
                reminder, created = BimonthlyCommentReminder.objects.get_or_create(
                    employer=employer,
                    candidate=job_history.candidate,
                    job=job_history.job,
                    period_start=period_start,
                    defaults={
                        'period_end': period_end,
                    }
                )
                
                if created:
                    reminders_created += 1
                    self.stdout.write(
                        f"Created reminder: {employer.user.get_full_name()} -> {job_history.candidate.user.get_full_name()}"
                    )
                
                # Determine if we should send a reminder
                should_send = False
                
                if not reminder.comment_provided:
                    # Check if it's time to send initial notification (start of period + 15 days)
                    notification_date = period_start + timedelta(days=15)
                    
                    if today >= notification_date and (not reminder.notification_sent or force):
                        should_send = True
                    
                    # Send reminders every 7 days after initial notification
                    elif reminder.notification_sent and reminder.last_reminder_sent:
                        days_since_last = (today - reminder.last_reminder_sent.date()).days
                        if days_since_last >= 7:
                            should_send = True
                    
                    # Send urgent reminders daily in the last 3 days
                    elif reminder.days_until_due <= 3 and reminder.days_until_due >= 0:
                        if not reminder.last_reminder_sent or (today - reminder.last_reminder_sent.date()).days >= 1:
                            should_send = True
                    
                    # Send overdue reminders daily
                    elif reminder.is_overdue:
                        if not reminder.last_reminder_sent or (today - reminder.last_reminder_sent.date()).days >= 1:
                            should_send = True
                
                if should_send and not dry_run:
                    reminder.send_reminder()
                    reminders_sent += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Sent reminder to {employer.user.get_full_name()} about {job_history.candidate.user.get_full_name()}"
                        )
                    )
                elif should_send and dry_run:
                    reminders_sent += 1
                    self.stdout.write(
                        f"[DRY RUN] Would send reminder to {employer.user.get_full_name()} about {job_history.candidate.user.get_full_name()}"
                    )
                
            except Exception as e:
                errors += 1
                logger.error(f"Error processing job history {job_history.id}: {str(e)}")
                self.stdout.write(
                    self.style.ERROR(
                        f"Error processing {job_history.candidate.user.get_full_name()}: {str(e)}"
                    )
                )
        
        # Summary
        self.stdout.write(
            self.style.SUCCESS(
                f"\nSummary {'(DRY RUN)' if dry_run else ''}:\n"
                f"- Reminders created: {reminders_created}\n"
                f"- Reminders sent: {reminders_sent}\n"
                f"- Errors: {errors}"
            )
        )
        
        # Show overdue reminders
        overdue_reminders = BimonthlyCommentReminder.objects.filter(
            period_end__lt=today,
            comment_provided=False
        ).count()
        
        if overdue_reminders > 0:
            self.stdout.write(
                self.style.WARNING(
                    f"\nWarning: {overdue_reminders} overdue comment periods found!"
                )
            )