import { Button } from "@/components/ui/button";
import { Check, File, X } from "lucide-react";
import moment from "moment";
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
        border: "1px solid rgba(100,100,100,0.14)",
        borderRadius: "0.8rem",
        padding: "0.8rem",
        display: "grid",
        gap: "0.5rem",
        background: "rgba(100,100,100,0.03)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: "0.9rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {app.name}
          </div>
          <div
            style={{
              fontSize: "0.78rem",
              opacity: 0.72,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {app.jobTitle || "Unknown Role"}
          </div>
        </div>
        <span
          style={{
            fontSize: "0.68rem",
            fontWeight: 600,
            padding: "0.22rem 0.5rem",
            borderRadius: "999px",
            background: shortlisted
              ? "rgba(34,197,94,0.14)"
              : "rgba(100,100,100,0.12)",
            color: shortlisted ? "rgb(22,163,74)" : "rgba(30,30,30,0.75)",
            alignSelf: "start",
          }}
        >
          {shortlisted ? "Shortlisted" : "Applied"}
        </span>
      </div>

      <a
        href={`mailto:${app.email}`}
        style={{
          fontSize: "0.8rem",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {app.email}
      </a>

      <a href={`tel:${app.phone}`} style={{ fontSize: "0.8rem" }}>
        {app.phone}
      </a>

      <div style={{ fontSize: "0.74rem", opacity: 0.72 }}>
        Applied: {app.created_at?.toDate ? moment(app.created_at.toDate()).format("LL") : "N/A"}
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.45rem",
          flexWrap: "wrap",
          marginTop: "0.1rem",
        }}
      >
        {cvUrl ? (
          <a
            href={cvUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.35rem",
              fontSize: "0.8rem",
              background: "rgba(100 100 100 / 0.1)",
              borderRadius: "0.45rem",
              padding: "0.3rem 0.55rem",
            }}
          >
            <File width={"0.85rem"} />
            View CV
          </a>
        ) : (
          <div style={{ fontSize: "0.76rem", opacity: 0.65 }}>No CV available</div>
        )}

        {showShortlistAction ? (
          <Button
            size="sm"
            variant={shortlisted ? "secondary" : "outline"}
            onClick={() => onShortlist(app)}
            disabled={shortlisted || shortlisting || !app.id}
          >
            <Check width={"0.85rem"} />
            {shortlisted ? "Shortlisted" : shortlisting ? "Adding..." : "Shortlist"}
          </Button>
        ) : null}

        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDecline(app)}
          disabled={declining || !app.id}
        >
          <X width={"0.85rem"} />
          {declining ? "Processing..." : secondaryActionLabel}
        </Button>
      </div>
    </div>
  );
}

const ApplicationCard = memo(ApplicationCardBase);

export default ApplicationCard;