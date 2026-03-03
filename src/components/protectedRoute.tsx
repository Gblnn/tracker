import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { LoadingOutlined } from "@ant-design/icons";

// Define routes that require specific clearance
const CLEARANCE_ROUTES = {
  "/vale-records": ["All", "Vale"],
};

// Define system-role-restricted routes
const ROLE_RESTRICTED_ROUTES = {
  admin: ["*"], // Admins can access all routes
  user: ["/index", "/records", "/record-list", "/vale-records", "/profile", "/phonebook", "/qr-code-generator", "/offer-letters", "/new-hire", "/fuel-log"], // Regular users can access records master
  profile: ["/profile", "/records", "/phonebook"] // Basic profile access
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
  const allowedRoutes = ROLE_RESTRICTED_ROUTES[userData.role as keyof typeof ROLE_RESTRICTED_ROUTES];
  const currentPath = location.pathname;
  
  // Helper function to check if a path matches allowed routes (including dynamic routes)
  const isPathAllowed = (path: string, allowedRoutes: string[]): boolean => {
    // Check for wildcard access
    if (allowedRoutes.includes("*")) return true;
    
    // Check exact match
    if (allowedRoutes.includes(path)) return true;
    
    // Check if path starts with any allowed route (for dynamic routes like /record/:id)
    return allowedRoutes.some(route => {
      // Special handling for dynamic routes
      if (path.startsWith('/record/') && allowedRoutes.includes('/records')) {
        return true;
      }
      return false;
    });
  };
  
  // If role is defined and has specific route restrictions (not wildcard)
  if (allowedRoutes && allowedRoutes.length > 0 && !allowedRoutes.includes("*")) {
    if (!isPathAllowed(currentPath, allowedRoutes)) {
      // Redirect to their default page based on role
      const defaultRoute = allowedRoutes[0];
      return <Navigate to={defaultRoute} replace />;
    }
  }
  // If role is not defined in ROLE_RESTRICTED_ROUTES, allow access to /index only
  else if (!allowedRoutes && currentPath !== "/index") {
    return <Navigate to="/index" replace />;
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
