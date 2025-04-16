import { useAuth } from "./AuthProvider";
import { Navigate, useLocation } from "react-router-dom";
import { LoadingOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

const LOADING_TIMEOUT = 5000; // 5 seconds timeout
const PUBLIC_ROUTES = ["/", "/user-reset", "/request-access"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth();
  const location = useLocation();
  const [isTimedOut, setIsTimedOut] = useState(false);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (loading && !isTimedOut) {
      timeoutId = setTimeout(() => {
        setIsTimedOut(true);
      }, LOADING_TIMEOUT);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [loading, isTimedOut]);

  // Show loading state only if explicitly loading and not timed out
  if (loading && !isTimedOut) {
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

  // If authenticated and on login page, redirect to index
  if (user && userData && location.pathname === "/") {
    return <Navigate to="/index" replace />;
  }

  // For public routes, allow access
  if (PUBLIC_ROUTES.includes(location.pathname)) {
    return <>{children}</>;
  }

  // For protected routes, require authentication
  if (!user || !userData) {
    return <Navigate to="/" replace />;
  }

  // If all checks pass, render the protected route
  return <>{children}</>;
}
