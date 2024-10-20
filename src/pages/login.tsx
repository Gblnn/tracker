import { Checkbox } from "@/components/ui/checkbox";
import { auth, db } from "@/firebase";
import { LoadingOutlined } from "@ant-design/icons";
import { message } from "antd";
import {
  browserSessionPersistence,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const usenavigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  setPersistence(auth, browserSessionPersistence);

  useEffect(() => {
    window.name != "" && usenavigate("/index");
  }, []);

  const AuthenticateRole = async () => {
    const RecordCollection = collection(db, "users");
    const recordQuery = query(
      RecordCollection,
      where("email", "==", auth.currentUser?.email)
    );
    const querySnapshot = await getDocs(recordQuery);
    const fetchedData: any = [];
    querySnapshot.forEach((doc: any) => {
      fetchedData.push({ id: doc.id, ...doc.data() });
    });
    console.log(fetchedData[0].role, fetchedData[0].email);
    window.name = fetchedData[0].email;
    window.location.reload();
    setLoading(false);
  };

  const handleLoginIn = async () => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      AuthenticateRole();
      // console.log(auth.currentUser);
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.message;
      console.log(err.message);
      message.error(errorMessage);
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

            <div style={{ display: "flex", flexFlow: "column" }}>
              <p style={{ fontWeight: 400, fontSize: "2.25rem" }}>StarDox</p>
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

              <input
                id="password"
                onChange={(e: any) => {
                  setPassword(e.target.value);
                }}
                type="password"
                placeholder="Password"
              />
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
                    <Checkbox />
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
                reviewed and verified by the organization.
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
