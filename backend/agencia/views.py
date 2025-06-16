from rest_framework import viewsets, permissions, generics
from api.permissions import IsEmployer, IsEmployerOrReadOnly
from .models import Location, Company, Job, Employer
from .serializers import JobWithAssignedCandidatesSerializer, LocationSerializer, CompanySerializer, JobSerializer, EmployerSerializer

class LocationViewSet(viewsets.ModelViewSet):
    queryset         = Location.objects.all()
    serializer_class = LocationSerializer

    queryset = Location.objects.select_related('company').all()

    def get_queryset(self):
        qs = Location.objects.select_related('company').all()
        if not self.request.user.is_staff:
            qs = qs.filter(company=self.request.user.employer.company)
        return qs

class CompanyViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsEmployer]
    serializer_class = CompanySerializer

    queryset = Company.objects.all()

    def get_queryset(self):
        qs = Company.objects.all()
        if not self.request.user.is_staff:
            # employer only sees their own company
            qs = qs.filter(pk=self.request.user.employer.company_id)
        return qs

class JobViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsEmployerOrReadOnly]
    serializer_class = JobSerializer

    queryset = Job.objects.select_related('company').all()

    def get_queryset(self):
        qs = Job.objects.select_related('company').all()
        if not self.request.user.is_staff and not self.request.user.groups.filter(name='personal').exists():
            qs = qs.filter(company=self.request.user.employer.company)
        return qs

class EmployerViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsEmployer]
    serializer_class = EmployerSerializer

    queryset = Employer.objects.select_related('user','company').all()

    def get_queryset(self):
        qs = Employer.objects.select_related('user','company').all()
        if not self.request.user.is_staff:
            qs = qs.filter(company=self.request.user.employer.company)
        return qs
    
class CurrentEmployerAPIView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]

    serializer_class = EmployerSerializer

    def get_object(self):
        return self.request.user.employer
    
class JobAssignedCandidatesView(generics.RetrieveAPIView):
    """
    API view to retrieve a specific Job and the candidates currently assigned to it.
    Takes a job_id as a URL parameter.
    """
    queryset = Job.objects.all() # The base queryset for the job
    serializer_class = JobWithAssignedCandidatesSerializer
    permission_classes = [permissions.IsAuthenticated, IsEmployerOrReadOnly] # Or more restrictive if needed

    # The lookup field is 'pk' by default for RetrieveAPIView, which matches <int:pk> in URLs.
    # We will use 'pk' for the job ID.

    def get_object(self):
        # Ensure the employer can only see jobs they are associated with if not staff.
        # This duplicates logic from JobViewSet, but is good for security on this specific endpoint.
        obj = super().get_object() # Get the Job object by its PK

        # Apply same filtering logic as JobViewSet if necessary for individual Job retrieval
        if not self.request.user.is_staff and hasattr(self.request.user, 'employer'):
            if obj.company != self.request.user.employer.company:
                self.permission_denied(
                    self.request,
                    message="You do not have permission to access this job."
                )
        return obj
