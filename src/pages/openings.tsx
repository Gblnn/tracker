import Back from "@/components/back";
import InputDialog from "@/components/input-dialog";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { useState } from "react";

export default function Openings() {
  const [addDialog, setAddDialog] = useState(false);

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
          title="Openings"
          extra={
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {/* <button style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
                v2.0
              </button> */}
            </div>
          }
        />

        <br />

        <div
          style={{ display: "flex", flexFlow: "column", gap: "0.5rem" }}
        ></div>
      </motion.div>

      <InputDialog
        titleIcon={<UserPlus color="dodgerblue" />}
        open={addDialog}
        title={"Add User"}
        OkButtonText="Add"
        inputplaceholder="Enter Email"
        input2placeholder="Enter Password"
        input3placeholder="Confirm Password"
        onCancel={() => setAddDialog(false)}
      />
    </div>
  );
}
