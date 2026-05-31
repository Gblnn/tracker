import { motion } from "framer-motion";

interface GridTileProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  onClick: () => void;
  badge?: number;
}
export default function GridTile({ title, description, icon, onClick, badge }: GridTileProps) {
  return (
    <motion.button
      type="button"
     
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "0.7rem",
        width: "100%",
        minHeight: "4.3rem",
        padding: "0.62rem 0.7rem",
        background: "rgba(246 248 252 / 0.78)",
        border: "1px solid rgba(255,255,255,0.65)",
        borderRadius: "0.88rem",
        // boxShadow: "0 6px 14px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        cursor: "pointer",
        transition: "transform 0.16s ease-out, box-shadow 0.16s ease-out, border-color 0.16s ease-out",
        color: "#1f2937",
        textAlign: "left",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "0.05rem",
          borderRadius: "0.82rem",
          pointerEvents: "none",
          background: "linear-gradient(165deg, rgba(255,255,255,0.34) 0%, rgba(220,230,245,0.14) 45%, rgba(255,255,255,0) 100%)",
        }}
      />
      <div
        style={{
          width: "2.5rem",
          height: "2.5rem",
          borderRadius: "0.72rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          color: "darkblue",
          flexShrink: 0,
          transition: "all 220ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          position: "relative",
          overflow: "visible",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 10px rgba(15, 23, 42, 0.08)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "0.05rem",
            borderRadius: "0.66rem",
            pointerEvents: "none",
            background:
              "linear-gradient(165deg, rgba(255,255,255,0.68) 0%, rgba(230,236,248,0.32) 52%, rgba(255,255,255,0) 100%)",
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
            transform: "scale(0.85)",
          }}
        >
          {icon}
        </div>
        {badge && badge > 0 && (
          <div style={{ position: 'absolute', top: -6, right: -6, background: 'crimson', color: 'white', borderRadius: 999, padding: '0.12rem 0.45rem', fontSize: "0.75rem", fontWeight: 500, minWidth: 18, textAlign: 'center', zIndex: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>{badge > 99 ? '99+' : badge > 0 ? badge : ""}</div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1, gap: "0.2rem" }}>
        <p
          style={{
            margin: 0,
            fontSize: "0.9rem",
            fontWeight: 500,
            letterSpacing: "0.01em",
            lineHeight: 1.1,
            color: "rgba(17, 24, 39, 0.96)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            position: "relative",
            zIndex: 1,
          }}
        >
          {title}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "0.7rem",
            fontWeight: 500,
            lineHeight: 1.2,
            color: "rgba(75, 85, 99, 0.82)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            position: "relative",
            zIndex: 1,
          }}
        >
          {description || "Open module"}
        </p>
      </div>
      
    </motion.button>
  );
}
