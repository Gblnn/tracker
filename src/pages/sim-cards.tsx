import { Button } from "@/components/ui/button";
import Back from "@/components/back";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { motion } from "framer-motion";
import { Check, ChevronDown, Loader2, PenLine, Plus, Search, Smartphone, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type SimCard = {
  id: string;
  record_id?: string;
  record_name?: string;
  sim_number?: string;
  cug_code?: string;
  status?: "active" | "inactive" | "suspended";
  notes?: string;
};

type RecordOption = { id: string; name: string };

const STATUS_OPTIONS: { value: NonNullable<SimCard["status"]>; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

const statusColor = (status?: SimCard["status"]) => {
  if (status === "active") return "rgba(0,180,100,0.15)";
  if (status === "suspended") return "rgba(220,60,60,0.15)";
  return "rgba(150,150,150,0.15)";
};

const statusTextColor = (status?: SimCard["status"]) => {
  if (status === "active") return "rgb(0,140,80)";
  if (status === "suspended") return "crimson";
  return "rgba(100,100,100,0.9)";
};

const EMPTY_FORM = {
  record_id: "",
  record_name: "",
  sim_number: "",
  cug_code: "",
  status: "active" as NonNullable<SimCard["status"]>,
  notes: "",
};

// Searchable record picker using Popover
function RecordPicker({
  records,
  value,
  onChange,
}: {
  records: RecordOption[];
  value: string;
  onChange: (id: string, name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      search.trim()
        ? records.filter((r) =>
            r.name.toLowerCase().includes(search.toLowerCase())
          )
        : records,
    [records, search]
  );

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
            padding: "0.5rem 0.75rem",
            borderRadius: "0.5rem",
            border: "1px solid rgba(100,100,100,0.25)",
            background: "transparent",
            fontSize: "0.88rem",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <span style={{ opacity: selected ? 1 : 0.45 }}>
            {selected ? selected.name : "Select person"}
          </span>
          <ChevronDown width="0.9rem" style={{ opacity: 0.5, flexShrink: 0 }} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        usePortal={false}
        style={{ padding: 0, width: "var(--radix-popover-trigger-width)", minWidth: "240px" }}
        align="start"
      >
        <div style={{ padding: "0.5rem", borderBottom: "1px solid rgba(100,100,100,0.15)" }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.5rem", borderRadius: "0.4rem", border: "1px solid rgba(100,100,100,0.2)" }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <Search width="0.8rem" style={{ opacity: 0.45, flexShrink: 0 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              placeholder="Search..."
              style={{ border: "none", background: "transparent", outline: "none", fontSize: "0.85rem", width: "100%", padding: 0 }}
              autoFocus
            />
          </div>
        </div>
        <div style={{ maxHeight: "220px", overflowY: "auto" }}>
          <button
            type="button"
            onClick={() => {
              onChange("", "");
              setOpen(false);
              setSearch("");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "0.55rem 0.75rem",
              fontSize: "0.85rem",
              background: value ? "transparent" : "rgba(100,100,255,0.08)",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <span>Unallocated</span>
            {!value && <Check width="0.8rem" color="mediumslateblue" />}
          </button>

          {filtered.length === 0 ? (
            <p style={{ padding: "0.75rem", fontSize: "0.82rem", opacity: 0.5, textAlign: "center" }}>No results</p>
          ) : (
            filtered.map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => {
                  onChange(rec.id, rec.name);
                  setOpen(false);
                  setSearch("");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "0.55rem 0.75rem",
                  fontSize: "0.85rem",
                  background: rec.id === value ? "rgba(100,100,255,0.08)" : "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span>{rec.name}</span>
                {rec.id === value && <Check width="0.8rem" color="mediumslateblue" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function SimCards() {
  const [simCards, setSimCards] = useState<SimCard[]>([]);
  const [records, setRecords] = useState<RecordOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCard, setSelectedCard] = useState<SimCard | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [simSnap, recordsSnap] = await Promise.all([
        getDocs(collection(db, "sim-cards")),
        getDocs(collection(db, "records")),
      ]);
      setSimCards(simSnap.docs.map((d) => ({ ...(d.data() as SimCard), id: d.id })));
      setRecords(
        recordsSnap.docs.map((d) => ({
          id: d.id,
          name: d.data().name || d.data().full_name || "Unknown",
        }))
      );
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async () => {
    if (!form.sim_number.trim()) {
      toast.error("SIM number is required");
      return;
    }
    if (form.cug_code && !/^\d{3}$/.test(form.cug_code)) {
      toast.error("CUG code must be exactly 3 digits");
      return;
    }
    try {
      setSaving(true);
      await addDoc(collection(db, "sim-cards"), {
        record_id: form.record_id,
        record_name: form.record_name,
        sim_number: form.sim_number.trim(),
        cug_code: form.cug_code.trim(),
        status: form.status,
        notes: form.notes.trim(),
      });
      toast.success("SIM card added");
      setAddDialog(false);
      setForm({ ...EMPTY_FORM });
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add SIM card");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedCard) return;
    if (!form.sim_number.trim()) {
      toast.error("SIM number is required");
      return;
    }
    if (form.cug_code && !/^\d{3}$/.test(form.cug_code)) {
      toast.error("CUG code must be exactly 3 digits");
      return;
    }
    try {
      setSaving(true);
      await updateDoc(doc(db, "sim-cards", selectedCard.id), {
        record_id: form.record_id,
        record_name: form.record_name,
        sim_number: form.sim_number.trim(),
        cug_code: form.cug_code.trim(),
        status: form.status,
        notes: form.notes.trim(),
      });
      toast.success("SIM card updated");
      setEditDialog(false);
      setSelectedCard(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update SIM card");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCard) return;
    try {
      setSaving(true);
      await deleteDoc(doc(db, "sim-cards", selectedCard.id));
      toast.success("SIM card removed");
      setDeleteDialog(false);
      setSelectedCard(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove SIM card");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (card: SimCard) => {
    setSelectedCard(card);
    setForm({
      record_id: card.record_id || "",
      record_name: card.record_name || "",
      sim_number: card.sim_number || "",
      cug_code: card.cug_code || "",
      status: card.status || "active",
      notes: card.notes || "",
    });
    setEditDialog(true);
  };

  const openDelete = (card: SimCard) => {
    setSelectedCard(card);
    setDeleteDialog(true);
  };

  const formFields = (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", paddingBottom: "0.5rem" }}>
      <div>
        <p style={{ fontSize: "0.75rem", opacity: 0.6, marginBottom: "0.3rem" }}>Allocated To</p>
        <RecordPicker
          records={records}
          value={form.record_id}
          onChange={(id, name) => setForm((f) => ({ ...f, record_id: id, record_name: name }))}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
        <div>
          <p style={{ fontSize: "0.75rem", opacity: 0.6, marginBottom: "0.3rem" }}>SIM Number *</p>
          <input
            value={form.sim_number}
            onChange={(e) => setForm((f) => ({ ...f, sim_number: e.target.value }))}
            placeholder="e.g. 96812345678"
          />
        </div>
        <div>
          <p style={{ fontSize: "0.75rem", opacity: 0.6, marginBottom: "0.3rem" }}>CUG Code</p>
          <input
            value={form.cug_code}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 3);
              setForm((f) => ({ ...f, cug_code: val }));
            }}
            placeholder="e.g. 123"
            maxLength={3}
            inputMode="numeric"
          />
        </div>
      </div>

      <div>
        <p style={{ fontSize: "0.75rem", opacity: 0.6, marginBottom: "0.3rem" }}>Status</p>
        <Select
          value={form.status}
          onValueChange={(val) => setForm((f) => ({ ...f, status: val as NonNullable<SimCard["status"]> }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p style={{ fontSize: "0.75rem", opacity: 0.6, marginBottom: "0.3rem" }}>Notes</p>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={2}
          placeholder="Optional notes"
        />
      </div>
    </div>
  );

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Back
          blurBG
          fixed
          title="SIM Cards"
          subtitle={simCards.length || undefined}
        //   icon={<Smartphone color="mediumslateblue" width="1.25rem" />}
          extra={
            <button
              onClick={() => {
                setForm({ ...EMPTY_FORM });
                setAddDialog(true);
              }}
              style={{ display: "flex", alignItems: "center", gap: "0.35rem", paddingLeft: "1rem", paddingRight: "1rem" }}
            >
              <Plus width="1rem" />
              <span style={{ fontSize: "0.85rem" }}>Add</span>
            </button>
          }
        />

        <div
          style={{
            paddingTop: "6rem",
            paddingLeft: "1.25rem",
            paddingRight: "1.25rem",
            paddingBottom: "8rem",
            minHeight: "100svh",
          }}
        >
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "70vh" }}>
              <Loader2 className="animate-spin" />
            </div>
          ) : simCards.length === 0 ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "70vh" }}>
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <Smartphone />
                  </EmptyMedia>
                  <EmptyTitle>No SIM Cards</EmptyTitle>
                  <EmptyDescription>No SIM card allocations have been added yet.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <div
              style={{
                border: "1px solid rgba(100,100,100,0.2)",
                borderRadius: "0.75rem",
                background: "rgba(100,100,100,0.04)",
                overflowX: "auto",
              }}
            >
              <table style={{ width: "100%", minWidth: "800px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(100,100,100,0.12)" }}>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600, fontSize: "0.82rem" }}>Allocated To</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600, fontSize: "0.82rem" }}>SIM Number</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600, fontSize: "0.82rem" }}>CUG</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600, fontSize: "0.82rem" }}>Status</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600, fontSize: "0.82rem" }}>Notes</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600, fontSize: "0.82rem" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {simCards.map((card) => (
                    <tr key={card.id} style={{ borderTop: "1px solid rgba(100,100,100,0.15)" }}>
                      <td style={{ padding: "0.75rem", verticalAlign: "middle", fontSize: "0.88rem" }}>
                        {card.record_name || <span style={{ opacity: 0.55 }}>Unallocated</span>}
                      </td>
                      <td style={{ padding: "0.75rem", verticalAlign: "middle", fontSize: "0.88rem", fontFamily: "monospace" }}>
                        {card.sim_number || <span style={{ opacity: 0.4 }}>—</span>}
                      </td>
                      <td style={{ padding: "0.75rem", verticalAlign: "middle", fontSize: "0.88rem", fontFamily: "monospace", fontWeight: 600 }}>
                        {card.cug_code || <span style={{ opacity: 0.4, fontWeight: 400 }}>—</span>}
                      </td>
                      <td style={{ padding: "0.75rem", verticalAlign: "middle" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            padding: "0.25rem 0.65rem",
                            borderRadius: "999px",
                            background: statusColor(card.status),
                            color: statusTextColor(card.status),
                            textTransform: "capitalize",
                          }}
                        >
                          {card.status || "unknown"}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem", verticalAlign: "middle", fontSize: "0.82rem", opacity: 0.7, maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {card.notes || <span style={{ opacity: 0.4 }}>—</span>}
                      </td>
                      <td style={{ padding: "0.75rem", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button
                            onClick={() => openEdit(card)}
                            style={{ padding: "0.4rem", background: "rgba(100,100,255,0.08)", borderRadius: "0.4rem" }}
                          >
                            <PenLine width="0.9rem" color="mediumslateblue" />
                          </button>
                          <button
                            onClick={() => openDelete(card)}
                            style={{ padding: "0.4rem", background: "rgba(220,60,60,0.08)", borderRadius: "0.4rem" }}
                          >
                            <Trash2 width="0.9rem" color="crimson" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      {/* Add Dialog */}
      <ResponsiveModal
        open={addDialog}
        onOpenChange={setAddDialog}
        title="Add SIM Card"
        description=""
      >
        <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {formFields}
          <div style={{ width: "100%", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
            <Button
              variant="default"
              disabled={saving || !form.sim_number.trim()}
              onClick={handleAdd}
              style={{ flex: 1 }}
            >
              {saving ? "Adding..." : "Add"}
            </Button>
            <Button
              variant="ghost"
              disabled={saving}
              onClick={() => setAddDialog(false)}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </ResponsiveModal>

      {/* Edit Dialog */}
      <ResponsiveModal
        open={editDialog}
        onOpenChange={(open) => {
          setEditDialog(open);
          if (!open) setSelectedCard(null);
        }}
        title="Edit SIM Card"
        description=""
      >
        <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {formFields}
          <div style={{ width: "100%", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
            <Button
              variant="default"
              disabled={saving || !form.sim_number.trim()}
              onClick={handleEdit}
              style={{ flex: 1 }}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="ghost"
              disabled={saving}
              onClick={() => {
                setEditDialog(false);
                setSelectedCard(null);
              }}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </ResponsiveModal>

      {/* Delete Confirmation */}
      <ResponsiveModal
        open={deleteDialog}
        onOpenChange={(open) => {
          setDeleteDialog(open);
          if (!open) setSelectedCard(null);
        }}
        title="Remove SIM Card"
        description=""
      >
        <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ fontSize: "0.88rem", opacity: 0.7, marginBottom: "0.5rem" }}>
            Remove SIM card <strong>{selectedCard?.sim_number}</strong> allocated to <strong>{selectedCard?.record_name || "unallocated"}</strong>? This action cannot be undone.
          </p>
          <div style={{ width: "100%", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
            <Button
              variant="destructive"
              disabled={saving}
              onClick={handleDelete}
              style={{ flex: 1 }}
            >
              {saving ? "Removing..." : "Remove"}
            </Button>
            <Button
              variant="ghost"
              disabled={saving}
              onClick={() => {
                setDeleteDialog(false);
                setSelectedCard(null);
              }}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </>
  );
}
