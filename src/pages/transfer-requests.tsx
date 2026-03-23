import Back from "@/components/back";
import RefreshButton from "@/components/refresh-button";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { ArrowRight, ArrowRightLeft, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type TransferStatus = "pending" | "approved" | "rejected";

type TransferRequest = {
  id: string;
  recordId: string;
  recordName: string;
  recordDesignation?: string;
  fromProject: string;
  fromSite: string;
  toProject: string;
  toSite: string;
  requestedBy: string;
  requestedByName?: string;
  status: TransferStatus;
  notes?: string;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
  resolvedBy?: string;
  resolverNotes?: string;
};

const statusColor: Record<TransferStatus, string> = {
  pending: "rgba(234, 179, 8, 0.15)",
  approved: "rgba(34, 197, 94, 0.12)",
  rejected: "rgba(239, 68, 68, 0.12)",
};

const statusTextColor: Record<TransferStatus, string> = {
  pending: "#ca8a04",
  approved: "#16a34a",
  rejected: "#dc2626",
};

const statusLabel: Record<TransferStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export default function TransferRequests() {
  const { userData } = useAuth();
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"pending" | "history">("pending");

  // Resolve dialog
  const [resolveTarget, setResolveTarget] = useState<TransferRequest | null>(null);
  const [resolveAction, setResolveAction] = useState<"approved" | "rejected" | null>(null);
  const [resolverNotes, setResolverNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  const isApprover =
    userData?.role === "admin" ||
    userData?.role === "site_admin" ||
    userData?.role === "management";

  const fetchRequests = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const q = query(collection(db, "transfer_requests"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const fetched: TransferRequest[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<TransferRequest, "id">),
      }));
      setRequests(fetched);

      if (isManualRefresh) setRefreshing(false);
    } catch (err) {
      console.error("Error fetching transfer requests:", err);
      toast.error("Failed to load transfer requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openResolve = (req: TransferRequest, action: "approved" | "rejected") => {
    setResolveTarget(req);
    setResolveAction(action);
    setResolverNotes("");
  };

  const confirmResolve = async () => {
    if (!resolveTarget || !resolveAction) return;
    setResolving(true);
    try {
      const now = Timestamp.now();

      // Update the transfer request
      await updateDoc(doc(db, "transfer_requests", resolveTarget.id), {
        status: resolveAction,
        resolvedAt: now,
        resolvedBy: userData?.email || "",
        resolverNotes: resolverNotes.trim(),
      });

      // If approved, update the record's project and site
      if (resolveAction === "approved") {
        await updateDoc(doc(db, "records", resolveTarget.recordId), {
          project: resolveTarget.toProject,
          site: resolveTarget.toSite,
          updatedAt: now,
        });
      }

      toast.success(
        resolveAction === "approved"
          ? `Transfer approved — ${resolveTarget.recordName} moved to ${resolveTarget.toProject}`
          : `Transfer request rejected`
      );

      setResolveTarget(null);
      setResolveAction(null);
      fetchRequests();
    } catch (err) {
      console.error("Error resolving transfer:", err);
      toast.error("Failed to process request");
    } finally {
      setResolving(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const historyRequests = requests.filter((r) => r.status !== "pending");
  const visible = tab === "pending" ? pendingRequests : historyRequests;

  return (
    <>
      <Back
        blurBG
        fixed
        title="Transfer Requests"
        subtitle={pendingRequests.length > 0 ? pendingRequests.length : undefined}
        extra={
          <RefreshButton
            fetchingData={refreshing}
            onClick={() => fetchRequests(true)}
          />
        }
      />

      {/* Tab bar */}
      <div
        style={{
          position: "fixed",
          top: "4.5rem",
          left: 0,
          right: 0,
          zIndex: 15,
          display: "flex",
          gap: "0.5rem",
          padding: "0.5rem 1.25rem",
          background: "rgba(250,250,250,0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(100,100,100,0.1)",
        }}
      >
        {(["pending", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "2rem",
              border: "none",
              fontWeight: 500,
              fontSize: "0.85rem",
              background:
                tab === t ? "black" : "rgba(100,100,100,0.08)",
              color: tab === t ? "white" : "inherit",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            {t === "pending" ? "Pending" : "History"}
            {t === "pending" && pendingRequests.length > 0 && (
              <span
                style={{
                  background: "rgba(255,255,255,0.3)",
                  borderRadius: "1rem",
                  padding: "0.1rem 0.45rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  minWidth: "1.25rem",
                  textAlign: "center",
                }}
              >
                {pendingRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div
        style={{
          paddingTop: "9rem",
          paddingLeft: "1.25rem",
          paddingRight: "1.25rem",
          paddingBottom: "3rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
       
          margin: "0 auto",
        }}
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "60vh",
            }}
          >
            <Loader2 className="animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "60vh",
            }}
          >
            <Empty>
              <EmptyHeader>
                <EmptyMedia>
                  <ArrowRightLeft />
                </EmptyMedia>
                <EmptyTitle>
                  {tab === "pending" ? "No Pending Requests" : "No History"}
                </EmptyTitle>
                <EmptyDescription>
                  {tab === "pending"
                    ? "No transfer requests awaiting approval."
                    : "Resolved transfer requests will appear here."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1rem",
              paddingTop: "0.25rem",
            }}
          >
            {visible.map((req) => (
              <div
                key={req.id}
                // onMouseEnter={(e) => {
                //   e.currentTarget.style.background = "rgba(100,100,100,0.08)";
                //   e.currentTarget.style.borderColor = "rgba(100,100,100,0.2)";
                // }}
                // onMouseLeave={(e) => {
                //   e.currentTarget.style.background = "rgba(100,100,100,0.04)";
                //   e.currentTarget.style.borderColor = "rgba(100,100,100,0.1)";
                // }}
                style={{
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  background: "rgba(100,100,100,0.04)",
                  border: "1px solid rgba(100,100,100,0.1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                  height: "100%",
                  transition: "all 0.15s ease",
                }}
              >
              {/* Worker info + status */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", textTransform: "capitalize" }}>
                    {req.recordName?.toLowerCase() || "Unknown Worker"}
                  </div>
                  {req.recordDesignation && (
                    <div style={{ fontSize: "0.8rem", opacity: 0.6, textTransform: "capitalize" }}>
                      {req.recordDesignation.toLowerCase()}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    padding: "0.25rem 0.65rem",
                    borderRadius: "2rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    background: statusColor[req.status],
                    color: statusTextColor[req.status],
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  {req.status === "pending" && <Clock width="0.75rem" />}
                  {req.status === "approved" && <CheckCircle2 width="0.75rem" />}
                  {req.status === "rejected" && <XCircle width="0.75rem" />}
                  {statusLabel[req.status]}
                </span>
              </div>

              {/* Transfer route */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.82rem",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    padding: "0.2rem 0.6rem",
                    borderRadius: "0.35rem",
                    background: "rgba(100,100,100,0.08)",
                    fontWeight: 500,
                  }}
                >
                  {req.fromProject || "—"}
                  {/* {req.fromSite ? ` · ${req.fromSite}` : ""} */}
                </span>
                <ArrowRight width="0.85rem" style={{ opacity: 0.5, flexShrink: 0 }} />
                <span
                  style={{
                    padding: "0.2rem 0.6rem",
                    borderRadius: "0.35rem",
                    background: "rgba(100,100,100,0.1)",
                  
                    fontWeight: 500,
                  }}
                >
                  {req.toProject || "—"}{req.toSite ? ` · ${req.toSite}` : ""}
                </span>
              </div>

              {/* Meta */}
              <div style={{ fontSize: "0.78rem", opacity: 0.55 }}>
                Requested by {req.requestedByName || req.requestedBy}
                {req.createdAt?.toDate
                  ? ` · ${req.createdAt.toDate().toLocaleDateString()}`
                  : ""}
              </div>

              {req.notes && (
                <div
                  style={{
                    fontSize: "0.82rem",
                    padding: "0.5rem 0.75rem",
                    background: "rgba(100,100,100,0.05)",
                    borderRadius: "0.5rem",
                    fontStyle: "italic",
                    opacity: 0.75,
                  }}
                >
                  "{req.notes}"
                </div>
              )}

              {req.resolverNotes && req.status !== "pending" && (
                <div
                  style={{
                    fontSize: "0.82rem",
                    padding: "0.5rem 0.75rem",
                    background: statusColor[req.status],
                    borderRadius: "0.5rem",
                    fontStyle: "italic",
                    color: statusTextColor[req.status],
                  }}
                >
                  Review note: "{req.resolverNotes}"
                </div>
              )}

              {/* Actions — only approvers see on pending requests */}
              {req.status === "pending" && isApprover && (
                <div style={{ display: "flex", gap: "0.5rem", paddingTop: "0.25rem" }}>
                  <button
                    onClick={() => openResolve(req, "rejected")}
                    style={{
                      flex: 1,
                      padding: "0.6rem",
                      borderRadius: "0.6rem",
           
                      background: "rgba(239,68,68,0.07)",
                      color: "#dc2626",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => openResolve(req, "approved")}
                    style={{
                      flex: 1,
                      padding: "0.6rem",
                      borderRadius: "0.6rem",
                      border: "none",
                      background: "darkslateblue",
                      color: "white",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Approve
                  </button>
                </div>
              )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolve confirmation modal */}
      <ResponsiveModal
        open={!!resolveTarget && !!resolveAction}
        onOpenChange={(open) => {
          if (!open) {
            setResolveTarget(null);
            setResolveAction(null);
          }
        }}
        title={resolveAction === "approved" ? "Approve Transfer" : "Reject Transfer"}
        description={
          resolveTarget
            ? resolveAction === "approved"
              ? `${resolveTarget.recordName} will be moved to ${resolveTarget.toProject}${resolveTarget.toSite ? ` · ${resolveTarget.toSite}` : ""}.`
              : `The transfer request for ${resolveTarget.recordName} will be rejected.`
            : ""
        }
      >
        <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <textarea
            value={resolverNotes}
            onChange={(e) => setResolverNotes(e.target.value)}
            placeholder="Add a note (optional)"
            rows={3}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid rgba(100,100,100,0.2)",
              background: "rgba(100,100,100,0.04)",
              fontSize: "0.9rem",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => {
                setResolveTarget(null);
                setResolveAction(null);
              }}
              style={{
                flex: 1,
                padding: "0.75rem",
                borderRadius: "0.6rem",
                border: "none",
                background: "rgba(100,100,100,0.08)",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmResolve}
              disabled={resolving}
              style={{
                flex: 2,
                padding: "0.75rem",
                borderRadius: "0.6rem",
                border: "none",
                background:
                  resolveAction === "approved" ? "darkslateblue" : "#dc2626",
                color: "white",
                fontWeight: 600,
                cursor: resolving ? "not-allowed" : "pointer",
                opacity: resolving ? 0.65 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
              }}
            >
              {resolving && <Loader2 className="animate-spin" width="1rem" />}
              {resolveAction === "approved" ? "Confirm Approval" : "Confirm Rejection"}
            </button>
          </div>
        </div>
      </ResponsiveModal>

    </>
  );
}
