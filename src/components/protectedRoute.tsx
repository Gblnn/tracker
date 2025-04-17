import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { LoadingOutlined } from "@ant-design/icons";

// Define routes that require specific clearance
const CLEARANCE_ROUTES = {
  "/records": ["All", "Sohar Star United"],
  "/vale-records": ["All", "Vale"],
};

export default function ProtectedRoutes() {
  const { user, userData, loading } = useAuth();
  const location = useLocation();

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

  // First check if user is authenticated
  if (!user || !userData) {
    return <Navigate to="/" />;
  }

  // Then check clearance for protected routes
  const requiredClearance =
    CLEARANCE_ROUTES[location.pathname as keyof typeof CLEARANCE_ROUTES];
  if (requiredClearance) {
    const hasClearance = requiredClearance.includes(userData.clearance);
    if (!hasClearance) {
      // If no clearance, redirect to record-list with error state
      return (
        <Navigate
          to="/record-list"
          state={{ error: "No clearance to access this route" }}
          replace
        />
      );
    }
  }

  return <Outlet />;
}
