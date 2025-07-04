import { useAuth } from "./AuthProvider";
import { Navigate, useLocation } from "react-router-dom";
import { LoadingOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

const LOADING_TIMEOUT = 5000; // 5 seconds timeout
const PUBLIC_ROUTES = ["/user-reset", "/request-access"]; // Remove "/" from public routes

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, userData, loading, cachedAuthState } = useAuth();
  const location = useLocation();
  const [isTimedOut, setIsTimedOut] = useState(false);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (loading && !isTimedOut && !cachedAuthState) {
      timeoutId = setTimeout(() => {
        setIsTimedOut(true);
      }, LOADING_TIMEOUT);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [loading, isTimedOut, cachedAuthState]);

  // Show loading state only if explicitly loading, not timed out, and no cached state
  if (loading && !isTimedOut && !cachedAuthState) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(darkslateblue, midnightblue)",
        }}
      >
        <LoadingOutlined style={{ fontSize: 24, color: "white" }} />
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
  // If we have cachedAuthState (offline mode), treat as authenticated
  // (userData will be set from cache)

  // If all checks pass, render the protected route
  return <>{children}</>;
}
