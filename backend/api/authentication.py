import logging
from rest_framework import authentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from django_auth_adfs.rest_framework import AdfsAccessTokenAuthentication
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from centros.models import Center

logger = logging.getLogger(__name__)
User = get_user_model()

class MultipleAuthAuthentication(authentication.BaseAuthentication):
    """
    Try ADFS first, then JWT.  ADFS logins get auto‐added to 'personal' group.
    """

    def __init__(self):
        self.adfs_authentication = AdfsAccessTokenAuthentication()
        self.jwt_authentication  = JWTAuthentication()

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        logger.debug(f"Authorization header: {auth_header!r}")

        # --- 1) Try ADFS ---
        try:
            if auth_header.startswith('Bearer '):
                adfs_auth = self.adfs_authentication.authenticate(request)
                if adfs_auth is not None:
                    user, token = adfs_auth
                    logger.debug("ADFS authentication successful")

                    # ✅ Ensure the user is in the 'personal' group
                    personal_group, _ = Group.objects.get_or_create(name='personal')
                    if personal_group not in user.groups.all():
                        user.groups.add(personal_group)
                        user.save(update_fields=['last_login'])  # or no fields

                    # ✅ Add user to center with ID 1 if they don't have a center
                    if not hasattr(user, 'center') or user.center is None:
                        try:
                            center_one = Center.objects.get(pk=1)
                            user.center = center_one
                            user.save(update_fields=['center'])
                            logger.info(f"User {user.username} added to center: {center_one.name} (ID 1)")
                        except Center.DoesNotExist:
                            logger.error("Center with ID 1 does not exist.")
                            
                    #Alternative: Restrict Staff Access Based on ADFS Groups
                    #if user and not user.is_staff:
                    #    roles = token.get('roles', [])  # Extract roles from ADFS token
                    #    if "AdminRole" in roles:  # Replace with your ADFS role
                    #        user.is_staff = True
                    #        user.save()
                    #        logger.debug(f"User {user.username} marked as staff based on role")
                    #

                    return user, token

                logger.debug("ADFS returned None, falling back to JWT")
        except Exception as e:
            logger.debug(f"ADFS auth error: {e}")

        # --- 2) Try JWT ---
        try:
            jwt_auth = self.jwt_authentication.authenticate(request)
            if jwt_auth is not None:
                logger.debug("JWT authentication successful")
                return jwt_auth
            logger.debug("JWT returned None")
        except Exception as e:
            logger.debug(f"JWT auth error: {e}")

        # --- 3) All failed ---
        logger.debug("Authentication failed")
        return None

    def authenticate_header(self, request):
        headers = []
        # prefer ADFS in WWW-Authenticate
        try:
            adfs_hdr = self.adfs_authentication.authenticate_header(request)
            if adfs_hdr:
                headers.append(adfs_hdr)
        except Exception:
            pass
        # then JWT
        try:
            jwt_hdr = self.jwt_authentication.authenticate_header(request)
            if jwt_hdr:
                headers.append(jwt_hdr)
        except Exception:
            pass
        return ', '.join(headers) or 'Bearer realm="api"'
