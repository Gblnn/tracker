import { useAuth } from "@/components/AuthProvider";
import Back from "@/components/back";
import { message } from "antd";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function RequestAccess() {
  const { loginUser } = useAuth();
  const [stage, setStage] = useState(1)
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  // const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [targetPath, setTargetPath] = useState("/index");
  const navigate = useNavigate();

  const checkEmailAndCreateAccount = async () => {
    try {
      setLoading(true);
      
      // Dynamically import Firebase modules
      const { getFirebaseDb } = await import("@/firebase");
      const { collection, query, where, getDocs } = await import("firebase/firestore");
      
      const db = getFirebaseDb();
      // First check if email exists in records
      const recordsRef = collection(db, "records");
      const recordsQuery = query(recordsRef, where("email", "==", email));
      const recordsSnapshot = await getDocs(recordsQuery);

      if (recordsSnapshot.empty) {
        toast.error("Email not found in records");
        setLoading(false);
        return;
      }

      // Then check if user already exists in users collection
      const usersRef = collection(db, "users");
      const usersQuery = query(usersRef, where("email", "==", email));
      const usersSnapshot = await getDocs(usersQuery);

      if (!usersSnapshot.empty) {
        toast.error("An account with this email already exists");
        setLoading(false);
        return;
      }

      // Get user details from the record
      const userRecord = recordsSnapshot.docs[0].data();
      // Use display_name if available, otherwise fall back to name
      setName(userRecord.display_name || userRecord.name || "");

      // If email exists in records but not in users, show the create account form
      setStage(2);
      toast.success(`Email verified`);
      
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      console.error(error);
      message.error(error.message);
    }
  };

  const createAccount = async () => {
    try {
      setLoading(true);
      
      // Dynamically import Firebase modules
      const { getFirebaseDb, getFirebaseAuth } = await import("@/firebase");
      const { collection, addDoc } = await import("firebase/firestore");
      const { createUserWithEmailAndPassword } = await import("firebase/auth");
      
      const auth = getFirebaseAuth();
      const db = getFirebaseDb();
      
      // Add user to users collection in Firestore
      const usersRef = collection(db, "users");
      await addDoc(usersRef, {
        email: email,
        clearance: JSON.stringify({ phonebook: true }),
        name: name,
        created_at: new Date(),
        role: "user",  // Default system role for new users
        designation: ""  // job title will be set later
      });

      // Create Firebase auth account
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success("Account created successfully!");
      
      // Use AuthProvider's loginUser to properly authenticate and get user data
      const { userData } = await loginUser(email, password);
      
      if (!userData) {
        throw new Error("User data not found after login");
      }
      
      window.name = email;
      
      // Store user data in localStorage
      localStorage.setItem("userRole", userData.role);
      localStorage.setItem("userEmail", userData.email);
      
      // Role-based redirection
      let path = "/index"; // default
      switch (userData.role) {
        case "profile":
          path = "/profile";
          break;
        case "admin":
          path = "/index";
          break;
        case "user":
          path = "/index";
          break;
        default:
          path = "/index";
          break;
      }
      
      setTargetPath(path);
      setStage(3);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      console.error(error);
      toast.error(error.message);
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          border: "",
          height: "100svh",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            border: "",
            position: "absolute",
            top: 0,
            left: 0,
            margin: "2rem",
          }}
        >
          <Back noback={stage==3} title={stage!=3&&name&&"Hi, "+name.split(' ')[0]}  />
        </div>

          {
            stage==1&&
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
          <div
            style={{
              display: "flex",
              width: "32ch",
              height: "",
              border: "1px solid rgba(100 100 100/ 50%)",
              borderRadius: "1.75rem",
              padding: "1.45rem",
              flexFlow: "column",
              gap: "1rem",
            }}
          >
            <p
              style={{
                fontSize: "1.35rem",
                textTransform: "uppercase",
                fontWeight: "600",
              }}
            >
              Create Account
            </p>
            <p style={{ fontSize: "0.8rem", opacity: 0.75 }}>
              Enter your email in the field below.
            </p>

            <div
              style={{ display: "flex", flexFlow: "column", gap: "0.75rem" }}
            >
              {/* <input
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                placeholder="Enter Full Name"
              ></input> */}

              <input
              type="email"
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                placeholder="Enter Email"
              ></input>

              <p style={{ fontSize: "0.6rem", opacity: 0.5 }}>
                Please consult the IT Department to acquire or enquire about
                your email id{" "}
              </p>
            </div>
            
            <button
              onClick={checkEmailAndCreateAccount}
              className={email != "" ? "" : "disabled"}
              style={{  
                background: "midnightblue",
                height: "2.5rem",
                fontSize: "0.9rem",
                color: "white"
              }}
            >
              {loading ? <Loader2 className="animate-spin" /> : "Request Access"}
            </button>
          </div>
        </motion.div>
          }

          {
            stage==2&&
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
          <div
            style={{
              display: "flex",
              width: "32ch",
              height: "",
              border: "1px solid rgba(100 100 100/ 50%)",
              borderRadius: "1.75rem",
              padding: "1.45rem",
              flexFlow: "column",
              gap: "1rem",
            }}
          >
            <div style={{display:"flex", gap:"0.5rem", alignItems:"center"}}>
            <p onClick={()=>setStage(1)} style={{cursor:"pointer", fontSize:"0.8rem", opacity:0.75}}>
              <ChevronLeft/>
            </p>
            <p
              style={{
                fontSize: "1.35rem",
                textTransform: "uppercase",
                fontWeight: "600",
              }}
            >
              Create Password
            </p>
            </div>
            
            <p style={{ fontSize: "0.8rem", opacity: 0.75, textAlign:"center" }}>
              Create a strong password for your account.
            </p>

            <div
              style={{ display: "flex", flexFlow: "column", gap: "0.75rem" }}
            >
              {/* <input
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                placeholder="Enter Full Name"
              ></input> */}

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
              />

              <input
                type="password"
                
                placeholder="Confirm Password"
              />

              <p style={{ fontSize: "0.6rem", opacity: 0.5, textAlign:"center" }}>
                Include symbols and numbers to strengthen password{" "}
              </p>
            </div>
            
            <button
              onClick={createAccount}
              className={password ? "" : "disabled"}
              style={{  
                background: "midnightblue",
                height: "2.5rem",
                fontSize: "0.9rem",
                color: "white"
              }}
            >
              {loading ? <LoaderCircle className="animate-spin" /> : "Create Account"}
            </button>
          </div>
        </motion.div>
          }

          {
            stage==3&&
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              <div
                style={{
                  display: "flex",
                  width: "32ch",
                  height: "",
                  // border: "1px solid rgba(100 100 100/ 50%)",
                  borderRadius: "1.75rem",
                  padding: "2rem 1.45rem",
                  flexFlow: "column",
                  gap: "5rem",
                  alignItems: "center",
                  textAlign: "center"
                }}
              >
                <div style={{ display: "flex", flexFlow: "column", gap: "1rem" }}>
                  <p
                    style={{
                      fontSize: "3rem",
                      lineHeight:"3rem",
                      fontWeight: "700",
                      background: "linear-gradient(135deg, midnightblue, mediumslateblue)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Welcome Aboard!
                  </p>
                  <p style={{fontSize:"4rem"}}>🎉</p>
                  
                  <p style={{ fontSize: "0.9rem", opacity: 0.75, lineHeight: "1.5", color:"darkslateblue", fontWeight:500 }}>
                    Your account has been created successfully. You're all set to get started.
                  </p>
                </div>

                <button
                  onClick={() => navigate(targetPath, { replace: true })}
                  style={{  
                    background: "darkslateblue",
                    height: "2.75rem",
                    fontSize: "0.95rem",
                    color: "white",
                    width: "100%",
                    fontWeight: "600",
                    display:"flex",
                    alignItems:"center",
                  }}
                >
                  Get Started
                  <ChevronRight width={"1rem"}/>
                </button>
              </div>
            </motion.div>
          }
        
      </div>
    </>
  );
}
