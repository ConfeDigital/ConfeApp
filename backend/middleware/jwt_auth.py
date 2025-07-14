from urllib.parse import parse_qs
from channels.auth import AuthMiddlewareStack
from channels.db import database_sync_to_async
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser, Group
from django.db import close_old_connections
import jwt
import logging
import time
from urllib.parse import unquote
from django_auth_adfs.rest_framework import AdfsAccessTokenAuthentication

logger = logging.getLogger(__name__)
User = get_user_model()

class JWTAuthMiddleware:
    """Middleware to authenticate user for channels, checking ADFS then JWT."""

    def __init__(self, app):
        self.app = app
        self.adfs_auth = AdfsAccessTokenAuthentication()

    async def __call__(self, scope, receive, send):
        close_old_connections()
        user = AnonymousUser()
        token = None
        
        try:
            # Extract token from headers or query string
            headers = dict(scope.get('headers', []))
            auth_header_bytes = headers.get(b'authorization')
            
            if auth_header_bytes:
                auth_header = auth_header_bytes.decode('utf-8')
                if auth_header.startswith('Bearer '):
                    token = auth_header.split(' ')[1]
                    logger.debug(f"Found authorization header with token")

            # If no token in header, check query string
            if not token:
                query_string = scope["query_string"].decode("utf8")
                logger.debug(f"Query string: {query_string}")
                token_list = parse_qs(query_string).get('token', None)
                if token_list:
                    token = token_list[0]
                    logger.debug(f"Found token in query string")
                
            # If no token found yet, try looking for cookies
            if not token and b'cookie' in headers:
                cookies_str = headers[b'cookie'].decode('utf-8')
                logger.debug(f"Found cookies: {cookies_str}")
                cookies = {
                    k: v for k, v in [
                        cookie.split('=', 1) for cookie in cookies_str.split('; ')
                        if '=' in cookie
                    ]
                }
                
                # Try to get token from cookies
                for cookie_name in ['access_token', 'auth_token', 'token', 'adfs_token', 'jwt_token']:
                    if cookie_name in cookies:
                        token = unquote(cookies[cookie_name])
                        logger.debug(f"Found token in cookie: {cookie_name}")
                        break

            if token:
                logger.debug(f"Attempting authentication with token (first 10 chars): {token[:10] if len(token) > 10 else token}...")
                
                # Determine token type by inspection
                token_type = await self.identify_token_type(token)
                logger.debug(f"Identified token type: {token_type}")
                
                if token_type == 'adfs':
                    # Try ADFS Authentication
                    user = await self.authenticate_adfs(token)
                else:
                    # Try JWT Authentication
                    user = await self.authenticate_jwt(token)
                    
                logger.debug(f"Final auth result: {user.is_authenticated}, User: {user.username if user.is_authenticated else 'Anonymous'}")
            else:
                logger.debug("No authentication token found in request")

        except Exception as e:
            logger.error(f"Authentication error in WebSocket: {str(e)}", exc_info=True)
            user = AnonymousUser()
            
        # Log more details about the scope to help with debugging
        logger.debug(f"WebSocket connection path: {scope.get('path', 'unknown')}")
        
        # Store user in scope
        scope['user'] = user
        
        # Check if authenticated before proceeding
        if not user.is_authenticated:
            # Send close message for WebSocket
            if scope["type"] == "websocket":
                logger.warning(f"WebSocket REJECTED - User not authenticated")
                return await send({
                    "type": "websocket.close",
                    "code": 4003,  # Custom code for authentication failure
                })
        
        # Continue processing the connection
        return await self.app(scope, receive, send)

    @database_sync_to_async
    def identify_token_type(self, token):
        """Identify the token as either ADFS or JWT by examining its structure."""
        try:
            # Try to decode without verification first to check structure
            decoded = jwt.decode(token, options={"verify_signature": False})
            
            # Check for ADFS-specific claims
            if 'iss' in decoded and decoded['iss'].startswith('https://login.microsoftonline.com/'):
                logger.debug(f"Token identified as ADFS token based on issuer: {decoded.get('iss')}")
                return 'adfs'
            
            # Check if token contains user_id claim which would be our JWT token
            if 'user_id' in decoded:
                logger.debug("Token identified as app JWT token (contains user_id)")
                return 'jwt'
                
            # If we're not sure, default to ADFS for broader compatibility
            logger.debug("Token type uncertain, defaulting to ADFS")
            return 'adfs'
        except Exception as e:
            logger.debug(f"Error identifying token type: {str(e)}")
            # Default to JWT if we can't identify it
            return 'jwt'

    async def authenticate_jwt(self, token):
        """Authenticate user based on JWT."""
        try:
            logger.debug("Attempting JWT token authentication")
            # Use a more permissive approach with error handling
            data = None
            try:
                # First try with our app's SECRET_KEY
                data = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                logger.debug("Token decoded successfully with SECRET_KEY")
            except jwt.InvalidAlgorithmError:
                # If algorithm mismatch, try to identify the correct algorithm
                try:
                    # Peek at the header to see what algorithm is specified
                    header = jwt.get_unverified_header(token)
                    alg = header.get('alg', 'HS256')
                    logger.debug(f"Token uses algorithm: {alg}")
                    
                    # Try with the detected algorithm
                    data = jwt.decode(token, settings.SECRET_KEY, algorithms=[alg])
                    logger.debug(f"Token decoded successfully with algorithm {alg}")
                except Exception as inner_e:
                    logger.debug(f"Failed to decode with detected algorithm: {str(inner_e)}")
                    return AnonymousUser()
            except Exception as e:
                logger.debug(f"Failed to decode JWT token: {str(e)}")
                return AnonymousUser()
                
            # Check if token is expired
            if data and 'exp' in data and data['exp'] < time.time():
                logger.debug(f"JWT token expired")
                return AnonymousUser()
                
            if data and 'user_id' in data:
                user = await self.get_user(data['user_id'])
                logger.debug(f"JWT auth result for user_id {data['user_id']}: {user.is_authenticated}")
                return user
            else:
                logger.debug("No user_id found in JWT token")
                return AnonymousUser()
        except Exception as e:
            logger.debug(f"JWT token validation failed: {str(e)}")
            return AnonymousUser()

    @database_sync_to_async
    def authenticate_adfs(self, token):
        """Authenticate user based on ADFS token and ensure user is in 'personal' group."""
        try:
            logger.debug("Attempting ADFS token authentication")
            
            # Create a mock request object for AdfsAccessTokenAuthentication
            class MockRequest:
                def __init__(self, token):
                    self.META = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

            mock_request = MockRequest(token)
            
            # Try to get token payload without verification first for debugging
            try:
                payload = jwt.decode(token, options={"verify_signature": False})
                logger.debug(f"ADFS token claims: iss={payload.get('iss', 'missing')}, aud={payload.get('aud', 'missing')}")
                if 'unique_name' in payload:
                    logger.debug(f"Token for user: {payload['unique_name']}")
                elif 'preferred_username' in payload:
                    logger.debug(f"Token for user: {payload['preferred_username']}")
                
                # Extract any roles from the token
                if 'roles' in payload:
                    logger.debug(f"Token contains roles: {payload['roles']}")
            except Exception as e:
                logger.debug(f"Could not decode token for inspection: {e}")
            
            # Use the ADFS authentication class to authenticate
            try:
                user_and_token = self.adfs_auth.authenticate(request=mock_request)
                if user_and_token is None:
                    logger.debug("ADFS authentication returned None")
                    return AnonymousUser()
                    
                user, _ = user_and_token  # Unpack the tuple
                logger.debug(f"ADFS authentication successful for user: {user.username}")
                
                # Ensure the user is in the 'personal' group
                self.add_to_personal_group(user)
                return user
            except Exception as auth_ex:
                logger.debug(f"ADFS authentication failed: {str(auth_ex)}")
                return AnonymousUser()
                
        except Exception as e:
            logger.error(f"ADFS Authentication error: {str(e)}", exc_info=True)
            return AnonymousUser()
    
    @database_sync_to_async
    def add_to_personal_group(self, user):
        """Add the user to the 'personal' group."""
        try:
            personal_group, _ = Group.objects.get_or_create(name='personal')
            if personal_group not in user.groups.all():
                user.groups.add(personal_group)
                user.save(update_fields=['last_login'])
                logger.debug(f"User {user.username} added to 'personal' group")
        except Exception as e:
            logger.error(f"Error adding user to personal group: {str(e)}")

    @database_sync_to_async
    def get_user(self, user_id):
        """Return the user based on user id."""
        try:
            user = User.objects.get(id=user_id)
            logger.debug(f"Retrieved user: {user.username} (id={user_id})")
            return user
        except User.DoesNotExist:
            logger.debug(f"User with id={user_id} does not exist")
            return AnonymousUser()

def JWTAuthMiddlewareStack(app):
    return JWTAuthMiddleware(AuthMiddlewareStack(app))