import Back from "@/components/back";
import { message } from "antd";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { motion } from "framer-motion";
import { useState } from "react";
import { LoadingOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { db } from "@/firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { toast } from "sonner";
import { ChevronLeft, LoaderCircle } from "lucide-react";

export default function RequestAccess() {
  const [stage, setStage] = useState(1)
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  // const [showCreateForm, setShowCreateForm] = useState(false);
  const auth = getAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const checkEmailAndCreateAccount = async () => {
    try {
      setLoading(true);
      
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
      setName(userRecord.name || "");

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
      
      
      
      // Add user to users collection in Firestore
      const usersRef = collection(db, "users");
      await addDoc(usersRef, {
        email: email,
        clearance:"None",
        name: name,
        created_at: new Date(),
        role: "profile"  // Default role for new users
      });

      // Create Firebase auth account
      await createUserWithEmailAndPassword(auth, email, password);
toast.success("Account created successfully!");
      
      // Sign in the user
      await signInWithEmailAndPassword(auth, email, password);
      
      window.name = email;
      
      navigate("/profile");
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
          <Back title={name&&"Hi, "+name.split(' ')[0]}  />
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
              Request Access
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
              }}
            >
              {loading ? <LoadingOutlined /> : "Request Access"}
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
              }}
            >
              {loading ? <LoaderCircle className="animate-spin" /> : "Create Account"}
            </button>
          </div>
        </motion.div>
          }
        
      </div>
    </>
  );
}
