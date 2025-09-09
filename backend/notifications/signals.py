from django.db.models.signals import post_save
from django.dispatch import receiver
from candidatos.models import JobHistoryComment
from agencia.models import Employer
from .views import mark_bimonthly_reminder_completed
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=JobHistoryComment)
def handle_job_history_comment_created(sender, instance, created, **kwargs):
    """
    Signal handler that runs when a JobHistoryComment is created.
    If the comment was created by an employer, mark the corresponding
    bimonthly reminder as completed.
    """
    print("handle_job_history_comment_created")
    if created and instance.author:
        try:
            # Check if the comment author is an employer
            employer = Employer.objects.get(user=instance.author)
            
            # Check if this comment is for a job in the employer's company
            if instance.job_history.job.company == employer.company:
                mark_bimonthly_reminder_completed(
                    job_history=instance.job_history,
                    employer_user=instance.author
                )
                logger.info(f"Processed bimonthly reminder completion for employer comment by {instance.author.get_full_name()}")
            else:
                print("Comment is not for a job in the employer's company")
        except Employer.DoesNotExist:
            # Comment author is not an employer, no action needed
            pass
        except Exception as e:
            logger.error(f"Error processing job history comment signal: {str(e)}")