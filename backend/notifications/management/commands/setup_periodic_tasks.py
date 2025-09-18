from django.core.management.base import BaseCommand
from django_celery_beat.models import PeriodicTask, CrontabSchedule
from django.utils.timezone import now
import json


class Command(BaseCommand):
    help = 'Set up periodic tasks for notifications'

    def handle(self, *args, **options):
        self.stdout.write('Setting up periodic tasks...')
        
        # Daily at 9:00 AM
        schedule, created = CrontabSchedule.objects.get_or_create(
            minute="0",
            hour="9",
            day_of_week="*",
            day_of_month="*",
            month_of_year="*",
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS('Created new crontab schedule for 9:00 AM daily')
            )
        else:
            self.stdout.write('Using existing crontab schedule for 9:00 AM daily')

        task_name = "notifications.tasks.run_bimonthly_reminders"

        if not PeriodicTask.objects.filter(task=task_name).exists():
            PeriodicTask.objects.create(
                crontab=schedule,
                name="Daily Bimonthly Reminder Task",
                task=task_name,
                args=json.dumps([]),  # can pass ["--dry-run"] etc.
                start_time=now(),
                enabled=True,
            )
            self.stdout.write(
                self.style.SUCCESS(f'Created periodic task: {task_name}')
            )
        else:
            self.stdout.write(f'Periodic task already exists: {task_name}')
        
        self.stdout.write(
            self.style.SUCCESS('Periodic tasks setup completed!')
        )
