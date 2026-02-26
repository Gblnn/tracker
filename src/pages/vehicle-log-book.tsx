import Back from "@/components/back";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

export default function VehicleLogBook() {
  return (
    <div style={{ height: "100svh" }}>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
        <Back
          fixed
          blurBG
          title="Vehicle Log Book"
          icon={<BookOpen color="orange" width="1.75rem" />}
        />
        
        <div style={{ 
          padding: "1.25rem", 
          paddingTop: "5rem",
          paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" 
        }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "70vh",
            gap: "1rem",
            opacity: 0.5
          }}>
            <BookOpen size={48} color="orange" />
            <p style={{ fontSize: "1.125rem", fontWeight: 500 }}>
              Vehicle Log Book
            </p>
            <p style={{ fontSize: "0.875rem", opacity: 0.7 }}>
              Feature coming soon
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
