import { useAuth } from "@/components/AuthProvider";
import Back from "@/components/back";
import Directive from "@/components/directive";
import IOMenu from "@/components/editorMenu";
import RefreshButton from "@/components/refresh-button";
import RoleSelect from "@/components/role-select";
import DefaultDialog from "@/components/ui/default-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { db } from "@/firebase";
import { message } from "antd";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { motion } from "framer-motion";
import {
  Book,
  Car,
  Eye,
  FileArchive,
  Fuel,
  KeyRound,
  Link,
  Loader2,
  MinusCircle,
  Notebook,
  PenLine,
  Plus,
  QrCode,
  ShieldPlus,
  User,
  UserCheck,
  UserPlus,
  Users as UsersIcon,
  Wallet
} from "lucide-react";
import { useEffect, useState } from "react";

// Constants for localStorage keys
const CACHED_USER_KEY = "cached_user_data";

// Module definitions
const MODULES = [
  { id: 'records_master', name: 'Records Master', icon: FileArchive },
  { id: 'user_management', name: 'Users', icon: UsersIcon },
  { id: 'new_hire', name: 'New Hire', icon: UserCheck },
  { id: 'phonebook', name: 'Phonebook', icon: Notebook },
  { id: 'quick_links', name: 'Quick Links', icon: Link },
  { id: 'qr_generator', name: 'QR Generator', icon: QrCode },
  { id: 'fuel_log', name: 'Fuel Log', icon: Fuel },
  { id: 'vehicle_master', name: 'Vehicle Master', icon: Car },
  { id: 'vehicle_log_book', name: 'Vehicle Log Book', icon: Book },
  { id: 'petty_cash', name: 'Petty Cash', icon: Wallet },
];

// Shared User Details Content Component
interface UserDetailsContentProps {
  display_name: string;
  display_email: string;
  role: string;
  setRole: (role: string) => void;
  clearance: string;
  setClearance: (clearance: string) => void;
  site: string;
  setSite: (site: string) => void;
  project: string;
  setProject: (project: string) => void;
  editor: string;
  setEditor: (editor: string) => void;
  sensitive_data: string;
  setSensitiveData: (data: string) => void;
  loading: boolean;
  onUpdate: () => void;
  onDelete: () => void;
  isMobile: boolean;
  onOpenClearanceDrawer: () => void;
}

