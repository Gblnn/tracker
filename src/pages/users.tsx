import Back from "@/components/back";
import { useAuth } from "@/components/AuthProvider";
import ClearanceMenu from "@/components/clearance-menu";
import Directive from "@/components/directive";
import IOMenu from "@/components/editorMenu";
import InputDialog from "@/components/input-dialog";
import RefreshButton from "@/components/refresh-button";
import RoleSelect from "@/components/role-select";
import DefaultDialog from "@/components/ui/default-dialog";
import { db } from "@/firebase";
import { LoadingOutlined } from "@ant-design/icons";
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
  AtSign,
  Eye,
  MinusCircle,
  PenLine,
  ShieldPlus,
  User,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";

// Constants for localStorage keys
const CACHED_USER_KEY = "cached_user_data";

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

  const auth = getAuth();

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
        role: "",  // job role will be set later
        system_role: "user", // default system role
        clearance: "Sohar Star United",
        editor: "false",
        sensitive_data: "false",
        assignedSite: "",
        assignedProject: "",
      });
      message.success("User created");
      setLoading(false);
      setAddUserDialog(false);
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
        role: role,
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
              <button
                style={{
                  fontSize: "0.8rem",
                  paddingLeft: "1rem",
                  paddingRight: "1rem",
                }}
                onClick={() => setAddUserDialog(true)}
              >
                <UserPlus width={"1rem"} color="dodgerblue" />
              </button>
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
            <LoadingOutlined style={{ color: "dodgerblue", scale: "2" }} />
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
                    <Eye width={"1.25rem"} color="dodgerblue" />
                  ) : user.role == "hr" ? (
                    <ShieldPlus width={"1.25rem"} color="dodgerblue" />
                  ) : (
                    <User width={"1.25rem"} color="dodgerblue" />
                  )
                }
                title={user.name}
                id_subtitle={user.email}
              />
            ))}
          </div>
        )}
      </motion.div>

      <DefaultDialog
        title={display_name}
        titleIcon={<User color="dodgerblue" />}
        codeIcon={<AtSign color="dodgerblue" width={"1rem"} />}
        open={userDialog}
        OkButtonText="Update"
        onCancel={() => setUserDialog(false)}
        onOk={updateUser}
        updating={loading}
        extra={
          <div
            style={{
              width: "100%",
              display: "flex",
              flexFlow: "column",
              gap: "0.5rem",
            }}
          >
            <Directive
              notName
              title={display_email}
              noArrow
              icon={<AtSign width={"1.24rem"} color="dodgerblue" />}
            />
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
            <ClearanceMenu
              value={clearance ? clearance : "Undefined"}
              onChange={setClearance}
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
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "none",
                    padding: "0.75rem",
                    color: "inherit",
                    fontSize: "0.85rem"
                  }}
                />
                <input
                  placeholder="Assigned Project"
                  value={project || ""}
                  onChange={(e) => setProject(e.target.value)}
                  style={{
                    borderRadius: "0.5rem",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "none",
                    padding: "0.75rem",
                    color: "inherit",
                    fontSize: "0.85rem"
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
        }
        title_extra={
          <div>
            <button
              onClick={() => setDeleteConfirmDialog(true)}
              style={{
                fontSize: "0.75rem",
                paddingLeft: "1rem",
                paddingRight: "1rem",
                height: "2rem",
              }}
            >
              <MinusCircle width={"1rem"} color="crimson" />
              Remove
            </button>
          </div>
        }
      />

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

      <InputDialog
        titleIcon={<UserPlus color="dodgerblue" />}
        open={addUserDialog}
        title={"Add User"}
        OkButtonText="Add"
        inputplaceholder="Enter Name"
        input2placeholder="Enter Email"
        input3placeholder="Enter Password"
        input4placeholder="Confirm Password"
        onCancel={() => setAddUserDialog(false)}
        inputOnChange={(e: any) => setName(e.target.value)}
        input2OnChange={(e: any) => setEmail(e.target.value)}
        input3OnChange={(e: any) => setPassword(e.target.value)}
        input4OnChange={(e: any) => setpassconfirm(e.target.value)}
        disabled={!name || !email || !passconfirm || password != passconfirm}
        onOk={createUser}
        updating={loading}
      />
    </div>
  );
}
