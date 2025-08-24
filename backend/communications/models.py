# communications/models.py
from django.db import models
from django.contrib.auth import get_user_model
import os

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

def forum_file_upload_path(instance, filename):
    """Generate upload path for forum files"""
    return f'forum_files/{instance.topic.id}/{filename}'

class ForumTopic(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_topics')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_pinned = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)
    views = models.IntegerField(default=0)

    class Meta:
        ordering = ['-is_pinned', '-updated_at']

    def __str__(self):
        return f"[{self.author.center.name if self.author.center else 'Sin centro'}] {self.title}"

    @property
    def reply_count(self):
        return self.replies.count()

    @property
    def last_reply(self):
        return self.replies.order_by('-created_at').first()

class ForumReply(models.Model):
    topic = models.ForeignKey(ForumTopic, on_delete=models.CASCADE, related_name='replies')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_replies')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_edited = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Reply to '{self.topic.title}' by {self.author.first_name} {self.author.last_name}"

class ForumFile(models.Model):
    FILE_TYPES = [
        ('image', 'Image'),
        ('pdf', 'PDF'),
        ('video', 'Video'),
        ('document', 'Document'),
        ('other', 'Other'),
    ]

    topic = models.ForeignKey(ForumTopic, on_delete=models.CASCADE, related_name='files', null=True, blank=True)
    reply = models.ForeignKey(ForumReply, on_delete=models.CASCADE, related_name='files', null=True, blank=True)
    file = models.FileField(upload_to=forum_file_upload_path)
    file_type = models.CharField(max_length=10, choices=FILE_TYPES, default='other')
    original_name = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        if self.file:
            # Auto-detect file type based on extension
            ext = os.path.splitext(self.file.name)[1].lower()
            if ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
                self.file_type = 'image'
            elif ext == '.pdf':
                self.file_type = 'pdf'
            elif ext in ['.mp4', '.avi', '.mov', '.wmv', '.webm']:
                self.file_type = 'video'
            elif ext in ['.doc', '.docx', '.txt', '.rtf']:
                self.file_type = 'document'
            
            if not self.original_name:
                self.original_name = self.file.name
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.original_name} ({self.file_type})"


class CenterMessage(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.sent_at}] {self.sender.center.name}: {self.text[:30]}"