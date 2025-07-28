import { useAuth } from "@/components/AuthProvider";
import Back from "@/components/back";
import Directive from "@/components/directive";
import IndexDropDown from "@/components/index-dropdown";
import InputDialog from "@/components/input-dialog";
import DefaultDialog from "@/components/ui/default-dialog";
import { db } from "@/firebase";
import { LoadingOutlined } from "@ant-design/icons";
import { collection, getDocs, query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  CreditCard,
  UserPlus
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Profile() {
  const [addUserDialog, setAddUserDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [logoutPrompt, setLogoutPrompt] = useState(false);
  const { userData, logoutUser: logOut } = useAuth();
  
  interface DocumentStatus {
    isValid: boolean;
    expiryDate?: Date | null;
    completionDate?: Date | null;
  }

  interface DocumentStates {
    civilId: DocumentStatus;
    license: DocumentStatus;
    passport: DocumentStatus;
    medical: DocumentStatus;
    training: DocumentStatus;
  }

  // Document states
  const [documents, setDocuments] = useState<DocumentStates>({
    civilId: { isValid: false, expiryDate: null },
    license: { isValid: false, expiryDate: null },
    passport: { isValid: false, expiryDate: null },
    medical: { isValid: false, expiryDate: null },
    training: { isValid: false, completionDate: null }
  });

  useEffect(() => {

    fetchDocumentStatus();
  }, []);

  const isExpiring = (date: Date | null | undefined): boolean => {
    if (!date) return false;
    const expiryTime = date.getTime();
    const currentTime = new Date().getTime();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    return expiryTime - currentTime < thirtyDaysInMs;
  };

  const fetchDocumentStatus = async () => {
    try {
      setLoading(true);
      const docQuery = query(
        collection(db, "records"),
        where("email", "==", window.name)
      );
      const docSnapshot = await getDocs(docQuery);
      
      if (!docSnapshot.empty) {
        const docData = docSnapshot.docs[0].data();
        setDocuments({
          civilId: { 
            isValid: docData.civilId?.isValid || false,
            expiryDate: docData.civilId?.expiryDate ? new Date(docData.civilId.expiryDate) : null 
          },
          license: { 
            isValid: docData.license?.isValid || false,
            expiryDate: docData.license?.expiryDate ? new Date(docData.license.expiryDate) : null 
          },
          passport: { 
            isValid: docData.passport?.isValid || false,
            expiryDate: docData.passport?.expiryDate ? new Date(docData.passport.expiryDate) : null 
          },
          medical: { 
            isValid: docData.medical?.isValid || false,
            expiryDate: docData.medical?.expiryDate ? new Date(docData.medical.expiryDate) : null 
          },
          training: { 
            isValid: docData.training?.isValid || false,
            completionDate: docData.training?.completionDate ? new Date(docData.training.completionDate) : null 
          }
        });
      }
    } catch (err) {
      console.error("Error fetching document status:", err);
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <div
      style={{
        padding: "1.25rem",
        background:
          "linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%))",
        height: "100svh",
      }}
    >
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
        <Back
          noback={userData?.role == "profile"}
          title={userData?.role == "profile" ? "StarBoard" : "Profile"}
          subtitle={userData?.role == "profile" ? "v1.4" : ""}
        
          icon={
            userData?.role == "profile" ? (
              <img style={{ width: "2rem" }} src="stardox-bg.png" />
            ) : (
              ""
            )
          }
          extra={
            <div style={{ display: "flex", gap: "0.75rem", alignItems:"center" }}>
              {/* <button style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
                v2.0
              </button> */}
              <IndexDropDown onProfile={()=>{}} onLogout={() => setLogoutPrompt(true)} />
              
            </div>
          }
        />

        <br />

        {loading ? (
          <div
            style={{
              border: "",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "75svh",
            }}
          >
            <LoadingOutlined style={{ color: "dodgerblue", scale: "3" }} />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
            

          
            <div style={{ display: "flex", flexFlow: "column", gap: "0.5rem" }}>
              <Directive
                title={"Update documents"}
                icon={<CreditCard color="dodgerblue" width={"1.25rem"} />}
                onClick={() =>{}}
                to="/civil-id"
                status={documents.civilId.isValid}
                
                expiring={isExpiring(documents.civilId.expiryDate)}
              />

              
            </div>
            {/* <div
              style={{
                border: "",
                display: "flex",
                flexWrap: "wrap",
                height: "65svh",
                gap: "0.75rem",
                justifyContent: "",
              }}
            >
              <SquareDirective
                title="Civil ID"
                icon={<CreditCard color="dodgerblue" width={"2rem"} />}
              />
              <SquareDirective
                title="License"
                icon={<Car color="violet" width={"2rem"} />}
              />
              <SquareDirective
                title="Passport"
                icon={<Book color="goldenrod" width={"2rem"} />}
              />
            </div> */}
          </motion.div>
        )}
      </motion.div>

      <DefaultDialog
        destructive
        OkButtonText="Logout"
        title={"Confirm Logout?"}
        open={logoutPrompt}
        onCancel={() => {
          setLogoutPrompt(false);
          window.location.reload();
        }}
        onOk={async () => {
          try {
            await logOut();
          } catch (error) {
            console.error("Logout error:", error);
          }
        }}
      />

      <InputDialog
        titleIcon={<UserPlus color="dodgerblue" />}
        open={addUserDialog}
        title={"Add User"}
        OkButtonText="Add"
        inputplaceholder="Enter Email"
        input2placeholder="Enter Password"
        input3placeholder="Confirm Password"
        onCancel={() => setAddUserDialog(false)}
      />
    </div>
  );
}
