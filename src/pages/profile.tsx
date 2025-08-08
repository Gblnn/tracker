import { useAuth } from "@/components/AuthProvider";
import Back from "@/components/back";
import Directive from "@/components/directive";
import IndexDropDown from "@/components/index-dropdown";
import InputDialog from "@/components/input-dialog";
import LazyLoader from "@/components/lazy-loader";
import DefaultDialog from "@/components/ui/default-dialog";
import { db } from "@/firebase";
import { LoadingOutlined } from "@ant-design/icons";
import { collection, getDocs, query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  CreditCard,
  NotebookTabs,
  Phone,
  UserPlus
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [addUserDialog, setAddUserDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoutPrompt, setLogoutPrompt] = useState(false);
  const { userData, logoutUser: logOut } = useAuth();
  const navigate = useNavigate();

  // User details state
  const [userDetails, setUserDetails] = useState({
    name: '',
    email: '',
    employeeCode: '',
    companyName: '',
    dateofJoin: '',
    contact: '',
    cug: '',
    site: '',
    project: '',
    role: '',
    salaryBasic: '',
    allowance: '',
    profile: ''
  });
  
  interface DocumentStatus {
    isValid: boolean;
    expiryDate?: string | null;
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
        
        // Update user details
        setUserDetails({
          name: docData.name || '',
          email: docData.email || '',
          employeeCode: docData.employeeCode || '',
          companyName: docData.companyName || '',
          dateofJoin: docData.dateofJoin || '',
          contact: docData.contact || '',
          cug: docData.cug || '',
          site: docData.site || '',
          project: docData.project || '',
          role: docData.role || '',
          salaryBasic: docData.salaryBasic || '',
          allowance: docData.allowance || '',
          profile: docData.profile || ''
        });

        // Update documents status
        setDocuments({
          civilId: { 
            isValid: docData.civil_number ? true : false,
            expiryDate: docData.civil_expiry ? (docData.civil_expiry) : null 
          },
          license: { 
            isValid: docData.vehicle_number ? true : false,
            expiryDate: docData.vehicle_expiry ? (docData.vehicle_expiry) : null 
          },
          passport: { 
            isValid: docData.passportID ? true : false,
            expiryDate: docData.passportExpiry ? (docData.passportExpiry) : null 
          },
          medical: { 
            isValid: docData.medical_completed_on ? true : false,
            expiryDate: docData.medical_due_on ? (docData.medical_due_on) : null 
          },
          training: { 
            isValid: docData.vt_hse_induction ? true : false,
            completionDate: docData.vt_hse_induction ? new Date(docData.vt_hse_induction) : null 
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
    <>
    
    <div
      style={{
        padding: "",
        // background:
        //   "linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%))",
        height: "100svh",
      }}
    >
      <motion.div style={{padding:""}} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
        <Back
        subtitle={userData?.system_role}
        fixed
        blurBG
        icon={userData?.system_role === "profile"&&<img src="/stardox-bg.png" width={"30rem"}/>}
          noback={userData?.system_role === "profile"}
          title={userData?.system_role === "profile" ? "StarBoard" : "User Profile"}
          
          extra={
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <IndexDropDown onProfile={() => {}} onLogout={() => setLogoutPrompt(true)} />
            </div>
          }
        />

        <div style={{height:"4rem"}}></div>

        {loading ? (
          <div
            style={{
              padding: "",
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
          <motion.div 
            initial={{ opacity: 0 }} 
            whileInView={{ opacity: 1 }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              maxWidth: "800px",
              margin: "0 auto",
              padding: "1.5rem",
            }}
          >
            {/* Profile Header Section */}
            <div style={{
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "1rem",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem"
            }}>
              <div style={{
                display: "flex",
                gap: "1.5rem",
                alignItems: "center"
              }}>
                <LazyLoader 
                gradient
                  fontSize="2rem" 
                  height="100px" 
                  width="100px" 
                  profile={userDetails.profile}
                  name={userDetails.name} 
                />
                <div style={{
                  display: "flex",
                  flexFlow: "column",
                  gap: "0.25rem",
                  flex: 1,
                  fontSize:"0.8rem"
                }}>
                  <h2 style={{ color: "#fff" }}>{userDetails.name}</h2>
                  <div style={{ textTransform: "capitalize" }}>{userDetails.role}</div>
                    <div>{userDetails.email}</div>
                    
                    <div>{userDetails.employeeCode}</div>
                  
                </div>
              </div>

              <div style={{border:""}}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "0.5rem",
                  alignItems: "center",
                  
                }}>
                  <Directive noArrow icon={<Phone color="dodgerblue" width={"1.25rem"}/>} title={userDetails.contact}/>
                  <Directive noArrow icon={<UserPlus color="dodgerblue" width={"1rem"}/>} title={userDetails.dateofJoin}/>
                </div>
              </div>

              {/* <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
                fontSize: "0.9rem",
                opacity: 0.8
              }}>
                <div>
                  <div style={{ marginBottom: "0.5rem", color: "dodgerblue" }}>Company Details</div>
                  <div>Company: {userDetails.companyName}</div>
                  <div>Join Date: {userDetails.dateofJoin}</div>
                  {userDetails.site && <div>Site: {userDetails.site}</div>}
                  {userDetails.project && <div>Project: {userDetails.project}</div>}
                </div>
                
                <div>
                  <div style={{ marginBottom: "0.5rem", color: "dodgerblue" }}>Contact Details</div>
                  <div>Phone: {userDetails.contact}</div>
                  {userDetails.cug && <div>CUG: {userDetails.cug}</div>}
                </div>
              </div> */}
            </div>

            <div style={{
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "1rem",
              padding: "1.25rem",
            }}>
              
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem"
              }}>
                <Directive 
                  onClick={() => navigate("/phonebook")}  
                  title="Phonebook" 
                  icon={<NotebookTabs color="dodgerblue" width={"1.25rem"}/>}
                />
                {userData?.role === "admin" && (
                  <Directive 
                    onClick={() => setAddUserDialog(true)}  
                    title="Add User" 
                    icon={<UserPlus color="lightgreen" width={"1.25rem"}/>}
                  />
                )}
              </div>
            </div>

            {/* Document Status Section */}
            <div style={{
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "1rem",
              padding: "1.25rem",
            }}>
              <h3 style={{ marginBottom: "1rem", color: "#fff", fontSize: "1rem" }}>Documents Status</h3>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem"
              }}>
                <Directive
                noArrow
                  title="Civil ID"
                  
              
                  icon={<CreditCard color="dodgerblue" width={"1.25rem"} />}
                  
                 
                  
                  id_subtitle={documents.civilId.expiryDate?documents.civilId.expiryDate :""}
                />
                <Directive
                noArrow
                  title="Passport"
                  icon={<CreditCard color="goldenrod" width={"1.25rem"} />}
                  onClick={() => navigate("/passport")}
                  status={documents.passport.isValid}
                  
                  id_subtitle={documents.passport.expiryDate||""}
                />
                {/* <Directive
                  title="Medical"
                  icon={<CreditCard color="tomato" width={"1.25rem"} />}
                  onClick={() => navigate("/medical")}
                  status={documents.medical.isValid}
                  
                  id_subtitle={documents.medical.expiryDate||""}
                />
                <Directive
                  title="License"
                  icon={<CreditCard color="violet" width={"1.25rem"} />}
                  onClick={() => navigate("/license")}
                  status={documents.license.isValid}
                
                  id_subtitle={documents.license.expiryDate||""}
                /> */}
              </div>
            </div>

            {/* Quick Actions Section */}
            
          </motion.div>
            /* <div
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
            </div> */)}
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

      </>


)}
