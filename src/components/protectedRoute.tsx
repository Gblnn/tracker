import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { LoadingOutlined } from "@ant-design/icons";

// Define routes that require specific clearance
const CLEARANCE_ROUTES = {
  "/records": ["All", "Sohar Star United"],
  "/vale-records": ["All", "Vale"],
};

// Define system-role-restricted routes
const ROLE_RESTRICTED_ROUTES = {
  supervisor: ["/supervisor"], // Supervisors can only access /supervisor
  admin: ["*"], // Admins can access all routes
  user: ["/record-list", "/records", "/vale-records"], // Regular users
  site_coordinator: ["/site-coordinator", "/record-list"],
  management: ["/management", "/record-list", "/reports"],
  profile: ["/profile", "/records"] // Basic profile access
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

  // Check role-based route restrictions
  const allowedRoutes = ROLE_RESTRICTED_ROUTES[userData.system_role as keyof typeof ROLE_RESTRICTED_ROUTES] || [];
  const currentPath = location.pathname;
  
  // If the user's system_role has route restrictions and current path is not allowed
  if (allowedRoutes.length > 0 && !allowedRoutes.includes("*")) {
    if (!allowedRoutes.includes(currentPath)) {
      // Redirect to their default page based on role
      const defaultRoute = allowedRoutes[0];
      return <Navigate to={defaultRoute} replace />;
    }
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
