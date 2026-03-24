import { useAuth } from "@/components/AuthProvider";
import Back from "@/components/back";
import BackgroundProcessDropdown from "@/components/background-process-dropdown";
import Directive from "@/components/directive";
import IndexDropDown from "@/components/index-dropdown";
import InputDialog from "@/components/input-dialog";
import LazyLoader from "@/components/lazy-loader";
import DefaultDialog from "@/components/ui/default-dialog";
import { db } from "@/firebase";
import { cacheProfileData, fetchAndCacheProfile, getCachedProfile } from "@/utils/profileCache";
import { LoadingOutlined } from "@ant-design/icons";
import { collection, getDocs, query, updateDoc, where } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AtSign,
  Book,
  BookOpen,
  Building2,
  CreditCard,
  HardHat,
  PenLine,
  Phone,
  Shield,
  UserPlus
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UserDashboard() {
  const [addUserDialog, setAddUserDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoutPrompt, setLogoutPrompt] = useState(false);
  const [editNameDialog, setEditNameDialog] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);
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
    designation: '',  // job title/position
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
    // Load cached data immediately for instant display
    const cachedProfile = getCachedProfile();
    const hasCachedData = !!(cachedProfile && userData?.email);
    
    if (hasCachedData) {
      console.log("⚡ Loading profile from cache");
      updateStateFromData(cachedProfile);
    }
    
    // Then fetch fresh data in background (silently if we have cached data)
    fetchDocumentStatus(hasCachedData);
  }, []);

  const updateStateFromData = (docData: any) => {
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
      designation: docData.designation || '',
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
  };

  const fetchDocumentStatus = async (silent: boolean = false) => {
    if (!userData?.email) return;
    
    try {
      // Only show loading spinner if we don't have cached data
      if (!silent) {
        setLoading(true);
      }
      
      // Use the cache utility to fetch and cache
      const profileData = await fetchAndCacheProfile(userData.email);
      
      if (profileData) {
        updateStateFromData(profileData);
      }
    } catch (err) {
      console.error("Error fetching document status:", err);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  

  const updateDisplayName = async () => {
    if (!editNameValue.trim() || !userData?.email) return;
    setSavingName(true);
    try {
      const q = query(collection(db, "records"), where("email", "==", userData.email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, { name: editNameValue.trim() });
        setUserDetails(prev => ({ ...prev, name: editNameValue.trim() }));
        const cached = getCachedProfile();
        if (cached) cacheProfileData({ ...cached, name: editNameValue.trim() });
      }
      setEditNameDialog(false);
    } catch (err) {
      console.error("Failed to update display name:", err);
    } finally {
      setSavingName(false);
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
        // subtitle={userData?.role}
        fixed
        blurBG
        icon={userData?.role === "profile"&&<img src="/stardox-bg.png" width={"30rem"}/>}
          noback={userData?.role === "profile"}
          title={userData?.role === "profile" ? "StarBoard" : ""}
          
          extra={
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <BackgroundProcessDropdown />
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
            <LoadingOutlined style={{ color: "mediumslateblue", scale: "3" }} />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              maxWidth: "560px",
              margin: "0 auto",
              padding: "1.25rem 1.25rem 2rem",
            }}
          >
            {/* ── Instagram-style Profile Header ── */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.6rem",
              paddingBottom: "1.25rem",
              borderBottom: "1px solid rgba(100,100,100,0.1)",
            }}>
              {/* Avatar with gradient ring */}
              <div
                style={{ position: "relative", cursor: "pointer", border:"" }}
                onClick={() => { setEditNameValue(userDetails.name); setEditNameDialog(true); }}
              >
                <div style={{
                  
                  padding: "3px",
                  borderRadius: "50%",
                  background: userDetails.name
                    ? "linear-gradient(135deg, mediumslateblue, violet)"
                    : "transparent",
                  border: userDetails.name ? "none" : "2.5px dashed #d1d5db",
                }}>
                  <LazyLoader
                    gradient
                    fontSize="2.5rem"
                    height="88px"
                    width="88px"
                    profile={userDetails.profile}
                    name={userDetails.name || userData?.email}
                  />
                </div>
                {/* Edit button overlay */}
                <div style={{
                  position: "absolute",
                  bottom: "2px",
                  right: "2px",
                  background: "mediumslateblue",
                  border: "2px solid white",
                  borderRadius: "50%",
                  width: "26px",
                  height: "26px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <PenLine width="12px" color="white" />
                </div>
              </div>

              {/* Name row */}
              {userDetails.name ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ fontSize: "1.2rem", fontWeight: 700 }}>{userDetails.name}</span>
                  {/* <button
                    onClick={() => { setEditNameValue(userDetails.name); setEditNameDialog(true); }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex" }}
                  >
                    <PenLine width="14px" color="slategray" />
                  </button> */}
                </div>
              ) : (
                <button
                  onClick={() => { setEditNameValue(''); setEditNameDialog(true); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#f59e0b", fontWeight: 600, fontSize: "0.95rem",
                    display: "flex", alignItems: "center", gap: "0.3rem",
                  }}
                >
                  <PenLine width="14px" />
                  Set your display name
                </button>
              )}

              {/* Email + employee code */}
              <div style={{ textAlign: "center", fontSize: "0.78rem", color: "slategray", lineHeight: 1.6 }}>
                <div>{userData?.email}</div>
                {userDetails.employeeCode && <div>{userDetails.employeeCode}</div>}
              </div>

              {/* Role pill */}
              <div style={{
                display: "flex", alignItems: "center", gap: "0.35rem",
                background: "rgba(123, 104, 238, 0.1)",
                padding: "0.3rem 0.75rem",
                borderRadius: "999px",
                fontSize: "0.78rem",
                color: "mediumslateblue",
                fontWeight: 500,
                textTransform: "capitalize",
              }}>
                <Shield width="0.8rem" />
                {userData?.role}
              </div>
            </div>

            {/* ── Profile Completion Nudge ── */}
            {(!userDetails.name || !documents.civilId.isValid || !documents.passport.isValid) && (
              <div style={{
                background: "rgba(245, 158, 11, 0.07)",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                borderRadius: "0.875rem",
                padding: "0.9rem 1rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
                  <AlertCircle width="1rem" color="#f59e0b" />
                  <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>Complete your profile</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  {!userDetails.name && (
                    <button
                      onClick={() => { setEditNameValue(''); setEditNameDialog(true); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.4rem",
                        background: "none", border: "none", cursor: "pointer",
                        color: "#f59e0b", fontSize: "0.82rem", fontWeight: 500, padding: 0,
                      }}
                    >
                      <PenLine width="0.8rem" /> Add your display name
                    </button>
                  )}
                  {!documents.civilId.isValid && (
                    <button
                      onClick={() => navigate("/passports")}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.4rem",
                        background: "none", border: "none", cursor: "pointer",
                        color: "#f59e0b", fontSize: "0.82rem", fontWeight: 500, padding: 0,
                      }}
                    >
                      <CreditCard  width="0.8rem" /> Add your Civil ID
                    </button>
                  )}
                  {!documents.passport.isValid && (
                    <button
                      onClick={() => navigate("/passports")}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.4rem",
                        background: "none", border: "none", cursor: "pointer",
                        color: "#f59e0b", fontSize: "0.82rem", fontWeight: 500, padding: 0,
                      }}
                    >
                      <BookOpen width="0.8rem" /> Add your Passport
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Document Stories ── */}
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.85rem" }}>
                Documents
              </div>
              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                {/* Civil ID bubble */}
                <div
                  onClick={() => navigate("/passports")}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}
                >
                  <div style={{
                    padding: "3px",
                    borderRadius: "50%",
                    background: documents.civilId.isValid
                      ? "linear-gradient(135deg, mediumslateblue, #818cf8)"
                      : "transparent",
                    border: documents.civilId.isValid ? "none" : "2.5px dashed #f59e0b",
                  }}>
                    <div style={{
                      width: "60px", height: "60px", borderRadius: "50%",
                      background: "rgba(100,100,100,0.06)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2.5px solid white",
                    }}>
                      <CreditCard color={documents.civilId.isValid ? "white" : "#9ca3af"} width="1.5rem" />
                    </div>
                  </div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, textAlign: "center" }}>
                    {documents.civilId.isValid ? "Civil ID" : "+ Civil ID"}
                  </span>
                  {documents.civilId.expiryDate
                    ? <span style={{ fontSize: "0.65rem", color: "slategray" }}>{documents.civilId.expiryDate}</span>
                    : <span style={{ fontSize: "0.65rem", color: "#f59e0b" }}>Not added</span>
                  }
                </div>

                {/* Passport bubble */}
                <div
                  onClick={() => navigate("/passports")}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}
                >
                  <div style={{
                    padding: "3px",
                    borderRadius: "50%",
                    background: documents.passport.isValid
                      ? "linear-gradient(135deg, goldenrod, #fbbf24)"
                      : "transparent",
                    border: documents.passport.isValid ? "none" : "2.5px dashed #f59e0b",
                  }}>
                    <div style={{
                      width: "60px", height: "60px", borderRadius: "50%",
                      background: "rgba(100,100,100,0.06)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2.5px solid white",
                    }}>
                      <Book color={documents.passport.isValid ? "white" : "#9ca3af"} width="1.5rem" />
                    </div>
                  </div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, textAlign: "center" }}>
                    {documents.passport.isValid ? "Passport" : "+ Passport"}
                  </span>
                  {documents.passport.expiryDate
                    ? <span style={{ fontSize: "0.65rem", color: "slategray" }}>{documents.passport.expiryDate}</span>
                    : <span style={{ fontSize: "0.65rem", color: "#f59e0b" }}>Not added</span>
                  }
                </div>
              </div>
            </div>

            {/* ── Info Section ── */}
            <div style={{
              background: "rgba(100, 100, 100, 0.04)",
              borderRadius: "1rem",
              padding: "1rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "0.5rem",
            }}>
              <Directive icon={<Building2 color="mediumslateblue" width={"1.25rem"}/>} title={userDetails.project||"Not Allocated"}/>
              {userDetails.site && (
                <Directive icon={<HardHat color="mediumslateblue" width={"1.25rem"}/>} title={userDetails.site}/>
              )}
              <Directive icon={<Phone color="mediumslateblue" width={"1.25rem"}/>} title={userDetails.contact||"Not Allocated"}/>
              <Directive notName icon={<AtSign color="mediumslateblue" width={"1.25rem"}/>} title={userDetails.email||"Not Allocated"}/>
            </div>
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
        titleIcon={<UserPlus color="mediumslateblue" />}
        open={addUserDialog}
        title={"Add User"}
        OkButtonText="Add"
        inputplaceholder="Enter Email"
        input2placeholder="Enter Password"
        input3placeholder="Confirm Password"
        onCancel={() => setAddUserDialog(false)}
      />

      <InputDialog
        titleIcon={<PenLine color="mediumslateblue" />}
        open={editNameDialog}
        title={"Display Name"}
        OkButtonText="Save"
        inputplaceholder="Enter your display name"
        input1Value={editNameValue}
        inputOnChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditNameValue(e.target.value)}
        updating={savingName}
        onCancel={() => setEditNameDialog(false)}
        onOk={updateDisplayName}
      />

      </div>

      </>


)}
