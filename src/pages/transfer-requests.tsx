import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import Back from "@/components/back";
import RefreshButton from "@/components/refresh-button";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, ArrowRightLeft, CalendarDays, Loader2, Plus, Search, User } from "lucide-react";
import { toast } from "sonner";

interface Props {
  embedMode?: boolean;
}

interface Transfer {
  id: string;
  created_at: string;
  transfer_date: string;
  from_project: string;
  to_project: string;
  initiator: string;
  acceptor: string;
}

export default function TransferRequests({ embedMode = false }: Props) {
  const { userData } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // New Transfer Form Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [transferDate, setTransferDate] = useState("");
  const [fromProject, setFromProject] = useState("");
  const [toProject, setToProject] = useState("");
  const [initiator, setInitiator] = useState("");
  const [acceptor, setAcceptor] = useState("");

  const fetchTransfers = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const { data, error } = await supabase
        .from("transfers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransfers(data || []);
    } catch (err: any) {
      console.error("Error fetching transfers:", err);
      toast.error("Failed to load transfers list.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  // Pre-fill fields when modal opens
  useEffect(() => {
    if (modalOpen) {
      const today = new Date().toISOString().split("T")[0];
      setTransferDate(today);
      setFromProject("");
      setToProject("");
      setInitiator(userData?.name || userData?.email || "");
      setAcceptor("");
    }
  }, [modalOpen, userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferDate || !fromProject || !toProject || !initiator) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("transfers")
        .insert({
          transfer_date: transferDate,
          from_project: fromProject,
          to_project: toProject,
          initiator: initiator,
          acceptor: acceptor
        });

      if (error) throw error;

      toast.success("Transfer recorded successfully!");
      setModalOpen(false);
      fetchTransfers();
    } catch (err: any) {
      console.error("Error creating transfer:", err);
      toast.error(err.message || "Failed to submit transfer.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTransfers = transfers.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      (t.from_project || "").toLowerCase().includes(q) ||
      (t.to_project || "").toLowerCase().includes(q) ||
      (t.initiator || "").toLowerCase().includes(q) ||
      (t.acceptor || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", overflow: "hidden" }}>
      {!embedMode && (
        <Back
          blurBG
          fixed
          title="Transfers"
          extra={
            <RefreshButton
              fetchingData={refreshing}
              onClick={() => fetchTransfers(true)}
            />
          }
        />
      )}

      {/* Control bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          padding: "1rem",
          borderBottom: "1px solid rgba(100, 100, 100, 0.1)",
          background: "#fafafa"
        }}
      >
        <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
          <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "#9ca3af" }} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transfers..."
            style={{ paddingLeft: "2.25rem", height: "2.25rem", fontSize: "0.85rem" }}
          />
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          style={{
            height: "2.25rem",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            backgroundColor: "#1e3a8a",
            color: "white"
          }}
        >
          <Plus className="w-4 h-4" />
          New Transfer
        </Button>
      </div>

      {/* Main content grid/table */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
            <Loader2 className="animate-spin w-8 h-8 text-blue-900" />
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "50vh", gap: "0.5rem", color: "#6b7280" }}>
            <ArrowRightLeft className="w-12 h-12 text-gray-300" />
            <h4 style={{ fontWeight: 600, color: "#374151" }}>No transfers found</h4>
            <p style={{ fontSize: "0.8rem" }}>Create a new transfer request to get started.</p>
          </div>
        ) : (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", overflow: "hidden", background: "white" }}>
            <Table>
              <TableHeader>
                <TableRow style={{ backgroundColor: "#f9fafb" }}>
                  <TableHead style={{ fontWeight: 600, color: "#374151" }}>Transfer Date</TableHead>
                  <TableHead style={{ fontWeight: 600, color: "#374151" }}>Route</TableHead>
                  <TableHead style={{ fontWeight: 600, color: "#374151" }}>Initiator</TableHead>
                  <TableHead style={{ fontWeight: 600, color: "#374151" }}>Acceptor</TableHead>
                  <TableHead style={{ fontWeight: 600, color: "#374151" }}>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransfers.map((t) => (
                  <TableRow key={t.id} style={{ transition: "background 0.2s" }}>
                    <TableCell style={{ fontWeight: 500, color: "#1f2937" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                        <CalendarDays className="w-4 h-4 text-gray-400" />
                        {new Date(t.transfer_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 500 }}>
                        <span style={{ color: "#4b5563" }}>{t.from_project}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                        <span style={{ color: "#1e3a8a" }}>{t.to_project}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>{t.initiator}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {t.acceptor ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
                          <User className="w-3.5 h-3.5 text-indigo-400" />
                          <span style={{ color: "#4f46e5", fontWeight: 500 }}>{t.acceptor}</span>
                        </div>
                      ) : (
                        <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "0.8rem" }}>Pending acceptance</span>
                      )}
                    </TableCell>
                    <TableCell style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                      {new Date(t.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* New Transfer Modal */}
      <ResponsiveModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title=""
        description=""
      >
        <form onSubmit={handleSubmit} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.75rem" }}>
            <ArrowRightLeft className="w-5 h-5 text-blue-900" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#111827" }}>Record New Transfer</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Transfer Date *</label>
            <Input
              type="date"
              required
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              style={{ fontSize: "0.85rem" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>From Project *</label>
              <Input
                type="text"
                required
                placeholder="e.g. Project A"
                value={fromProject}
                onChange={(e) => setFromProject(e.target.value)}
                style={{ fontSize: "0.85rem" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>To Project *</label>
              <Input
                type="text"
                required
                placeholder="e.g. Project B"
                value={toProject}
                onChange={(e) => setToProject(e.target.value)}
                style={{ fontSize: "0.85rem" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Initiator *</label>
            <Input
              type="text"
              required
              placeholder="Who initiated the transfer"
              value={initiator}
              onChange={(e) => setInitiator(e.target.value)}
              style={{ fontSize: "0.85rem" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Acceptor (Optional)</label>
            <Input
              type="text"
              placeholder="Who accepted/approved the transfer"
              value={acceptor}
              onChange={(e) => setAcceptor(e.target.value)}
              style={{ fontSize: "0.85rem" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              style={{ height: "2.25rem", fontSize: "0.85rem" }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              style={{
                height: "2.25rem",
                fontSize: "0.85rem",
                backgroundColor: "#1e3a8a",
                color: "white"
              }}
            >
              {submitting ? "Saving..." : "Save Record"}
            </Button>
          </div>
        </form>
      </ResponsiveModal>
    </div>
  );
}
