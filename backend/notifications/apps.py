from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'

    def ready(self):
        import notifications.signals
        import os
        if os.environ.get("RUN_MAIN", None) != "true":
            return

        from django_celery_beat.models import PeriodicTask, CrontabSchedule
        from django.utils.timezone import now
        import json

        # Daily at 9:00 AM
        schedule, _ = CrontabSchedule.objects.get_or_create(
            minute="0",
            hour="9",
            day_of_week="*",
            day_of_month="*",
            month_of_year="*",
        )

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
