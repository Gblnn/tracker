import Back from "@/components/back";
import RefreshButton from "@/components/refresh-button";
import { Button } from "@/components/ui/button";
import AddRecordButton from "@/components/add-record-button";
import { ResponsiveModal } from "@/components/responsive-modal";
import ProjectSelect from "@/components/project-select";
import { db } from "@/firebase";
import { addDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { motion } from "framer-motion";
import { Plus, LoaderCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Empty, EmptyMedia, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";

interface Requirement {
  id?: string;
  project?: string;
  role?: string;
  count?: number;
  skills?: string;
  required_by?: string;
  priority?: string;
  created_at?: any;
  status?: string; // e.g., pending, with_hr, approved
}

export default function ManpowerRequirements() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
 
  const [fetching, setFetching] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newReq, setNewReq] = useState<Requirement>({
    project: "",
    role: "",
    count: 1,
    skills: "",
    required_by: "",
    priority: "normal",
  });

  useEffect(() => {
    fetchRequirements();
  }, []);

  const fetchRequirements = async () => {
    try {
      setFetching(true);
      const reqQ = query(collection(db, "manpower_requirements"), orderBy("created_at", "desc"));
      const snap = await getDocs(reqQ);
      const data: Requirement[] = [];
      snap.forEach((d: any) => data.push({ id: d.id, ...d.data() }));
      setRequirements(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load requirements");
    } finally {
      setFetching(false);
    }
  };

  const handleAdd = async () => {
    if (!newReq.project || !newReq.role) {
      toast.error("Please fill project and role");
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, "manpower_requirements"), {
        project: newReq.project,
        role: newReq.role,
        count: Number(newReq.count || 1),
        skills: newReq.skills || "",
        required_by: newReq.required_by || null,
        priority: newReq.priority || "normal",
        status: "with_hr",
        created_at: new Date(),
      });
      toast.success("Requirement submitted to HR");
      setAddOpen(false);
      setNewReq({ project: "", role: "", count: 1, skills: "", required_by: "", priority: "normal" });
      fetchRequirements();
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit requirement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
      <Back
        fixed
        title=""
        extra={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <RefreshButton onClick={fetchRequirements} fetchingData={fetching} />
          </div>
        }
      />

      <div style={{ padding: "1.25rem", paddingTop: "6.5rem" }}>
        {fetching ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", border:"", position:"absolute", top:0, left:0, width:"100%", height:"100%" }}>
            <LoaderCircle className="animate-spin" />
          </div>
        ) : requirements.length === 0 ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", border:"", position:"absolute", top:0, left:0, width:"100%", height:"100%" }}>
            <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Plus />
                    </EmptyMedia>
                    <EmptyTitle>No Requirements</EmptyTitle>
                    <EmptyDescription>
                      Add a requirement to get started.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {requirements.map((r) => (
              <div key={r.id} style={{ background: "rgba(100,100,100,0.03)", padding: "1rem", borderRadius: "0.75rem", border: "1px solid rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "1rem", fontWeight: 600 }}>{r.role} <span style={{ fontSize: "0.85rem", opacity: 0.75 }}>x{r.count}</span></div>
                    <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>{r.project}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.85rem", textTransform: "capitalize", opacity: 0.8 }}>{r.priority || "normal"}</div>
                    <div style={{ fontSize: "0.8rem", opacity: 0.6 }}>{r.status}</div>
                  </div>
                </div>
                {r.skills ? <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", opacity: 0.85 }}>{r.skills}</div> : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <ResponsiveModal open={addOpen} onOpenChange={setAddOpen} title="" description="" hideHeader>
        <div style={{ width: "100%", height: "560px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "1.25rem", borderBottom: "1px solid rgba(0,0,0,0.04)", background: "var(--bg, white)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>Post Manpower Requirement</h2>
          </div>

          <div style={{ padding: "1.25rem", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <ProjectSelect value={newReq.project} onChange={(v) => setNewReq((p) => ({ ...p, project: v }))} />

            <div>
              <label htmlFor="role" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.35rem", opacity: 0.9 }}>Role / Job Title</label>
              <input id="role" placeholder="Role / Job Title" value={newReq.role} onChange={(e) => setNewReq((p) => ({ ...p, role: e.target.value }))} style={{ padding: "0.85rem 1rem", borderRadius: "0.6rem", border: "1px solid rgba(0,0,0,0.06)", width: "100%" }} />
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <div style={{ flex: "0 0 6.5rem" }}>
                <label htmlFor="count" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.35rem", opacity: 0.9 }}>Headcount</label>
                <input id="count" type="number" min={1} value={newReq.count} onChange={(e) => setNewReq((p) => ({ ...p, count: Number(e.target.value) }))} style={{ padding: "0.75rem 1rem", borderRadius: "0.6rem", border: "1px solid rgba(0,0,0,0.06)", width: "100%" }} />
              </div>

              <div style={{ flex: 1 }}>
                <label htmlFor="required_by" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.35rem", opacity: 0.9 }}>Required By</label>
                <input id="required_by" type="date" value={newReq.required_by || ""} onChange={(e) => setNewReq((p) => ({ ...p, required_by: e.target.value }))} style={{ padding: "0.75rem 1rem", borderRadius: "0.6rem", border: "1px solid rgba(0,0,0,0.06)", width: "100%" }} />
              </div>
            </div>

            <div>
              <label htmlFor="priority" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.35rem", opacity: 0.9 }}>Priority</label>
              <Select value={newReq.priority} onValueChange={(value) => setNewReq((p) => ({ ...p, priority: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="skills" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.35rem", opacity: 0.9 }}>Required Skills / Description</label>
              <textarea id="skills" placeholder="Required skills / description" value={newReq.skills} onChange={(e) => setNewReq((p) => ({ ...p, skills: e.target.value }))} style={{ minHeight: "120px", padding: "0.85rem 1rem", borderRadius: "0.6rem", border: "1px solid rgba(0,0,0,0.06)", width: "100%" }} />
            </div>
          </div>

          <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid rgba(0,0,0,0.04)", display: "flex", gap: "0.5rem", justifyContent: "flex-end", background: "var(--bg, white)" }}>
            <Button style={{flex:1}} variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button style={{flex:1}} onClick={handleAdd} disabled={saving}>
              {saving ? "Submitting..." : "Submit to HR"}
            </Button>
          </div>
        </div>
      </ResponsiveModal>
      <AddRecordButton title="Add Requirement" onClick={() => setAddOpen(true)} icon={<Plus width={14} />} />
    </motion.div>
  );
}
