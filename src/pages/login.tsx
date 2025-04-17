import { useAuth } from "@/components/AuthProvider";
import { Checkbox } from "@/components/ui/checkbox";
import { auth } from "@/firebase";
import { LoadingOutlined } from "@ant-design/icons";
import { message } from "antd";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
} from "firebase/auth";
import { motion } from "framer-motion";
import { ChevronRight, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLoginIn = async () => {
    try {
      setLoading(true);
      // Set persistence before login attempt
      await setPersistence(
        auth,
        stayLoggedIn ? browserLocalPersistence : browserSessionPersistence
      );

      const { userData } = await loginUser(email, password);

      if (!userData) {
        throw new Error("User not found in database");
      }

      // Store user data in localStorage for components that still rely on it
      localStorage.setItem("userRole", userData.role);
      localStorage.setItem("userEmail", userData.email);

      // Force persistence check after successful login
      if (stayLoggedIn) {
        await setPersistence(auth, browserLocalPersistence);
      }

      // Navigate to the return path or index, using replace to avoid history stack
      const returnPath = location.state?.returnPath || "/index";
      navigate(returnPath, { replace: true });
    } catch (err: any) {
      const errorMessage = err.message;
      console.error("Login error:", err);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
      <div style={{ display: "flex", padding: "1.25rem", height: "100svh" }}>
        <div
          className="desktop-only"
          style={{
            border: "",
            flex: 1,
            background: "linear-gradient(darkslateblue, midnightblue)",
            alignItems: "flex-end",
            borderRadius: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              border: "",
              alignItems: "center",
              margin: "2rem",
              gap: "",
            }}
          >
            <img src="/stardox-bg.png" style={{ width: "4rem", border: "" }} />

            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <p style={{ fontWeight: 400, fontSize: "2.25rem" }}>StarBoard</p>
              <p>v1.1</p>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
            flexFlow: "column",
            border: "",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexFlow: "column",
              border: "",
              borderRadius: "1rem",
              width: "32ch",
            }}
          >
            <div
              style={{
                display: "flex",
                border: "",
                borderRadius: "1rem",
                padding: "",
                flexFlow: "column",
                width: "100%",
                gap: "0.75rem",
                marginTop: "2rem",
              }}
            >
              <p
                style={{
                  top: 0,
                  left: 0,
                  fontSize: "2rem",
                  fontWeight: "600",
                  border: "",
                  width: "100%",
                  paddingLeft: "0.5rem",
                  marginTop: "",
                }}
              >
                LOGIN
              </p>
              <br />

              <input
                autoComplete="email"
                id="email"
                onChange={(e: any) => {
                  setEmail(e.target.value);
                  console.log();
                }}
                type="email"
                placeholder="Email Address"
              />

              <div style={{ position: "relative", width: "100%" }}>
                <input
                  id="password"
                  onChange={(e: any) => {
                    setPassword(e.target.value);
                  }}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  style={{ width: "100%" }}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    padding: "0.25rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                  type="button"
                >
                  {showPassword ? (
                    <EyeOff size={18} color="gray" />
                  ) : (
                    <Eye size={18} color="gray" />
                  )}
                </button>
              </div>
              <p />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  width: "100%",
                  justifyContent: "",
                  paddingRight: "1rem",
                  paddingLeft: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    border: "",
                    width: "100%",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Checkbox
                      checked={stayLoggedIn}
                      onCheckedChange={(checked) =>
                        setStayLoggedIn(checked === true)
                      }
                    />
                    <p style={{ fontSize: "0.75rem" }}>Stay logged in</p>
                  </div>

                  <Link
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      color: "mediumslateblue",
                      cursor: "pointer",
                    }}
                    to={"/user-reset"}
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <p />
              <button
                onClick={handleLoginIn}
                className={loading ? "disabled" : ""}
                style={{
                  background: "midnightblue",
                  display: "flex",
                  gap: "0.75rem",
                }}
              >
                {loading ? <LoadingOutlined /> : ""}
                LOGIN
                <ChevronRight width={"0.75rem"} />
              </button>
            </div>

            <br />
            <br />
            <br />

            <div
              style={{
                display: "flex",
                flexFlow: "column",
                gap: "0.5rem",
                bottom: 0,
                width: "100%",
              }}
            >
              {/* <Button onClick={handleDevKey} variant={"ghost"}>
                <KeyRound color="dodgerblue" width={"1.25rem"} />
                Developer Key
              </Button> */}
              <p style={{ opacity: 0.5, fontSize: "0.65rem", border: "" }}>
                If you do not have an account you can request for one. You will
                be granted access to create an account once your request is
                processed.
              </p>
              <Link
                style={{
                  fontSize: "0.8rem",
                  color: "mediumslateblue",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
                to={"/request-access"}
              >
                Request Access
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
