import { useAuth } from "./AuthProvider";
import { Navigate, useLocation } from "react-router-dom";
import { LoadingOutlined } from "@ant-design/icons";

const CACHED_USER_KEY = "cached_user_data";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth();
  const location = useLocation();

  // Helper function to check if we have valid cached data
  const getCachedUserData = () => {
    try {
      const cached = localStorage.getItem(CACHED_USER_KEY);
      if (!cached) return null;

      const parsedData = JSON.parse(cached);
      // Verify the cached data matches the current user
      return parsedData && parsedData.email === user?.email ? parsedData : null;
    } catch (error) {
      console.error("Error reading cached user data:", error);
      return null;
    }
  };

  // Show loading spinner while checking auth state
  if (loading) {
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

  // If user is authenticated and we're on the login page, redirect to index
  // In offline mode, we'll use cached data if available
  if (user && location.pathname === "/") {
    const cachedData = getCachedUserData();
    if (userData || cachedData) {
      return <Navigate to="/index" replace />;
    }
  }

  // If user is not authenticated and we're not on public routes, redirect to login
  const publicRoutes = ["/", "/user-reset", "/request-access"];
  if (!user && !publicRoutes.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
