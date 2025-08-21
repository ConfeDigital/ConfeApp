from rest_framework import permissions
from agencia.models import Job
from candidatos.models import UserProfile
from centros.models import TransferRequest

class IsAdminUserOrReadOnly(permissions.IsAdminUser):

    def has_permission(self, request, view):
        is_admin = super(
            IsAdminUserOrReadOnly, 
            self).has_permission(request, view)
        return request.method in permissions.SAFE_METHODS or is_admin

class IsInSameCenter(permissions.BasePermission):
    """
    Allows users to edit objects only if the object's effective center
    matches the requesting user's center.
    """

    def has_permission(self, request, view):
        """
        View-level permission. Let IsAuthenticated handle basic auth.
        This permission focuses on object-level checks.
        """
        return True

    def has_object_permission(self, request, view, obj):
        # Allow GET, HEAD, OPTIONS requests by default.
        # If you want to restrict reads to only users in the same center,
        # you'll need to adjust this or handle it in the view's get_object method.
        if request.user.is_staff:
            return True
        
        if request.method in permissions.SAFE_METHODS:
            return True

        # Get the center of the requesting user
        requesting_user_center = getattr(request.user, 'center', None)
        if not requesting_user_center:
            return False  # Requesting user must have a center

        # Determine the center of the target object
        target_object_center = None
        if hasattr(obj, 'center'):    # Case 1: Object itself has a 'center' (e.g., User model)
            target_object_center = obj.center
        elif hasattr(obj, 'user') and hasattr(obj.user, 'center'):  # Case 2: Object has a 'user' with a 'center' (e.g., UserProfile model)
            target_object_center = obj.user.center
        # Add more 'elif' conditions here if you have other models
        # that expose their "effective center" in different ways.

        if target_object_center:
            return target_object_center == requesting_user_center

        return False  # If the target object's center cannot be determined or doesn't match

class GerentePermission(permissions.BasePermission):
    """
    Allows users in the 'gerente' group to manage transfer requests
    for their center, and also manage 'personal' users within their center.
    Admins can manage all users and transfer requests.
    """
    def has_permission(self, request, view):
        # Admins have full access
        if request.user.is_staff:
            return True

        # All other methods require the user to be in the 'gerente' group
        # (or whatever group is allowed to perform these actions)
        return request.user.groups.filter(name='gerente').exists()

    def has_object_permission(self, request, view, obj):
        # Admins have full access to any object
        if request.user.is_staff:
            return True

        # Check if the user is a 'gerente'
        if not request.user.groups.filter(name='gerente').exists():
            return False # Not a gerente, so no object permission

        # --- Logic for User objects (PUT/PATCH for 'personal' users in their center) ---
        # This part applies if this permission is also used for a UserViewSet
        if hasattr(obj, 'groups') and hasattr(obj, 'center'): # Check if 'obj' is likely a User instance
            if request.method in ['PUT', 'PATCH']:
                # Gerente can only update 'personal' users in their own center
                return obj.groups.filter(name='personal').exists() and \
                       getattr(obj, 'center') == getattr(request.user, 'center')
            # For other methods on User objects (e.g., DELETE), deny by default
            return False # Or define specific logic for DELETE if needed

        # --- Logic for TransferRequest objects (POST for accept/decline) ---
        # This part applies if 'obj' is a TransferRequest instance
        if isinstance(obj, TransferRequest): # Assuming TransferRequest model is imported
            if request.method == 'POST': # This covers your accept/decline actions
                # A gerente can accept an 'incoming' request if it's for their center
                # A gerente can decline an 'incoming' or 'outgoing' request related to their center

                # For 'accept' action, check if destination center matches user's center
                if view.action == 'accept':
                    return obj.destination_center == request.user.center
                # For 'decline' action, check if source or destination center matches user's center
                elif view.action == 'decline':
                    return obj.source_center == request.user.center or \
                           obj.destination_center == request.user.center
            # For other methods on TransferRequest objects (e.g., PUT/PATCH/DELETE), deny by default
            return False # Or define specific logic for other methods if needed

        return False # Deny by default if object type is not handled


class PersonalPermission(permissions.BasePermission):
    """
    Allows access if the user is staff, in the 'gerente' group, or in the 'personal' group.
    """
    def has_permission(self, request, view):
        return request.user.is_staff or \
               request.user.groups.filter(name='gerente').exists() or \
               request.user.groups.filter(name='personal').exists()

    def has_object_permission(self, request, view, obj):
        return request.user.is_staff or \
               request.user.groups.filter(name='gerente').exists() or \
               request.user.groups.filter(name='personal').exists()


