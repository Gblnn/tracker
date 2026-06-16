import moment from "moment";
import { Check, ExternalLink, UserMinus } from "lucide-react";
import { memo } from "react";

export interface ApplicationCardData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  jobTitle?: string;
  created_at?: any;
  cv?: string;
  cvLink?: string;
  designation?: string;
}

interface ApplicationCardProps {
  app: ApplicationCardData;
  shortlisted: boolean;
  shortlisting: boolean;
  declining: boolean;
  onShortlist: (app: ApplicationCardData) => void;
  onDecline: (app: ApplicationCardData) => void;
  showShortlistAction?: boolean;
  secondaryActionLabel?: string;
}

function ApplicationCardBase({
  app,
  shortlisted,
  shortlisting,
  declining,
  onShortlist,
  onDecline,
  showShortlistAction = true,
  secondaryActionLabel = "Decline",
}: ApplicationCardProps) {
  const cvUrl = app.cvLink || app.cv;

  return (
    <div
      style={{
        border: "1px solid rgba(100,100,100,0.12)",
        borderRadius: "0.9rem",
        padding: "1rem",
        display: "grid",
        gap: "0.65rem",
        background: "rgba(255,255,255,0.5)",
      }}
    >
      {/* Name + role */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {app.name}
          </div>
          <div style={{ fontSize: "0.76rem", opacity: 0.58, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "0.15rem" }}>
            {app.jobTitle || "Unknown Role"}
          </div>
          {
            app.designation &&
            <div style={{ fontSize: "0.76rem", opacity: 0.58, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "0.15rem" }}>
            {app.designation || "Not Specified"}
          </div>
          }
          
        </div>
        {shortlisted && (
          <span style={{ flexShrink: 0, fontSize: "0.65rem", fontWeight: 600, padding: "0.2rem 0.5rem", borderRadius: "999px", background: "rgba(34,197,94,0.12)", color: "rgb(21,128,61)" }}>
            Shortlisted
          </span>
        )}
      </div>

      {/* Contact details */}
      <div style={{ display: "grid", gap: "0.3rem" }}>
        <a
          href={`mailto:${app.email}`}
          style={{ fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", background: "rgba(100,100,100,0.06)", width: "fit-content", maxWidth: "100%", padding: "0.22rem 0.5rem", borderRadius: "0.4rem", color: "#1e3a8a", fontWeight: 500 }}
        >
          {app.email}
        </a>
        <a
          href={`tel:${app.phone}`}
          style={{ fontSize: "0.78rem", background: "rgba(100,100,100,0.06)", width: "fit-content", padding: "0.22rem 0.5rem", borderRadius: "0.4rem", color: "#1e3a8a", fontWeight: 500 }}
        >
          {app.phone}
        </a>
      </div>

      <div style={{ fontSize: "0.72rem", opacity: 0.55 }}>
        Applied: {app.created_at?.toDate ? moment(app.created_at.toDate()).format("LL") : "N/A"}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.1rem" }}>
        {cvUrl ? (
          <a
            href={cvUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", fontSize: "0.78rem", fontWeight: 500, background: "rgba(100,100,100,0.08)", borderRadius: "0.5rem", padding: "0.45rem 0.6rem", color: "inherit", textDecoration: "none" }}
          >
            <ExternalLink style={{ width: "0.75rem", height: "0.75rem" }} />
            View CV
          </a>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.74rem", opacity: 0.5 }}>No CV</div>
        )}

        {showShortlistAction ? (
          <button
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.35rem",
              fontSize: "0.78rem",
              fontWeight: 500,
              borderRadius: "0.5rem",
              padding: "0.45rem 0.6rem",
              background: shortlisted ? "rgba(34,197,94,0.12)" : "rgba(100,100,100,0.08)",
              color: shortlisted ? "rgb(21,128,61)" : "inherit",
              opacity: shortlisted || shortlisting || !app.id ? 0.7 : 1,
              cursor: shortlisted || shortlisting || !app.id ? "not-allowed" : "pointer",
            }}
            onClick={() => onShortlist(app)}
            disabled={shortlisted || shortlisting || !app.id}
          >
            <Check style={{ width: "0.75rem", height: "0.75rem" }} />
            {shortlisted ? "Shortlisted" : shortlisting ? "Adding..." : "Shortlist"}
          </button>
        ) : null}

        <button
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.35rem",
            fontSize: "0.78rem",
            fontWeight: 500,
            borderRadius: "0.5rem",
            padding: "0.45rem 0.6rem",
            background: "rgba(239,68,68,0.08)",
            color: "rgb(185,28,28)",
            opacity: declining || !app.id ? 0.7 : 1,
            cursor: declining || !app.id ? "not-allowed" : "pointer",
          }}
          onClick={() => onDecline(app)}
          disabled={declining || !app.id}
        >
          <UserMinus style={{ width: "0.75rem", height: "0.75rem" }} />
          {declining ? "Processing..." : secondaryActionLabel}
        </button>
      </div>
    </div>
  );
}

const ApplicationCard = memo(ApplicationCardBase);

export default ApplicationCard;