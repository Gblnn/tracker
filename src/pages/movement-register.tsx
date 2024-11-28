import AddRecordButton from "@/components/add-record-button";
import Back from "@/components/back";
import ClearanceMenu from "@/components/clearance-menu";
import Directive from "@/components/directive";
import IOMenu from "@/components/editorMenu";
import InputDialog from "@/components/input-dialog";
import RefreshButton from "@/components/refresh-button";
import SelectMenu from "@/components/select-menu";
import DefaultDialog from "@/components/ui/default-dialog";
import { db } from "@/firebase";
import { message } from "antd";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
} from "firebase/firestore";
import { motion } from "framer-motion";
import {
  ArrowUpDown,
  AtSign,
  Eye,
  LoaderCircle,
  MinusCircle,
  PenLine,
  Plus,
  User,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function MovementRegister() {
  const [addUserDialog, setAddUserDialog] = useState(false);
  const [fetchingData, setfetchingData] = useState(false);
  const [users, setUsers] = useState([]);
  const [userDialog, setUserDialog] = useState(false);
  const [AddRecordDialog, setAddRecordDialog] = useState(false);

  const [refreshCompleted, setRefreshCompleted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passconfirm, setpassconfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const [display_name, setDisplayName] = useState("");
  const [display_email, setDisplayEmail] = useState("");
  // const [role, setRole] = useState("");
  const [docid, setDocid] = useState("");
  const [deleteConfirmDiaog, setDeleteConfirmDialog] = useState(false);
  const [role, setRole] = useState("");
  const [clearance, setClearance] = useState("");
  const [editor, setEditor] = useState("");
  const [sensitive_data, setSensitiveData] = useState("");

  const auth = getAuth();

  const createUser = async () => {
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      await addDoc(collection(db, "users"), {
        name: name,
        email: email,
        role: "user",
        clearance: "Sohar Star United",
        editor: "false",
        sensitive_data: "false",
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

  // const [email, setEmail] = useState("")
  // const [password, setPassword] = useState("")

  // const Authenticate = () => {

  // }

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
    const RecordCollection = collection(db, "movement");
    const recordQuery = query(RecordCollection);
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
      await updateDoc(doc(db, "users", docid), {
        role: role,
        clearance: clearance,
        editor: editor,
        sensitive_data: sensitive_data,
      });
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
        background:
          "linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%))",
        height: "100svh",
      }}
    >
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
        <Back
          icon={<ArrowUpDown color="dodgerblue" />}
          title="Movement"
          extra={
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {/* <button
                style={{
                  fontSize: "0.8rem",
                  paddingLeft: "1rem",
                  paddingRight: "1rem",
                }}
                onClick={() => setAddUserDialog(true)}
              >
                <UserPlus width={"1rem"} color="dodgerblue" />
              </button> */}

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
            {fetchingData ? (
              //   <LoadingOutlined style={{ color: "dodgerblue", scale: "2" }} />
              <LoaderCircle
                color="dodgerblue"
                className="animate-spin"
                style={{ width: "3rem", height: "3rem" }}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.5 }}
                style={{
                  display: "flex",
                  flexFlow: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  opacity: 0.5,
                }}
              >
                <p>No Entries Found</p>
                <p style={{ fontSize: "0.75rem" }}>Tap + to add a Record</p>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            style={{
              display: "flex",
              flexFlow: "column",
              gap: "0.5rem",
              border: "",
              height: "82svh",
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
                  setEditor(user.editor);
                  setSensitiveData(user.sensitive_data);
                }}
                key={user.id}
                icon={
                  user.role == "admin" ? (
                    <Eye width={"1.25rem"} color="dodgerblue" />
                  ) : (
                    <User width={"1.25rem"} color="dodgerblue" />
                  )
                }
                title={user.name}
                id_subtitle={user.email}
              />
            ))}
          </motion.div>
        )}
      </motion.div>

      <InputDialog
        titleIcon={<UserPlus color="dodgerblue" />}
        title="Add Movement"
        open={AddRecordDialog}
        onCancel={() => setAddRecordDialog(false)}
        OkButtonText="Add"
      />

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
            <SelectMenu value={role.toLowerCase()} onChange={setRole} />
            <ClearanceMenu
              value={clearance ? clearance : "Undefined"}
              onChange={setClearance}
            />
            <IOMenu
              placeholder="Clearance"
              icon={<PenLine color="dodgerblue" width={"1.25rem"} />}
              value={editor == "true" ? "true" : "false"}
              onChange={setEditor}
            />
            <IOMenu
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

      <AddRecordButton
        icon={<Plus color="dodgerblue" />}
        onClick={() => setAddRecordDialog(true)}
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
