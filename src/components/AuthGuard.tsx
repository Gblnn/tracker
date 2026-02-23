import { useAuth } from "./AuthProvider";
import { Navigate, useLocation } from "react-router-dom";

const PUBLIC_ROUTES = ["/user-reset", "/request-access"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, userData, cachedAuthState } = useAuth();
  const location = useLocation();

  // NEVER show loading screen on mount - let the app render immediately

  // For public routes, allow access regardless of auth state
  if (PUBLIC_ROUTES.includes(location.pathname)) {
    return <>{children}</>;
  }

  // Handle login page (/) access
  if (location.pathname === "/") {
    // If authenticated, redirect based on user role
    if ((user && userData) || cachedAuthState) {
      // Determine redirect path based on role
      let redirectPath = "/index"; // default
      
      if (userData?.role) {
        switch (userData.role) {
          case "supervisor":
            redirectPath = "/supervisor";
            break;
          case "site_coordinator":
            redirectPath = "/site-coordinator";
            break;
          case "management":
            redirectPath = "/management";
            break;
          case "admin":
            redirectPath = "/index";
            break;
          case "user":
            redirectPath = "/record-list";
            break;
          default:
            redirectPath = "/index";
            break;
        }
      }
      
      return <Navigate to={redirectPath} replace />;
    }
    // If not authenticated, show login page
    return <>{children}</>;
  }

  // For all other routes, require authentication
  // Allow access if we have valid cached auth state (offline mode)
  if ((!user || !userData) && !cachedAuthState) {
    // Save the attempted path to redirect back after login
    const returnPath = location.pathname !== "/" ? location.pathname : "/index";
    return <Navigate to="/" replace state={{ returnPath }} />;
  }

  // If all checks pass, render the protected route
  return <>{children}</>;
}
