# api/email_backends.py
import json
import msal
import requests
from django.core.mail.backends.base import BaseEmailBackend
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class MicrosoftGraphEmailBackend(BaseEmailBackend):
    """
    Email backend that uses Microsoft Graph API to send emails
    """
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.client_id = getattr(settings, 'client_id', None)
        self.client_secret = getattr(settings, 'client_secret', None)
        self.tenant_id = getattr(settings, 'tenant_id', None)
        self.email_user = getattr(settings, 'email_user', None)
        
        if not all([self.client_id, self.client_secret, self.tenant_id, self.email_user]):
            raise ValueError("Microsoft Graph email backend requires MS_GRAPH_CLIENT_ID, "
                           "MS_GRAPH_CLIENT_SECRET, MS_GRAPH_TENANT_ID, and MS_GRAPH_EMAIL_USER settings")
    
    def _get_access_token(self):
        """Get access token using client credentials flow"""
        authority = f"https://login.microsoftonline.com/{self.tenant_id}"
        scope = ["https://graph.microsoft.com/.default"]
        
        app = msal.ConfidentialClientApplication(
            client_id=self.client_id,
            client_credential=self.client_secret,
            authority=authority
        )
        
        result = app.acquire_token_for_client(scopes=scope)
        
        if "access_token" in result:
            return result["access_token"]
        else:
            logger.error(f"Error getting access token: {result}")
            raise Exception(f"Failed to acquire access token: {result.get('error_description', 'Unknown error')}")
    
    def send_messages(self, email_messages):
        """Send email messages using Microsoft Graph API"""
        if not email_messages:
            return 0
        
        access_token = self._get_access_token()
        sent_count = 0
        
        for message in email_messages:
            if self._send_single_message(message, access_token):
                sent_count += 1
        
        return sent_count
    
    def _send_single_message(self, message, access_token):
        """Send a single email message"""
        try:
            # Prepare recipients
            to_recipients = [{"emailAddress": {"address": email}} for email in message.to]
            cc_recipients = [{"emailAddress": {"address": email}} for email in message.cc] if message.cc else []
            bcc_recipients = [{"emailAddress": {"address": email}} for email in message.bcc] if message.bcc else []
            
            # Prepare email body
            body_content = {
                "contentType": "HTML" if hasattr(message, 'alternatives') and message.alternatives else "Text",
                "content": message.body
            }
            
            # If there are HTML alternatives, use the first one
            if hasattr(message, 'alternatives') and message.alternatives:
                for content, mimetype in message.alternatives:
                    if mimetype == 'text/html':
                        body_content = {
                            "contentType": "HTML",
                            "content": content
                        }
                        break
            
            # Prepare attachments
            attachments = []
            if hasattr(message, 'attachments') and message.attachments:
                for attachment in message.attachments:
                    if hasattr(attachment, 'get_content'):
                        # Django attachment object
                        content = attachment.get_content()
                        filename = attachment.get_filename()
                        content_type = attachment.get_content_type()
                    else:
                        # Simple tuple (filename, content, mimetype)
                        filename, content, content_type = attachment
                    
                    import base64
                    attachments.append({
                        "@odata.type": "#microsoft.graph.fileAttachment",
                        "name": filename,
                        "contentType": content_type,
                        "contentBytes": base64.b64encode(content).decode('utf-8')
                    })
            
            # Construct the email
            email_data = {
                "message": {
                    "subject": message.subject,
                    "body": body_content,
                    "toRecipients": to_recipients,
                    "ccRecipients": cc_recipients,
                    "bccRecipients": bcc_recipients,
                    "attachments": attachments
                }
            }
            
            # Send the email
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Use the service account email to send
            url = f"https://graph.microsoft.com/v1.0/users/{self.email_user}/sendMail"
            
            response = requests.post(url, headers=headers, data=json.dumps(email_data))
            
            if response.status_code == 202:  # Success
                logger.info(f"Email sent successfully to {', '.join(message.to)}")
                return True
            else:
                logger.error(f"Failed to send email: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Exception sending email: {str(e)}")
            return False