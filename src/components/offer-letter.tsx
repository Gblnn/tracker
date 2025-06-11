import { Plus } from "lucide-react";
import AddRecordButton from "./add-record-button";

export default function OfferLetter() {
  return (
    <>
      <div
        style={{
          width: "32ch",
          borderRadius: "0.5rem",
          border: "1px solid rgba(100 100 100/ 50%)",
          padding: "0.75rem",
        }}
      >
        OfferLetter
      </div>
      <AddRecordButton icon={<Plus />} />
    </>
  );
}
