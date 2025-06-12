import { motion } from "framer-motion";
import { ChevronRight, PenLine, Users } from "lucide-react";

interface Props {
  date?: string;
  designation?: string;
  experience?: string;
  desc?: string;
  mailto?: string;
}

export default function Work(props: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
        opacity: { duration: 0.6 },
        y: { duration: 0.4 },
      }}
      viewport={{ once: true }}
      className="work-card"
      style={{
        width: "32ch",
        borderRadius: "0.75rem",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div
        style={{
          background: "linear-gradient(120deg, #002244, midnightblue)",
          padding: "",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            border: "",
            display: "flex",
            justifyContent: "flex-end",
            padding: "1rem",
          }}
        >
          <button style={{ marginBottom: "" }}>
            <PenLine />
          </button>
        </div>

        <div style={{ padding: "2rem", paddingTop: 0 }}>
          <div style={{ marginBottom: "1.75rem" }}>
            <p
              style={{
                fontSize: "0.75rem",
                fontWeight: "800",
                color: "white",
                background: "rgba(220,20,60)",
                padding: "0.25rem 0.75rem",
                borderRadius: "1rem",
                width: "fit-content",
                marginBottom: "1rem",
              }}
            >
              FULL TIME
            </p>

            <p
              style={{
                fontSize: "1.35rem",
                fontWeight: "500",
                color: "white",
                lineHeight: "1.3",
                marginBottom: "0.75rem",
              }}
            >
              {props.designation}
            </p>

            <p style={{ fontSize: "0.8rem", opacity: 0.5 }}>
              Posted on {props.date}
            </p>
          </div>

          <p
            style={{
              fontSize: "0.85rem",
              opacity: 0.7,
              lineHeight: "1.6",
            }}
          >
            {props.desc}
          </p>
        </div>

        <div
          style={{
            padding: "1.25rem 2rem",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              justifyContent: "space-between",
            }}
          >
            <Users width="1rem" color="crimson" />
            <div></div>
            <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
              <b>0</b> Applicants
            </p>
            <ChevronRight width={"1rem"} />
          </div>

          {/* <a href={`mailto:${props.mailto}`}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: "crimson",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              border: "none",
              cursor: "pointer",
              color: "white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            <Mail width="1rem" />
            Apply
          </motion.button>
        </a> */}
        </div>
      </div>
    </motion.div>
  );
}
