import { Layers } from "lucide-react";
import Back from "./back";
import RefreshButton from "./refresh-button";

export default function RecordPage() {
  return (
    <>
      <div style={{ padding: "1.25rem" }}>
        <Back
          title={""}
          extra={
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                style={{
                  paddingLeft: "1rem",
                  paddingRight: "1rem",
                  fontSize: "0.8rem",
                  alignItems: "center",
                  display: "flex",
                }}
              >
                <Layers color="dodgerblue" width={"1.1rem"} />
                Category
              </button>
              <RefreshButton />
            </div>
          }
        />
      </div>
    </>
  );
}
