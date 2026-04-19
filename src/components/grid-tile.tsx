import { motion } from "framer-motion";

interface GridTileProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}

// Light blue tint

export default function GridTile({ title, icon, onClick }: GridTileProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "0.6rem",
        width: "100%",
        padding: "0.5rem 0.4rem",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        transition: "transform 0.12s ease-out",
        color: "#374151",
      }}
    >
      <div
        style={{
          width: "4.25rem",
          height: "4.25rem",
          borderRadius: "1.2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(100 100 100 / 0.05)",
          boxShadow: "none",
          
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "inherit",
          }}
        >
          {icon}
        </div>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: "0.8rem",
          fontWeight: 500,
          textAlign: "center",
          lineHeight: 1.25,
          opacity: 0.9,
          maxWidth: "6.5rem",
          textWrap: "balance",
        }}
      >
        {title}
      </p>
    </motion.button>
  );
}
