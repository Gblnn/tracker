import { motion } from "framer-motion";

interface GridTileProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export default function GridTile({ title, icon, onClick }: GridTileProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      style={{
        
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "1.5rem",
        background: "rgba(250 250 250/ 0.35)",
        boxShadow:"1px 1px 5px rgba(0,0,0,0.15)",
        // background:"linear-gradient(darkslateblue, midnightblue)",
        borderRadius: "0.5rem",
        cursor: "pointer",
        transition: "all 0.2s ease",
        aspectRatio: "1",
        backdropFilter:"blur(16px)",
        WebkitBackdropFilter:"blur(16px)",
        // color:"white"
        color:"darkslategray"
      }}
      
    >
      {icon}
      <p style={{fontSize: "0.85rem", fontWeight: 500, textAlign: "center", opacity: 0.85}}>
        {title}
      </p>
    </motion.div>
  );
}
