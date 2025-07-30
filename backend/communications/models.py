# communications/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class CommunicationPost(models.Model):
    title = models.CharField(max_length=255)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    attachment = models.FileField(upload_to='communications/', null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.title

    # def save(self, *args, **kwargs):
    #     # Rename file
    #     if self.attachment and not self._state.adding:
    #         ext = os.path.splitext(self.attachment.name)[1]
    #         unique_name = f"{uuid.uuid4()}{ext}"
    #         self.attachment.name = f"communications/{unique_name}"

    #     # Compress image if it's an image
    #     if self.attachment and self.attachment.name.lower().endswith(('.jpg', '.jpeg', '.png')):
    #         img = Image.open(self.attachment)
    #         img = img.convert("RGB")  # ensure compatibility
    #         buffer = BytesIO()
    #         img.save(buffer, format='JPEG', quality=70)  # Compress
    #         buffer.seek(0)
    #         self.attachment = ContentFile(buffer.read(), name=self.attachment.name)

    #     super().save(*args, **kwargs)

class CenterMessage(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.sent_at}] {self.sender.center.name}: {self.text[:30]}"