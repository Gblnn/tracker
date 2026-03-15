import Back from "@/components/back";
import BottomNav from "@/components/bottom-nav";
import IndexDropDown from "@/components/index-dropdown";
import RefreshButton from "@/components/refresh-button";
import DefaultDialog from "@/components/ui/default-dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/firebase";
import { ResponsiveModal } from "@/components/responsive-modal";
import { addDoc, collection, getDocs, orderBy, query, Timestamp, where } from "firebase/firestore";
import { ArrowRightLeft, Factory, Loader2, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function SiteAdminWorkers() {
  const { userData, logoutUser: logOut } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [logoutPrompt, setLogoutPrompt] = useState(false);

  // Transfer request state
  const [projectsList, setProjectsList] = useState<{ id: string; name: string }[]>([]);
  const [transferTarget, setTransferTarget] = useState<any | null>(null);
  const [toProject, setToProject] = useState("");
  const [toSite, setToSite] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const [submittingTransfer, setSubmittingTransfer] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const assignedSite = (userData?.assignedSite || "").toLowerCase().trim();
      const assignedProject = (userData?.assignedProject || "").toLowerCase().trim();
      const assignedSupervisorEmail = (userData?.email || "").toLowerCase().trim();
      const assignedSupervisorName = (userData?.name || "").toLowerCase().trim();
      const snap = await getDocs(collection(db, "records"));

      const allWorkers = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

      const filtered = allWorkers.filter((worker) => {
        if (!assignedSite && !assignedProject && !assignedSupervisorEmail && !assignedSupervisorName) {
          return false;
        }

        const workerSite = String(worker.site || worker.location || "").toLowerCase().trim();
        const workerProject = String(worker.project || "").toLowerCase().trim();
        const workerSupervisorEmail = String(
          worker.supervisor_email || worker.supervisorEmail || worker.assignedSupervisorEmail || ""
        )
          .toLowerCase()
          .trim();
        const workerSupervisorName = String(
          worker.supervisor_name || worker.supervisorName || worker.assignedSupervisorName || ""
        )
          .toLowerCase()
          .trim();

        const siteMatches = assignedSite ? workerSite === assignedSite : true;
        const projectMatches = assignedProject ? workerProject === assignedProject : true;
        const supervisorMatches =
          workerSupervisorEmail || workerSupervisorName
            ? (assignedSupervisorEmail && workerSupervisorEmail === assignedSupervisorEmail) ||
              (assignedSupervisorName && workerSupervisorName === assignedSupervisorName)
            : true;

        return siteMatches && projectMatches && supervisorMatches;
      });

      filtered.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
      setRecords(filtered);
    } catch (error) {
      console.error("Error fetching site workers:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [userData?.assignedSite, userData?.assignedProject]);

  const fetchMyRequests = async () => {
    if (!userData?.email) return;
    try {
      const q = query(
        collection(db, "transfer_requests"),
        where("requestedBy", "==", userData.email),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setMyRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching transfer requests:", err);
    }
  };

  const fetchProjects = async () => {
    try {
      const snap = await getDocs(collection(db, "projects"));
      setProjectsList(
        snap.docs.map((d) => ({ id: d.id, name: (d.data() as any).name || d.id }))
      );
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  useEffect(() => {
    fetchMyRequests();
    fetchProjects();
  }, [userData?.email]);

  const openTransfer = (worker: any) => {
    setTransferTarget(worker);
    setToProject("");
    setToSite("");
    setTransferNotes("");
  };

  const submitTransfer = async () => {
    if (!toProject.trim()) {
      toast.error("Please select a destination project");
      return;
    }
    if (!userData?.email || !transferTarget) return;
    setSubmittingTransfer(true);
    try {
      await addDoc(collection(db, "transfer_requests"), {
        recordId: transferTarget.id,
        recordName: transferTarget.name || "Unknown",
        recordDesignation: transferTarget.designation || "",
        fromProject: transferTarget.project || userData?.assignedProject || "",
        fromSite: transferTarget.site || transferTarget.location || userData?.assignedSite || "",
        toProject: toProject.trim(),
        toSite: toSite.trim(),
        requestedBy: userData.email,
        requestedByName: userData.name || userData.email,
        status: "pending",
        notes: transferNotes.trim(),
        createdAt: Timestamp.now(),
      });
      toast.success("Transfer request submitted");
      setTransferTarget(null);
      fetchMyRequests();
    } catch (err) {
      console.error("Error submitting transfer request:", err);
      toast.error("Failed to submit request");
    } finally {
      setSubmittingTransfer(false);
    }
  };

  const visibleWorkers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return records;

    return records.filter((worker) => {
      const name = String(worker.name || "").toLowerCase();
      const role = String(worker.role || worker.designation || "").toLowerCase();
      const email = String(worker.email || "").toLowerCase();
      return name.includes(q) || role.includes(q) || email.includes(q);
    });
  }, [records, searchQuery]);

  return (
    <>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
        <div style={{ padding: "", position: "fixed", zIndex: 20 }}>
          <Back
            noback
            blurBG
            fixed
            title={userData?.assignedProject || "Assigned Site"}
            // subtitle={userData?.assignedProject || visibleWorkers.length}
            icon={<Factory color="mediumslateblue" />}
            extra={
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <RefreshButton onClick={fetchWorkers} fetchingData={loading} />
                <IndexDropDown
                  onLogout={() => setLogoutPrompt(true)}
                  onProfile={() => navigate("/profile")}
                />
              </div>
            }
          />
        </div>

        <div
          style={{
            position: "fixed",
            top: "4.5rem",
            left: 0,
            right: 0,
            padding: "0.75rem 1.25rem",
            background: "rgba(250, 250, 250)",
            zIndex: 15,
            borderBottom: "1px solid rgba(100, 100, 100, 0.1)",
          }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workers"
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              background: "rgba(150, 150, 150, 0.15)",
              fontSize: "1rem",
            }}
          />
        </div>

        <div
          style={{
            paddingTop: "10rem",
            paddingLeft: "1.25rem",
            paddingRight: "1.25rem",
            paddingBottom: "8rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            
          }}
        >
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "65vh" }}>
              <Loader2 className="animate-spin" />
            </div>
          ) : visibleWorkers.length === 0 ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "65vh" }}>
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <Users />
                  </EmptyMedia>
                  <EmptyTitle>No Workers Found</EmptyTitle>
                  <EmptyDescription>
                    No workers are mapped to your assigned site or supervisor.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            visibleWorkers.map((worker) => (
              <div
                key={worker.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                  background: "rgba(100,100,100,0.04)",
                  border: "1px solid rgba(100,100,100,0.08)",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", minWidth: 0 }}>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      textTransform: "capitalize",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {(worker.name || "Unnamed").toLowerCase()}
                  </span>
                  <span style={{ fontSize: "0.78rem", opacity: 0.55, textTransform: "capitalize" }}>
                    {worker.designation || worker.project || worker.site || worker.location || ""}
                  </span>
                </div>

                {myRequests.some((r) => r.recordId === worker.id && r.status === "pending") ? (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      padding: "0.2rem 0.55rem",
                      borderRadius: "2rem",
                      background: "rgba(234,179,8,0.15)",
                      color: "#ca8a04",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    Transfer Pending
                  </span>
                ) : (
                  <button
                    onClick={() => openTransfer(worker)}
                    style={{
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      padding: "0.45rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(123,104,238,0.25)",
                      background: "rgba(123,104,238,0.07)",
                      color: "mediumslateblue",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <ArrowRightLeft width="0.85rem" />
                    Transfer
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Transfer request modal */}
      <ResponsiveModal
        open={!!transferTarget}
        onOpenChange={(open) => {
          if (!open) setTransferTarget(null);
        }}
        title="Request Transfer"
        description={
          transferTarget
            ? `Move ${transferTarget.name} to another project or site`
            : ""
        }
      >
        <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <div style={{ fontSize: "0.82rem", opacity: 0.6, display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <span>Currently:</span>
            <strong>{transferTarget?.project || userData?.assignedProject || "—"}</strong>
            {(transferTarget?.site || transferTarget?.location || userData?.assignedSite) && (
              <span>· {transferTarget?.site || transferTarget?.location || userData?.assignedSite}</span>
            )}
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", opacity: 0.7, display: "block", marginBottom: "0.35rem" }}>
              Destination Project *
            </label>
            <select
              value={toProject}
              onChange={(e) => setToProject(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid rgba(100,100,100,0.2)",
                background: "rgba(100,100,100,0.04)",
                fontSize: "0.9rem",
              }}
            >
              <option value="">Select project...</option>
              {projectsList.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", opacity: 0.7, display: "block", marginBottom: "0.35rem" }}>
              Destination Site
            </label>
            <input
              value={toSite}
              onChange={(e) => setToSite(e.target.value)}
              placeholder="Enter site name (optional)"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid rgba(100,100,100,0.2)",
                background: "rgba(100,100,100,0.04)",
                fontSize: "0.9rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", opacity: 0.7, display: "block", marginBottom: "0.35rem" }}>
              Reason (optional)
            </label>
            <textarea
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              placeholder="Why is the transfer needed?"
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
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setTransferTarget(null)}
              style={{
                flex: 1,
                padding: "0.75rem",
                borderRadius: "0.6rem",
                border: "none",
                background: "rgba(100,100,100,0.1)",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
            <button
              onClick={submitTransfer}
              disabled={submittingTransfer || !toProject.trim()}
              style={{
                flex: 2,
                padding: "0.75rem",
                borderRadius: "0.6rem",
                border: "none",
                background: "mediumslateblue",
                color: "white",
                fontWeight: 600,
                cursor: submittingTransfer || !toProject.trim() ? "not-allowed" : "pointer",
                opacity: submittingTransfer || !toProject.trim() ? 0.55 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
              }}
            >
              {submittingTransfer && <Loader2 className="animate-spin" width="1rem" />}
              Submit Request
            </button>
          </div>
        </div>
      </ResponsiveModal>

      <DefaultDialog
        destructive
        title={"Confirm Logout?"}
        OkButtonText="Logout"
        open={logoutPrompt}
        onCancel={() => setLogoutPrompt(false)}
        onOk={async () => {
          try {
            await logOut();
          } catch (error) {
            console.error("Logout error:", error);
          }
        }}
      />

      <BottomNav />
    </>
  );
}