const UserDetailsContent: React.FC<UserDetailsContentProps> = ({
  display_name,
  display_email,
  role,
  setRole,
  clearance,
  
  site,
  setSite,
  project,
  setProject,
  editor,
  setEditor,
  sensitive_data,
  setSensitiveData,
  loading,
  onUpdate,
  onDelete,
  
  onOpenClearanceDrawer,
}) => {
  // Parse clearance to count enabled modules
  const getEnabledModulesCount = () => {
    try {
      const modules = JSON.parse(clearance || '{}');
      return Object.values(modules).filter(v => v === true).length;
    } catch {
      return 0;
    }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", maxHeight: "75vh", width: "100%" }}>
      {/* Fixed Header */}
      <div style={{
        paddingTop:"0rem",
        padding: "1.5rem",
        paddingBottom: "1rem",
        borderBottom: "1px solid rgba(100, 100, 100, 0.1)",
        background: "var(--background)",
        boxSizing: "border-box",
        width: "100%"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "", gap: "", flexFlow:"column" }}>
            {/* <div style={{
              background: "black",
              padding: "0.75rem",
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <User color="white" width="1.5rem" />
            </div> */}
            <h2 style={{ fontSize: "1.5rem", letterSpacing: "-0.02em",  }}>{display_name}</h2>
            <div style={{fontSize:"0.8rem", marginLeft:"0.25rem"}}>{display_email}</div>
          </div>
          <button
            onClick={onDelete}
            style={{
              fontSize: "0.75rem",
              paddingLeft: "1rem",
              paddingRight: "1rem",
              height: "2rem",
              background: "rgba(220, 38, 38, 0.1)",
              // border: "1px solid rgba(220, 38, 38, 0.3)",
              borderRadius: "0.5rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "crimson"
            }}
          >
            <MinusCircle width={"1rem"} color="crimson" />
            Remove
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{
        flex: 1,
        padding: "1.5rem",
        paddingTop: "1.5rem",
        paddingBottom: "0",
        width: "100%",
        boxSizing: "border-box",
        overflowY: "auto",
        minHeight: 0
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", paddingBottom: "1.5rem" }}>
            {/* <Directive
              notName
              title={display_email}
              noArrow
              icon={<AtSign width={"1.24rem"} color="dodgerblue" />}
            /> */}
            <RoleSelect 
              value={role.toLowerCase()} 
              onChange={(newRole) => {
                setRole(newRole);
                if (newRole !== 'supervisor' && newRole !== 'site_coordinator') {
                  setSite('');
                  setProject('');
                }
              }}
            />
            <Directive
              onClick={onOpenClearanceDrawer}
              title="Module Clearance"
              icon={<KeyRound width="1.25rem" color="dodgerblue" />}
              id_subtitle={`${getEnabledModulesCount()} modules enabled`}
            />
            {(role === 'supervisor' || role === 'site_coordinator') && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}>
                <input
                  placeholder="Assigned Site"
                  value={site || ""}
                  onChange={(e) => setSite(e.target.value)}
                  style={{
                    borderRadius: "0.5rem",
                    backgroundColor: "rgba(100, 100, 100, 0.05)",
                    border: "1px solid rgba(100, 100, 100, 0.1)",
                    padding: "0.875rem 1rem",
                    color: "inherit",
                    fontSize: "1rem"
                  }}
                />
                <input
                  placeholder="Assigned Project"
                  value={project || ""}
                  onChange={(e) => setProject(e.target.value)}
                  style={{
                    borderRadius: "0.5rem",
                    backgroundColor: "rgba(100, 100, 100, 0.05)",
                    border: "1px solid rgba(100, 100, 100, 0.1)",
                    padding: "0.875rem 1rem",
                    color: "inherit",
                    fontSize: "1rem"
                  }}
                />
              </div>
            )}
            <IOMenu
              title="Editing"
              placeholder="Clearance"
              icon={<PenLine color="dodgerblue" width={"1.25rem"} />}
              value={editor == "true" ? "true" : "false"}
              onChange={setEditor}
            />
            <IOMenu
              title="Sensitive Data"
              placeholder="Sensitive Data"
              value={sensitive_data == "true" ? "true" : "false"}
              onChange={setSensitiveData}
              icon={<Eye color="dodgerblue" width={"1.25rem"} />}
            />
          </div>
        </motion.div>
      </div>

      {/* Fixed Footer with Update Button */}
      <div style={{
        padding: "1rem",
        paddingBottom: "2rem",
        background: "var(--background)",
        boxSizing: "border-box",
        borderTop: "1px solid rgba(100, 100, 100, 0.1)",
        width: "100%"
      }}>
        <motion.button
          type="button"
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          onClick={onUpdate}
          style={{
            width: "100%",
            padding: "1rem",
            borderRadius: "1rem",
            background: loading ? "rgba(100, 100, 100, 0.3)" : "black",
            color: "white",
            fontSize: "1.0625rem",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            fontWeight: "500"
          }}
        >
          {loading ? (
            <Loader2 className="animate-spin" width="1.25rem" />
          ) : (
            <span>Update</span>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default function Users() {
  const [addUserDialog, setAddUserDialog] = useState(false);
  const [fetchingData, setfetchingData] = useState(false);
  const [users, setUsers] = useState([]);
  const [userDialog, setUserDialog] = useState(false);
  const { userData: currentUserData } = useAuth();

  const [refreshCompleted, setRefreshCompleted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passconfirm, setpassconfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const [display_name, setDisplayName] = useState("");
  const [display_email, setDisplayEmail] = useState("");
  const [docid, setDocid] = useState("");
  const [deleteConfirmDiaog, setDeleteConfirmDialog] = useState(false);
  const [role, setRole] = useState("");
  const [clearance, setClearance] = useState("");
  const [editor, setEditor] = useState("");
  const [sensitive_data, setSensitiveData] = useState("");
  const [site, setSite] = useState("");
  const [project, setProject] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  
  // Clearance drawer states
  const [clearanceDrawerOpen, setClearanceDrawerOpen] = useState(false);
  const [modulePermissions, setModulePermissions] = useState<Record<string, boolean>>({});
  const [createUserClearanceDrawerOpen, setCreateUserClearanceDrawerOpen] = useState(false);
  const [createUserModulePermissions, setCreateUserModulePermissions] = useState<Record<string, boolean>>({});

  const auth = getAuth();

  // Parse module permissions from clearance string
  useEffect(() => {
    try {
      const parsed = JSON.parse(clearance || '{}');
      setModulePermissions(parsed);
    } catch {
      setModulePermissions({});
    }
  }, [clearance]);

  // Toggle module permission
  const toggleModulePermission = (moduleId: string) => {
    setModulePermissions(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Toggle module permission for create user
  const toggleCreateUserModulePermission = (moduleId: string) => {
    setCreateUserModulePermissions(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Save module permissions to clearance
  const saveClearance = () => {
    setClearance(JSON.stringify(modulePermissions));
    setClearanceDrawerOpen(false);
  };

  // Handle add user dialog close and reset form
  const handleAddUserDialogChange = (open: boolean) => {
    setAddUserDialog(open);
    if (!open) {
      // Reset form fields when dialog closes
      setName("");
      setEmail("");
      setPassword("");
      setpassconfirm("");
      setCreateUserModulePermissions({});
    }
  };

  // Detect mobile/desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Function to update local cache if the updated user is the current user
  const updateLocalCache = (email: string, updatedData: any) => {
    try {
      // Only update cache if the updated user is the current logged-in user
      if (currentUserData?.email === email) {
        const cachedUser = localStorage.getItem(CACHED_USER_KEY);
        if (cachedUser) {
          const parsedUser = JSON.parse(cachedUser);
          const updatedUser = { ...parsedUser, ...updatedData };
          localStorage.setItem(CACHED_USER_KEY, JSON.stringify(updatedUser));

          // Force a page reload to update the app state with new permissions
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Error updating local cache:", error);
    }
  };

  const createUser = async () => {
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      await addDoc(collection(db, "users"), {
        name: name,
        email: email,
        role: "profile",  // system access role
        designation: "",  // job title
        clearance: JSON.stringify(createUserModulePermissions),
        editor: "false",
        sensitive_data: "false",
        assignedSite: "",
        assignedProject: "",
      });
      message.success("User created");
      setLoading(false);
      setAddUserDialog(false);
      setCreateUserModulePermissions({});
      // Reset create user form fields
      setName("");
      setEmail("");
      setPassword("");
      setpassconfirm("");
      fetchUsers();
    } catch (error) {
      setLoading(false);
      message.error(String(error));
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const deleteUser = async () => {
    setLoading(true);
    await deleteDoc(doc(db, "users", docid));
    fetchUsers();
    setLoading(false);
    setDeleteConfirmDialog(false);
    setUserDialog(false);
  };

  const fetchUsers = async () => {
    setfetchingData(true);
    const RecordCollection = collection(db, "users");
    const recordQuery = query(RecordCollection, orderBy("role"));
    const querySnapshot = await getDocs(recordQuery);
    const fetchedData: any = [];

    querySnapshot.forEach((doc: any) => {
      fetchedData.push({ id: doc.id, ...doc.data() });
    });
    setfetchingData(false);
    setUsers(fetchedData);
    setRefreshCompleted(true);
    setTimeout(() => {
      setRefreshCompleted(false);
    }, 1000);
  };

  const updateUser = async () => {
    try {
      setLoading(true);
      const updatedData = {
        role: role,  // system access role
        clearance: clearance,
        editor: editor,
        sensitive_data: sensitive_data,
        ...(role === "supervisor" || role === "site_coordinator" ? {
          assignedSite: site,
          assignedProject: project,
        } : {
          assignedSite: "",
          assignedProject: "",
        })
      };

      await updateDoc(doc(db, "users", docid), updatedData);

      // Update local cache if the updated user is the current user
      updateLocalCache(display_email, updatedData);

      setLoading(false);
      setUserDialog(false);
      message.success("Updated User");
      fetchUsers();
    } catch (error) {
      setLoading(false);
      message.error(String(error));
    }
  };

  return (
    <div
      style={{
        padding: "1.25rem",
        // background:
        //   "linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%))",
        height: "100svh",
      }}
    >
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
        <Back
          title="Users"
          extra={
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <RefreshButton
                fetchingData={fetchingData}
                onClick={fetchUsers}
                refreshCompleted={refreshCompleted}
              />
            </div>
          }
        />

        <br />

        {users.length < 1 ? (
          <div
            style={{
              border: "",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "75svh",
              
            }}
          >
            <Loader2 className="animate-spin" style={{ color: "dodgerblue", scale: "2" }} />
          </div>
        ) : (
          <div
          className="record-list"
          
            style={{
              display: "flex",
              flexFlow: "column",
              gap: "0.5rem",
              border: "",
              height: "82svh",
              overflowY: "auto",
            }}
          >
            {users.map((user: any) => (
              <Directive
                onClick={() => {
                  setDocid(user.id);
                  setUserDialog(true);
                  setDisplayName(user.name);
                  setDisplayEmail(user.email);
                  setRole(user.role);
                  setClearance(user.clearance);
                  setSite(user.assignedSite || "");
                  setProject(user.assignedProject || "");
                  setEditor(user.editor);
                  setSensitiveData(user.sensitive_data);
                }}
                key={user.id}
                icon={
                  user.role == "admin" ? (
                    <Eye width={"1.25rem"} color="black" />
                  ) : user.role == "hr" ? (
                    <ShieldPlus width={"1.25rem"} color="black" />
                  ) : (
                    <User width={"1.25rem"} color="black" />
                  )
                }
                title={user.name}
                id_subtitle={user.email}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* User Details - Drawer for Mobile / Dialog for Desktop - Unified Layout */}
      {isMobile ? (
        <Drawer open={userDialog} onOpenChange={setUserDialog} shouldScaleBackground={false}>
          <DrawerTitle></DrawerTitle>
          <DrawerDescription></DrawerDescription>
          <DrawerContent 
            className="pb-safe" 
            style={{ 
              width: "100%", 
              maxHeight: "75vh", 
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
              padding: 0,
              margin: 0,
            }}
          >
            <UserDetailsContent
              display_name={display_name}
              display_email={display_email}
              role={role}
              setRole={setRole}
              clearance={clearance}
              setClearance={setClearance}
              site={site}
              setSite={setSite}
              project={project}
              setProject={setProject}
              editor={editor}
              setEditor={setEditor}
              sensitive_data={sensitive_data}
              setSensitiveData={setSensitiveData}
              loading={loading}
              onUpdate={updateUser}
              onDelete={() => setDeleteConfirmDialog(true)}
              isMobile={isMobile}
              onOpenClearanceDrawer={() => setClearanceDrawerOpen(true)}
            />
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={userDialog} onOpenChange={setUserDialog}>
          <DialogContent style={{ maxWidth: "500px", display: "flex", flexDirection: "column", maxHeight: "90vh", padding: 0 }}>
            <DialogTitle></DialogTitle>
            <DialogDescription></DialogDescription>
            <UserDetailsContent
              display_name={display_name}
              display_email={display_email}
              role={role}
              setRole={setRole}
              clearance={clearance}
              setClearance={setClearance}
              site={site}
              setSite={setSite}
              project={project}
              setProject={setProject}
              editor={editor}
              setEditor={setEditor}
              sensitive_data={sensitive_data}
              setSensitiveData={setSensitiveData}
              loading={loading}
              onUpdate={updateUser}
              onDelete={() => setDeleteConfirmDialog(true)}
              isMobile={isMobile}
              onOpenClearanceDrawer={() => setClearanceDrawerOpen(true)}
            />
          </DialogContent>
        </Dialog>
      )}

      <DefaultDialog
        destructive
        open={deleteConfirmDiaog}
        onCancel={() => setDeleteConfirmDialog(false)}
        title={"Delete User?"}
        OkButtonText="Delete"
        onOk={deleteUser}
        updating={loading}
        disabled={loading}
      />

      {/* Clearance Drawer for Editing User */}
      {isMobile ? (
        <Drawer open={clearanceDrawerOpen} onOpenChange={setClearanceDrawerOpen} shouldScaleBackground={false}>
          <DrawerTitle></DrawerTitle>
          <DrawerDescription></DrawerDescription>
          <DrawerContent className="pb-safe" style={{ width: "100%", maxHeight: "80vh", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", width: "100%", boxSizing: "border-box" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", textAlign:"center", border:"", justifyContent:"center" }}>
              
                <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>Module Clearance</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "50vh", overflowY: "auto" }}>
                {MODULES.map((module) => {
                  const Icon = module.icon;
                  const isEnabled = modulePermissions[module.id] || false;
                  return (
                    <motion.div
                      key={module.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleModulePermission(module.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "1rem",
                        borderRadius: "0.75rem",
                        background: isEnabled ? "rgba(100, 100, 100, 0.1)" : "rgba(100, 100, 100, 0.05)",
                        // border: isEnabled ? "1px solid rgba(30, 144, 255, 0.3)" : "1px solid rgba(100, 100, 100, 0.1)",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <Icon width="1.25rem" style={{color: isEnabled ? "inherit" : "rgba(100, 100, 100, 0.7)"}} />
                        <span style={{ fontSize: "1rem", color: isEnabled ? "inherit" : "rgba(100, 100, 100, 0.7)" }}>{module.name}</span>
                      </div>
                      <div
                        style={{
                          width: "2.5rem",
                          height: "1.5rem",
                          borderRadius: "0.75rem",
                          background: isEnabled ? "black" : "rgba(100, 100, 100, 0.2)",
                          position: "relative",
                          transition: "all 0.3s"
                        }}
                      >
                        <div
                          style={{
                            width: "1.25rem",
                            height: "1.25rem",
                            borderRadius: "50%",
                            background: "white",
                            position: "absolute",
                            top: "0.125rem",
                            left: isEnabled ? "1.125rem" : "0.125rem",
                            transition: "all 0.3s"
                          }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                onClick={saveClearance}
                style={{
                  width: "100%",
                  padding: "1rem",
                  borderRadius: "1rem",
                  background: "black",
                  color: "white",
                  fontSize: "1.0625rem",
                  border: "none",
                  cursor: "pointer",
                  marginTop: "0.5rem",
                  marginBottom: "1rem"
                }}
              >
                Save
              </motion.button>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={clearanceDrawerOpen} onOpenChange={setClearanceDrawerOpen}>
          <DialogContent style={{ maxWidth: "500px" }}>
            <DialogTitle></DialogTitle>
            <DialogDescription></DialogDescription>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <KeyRound width="1.5rem" color="dodgerblue" />
                <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>Module Clearance</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "50vh", overflowY: "auto" }}>
                {MODULES.map((module) => {
                  const Icon = module.icon;
                  const isEnabled = modulePermissions[module.id] || false;
                  return (
                    <motion.div
                      key={module.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleModulePermission(module.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "1rem",
                        borderRadius: "0.75rem",
                        background: isEnabled ? "rgba(30, 144, 255, 0.1)" : "rgba(100, 100, 100, 0.05)",
                        border: isEnabled ? "1px solid rgba(30, 144, 255, 0.3)" : "1px solid rgba(100, 100, 100, 0.1)",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <Icon width="1.25rem" color={isEnabled ? "dodgerblue" : "gray"} />
                        <span style={{ fontSize: "1rem", color: isEnabled ? "inherit" : "rgba(100, 100, 100, 0.7)" }}>{module.name}</span>
                      </div>
                      <div
                        style={{
                          width: "2.5rem",
                          height: "1.5rem",
                          borderRadius: "0.75rem",
                          background: isEnabled ? "dodgerblue" : "rgba(100, 100, 100, 0.2)",
                          position: "relative",
                          transition: "all 0.3s"
                        }}
                      >
                        <div
                          style={{
                            width: "1.25rem",
                            height: "1.25rem",
                            borderRadius: "50%",
                            background: "white",
                            position: "absolute",
                            top: "0.125rem",
                            left: isEnabled ? "1.125rem" : "0.125rem",
                            transition: "all 0.3s"
                          }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                onClick={saveClearance}
                style={{
                  width: "100%",
                  padding: "1rem",
                  borderRadius: "1rem",
                  background: "black",
                  color: "white",
                  fontSize: "1.0625rem",
                  border: "none",
                  cursor: "pointer",
                  marginTop: "0.5rem"
                }}
              >
                Save
              </motion.button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create User Dialog */}
      {isMobile ? (
        <Drawer open={addUserDialog} onOpenChange={handleAddUserDialogChange} shouldScaleBackground={false}>
          <DrawerTitle></DrawerTitle>
          <DrawerDescription></DrawerDescription>
          <DrawerContent className="pb-safe" style={{ width: "100%", maxHeight: "80vh", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", width: "100%", boxSizing: "border-box" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", justifyContent:"center", border:"" }}>
               
                <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>Add User</h2>
              </div>
              <input
                placeholder="Enter Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(100, 100, 100, 0.05)",
                  border: "1px solid rgba(100, 100, 100, 0.1)",
                  padding: "0.875rem 1rem",
                  color: "inherit",
                  fontSize: "1rem"
                }}
              />
              <input
                placeholder="Enter Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(100, 100, 100, 0.05)",
                  border: "1px solid rgba(100, 100, 100, 0.1)",
                  padding: "0.875rem 1rem",
                  color: "inherit",
                  fontSize: "1rem"
                }}
              />
              <input
                placeholder="Enter Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(100, 100, 100, 0.05)",
                  border: "1px solid rgba(100, 100, 100, 0.1)",
                  padding: "0.875rem 1rem",
                  color: "inherit",
                  fontSize: "1rem"
                }}
              />
              <input
                placeholder="Confirm Password"
                type="password"
                value={passconfirm}
                onChange={(e) => setpassconfirm(e.target.value)}
                style={{
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(100, 100, 100, 0.05)",
                  border: "1px solid rgba(100, 100, 100, 0.1)",
                  padding: "0.875rem 1rem",
                  color: "inherit",
                  fontSize: "1rem"
                }}
              />
              <Directive
                onClick={() => setCreateUserClearanceDrawerOpen(true)}
                title="Module Clearance"
                icon={<KeyRound width="1.25rem" color="dodgerblue" />}
                id_subtitle={`${Object.values(createUserModulePermissions).filter(v => v === true).length} modules enabled`}
              />
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                onClick={createUser}
                disabled={!name || !email || !passconfirm || password !== passconfirm || loading}
                style={{
                  width: "100%",
                  padding: "1rem",
                  borderRadius: "1rem",
                  background: (!name || !email || !passconfirm || password !== passconfirm || loading) ? "rgba(100, 100, 100, 0.3)" : "black",
                  color: "white",
                  fontSize: "1.0625rem",
                  border: "none",
                  cursor: (!name || !email || !passconfirm || password !== passconfirm || loading) ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  marginTop: "0.5rem"
                }}
              >
                {loading ? <Loader2 className="animate-spin" width="1.25rem" /> : <span>Add</span>}
              </motion.button>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={addUserDialog} onOpenChange={handleAddUserDialogChange}>
          <DialogContent style={{ maxWidth: "500px" }}>
            <DialogTitle></DialogTitle>
            <DialogDescription></DialogDescription>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <UserPlus width="1.5rem" color="dodgerblue" />
                <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>Add User</h2>
              </div>
              <input
                placeholder="Enter Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(100, 100, 100, 0.05)",
                  border: "1px solid rgba(100, 100, 100, 0.1)",
                  padding: "0.875rem 1rem",
                  color: "inherit",
                  fontSize: "1rem"
                }}
              />
              <input
                placeholder="Enter Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(100, 100, 100, 0.05)",
                  border: "1px solid rgba(100, 100, 100, 0.1)",
                  padding: "0.875rem 1rem",
                  color: "inherit",
                  fontSize: "1rem"
                }}
              />
              <input
                placeholder="Enter Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(100, 100, 100, 0.05)",
                  border: "1px solid rgba(100, 100, 100, 0.1)",
                  padding: "0.875rem 1rem",
                  color: "inherit",
                  fontSize: "1rem"
                }}
              />
              <input
                placeholder="Confirm Password"
                type="password"
                value={passconfirm}
                onChange={(e) => setpassconfirm(e.target.value)}
                style={{
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(100, 100, 100, 0.05)",
                  border: "1px solid rgba(100, 100, 100, 0.1)",
                  padding: "0.875rem 1rem",
                  color: "inherit",
                  fontSize: "1rem"
                }}
              />
              <Directive
                onClick={() => setCreateUserClearanceDrawerOpen(true)}
                title="Module Clearance"
                icon={<KeyRound width="1.25rem" color="dodgerblue" />}
                id_subtitle={`${Object.values(createUserModulePermissions).filter(v => v === true).length} modules enabled`}
              />
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                onClick={createUser}
                disabled={!name || !email || !passconfirm || password !== passconfirm || loading}
                style={{
                  width: "100%",
                  padding: "1rem",
                  borderRadius: "1rem",
                  background: (!name || !email || !passconfirm || password !== passconfirm || loading) ? "rgba(100, 100, 100, 0.3)" : "black",
                  color: "white",
                  fontSize: "1.0625rem",
                  border: "none",
                  cursor: (!name || !email || !passconfirm || password !== passconfirm || loading) ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  marginTop: "0.5rem"
                }}
              >
                {loading ? <Loader2 className="animate-spin" width="1.25rem" /> : <span>Add</span>}
              </motion.button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Clearance Drawer for Create User */}
      {isMobile ? (
        <Drawer open={createUserClearanceDrawerOpen} onOpenChange={setCreateUserClearanceDrawerOpen} shouldScaleBackground={false}>
          <DrawerTitle></DrawerTitle>
          <DrawerDescription></DrawerDescription>
          <DrawerContent className="pb-safe" style={{ width: "100%", maxHeight: "75vh", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", width: "100%", boxSizing: "border-box" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <KeyRound width="1.5rem" color="dodgerblue" />
                <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>Module Clearance</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "50vh", overflowY: "auto" }}>
                {MODULES.map((module) => {
                  const Icon = module.icon;
                  const isEnabled = createUserModulePermissions[module.id] || false;
                  return (
                    <motion.div
                      key={module.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleCreateUserModulePermission(module.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "1rem",
                        borderRadius: "0.75rem",
                        background: isEnabled ? "rgba(30, 144, 255, 0.1)" : "rgba(100, 100, 100, 0.05)",
                        border: isEnabled ? "1px solid rgba(30, 144, 255, 0.3)" : "1px solid rgba(100, 100, 100, 0.1)",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <Icon width="1.25rem" color={isEnabled ? "dodgerblue" : "gray"} />
                        <span style={{ fontSize: "1rem", color: isEnabled ? "inherit" : "rgba(100, 100, 100, 0.7)" }}>{module.name}</span>
                      </div>
                      <div
                        style={{
                          width: "2.5rem",
                          height: "1.5rem",
                          borderRadius: "0.75rem",
                          background: isEnabled ? "dodgerblue" : "rgba(100, 100, 100, 0.2)",
                          position: "relative",
                          transition: "all 0.3s"
                        }}
                      >
                        <div
                          style={{
                            width: "1.25rem",
                            height: "1.25rem",
                            borderRadius: "50%",
                            background: "white",
                            position: "absolute",
                            top: "0.125rem",
                            left: isEnabled ? "1.125rem" : "0.125rem",
                            transition: "all 0.3s"
                          }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => setCreateUserClearanceDrawerOpen(false)}
                style={{
                  width: "100%",
                  padding: "1rem",
                  borderRadius: "1rem",
                  background: "black",
                  color: "white",
                  fontSize: "1.0625rem",
                  border: "none",
                  cursor: "pointer",
                  marginTop: "0.5rem"
                }}
              >
                Save
              </motion.button>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={createUserClearanceDrawerOpen} onOpenChange={setCreateUserClearanceDrawerOpen}>
          <DialogContent style={{ maxWidth: "500px" }}>
            <DialogTitle></DialogTitle>
            <DialogDescription></DialogDescription>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <KeyRound width="1.5rem" color="dodgerblue" />
                <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>Module Clearance</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "50vh", overflowY: "auto" }}>
                {MODULES.map((module) => {
                  const Icon = module.icon;
                  const isEnabled = createUserModulePermissions[module.id] || false;
                  return (
                    <motion.div
                      key={module.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleCreateUserModulePermission(module.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "1rem",
                        borderRadius: "0.75rem",
                        background: isEnabled ? "rgba(30, 144, 255, 0.1)" : "rgba(100, 100, 100, 0.05)",
                        border: isEnabled ? "1px solid rgba(30, 144, 255, 0.3)" : "1px solid rgba(100, 100, 100, 0.1)",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <Icon width="1.25rem" color={isEnabled ? "dodgerblue" : "gray"} />
                        <span style={{ fontSize: "1rem", color: isEnabled ? "inherit" : "rgba(100, 100, 100, 0.7)" }}>{module.name}</span>
                      </div>
                      <div
                        style={{
                          width: "2.5rem",
                          height: "1.5rem",
                          borderRadius: "0.75rem",
                          background: isEnabled ? "dodgerblue" : "rgba(100, 100, 100, 0.2)",
                          position: "relative",
                          transition: "all 0.3s"
                        }}
                      >
                        <div
                          style={{
                            width: "1.25rem",
                            height: "1.25rem",
                            borderRadius: "50%",
                            background: "white",
                            position: "absolute",
                            top: "0.125rem",
                            left: isEnabled ? "1.125rem" : "0.125rem",
                            transition: "all 0.3s"
                          }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => setCreateUserClearanceDrawerOpen(false)}
                style={{
                  width: "100%",
                  padding: "1rem",
                  borderRadius: "1rem",
                  background: "black",
                  color: "white",
                  fontSize: "1.0625rem",
                  border: "none",
                  cursor: "pointer",
                  marginTop: "0.5rem"
                }}
              >
                Save
              </motion.button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Floating Add User Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => setAddUserDialog(true)}
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          width: "3.5rem",
          height: "3.5rem",
          borderRadius: "0.5rem",
          background: "black",
          color: "white",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
         
          
        }}
      >
        <Plus width="1.5rem" />
      </motion.button>
    </div>
  );
}
