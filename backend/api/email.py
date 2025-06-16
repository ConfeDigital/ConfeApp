from djoser.email import PasswordResetEmail, PasswordChangedConfirmationEmail, ActivationEmail, ConfirmationEmail

class PasswordResetEmail(PasswordResetEmail):
    template_name = 'new_email/password_reset.html'  # Path to your template file

    def get_context_data(self):
        context = super().get_context_data()
        return context
    
class ActivationEmail(ActivationEmail):
    template_name = 'new_email/activation.html'  # Path to your template file

    def get_context_data(self):
        context = super().get_context_data()
        return context
    
class PasswordChangedConfirmationEmail(PasswordChangedConfirmationEmail):
    template_name = 'new_email/password_changed_confirmation.html'  # Path to your template file

    def get_context_data(self):
        context = super().get_context_data()
        return context

class ConfirmationEmail(ConfirmationEmail):
    template_name = 'new_email/confirmation_email.html'  # Path to your template file

    def get_context_data(self):
        context = super().get_context_data()
        return context