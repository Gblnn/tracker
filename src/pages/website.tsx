import Back from "@/components/back";
import Directive from "@/components/directive";
import InputDialog from "@/components/input-dialog";
import { motion } from "framer-motion";
import { Newspaper, UserPlus, Users } from "lucide-react";
import { useState } from "react";

export default function Website() {
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
          title="Website"
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
          <Directive title={"Openings"} icon={<Users width={"1.25rem"} />} />
          <Directive
            notName
            icon={<Newspaper color="dodgerblue" width={"1.25rem"} />}
            title={"Latest News & Updates"}
          />
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
