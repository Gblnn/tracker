import AddRecordButton from "@/components/add-record-button";
import Back from "@/components/back";
import Directive from "@/components/directive";
import InputDialog from "@/components/input-dialog";
import SearchBox from "@/components/searchbar";
import { motion } from "framer-motion";
import { Hash, Plus } from "lucide-react";
import { useState } from "react";

export default function LPO() {
  const [createProjectDialog, setCreateProjectDialog] = useState(false);

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
          title="LPOs"
          extra={<div style={{ display: "flex", gap: "0.5rem" }}></div>}
        />

        <br />

        <SearchBox />

        <br />

        <div style={{ display: "flex", flexFlow: "column", gap: "0.5rem" }}>
          <Directive
            icon={<Hash width={"1.25rem"} color="dodgerblue" />}
            title={"CD 180"}
          />
          <Directive
            icon={<Hash width={"1.25rem"} color="dodgerblue" />}
            title={"CD 175"}
          />
        </div>

        <AddRecordButton icon={<Plus color="dodgerblue" />} />
      </motion.div>

      <InputDialog
        open={createProjectDialog}
        onCancel={() => setCreateProjectDialog(false)}
      />
    </div>
  );
}
