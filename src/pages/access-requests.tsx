import Back from "@/components/back";
import InputDialog from "@/components/input-dialog";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { useState } from "react";

export default function AccessRequests() {
  const [addUserDialog, setAddUserDialog] = useState(false);

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
          title="Access Requests"
          extra={
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {/* <button style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
                v2.0
              </button> */}
            </div>
          }
        />

        <br />

        <div style={{ display: "flex", flexFlow: "column", gap: "0.5rem" }}>
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
