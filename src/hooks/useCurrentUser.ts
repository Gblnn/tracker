import { useAuth } from "@/components/AuthProvider";

export function useCurrentUser() {
  const { user, userData } = useAuth();

  return {
    // For backward compatibility with window.name
    windowName: userData?.email || "",
    // New properties
    email: userData?.email || "",
    role: userData?.role || "profile",  // system access role
    designation: userData?.designation || "",  // job title/position
    clearance: userData?.clearance || "none",
    isAdmin: userData?.role === "admin",
    isAuthenticated: !!user && !!userData,
    // Raw data
    user,
    userData,
  };
}
