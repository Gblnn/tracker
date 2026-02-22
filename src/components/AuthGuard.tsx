import { useAuth } from "./AuthProvider";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

const PUBLIC_ROUTES = ["/user-reset", "/request-access"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, userData, loading, cachedAuthState } = useAuth();
  const location = useLocation();

  // Show loading state only during active operations (login/logout)
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "black",
        }}
      >
        <Loader2 className="animate-spin" style={{ fontSize: 24, color: "white" }} />
      </div>
    );
  }

  // For public routes, allow access regardless of auth state
  if (PUBLIC_ROUTES.includes(location.pathname)) {
    return <>{children}</>;
  }

  // Handle login page (/) access
  if (location.pathname === "/") {
    // If authenticated, redirect to index
    if ((user && userData) || cachedAuthState) {
      return <Navigate to="/index" replace />;
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