class AgenciaLaboralPermission(permissions.BasePermission):
    """
    Allows access if the user is staff, in the 'gerente' group, or in the 'agencia_laboral' group.
    """
    def has_permission(self, request, view):
        return request.user.is_staff or \
               request.user.groups.filter(name='gerente').exists() or \
               request.user.groups.filter(name='agencia_laboral').exists()

    def has_object_permission(self, request, view, obj):
        return request.user.is_staff or \
               request.user.groups.filter(name='gerente').exists() or \
               request.user.groups.filter(name='agencia_laboral').exists()

class IsEmployer(permissions.BasePermission):
    """
    Only staff or users in the 'empleador' group (i.e. has an Employer)
    """
    def has_permission(self, request, view):
        return request.user.is_staff or hasattr(request.user, 'employer') or request.user.groups.filter(name='agencia_laboral').exists()
    
class IsEmployerOrReadOnly(permissions.BasePermission):
    """
    Allows read-only access for any user,
    but restricts create, update, and delete operations
    to staff or users with an 'employer' attribute.
    """
    def has_permission(self, request, view):
        # Allow GET, HEAD, and OPTIONS requests for any user (read-only)
        if request.method in permissions.SAFE_METHODS:
            return True

        # For other methods (POST, PUT, PATCH, DELETE),
        # require staff status or an 'employer' attribute
        return request.user.is_staff or hasattr(request.user, 'employer') or request.user.groups.filter(name='agencia_laboral').exists()

class WorksInSameCompany(permissions.BasePermission):
    """
    Allows access if the target object's job's company matches the requesting employer user's company.
    This permission is intended for 'employer' users.
    """
    message = "You do not work for the company associated with this resource."

    def _get_employer_company(self, user):
        """Helper to get the company from the requesting user's Employer profile."""
        if hasattr(user, 'employer') and user.employer and user.employer.company:
            return user.employer.company
        return None

    def _get_object_job_company(self, obj):
        """Helper to get the company associated with the target object's job."""
        if isinstance(obj, Job): # If obj is a Job itself
            return obj.company
        elif isinstance(obj, UserProfile): # If obj is a UserProfile
            if obj.current_job and obj.current_job.company:
                return obj.current_job.company
        elif hasattr(obj, 'job') and isinstance(obj.job, Job): # If obj is JobHistory
            return obj.job.company
        elif hasattr(obj, 'job_history') and hasattr(obj.job_history, 'job') and isinstance(obj.job_history.job, Job): # If obj is JobHistoryComment
            return obj.job_history.job.company
        # Add other relevant obj types that contain a job or company
        return None

    def has_permission(self, request, view):
        # This permission only applies if the user is an employer.
        # CombinedJobAccessPermission will handle other user types.
        if request.user.is_staff:
            return True # Staff can bypass this
        
        return self._get_employer_company(request.user) is not None

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True # Staff have full access

        requesting_user_company = self._get_employer_company(request.user)
        if not requesting_user_company:
            return False # User must have an Employer profile with a company

        target_object_company = self._get_object_job_company(obj)
        if not target_object_company:
            return False # Target object's job must have a company

        return requesting_user_company == target_object_company
    
class CombinedJobAccessPermission(permissions.BasePermission):
    """
    Custom permission for accessing Job and related Candidate data.
    Allows access if:
    - User is authenticated AND
    - ( (User is a 'personal'/'gerente' type AND resource is in their center) OR
        (User is an 'employer' type AND resource's job is in their company) )
    """
    message = "You do not have the required permissions to access this resource."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_staff:
            return True

        # Personal/Gerente access path
        personal_access_allowed = PersonalPermission().has_permission(request, view) and \
                                  IsInSameCenter().has_permission(request, view)

        # Employer access path
        employer_access_allowed = IsEmployer().has_permission(request, view) and \
                                  WorksInSameCompany().has_permission(request, view)

        return personal_access_allowed or employer_access_allowed

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if request.user.is_staff:
            return True

        # Personal/Gerente access path (object level)
        personal_obj_allowed = PersonalPermission().has_object_permission(request, view, obj) and \
                               IsInSameCenter().has_object_permission(request, view, obj)

        # Employer access path (object level)
        employer_obj_allowed = IsEmployer().has_permission(request, view) and \
                               WorksInSameCompany().has_object_permission(request, view, obj)

        return personal_obj_allowed or employer_obj_allowed