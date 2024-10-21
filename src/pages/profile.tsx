import Back from "@/components/back";
import InputDialog from "@/components/input-dialog";
import LazyLoader from "@/components/lazy-loader";
import { db } from "@/firebase";
import { LoadingOutlined } from "@ant-design/icons";
import { collection, getDocs, query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

export default function Profile() {
  const [addUserDialog, setAddUserDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const RecordCollection = collection(db, "users");
    const recordQuery = query(
      RecordCollection,
      where("email", "==", window.name)
    );
    const querySnapshot = await getDocs(recordQuery);
    setLoading(false);
    const fetchedData: any = [];

    querySnapshot.forEach((doc: any) => {
      fetchedData.push({ id: doc.id, ...doc.data() });
    });
    setName(fetchedData[0].name);
    setRole(fetchedData[0].role);
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
          title="Profile"
          extra={
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {/* <button style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
                v2.0
              </button> */}
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
            <div
              style={{
                display: "flex",
                flexFlow: "row",
                gap: "0.5rem",
                border: "",
                borderBottom: "1px solid rgba(100 100 100/ 50%)",
                paddingBottom: "1.5rem",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  border: "",
                  width: "fit-content",
                  alignItems: "center",
                }}
              >
                <LazyLoader
                  gradient
                  block
                  name={name}
                  width="5rem"
                  height="5rem"
                  fontSize="2rem"
                />
                <div style={{ border: "" }}>
                  <p
                    style={{
                      fontWeight: "600",
                      fontSize: "1.5rem",
                      lineHeight: "1.25rem",
                    }}
                  >
                    {name}
                  </p>
                  <p style={{ fontSize: "0.8rem", lineHeight: "2rem" }}>
                    {window.name}
                  </p>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      background: "white",
                      width: "fit-content",
                      paddingLeft: "0.35rem",
                      paddingRight: "0.35rem",
                      borderRadius: "0.5rem",
                      color: "black",
                      fontWeight: 600,
                    }}
                  >
                    {role}
                  </p>
                </div>
              </div>
              <button
                style={{
                  paddingLeft: "1rem",
                  paddingRight: "1rem",
                  marginRight: "1rem",
                  fontSize: "0.8rem",
                }}
              >
                Edit
              </button>

              {/* <Directive
            title="Users"
            icon={<Users width={"1.1rem"} color="dodgerblue" />}
            onClick={() => setAddUserDialog(true)}
            to={"/users"}
          />

          <Directive
            title="Access Requests"
            icon={<GitPullRequestArrow width={"1.1rem"} color="dodgerblue" />}
            onClick={() => setAddUserDialog(true)}
            to={"/access-requests"}
          /> */}
            </div>
          </motion.div>
        )}
      </motion.div>

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
