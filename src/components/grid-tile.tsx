import { motion } from "framer-motion";

interface GridTileProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export default function GridTile({ title, icon, onClick }: GridTileProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "0.6rem",
        width: "100%",
        padding: "0.35rem 0.4rem",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        transition: "transform 0.12s ease-out",
        color: "#374151",
      }}
    >
      <div
        style={{
          width: "4rem",
          height: "4rem",
          borderRadius: "1.1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(250 250 250)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          // border: "1px solid rgba(186, 218, 255, 0.5)",
          // boxShadow: "0 8px 16px rgba(20, 60, 180, 0.25), inset 0 1px 3px rgba(255, 255, 255, 0.7)",
          color: "darkblue",
          transition: "all 240ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          position: "relative",
          overflow: "hidden",
          transform: "translateY(-2px)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "0.05rem",
            borderRadius: "1rem",
            pointerEvents: "none",
            background: "linear-gradient(165deg, rgba(255,255,255,0.5) 0%, rgba(200,230,255,0.2) 50%, rgba(255,255,255,0) 100%)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "inherit",
            position: "relative",
            zIndex: 1,
          }}
        >
          {icon}
        </div>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: "0.72rem",
          fontWeight: 500,
          textAlign: "center",
          lineHeight: 1.25,
          opacity: 0.9,
          maxWidth: "6.5rem",
          textWrap: "balance",
          transition: "opacity 240ms ease",
        }}
      >
        {title}
      </p>
    </motion.button>
  );
}
