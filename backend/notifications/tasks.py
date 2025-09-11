from celery import shared_task
from notifications.services.reminders import process_bimonthly_reminders


@shared_task
def run_bimonthly_reminders(dry_run=False, force=False):
    """
    Celery task for sending reminders.
    """
    process_bimonthly_reminders(dry_run=dry_run, force=force, stdout=None)
