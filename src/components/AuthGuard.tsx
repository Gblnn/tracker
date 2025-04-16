import { useAuth } from "./AuthProvider";
import { Navigate, useLocation } from "react-router-dom";
import { LoadingOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

const LOADING_TIMEOUT = 5000; // 5 seconds timeout

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, userData, loading, initialized } = useAuth();
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

  // If we have valid auth state and we're on the login page, redirect immediately
  if (user && userData && location.pathname === "/") {
    return <Navigate to="/index" replace />;
  }

  // For protected routes with valid auth, render immediately
  const publicRoutes = ["/", "/user-reset", "/request-access"];
  if (user && userData && !publicRoutes.includes(location.pathname)) {
    return <>{children}</>;
  }

  // For public routes with no auth required
  if (publicRoutes.includes(location.pathname)) {
    return <>{children}</>;
  }

  // Show loading state only if explicitly loading
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

  // If no valid auth state and not on a public route, redirect to login
  if (!user && !publicRoutes.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
