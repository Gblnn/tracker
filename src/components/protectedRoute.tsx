import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { LoadingOutlined } from "@ant-design/icons";

export default function ProtectedRoutes() {
  const { user, userData, loading } = useAuth();

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

  return user && userData ? <Outlet /> : <Navigate to="/" />;
}
