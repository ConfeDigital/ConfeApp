from django.core.management.base import BaseCommand
from notifications.services.reminders import process_bimonthly_reminders


class Command(BaseCommand):
    help = "Send bimonthly comment reminders to employers about their active candidates"

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Simulate without sending")
        parser.add_argument("--force", action="store_true", help="Force send even if already sent")

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        force = options["force"]

        self.stdout.write(self.style.SUCCESS(
            f"Starting bimonthly reminder process {'(DRY RUN)' if dry_run else ''}"
        ))

        process_bimonthly_reminders(dry_run=dry_run, force=force, stdout=self.stdout)
