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
        gap: "0.75rem",
        padding: "1.5rem",
        background: "rgba(100 100 100/ 0.05)",
        borderRadius: "0.5rem",
        cursor: "pointer",
        transition: "all 0.2s ease",
        aspectRatio: "1"
      }}
      
    >
      {icon}
      <p style={{ fontSize: "0.85rem", fontWeight: 500, textAlign: "center", opacity: 0.85 }}>
        {title}
      </p>
    </motion.div>
  );
}
