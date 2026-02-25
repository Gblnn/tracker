import Back from "@/components/back";
import { motion } from "framer-motion";
import { Car } from "lucide-react";

export default function VehicleMaster() {
//   const { userData } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      style={{
        padding: "1.25rem",
        minHeight: "100svh",
      }}
    >
      <Back
        title="Vehicle Master"
        
      />

      <div style={{ height: "2rem" }} />

      {/* Content goes here */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "70vh",
          opacity: 0.5,
        }}
      >
        <Car width="3rem" height="3rem" />
        <p style={{ marginTop: "1rem" }}>Vehicle Master - Coming Soon</p>
      </div>
    </motion.div>
  );
}
