// ProtectedRoute.jsx
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearFeedback } from "../features/auth/authSlice";
import { Navigate, useLocation } from "react-router-dom";
import DashboardSkeleton from "./DashboardSkeleton";

const getDashboardPath = (userGroups) => {
  if (!userGroups || userGroups.length === 0) {
    return "/"; // Default to home if no groups
  }
  const lowerCaseGroups = userGroups.map(group => group.name.toLowerCase());

  if (lowerCaseGroups.includes("candidatos")) {
    return "/candidato/dashboard";
  }
  if (lowerCaseGroups.includes("empleador")) {
    return "/empleador";
  }
  if (lowerCaseGroups.includes("personal")) {
    return "/dashboard";
  }

  return "/";
};

function ProtectedRoute({ children, allowedRoles = [] }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, loading, user, message, error } = useSelector((state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    loading: state.auth.isLoading,
    user: state.auth.user,
    message: state.auth.message,
    error: state.auth.error
  }));

  useEffect(() => {
    if (message || error) {
      // Set a timer to clear the message/error after 5 seconds
      const timer = setTimeout(() => {
        dispatch(clearFeedback());
      }, 5000); // 5000 milliseconds = 5 seconds

      // Cleanup function to clear the timer if the component unmounts
      return () => clearTimeout(timer);
    }
  }, [message, error, dispatch]);

  // While loading or if user data is not fully available, show skeleton.
  if (loading || (isAuthenticated && user === null)) {
    return <DashboardSkeleton />;
  }

  // Check if the user is authenticated and active. If not, redirect to home.
  if (!isAuthenticated || !user?.is_active) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} />;
  }

  const userGroups = user.groups || [];

  const userDashboardPath = getDashboardPath(userGroups);
  const isTryingToAccessGenericDashboard = location.pathname === "/dashboard" && userDashboardPath !== "/dashboard";
  if (isTryingToAccessGenericDashboard) {
    return <Navigate to={userDashboardPath} replace />;
  }

  // If user is staff, allow regardless of groups.
  if (user.is_staff) {
    return children;
  }

  // If no roles are specified, default to deny access.
  if (!allowedRoles || allowedRoles.length === 0) {
    return <Navigate to="/" />;
  }

  // Check if the user's groups contain any of the allowed roles.
  const userGroupsLower = userGroups.map((group) => group.name.toLowerCase());
  const hasAccess = allowedRoles.some((role) =>
    userGroupsLower.includes(role.toLowerCase())
  );

  return hasAccess ? children : <Navigate to="/" />;
}

export default ProtectedRoute;
