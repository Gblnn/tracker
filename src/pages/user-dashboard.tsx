import { useAuth } from "@/components/AuthProvider";
import Back from "@/components/back";
import BackgroundProcessDropdown from "@/components/background-process-dropdown";
import IndexDropDown from "@/components/index-dropdown";
import InputDialog from "@/components/input-dialog";
import LazyLoader from "@/components/lazy-loader";
import DefaultDialog from "@/components/ui/default-dialog";
import { db } from "@/firebase";
import { cacheProfileData, fetchAndCacheProfile, getCachedProfile } from "@/utils/profileCache";
import { LoadingOutlined } from "@ant-design/icons";
import { collection, getDocs, query, updateDoc, where } from "firebase/firestore";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AtSign,
  Book,
  BookOpen,
  Building2,
  Calendar,
  ChevronRight,
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

  const docItems: {
    icon: React.ReactNode;
    label: string;
    hasDoc: boolean;
    dateLabel: string | null;
    route: string;
  }[] = [
    {
      icon: <CreditCard width="1.1rem" />,
      label: "Civil ID",
      hasDoc: documents.civilId.isValid,
      dateLabel: documents.civilId.expiryDate ?? null,
      route: "/passports",
    },
    {
      icon: <BookOpen width="1.1rem" />,
      label: "Passport",
      hasDoc: documents.passport.isValid,
      dateLabel: documents.passport.expiryDate ?? null,
      route: "/passports",
    },
    {
      icon: <Shield width="1.1rem" />,
      label: "Medical",
      hasDoc: documents.medical.isValid,
      dateLabel: documents.medical.expiryDate ?? null,
      route: "/passports",
    },
    {
      icon: <CreditCard width="1.1rem" />,
      label: "License",
      hasDoc: documents.license.isValid,
      dateLabel: documents.license.expiryDate ?? null,
      route: "/passports",
    },
    {
      icon: <HardHat width="1.1rem" />,
      label: "HSE Induction",
      hasDoc: documents.training.isValid,
      dateLabel: documents.training.completionDate
        ? documents.training.completionDate.toLocaleDateString()
        : null,
      route: "/passports",
    },
  ];

  const employmentRows: { icon: React.ReactNode; label: string; value: string }[] = [
    { icon: <Building2 width="1rem" />, label: "Company", value: userDetails.companyName },
    { icon: <Building2 width="1rem" />, label: "Project", value: userDetails.project },
    { icon: <HardHat width="1rem" />, label: "Site", value: userDetails.site },
    { icon: <Book width="1rem" />, label: "Designation", value: userDetails.designation },
    { icon: <Calendar width="1rem" />, label: "Date Joined", value: userDetails.dateofJoin },
  ].filter((r) => !!r.value);

  const contactRows: { icon: React.ReactNode; label: string; value: string; href: string }[] = [
    { icon: <AtSign width="1rem" />, label: "Email", value: userDetails.email || userData?.email || "", href: `mailto:${userDetails.email || userData?.email}` },
    { icon: <Phone width="1rem" />, label: "Mobile", value: userDetails.contact, href: `tel:${userDetails.contact}` },
    { icon: <Phone width="1rem" />, label: "CUG", value: userDetails.cug ? String(userDetails.cug) : "", href: `tel:${userDetails.cug}` },
  ].filter((r) => !!r.value);

  const sectionLabel = (text: string) => (
    <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(0,0,0,0.35)", marginBottom: "0.5rem", paddingLeft: "0.25rem" }}>
      {text}
    </div>
  );

  const infoRow = (icon: React.ReactNode, label: string, value: string, href?: string, last?: boolean) => {
    const inner = (
      <motion.div
        whileTap={{ scale: 0.985 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.85rem",
          padding: "0.8rem 1rem",
          background: "rgba(100,100,100,0.03)",
          borderBottom: last ? "none" : "1px solid rgba(100,100,100,0.07)",
        }}
      >
        <div style={{ width: "2rem", height: "2rem", borderRadius: "0.55rem", background: "rgba(0,0,139,0.07)", display: "flex", alignItems: "center", justifyContent: "center", color: "darkblue", flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.66rem", color: "rgba(0,0,0,0.38)", marginBottom: "0.1rem" }}>{label}</div>
          <div style={{ fontSize: "0.875rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
        </div>
        {href && <ChevronRight style={{ width: "0.85rem", opacity: 0.3, flexShrink: 0 }} />}
      </motion.div>
    );
    return href
      ? <a key={label} href={href} style={{ textDecoration: "none", color: "inherit" }}>{inner}</a>
      : <div key={label}>{inner}</div>;
  };

  const card = (children: React.ReactNode) => (
    <div style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(100,100,100,0.09)", borderRadius: "1rem", overflow: "hidden", backdropFilter: "blur(4px)" }}>
      {children}
    </div>
  );

  return (
    <>
      <div style={{ minHeight: "100svh", background: "rgba(248,249,252,1)" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Back
            fixed
            blurBG
            icon={userData?.role === "profile" && <img src="/stardox-bg.png" width={"30rem"} />}
            noback={userData?.role === "profile"}
            title={userData?.role === "profile" ? "StarBoard" : ""}
            extra={
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <BackgroundProcessDropdown />
                <IndexDropDown onProfile={() => {}} onLogout={() => setLogoutPrompt(true)} />
              </div>
            }
          />

          <div style={{ height: "4rem" }} />

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "75svh" }}>
                <LoadingOutlined style={{ color: "darkblue", scale: "3" }} />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                style={{ display: "flex", flexDirection: "column", gap: "1.1rem", maxWidth: "520px", margin: "0 auto", padding: "1rem 1rem 6rem" }}
              >
                {/* ── Hero Banner ── */}
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  style={{
                    background: "linear-gradient(140deg, #0c1445 0%, #1e3a8a 55%, #2563eb 100%)",
                    borderRadius: "1.25rem",
                    padding: "1.6rem 1.5rem 1.4rem",
                    color: "white",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* subtle mesh pattern */}
                  <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%), radial-gradient(circle at 10% 90%, rgba(255,255,255,0.04) 0%, transparent 40%)", pointerEvents: "none" }} />

                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", position: "relative" }}>
                    {/* Avatar */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div style={{ padding: "2.5px", borderRadius: "50%", background: "linear-gradient(135deg, rgba(255,255,255,0.5), rgba(255,255,255,0.15))" }}>
                        <LazyLoader
                          gradient
                          fontSize="1.6rem"
                          height="62px"
                          width="62px"
                          profile={userDetails.profile}
                          name={userDetails.name || userData?.email}
                        />
                      </div>
                    </div>

                    {/* Name + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {userDetails.name ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ fontSize: "1.05rem", fontWeight: 700, letterSpacing: "-0.01em" }}>{userDetails.name}</span>
                          <button
                            onClick={() => { setEditNameValue(userDetails.name); setEditNameDialog(true); }}
                            style={{ background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", padding: "3px 4px", borderRadius: "6px", display: "flex", flexShrink: 0, lineHeight: 0 }}
                          >
                            <PenLine width="10px" color="white" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditNameValue(''); setEditNameDialog(true); }}
                          style={{ background: "rgba(255,255,255,0.1)", border: "1px dashed rgba(255,255,255,0.3)", cursor: "pointer", color: "rgba(255,255,255,0.8)", fontWeight: 500, fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.28rem 0.65rem", borderRadius: "0.5rem" }}
                        >
                          <PenLine width="11px" /> Set display name
                        </button>
                      )}

                      {userDetails.designation && (
                        <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", marginTop: "0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {userDetails.designation}
                        </div>
                      )}

                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.6rem" }}>
                        {userDetails.employeeCode && (
                          <span style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.05em", background: "rgba(255,255,255,0.12)", padding: "0.18rem 0.48rem", borderRadius: "0.3rem", color: "rgba(255,255,255,0.85)" }}>
                            {userDetails.employeeCode}
                          </span>
                        )}
                        <span style={{ fontSize: "0.65rem", fontWeight: 600, background: "rgba(255,255,255,0.12)", padding: "0.18rem 0.48rem", borderRadius: "0.3rem", color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: "0.22rem", textTransform: "capitalize" }}>
                          <Shield width="0.58rem" />
                          {userData?.role}
                        </span>
                        {userDetails.project && (
                          <span style={{ fontSize: "0.65rem", fontWeight: 500, background: "rgba(255,255,255,0.08)", padding: "0.18rem 0.48rem", borderRadius: "0.3rem", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: "0.22rem" }}>
                            <Building2 width="0.58rem" />
                            {userDetails.project}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* ── Profile Completion Nudge ── */}
                <AnimatePresence>
                  {(!userDetails.name || !documents.civilId.isValid || !documents.passport.isValid) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "0.9rem", padding: "0.8rem 1rem", overflow: "hidden" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.45rem" }}>
                        <AlertCircle width="0.85rem" color="#d97706" />
                        <span style={{ fontWeight: 600, fontSize: "0.78rem", color: "#92400e" }}>Complete your profile</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        {!userDetails.name && (
                          <button onClick={() => { setEditNameValue(''); setEditNameDialog(true); }} style={{ display: "flex", alignItems: "center", gap: "0.32rem", background: "none", border: "none", cursor: "pointer", color: "#b45309", fontSize: "0.77rem", fontWeight: 500, padding: 0 }}>
                            <PenLine width="0.72rem" /> Add display name
                          </button>
                        )}
                        {!documents.civilId.isValid && (
                          <button onClick={() => navigate("/passports")} style={{ display: "flex", alignItems: "center", gap: "0.32rem", background: "none", border: "none", cursor: "pointer", color: "#b45309", fontSize: "0.77rem", fontWeight: 500, padding: 0 }}>
                            <CreditCard width="0.72rem" /> Upload Civil ID
                          </button>
                        )}
                        {!documents.passport.isValid && (
                          <button onClick={() => navigate("/passports")} style={{ display: "flex", alignItems: "center", gap: "0.32rem", background: "none", border: "none", cursor: "pointer", color: "#b45309", fontSize: "0.77rem", fontWeight: 500, padding: 0 }}>
                            <BookOpen width="0.72rem" /> Upload Passport
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Documents & Assets ── */}
                <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  {sectionLabel("Documents & Assets")}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.55rem" }}>
                    {docItems.map((item, i) => (
                      <motion.div
                        key={i}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate(item.route)}
                        style={{
                          background: item.hasDoc ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.5)",
                          border: `1px solid ${item.hasDoc ? "rgba(0,0,139,0.1)" : "rgba(245,158,11,0.22)"}`,
                          borderRadius: "0.95rem",
                          padding: "0.9rem",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.55rem",
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ width: "1.9rem", height: "1.9rem", borderRadius: "0.5rem", background: item.hasDoc ? "rgba(0,0,139,0.08)" : "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: item.hasDoc ? "darkblue" : "#d97706" }}>
                            {item.icon}
                          </div>
                          <div style={{ width: "0.45rem", height: "0.45rem", borderRadius: "50%", background: item.hasDoc ? "rgb(34,197,94)" : "#f59e0b" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.15rem" }}>{item.label}</div>
                          <div style={{ fontSize: "0.66rem", color: item.hasDoc ? "rgba(0,0,0,0.4)" : "#d97706", fontWeight: item.hasDoc ? 400 : 500 }}>
                            {item.hasDoc ? (item.dateLabel || "On file") : "Not uploaded"}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>

                {/* ── Employment ── */}
                {employmentRows.length > 0 && (
                  <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    {sectionLabel("Employment")}
                    {card(employmentRows.map((row, i) => infoRow(row.icon, row.label, row.value, undefined, i === employmentRows.length - 1)))}
                  </motion.section>
                )}

                {/* ── Contact ── */}
                {contactRows.length > 0 && (
                  <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    {sectionLabel("Contact")}
                    {card(contactRows.map((row, i) => infoRow(row.icon, row.label, row.value, row.href, i === contactRows.length - 1)))}
                  </motion.section>
                )}
              </motion.div>
            )}
          </AnimatePresence>
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
  );
}
