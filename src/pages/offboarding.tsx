import { Button } from "@/components/ui/button";
import Back from "@/components/back";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { db } from "@/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  LogOut,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import emailjs from "@emailjs/browser";

type RecordOption = { id: string; name: string; email?: string; code?: string };

type ResourceBuckets = {
  simCards: any[];
  devices: any[];
  assets: any[];
  vehicles: any[];
  projects: any[];
};

const EMPTY_RESOURCES: ResourceBuckets = {
  simCards: [],
  devices: [],
  assets: [],
  vehicles: [],
  projects: [],
};

function RecordPicker({
  records,
  value,
  onChange,
}: {
  records: RecordOption[];
  value: string;
  onChange: (record: RecordOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(
      (r) => r.name.toLowerCase().includes(q) || (r.code || "").toLowerCase().includes(q)
    );
  }, [records, search]);

  const selected = records.find((r) => r.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            border: "1px solid rgba(100,100,100,0.25)",
            background: "transparent",
            fontSize: "0.88rem",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <span style={{ opacity: selected ? 1 : 0.45 }}>
            {selected ? `${selected.name} (${selected.code || "N/A"})` : "Select employee"}
          </span>
          <ChevronDown width="0.9rem" style={{ opacity: 0.5, flexShrink: 0 }} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        usePortal={false}
        align="start"
        style={{ padding: 0, width: "var(--radix-popover-trigger-width)", minWidth: "280px" }}
      >
        <div style={{ padding: "0.5rem", borderBottom: "1px solid rgba(100,100,100,0.15)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.25rem 0.5rem",
              borderRadius: "0.4rem",
              border: "1px solid rgba(100,100,100,0.2)",
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <Search width="0.8rem" style={{ opacity: 0.45, flexShrink: 0 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              placeholder="Search name or code..."
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "0.85rem",
                width: "100%",
                padding: 0,
              }}
              autoFocus
            />
          </div>
        </div>

        <div style={{ maxHeight: "220px", overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <p style={{ padding: "0.75rem", fontSize: "0.82rem", opacity: 0.5, textAlign: "center" }}>
              No employees found
            </p>
          ) : (
            filtered.map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => {
                  onChange(rec);
                  setOpen(false);
                  setSearch("");
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "0.2rem",
                  width: "100%",
                  padding: "0.65rem 0.75rem",
                  fontSize: "0.85rem",
                  background: rec.id === value ? "rgba(100,100,255,0.08)" : "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontWeight: 500 }}>{rec.name}</span>
                <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>
                  {rec.code || "N/A"} - {rec.email || "No email"}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function Offboarding() {
  const [records, setRecords] = useState<RecordOption[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<RecordOption | null>(null);
  const [resources, setResources] = useState<ResourceBuckets>(EMPTY_RESOURCES);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split("T")[0]);
  const [departureReason, setDepartureReason] = useState("");

  const totalResources =
    resources.simCards.length +
    resources.devices.length +
    resources.assets.length +
    resources.vehicles.length +
    resources.projects.length;

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(query(collection(db, "records"), where("state", "==", "active")));
      const list = snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name || d.data().displayName || "Unknown",
        email: d.data().email || "",
        code: d.data().employeeCode || "",
      }));
      setRecords(list);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async (recordId: string) => {
    try {
      setLoading(true);
      const [simSnap, devicesSnap, assetsSnap, vehiclesSnap, projectsSnap] = await Promise.all([
        getDocs(query(collection(db, "sim-cards"), where("record_id", "==", recordId))),
        getDocs(query(collection(db, "devices"), where("assigned_to", "==", recordId))),
        getDocs(query(collection(db, "assets"), where("assigned_to", "==", recordId))),
        getDocs(query(collection(db, "vehicle_master"), where("assigned_to", "==", recordId))),
        getDocs(query(collection(db, "projects"), where("assigned_members", "array-contains", recordId))),
      ]);

      setResources({
        simCards: simSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        devices: devicesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        assets: assetsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        vehicles: vehiclesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        projects: projectsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load allocated resources");
    } finally {
      setLoading(false);
    }
  };

  const selectRecord = async (record: RecordOption) => {
    setSelectedRecord(record);
    await fetchResources(record.id);
  };

  const sendNotification = async () => {
    if (!selectedRecord?.email) return;
    try {
      await emailjs.send("service_lunn2bp", "template_1y0oq9l", {
        name: selectedRecord.name,
        subject: "Employee Departure Notification",
        recipient: selectedRecord.email,
        message: `Employee ${selectedRecord.name} departed on ${departureDate}. Reason: ${departureReason || "Not specified"}.`,
      });
    } catch (error) {
      console.error("Email notification failed", error);
    }
  };

  const processDeparture = async () => {
    if (!selectedRecord) return;

    try {
      setProcessing(true);

      for (const sim of resources.simCards) {
        await updateDoc(doc(db, "sim-cards", sim.id), { record_id: "", record_name: "" });
      }
      for (const device of resources.devices) {
        await updateDoc(doc(db, "devices", device.id), { assigned_to: "", assigned_name: "" });
      }
      for (const asset of resources.assets) {
        await updateDoc(doc(db, "assets", asset.id), { assigned_to: "", assigned_name: "" });
      }
      for (const vehicle of resources.vehicles) {
        await updateDoc(doc(db, "vehicle_master", vehicle.id), { assigned_to: "", driver_name: "" });
      }
      for (const project of resources.projects) {
        const updatedMembers = (project.assigned_members || []).filter((id: string) => id !== selectedRecord.id);
        await updateDoc(doc(db, "projects", project.id), { assigned_members: updatedMembers });
      }

      await updateDoc(doc(db, "records", selectedRecord.id), {
        state: "departed",
        departed_on: Timestamp.now(),
        departure_reason: departureReason,
      });

      await addDoc(collection(db, "history"), {
        action: "employee_departure",
        employee_id: selectedRecord.id,
        employee_name: selectedRecord.name,
        departure_date: departureDate,
        departure_reason: departureReason,
        resources_count: totalResources,
        timestamp: Timestamp.now(),
      });

      await sendNotification();

      toast.success("Departure completed and resources deallocated");
      setConfirmOpen(false);
      setSelectedRecord(null);
      setResources(EMPTY_RESOURCES);
      setDepartureReason("");
      await fetchRecords();
    } catch (error) {
      console.error(error);
      toast.error("Failed to process departure");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Back blurBG fixed title="Offboarding" />

        <div
          style={{
            paddingTop: "6rem",
            paddingLeft: "1.25rem",
            paddingRight: "1.25rem",
            paddingBottom: "8rem",
            minHeight: "100svh",
          }}
        >
          <div style={{ maxWidth: "800px", margin: "0 auto", display: "grid", gap: "1rem" }}>
            <div
              style={{
                background: "rgba(100,100,100,0.04)",
                border: "1px solid rgba(100,100,100,0.15)",
                borderRadius: "0.75rem",
                padding: "1rem",
              }}
            >
              <p style={{ fontSize: "0.82rem", opacity: 0.7, marginBottom: "0.5rem" }}>
                Select Departing Employee
              </p>
              <RecordPicker
                records={records}
                value={selectedRecord?.id || ""}
                onChange={selectRecord}
              />
            </div>

            {selectedRecord && (
              <>
                <div
                  style={{
                    background: "rgba(100,100,100,0.04)",
                    border: "1px solid rgba(100,100,100,0.15)",
                    borderRadius: "0.75rem",
                    padding: "1rem",
                    display: "grid",
                    gap: "0.75rem",
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600 }}>{selectedRecord.name}</p>
                    <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.65 }}>
                      {selectedRecord.code || "N/A"} - {selectedRecord.email || "No email"}
                    </p>
                  </div>

                  <div>
                    <p style={{ fontSize: "0.75rem", opacity: 0.65, marginBottom: "0.25rem" }}>Departure Date</p>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.7rem",
                        borderRadius: "0.5rem",
                        border: "1px solid rgba(100,100,100,0.25)",
                      }}
                    />
                  </div>

                  <div>
                    <p style={{ fontSize: "0.75rem", opacity: 0.65, marginBottom: "0.25rem" }}>Reason</p>
                    <textarea
                      rows={3}
                      value={departureReason}
                      onChange={(e) => setDepartureReason(e.target.value)}
                      placeholder="Optional departure reason"
                      style={{
                        width: "100%",
                        padding: "0.7rem",
                        borderRadius: "0.5rem",
                        border: "1px solid rgba(100,100,100,0.25)",
                        resize: "vertical",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(100,100,100,0.04)",
                    border: "1px solid rgba(100,100,100,0.15)",
                    borderRadius: "0.75rem",
                    padding: "1rem",
                    display: "grid",
                    gap: "0.5rem",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600 }}>
                    Deallocation Checklist ({totalResources})
                  </p>

                  <div style={{ fontSize: "0.84rem", opacity: 0.8 }}>
                    <CheckCircle2 width="0.9rem" style={{ marginRight: "0.35rem", verticalAlign: "middle" }} />
                    SIM Cards: {resources.simCards.length}
                  </div>
                  <div style={{ fontSize: "0.84rem", opacity: 0.8 }}>
                    <CheckCircle2 width="0.9rem" style={{ marginRight: "0.35rem", verticalAlign: "middle" }} />
                    Devices: {resources.devices.length}
                  </div>
                  <div style={{ fontSize: "0.84rem", opacity: 0.8 }}>
                    <CheckCircle2 width="0.9rem" style={{ marginRight: "0.35rem", verticalAlign: "middle" }} />
                    Assets: {resources.assets.length}
                  </div>
                  <div style={{ fontSize: "0.84rem", opacity: 0.8 }}>
                    <CheckCircle2 width="0.9rem" style={{ marginRight: "0.35rem", verticalAlign: "middle" }} />
                    Vehicles: {resources.vehicles.length}
                  </div>
                  <div style={{ fontSize: "0.84rem", opacity: 0.8 }}>
                    <CheckCircle2 width="0.9rem" style={{ marginRight: "0.35rem", verticalAlign: "middle" }} />
                    Projects: {resources.projects.length}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                  <Button variant="ghost" onClick={() => setSelectedRecord(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setConfirmOpen(true)}>
                    <LogOut width="0.9rem" style={{ marginRight: "0.4rem" }} />
                    Depart and Archive
                  </Button>
                </div>
              </>
            )}

            {!selectedRecord && !loading && records.length === 0 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "45vh" }}>
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia>
                      <LogOut />
                    </EmptyMedia>
                    <EmptyTitle>No active employees</EmptyTitle>
                    <EmptyDescription>No records available for offboarding.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </div>
            )}

            {loading && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "45vh" }}>
                <Loader2 className="animate-spin" />
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <ResponsiveModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm Departure"
        description="This will deallocate resources and mark the record as departed"
      >
        <div style={{ padding: "1rem", display: "grid", gap: "1rem" }}>
          <div
            style={{
              background: "rgba(220,60,60,0.08)",
              border: "1px solid rgba(220,60,60,0.2)",
              borderRadius: "0.5rem",
              padding: "0.75rem",
              display: "flex",
              gap: "0.5rem",
            }}
          >
            <AlertCircle color="crimson" width="1rem" style={{ flexShrink: 0, marginTop: "0.1rem" }} />
            <p style={{ margin: 0, fontSize: "0.82rem", opacity: 0.85 }}>
              This action deallocates all linked resources and archives the employee state.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button variant="ghost" style={{ flex: 1 }} onClick={() => setConfirmOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button style={{ flex: 1 }} onClick={processDeparture} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 width="0.9rem" className="animate-spin" style={{ marginRight: "0.4rem" }} />
                  Processing...
                </>
              ) : (
                <>
                  <LogOut width="0.9rem" style={{ marginRight: "0.4rem" }} />
                  Confirm
                </>
              )}
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </>
  );
}
