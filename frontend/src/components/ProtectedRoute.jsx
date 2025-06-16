// ProtectedRoute.jsx
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import DashboardSkeleton from "./DashboardSkeleton";

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, loading, user } = useSelector((state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    loading: state.auth.isLoading,
    user: state.auth.user,
  }));

  // While loading or if user data is not fully available, show skeleton.
  if (loading || (isAuthenticated && user === null)) {
    return <DashboardSkeleton />;
  }

  // Check if the user is authenticated and active. If not, redirect to home.
  if (!isAuthenticated || !user?.is_active) {
    return <Navigate to="/" />;
  }

  // If user is staff, allow regardless of groups.
  if (isAuthenticated && user.is_staff) {
    return children;
  }

  // If no roles are specified, default to deny access.
  if (!allowedRoles || allowedRoles.length === 0) {
    return <Navigate to="/" />;
  }

  // Check if the user's groups contain any of the allowed roles.
  const userGroups = user.groups.map((group) => group.name.toLowerCase());
  const hasAccess = allowedRoles.some((role) =>
    userGroups.includes(role.toLowerCase())
  );

  return isAuthenticated && hasAccess ? children : <Navigate to="/" />;
}

export default ProtectedRoute;
