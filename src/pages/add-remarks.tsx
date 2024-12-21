import AddRecordButton from "@/components/add-record-button";
import Back from "@/components/back";
import InputDialog from "@/components/input-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";
import { Download, PenLine, PenSquare, Upload, UserPlus } from "lucide-react";
import { useState } from "react";

export default function AddRemarks() {
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
          title="Annotate"
          icon={<PenSquare color="dodgerblue" />}
          extra={
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                style={{
                  paddingLeft: "1rem",
                  paddingRight: "1rem",
                  fontSize: "0.8rem",
                }}
              >
                <Download width={"1rem"} color="dodgerblue" />
                Export
              </button>
            </div>
          }
        />

        <br />

        <div style={{ display: "flex", flexFlow: "column", gap: "0.5rem" }}>
          <Table>
            <TableHeader>
              <TableRow style={{ position: "sticky", fontWeight: "600" }}>
                <TableHead>Annotate</TableHead>
                <TableHead>uio</TableHead>
                <TableHead>uio</TableHead>
                <TableHead>uio</TableHead>
                <TableHead>uio</TableHead>
                <TableHead>jkl</TableHead>
                <TableHead>uio</TableHead>
                <TableHead>uio</TableHead>
                <TableHead>uio</TableHead>
                <TableHead>uio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <button
                    style={{
                      fontSize: "0.7rem",
                      height: "1.75rem",
                      width: "4.5rem",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <PenLine color="dodgerblue" width={"0.8rem"} />
                    Add
                  </button>
                </TableCell>
                <TableCell>hjk</TableCell>
                <TableCell>hjk</TableCell>
                <TableCell>hjk</TableCell>
                <TableCell>hjk</TableCell>
                <TableCell>hjk</TableCell>
                <TableCell>hjk</TableCell>
                <TableCell>hjk</TableCell>
                <TableCell>hjk</TableCell>
                <TableCell>hjk</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <button
                    style={{
                      fontSize: "0.7rem",
                      height: "1.75rem",
                      width: "4.5rem",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <PenLine color="dodgerblue" width={"0.8rem"} />
                    Add
                  </button>
                </TableCell>
                <TableCell>hjk</TableCell>
                <TableCell>hjk</TableCell>
                <TableCell>hjk</TableCell>
                <TableCell>hjk</TableCell>
                <TableCell>hjk</TableCell>
                <TableCell>hjk</TableCell>
                <TableCell>hjk</TableCell>
                <TableCell>hjk</TableCell>
                <TableCell>hjk</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </motion.div>

      <AddRecordButton icon={<Upload color="dodgerblue" />} />

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
