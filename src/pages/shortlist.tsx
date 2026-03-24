import ApplicationCard from "@/components/application-card";
import Back from "@/components/back";
import RefreshButton from "@/components/refresh-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { db } from "@/firebase";
import { collection, deleteDoc, doc, getDocs, query } from "firebase/firestore";
import { motion } from "framer-motion";
import { LoaderCircle, RefreshCw, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface ShortlistRecord {
  id: string;
  applicationId?: string;
  name?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  created_at?: any;
  cv?: string;
  cvLink?: string;
  shortlistedAt?: any;
}

export default function Shortlist() {
  const [fetchingData, setFetchingData] = useState(false);
  const [records, setRecords] = useState<ShortlistRecord[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [confirmClearAllOpen, setConfirmClearAllOpen] = useState(false);
  const [recordToRemove, setRecordToRemove] = useState<ShortlistRecord | null>(null);
  const [renderLimit, setRenderLimit] = useState(24);
  const [clearingAll, setClearingAll] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetchingData(true);
      const shortlistSnapshot = await getDocs(query(collection(db, "shortlist")));
      const fetchedData: ShortlistRecord[] = [];

      shortlistSnapshot.forEach((shortlistDoc: any) => {
        fetchedData.push({ id: shortlistDoc.id, ...shortlistDoc.data() });
      });

      fetchedData.sort((a, b) => {
        const aTime = a.shortlistedAt?.toDate ? a.shortlistedAt.toDate().getTime() : 0;
        const bTime = b.shortlistedAt?.toDate ? b.shortlistedAt.toDate().getTime() : 0;
        return bTime - aTime;
      });

      setRecords(fetchedData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load shortlisted candidates");
    } finally {
      setFetchingData(false);
    }
  };

  const visibleRecords = useMemo(() => {
    return records.slice(0, renderLimit);
  }, [records, renderLimit]);

  const handleRequestRemove = (record: ShortlistRecord) => {
    setRecordToRemove(record);
    setConfirmRemoveOpen(true);
  };

  const handleRemoveFromShortlist = async () => {
    if (!recordToRemove?.id) return;

    setRemovingId(recordToRemove.id);
    try {
      await deleteDoc(doc(db, "shortlist", recordToRemove.id));
      setRecords((prev) => prev.filter((record) => record.id !== recordToRemove.id));
      toast.success("Removed from shortlist");
      setConfirmRemoveOpen(false);
      setRecordToRemove(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove shortlisted candidate");
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearAll = async () => {
    setClearingAll(true);
    try {
      await Promise.all(records.map((record) => deleteDoc(doc(db, "shortlist", record.id))));
      setRecords([]);
      toast.success("Shortlist cleared");
      setConfirmClearAllOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to clear shortlist");
    } finally {
      setClearingAll(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
      <Back
        title={"Shortlist"}
        fixed
        extra={
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <RefreshButton onClick={fetchData} fetchingData={fetchingData} />
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmClearAllOpen(true)}
              disabled={records.length === 0 || clearingAll}
            >
              <Trash2 width={"0.9rem"} />
              {clearingAll ? "Clearing..." : "Clear All"}
            </Button>
          </div>
        }
      />

      {fetchingData ? (
        <div
          style={{
            width: "100%",
            minHeight: "80svh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <LoaderCircle className="animate-spin" width={"2.1rem"} />
        </div>
      ) : records.length > 0 ? (
        <div style={{ paddingTop: "5.6rem", paddingInline: "1rem", paddingBottom: "1.5rem" }}>
          <div
            style={{
              display: "grid",
              gap: "0.6rem",
              marginBottom: "0.85rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", opacity: 0.8 }}>
              <Users width={"0.9rem"} />
              <span style={{ fontSize: "0.85rem" }}>
                {records.length} shortlisted {records.length === 1 ? "candidate" : "candidates"}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: "0.7rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            }}
          >
            {visibleRecords.map((record) => (
              <ApplicationCard
                key={record.id}
                app={{
                  id: record.id,
                  name: record.name || "Unnamed Candidate",
                  email: record.email || "N/A",
                  phone: record.phone || "N/A",
                  jobTitle: record.jobTitle || "Unknown Role",
                  created_at: record.created_at,
                  cv: record.cv,
                  cvLink: record.cvLink,
                }}
                shortlisted
                shortlisting={false}
                declining={removingId === record.id}
                onShortlist={() => {
                  // No-op: shortlisted records are already in shortlist.
                }}
                onDecline={() => handleRequestRemove(record)}
                showShortlistAction={false}
                secondaryActionLabel="Remove"
              />
            ))}
          </div>

          {renderLimit < records.length ? (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "0.85rem" }}>
              <Button variant="outline" onClick={() => setRenderLimit((prev) => prev + 24)}>
                <RefreshCw width={"0.85rem"} />
                Load More
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div
          style={{
            minHeight: "80svh",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: "1rem",
          }}
        >
          <div style={{ opacity: 0.7, display: "grid", gap: "0.35rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 650 }}>No shortlisted candidates</h3>
            <p style={{ fontSize: "0.85rem" }}>
              Add candidates from the applications list to see them here.
            </p>
          </div>
        </div>
      )}

      <Dialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from shortlist?</DialogTitle>
            <DialogDescription>
              {recordToRemove?.name || "This candidate"} will be removed from shortlist.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmRemoveOpen(false);
                setRecordToRemove(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveFromShortlist} disabled={!!removingId}>
              {removingId ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmClearAllOpen} onOpenChange={setConfirmClearAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear shortlist?</DialogTitle>
            <DialogDescription>
              This will remove every candidate from shortlist.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClearAllOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearAll} disabled={clearingAll}>
              {clearingAll ? "Clearing..." : "Clear All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}