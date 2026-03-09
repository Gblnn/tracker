import Back from "@/components/back";
import RefreshButton from "@/components/refresh-button";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { db } from "@/firebase";
import { addDoc, collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { Loader2, Package, Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type ProjectItem = {
  id: string;
  name: string;
  description?: string;
  assignedRecordIds?: string[];
  assignedUserIds?: string[];
  assignedPeople?: string[];
  assignedUsers?: string[];
};

type RecordItem = {
  id: string;
  name?: string;
  email?: string;
  designation?: string;
  project?: string;
};

export default function Projects() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshCompleted, setRefreshCompleted] = useState(false);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const [allocateOpen, setAllocateOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [allocateSearch, setAllocateSearch] = useState("");
  const [savingAllocation, setSavingAllocation] = useState(false);

  const fetchData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [projectSnap, recordSnap] = await Promise.all([
        getDocs(collection(db, "projects")),
        getDocs(collection(db, "records")),
      ]);

      const fetchedProjects: ProjectItem[] = [];
      projectSnap.forEach((d) => fetchedProjects.push({ id: d.id, ...(d.data() as Omit<ProjectItem, "id">) }));

      const fetchedRecords: RecordItem[] = [];
      recordSnap.forEach((d) => fetchedRecords.push({ id: d.id, ...(d.data() as Omit<RecordItem, "id">) }));

      fetchedProjects.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      fetchedRecords.sort((a, b) => (a.name || a.email || "").localeCompare(b.name || b.email || ""));

      setProjects(fetchedProjects);
      setRecords(fetchedRecords);

      if (isManualRefresh) {
        setRefreshCompleted(true);
        setTimeout(() => setRefreshCompleted(false), 900);
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
      toast.error("Failed to load project data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const createProject = async () => {
    const name = newProjectName.trim();
    const description = newProjectDescription.trim();

    if (!name) {
      toast.error("Project name is required");
      return;
    }

    const duplicate = projects.some((p) => p.name?.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      toast.error("A project with this name already exists");
      return;
    }

    try {
      setCreating(true);
      await addDoc(collection(db, "projects"), {
        name,
        description,
        assignedRecordIds: [],
        assignedUserIds: [],
        assignedPeople: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast.success("Project created");
      setCreateOpen(false);
      setNewProjectName("");
      setNewProjectDescription("");
      fetchData();
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const openAllocateModal = (project: ProjectItem) => {
    setSelectedProject(project);
    setSelectedRecordIds(project.assignedRecordIds || project.assignedUserIds || []);
    setAllocateSearch("");
    setAllocateOpen(true);
  };

  const toggleRecordSelection = (recordId: string) => {
    setSelectedRecordIds((prev) =>
      prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]
    );
  };

  const saveAllocation = async () => {
    if (!selectedProject) return;

    try {
      setSavingAllocation(true);

      const selectedRecords = records.filter((r) => selectedRecordIds.includes(r.id));
      const selectedPeople = selectedRecords.map((r) => r.name || r.email || r.id).filter(Boolean);

      const batch = writeBatch(db);
      const projectRef = doc(db, "projects", selectedProject.id);

      batch.update(projectRef, {
        assignedRecordIds: selectedRecordIds,
        assignedUserIds: selectedRecordIds,
        assignedPeople: selectedPeople,
        assignedUsers: selectedPeople,
        updatedAt: new Date(),
      });

      records.forEach((record) => {
        const isSelected = selectedRecordIds.includes(record.id);
        const currentlyAssignedToThisProject = record.project === selectedProject.name;

        if (isSelected || currentlyAssignedToThisProject) {
          const recordRef = doc(db, "records", record.id);
          batch.update(recordRef, {
            project: isSelected ? selectedProject.name : "",
          });
        }
      });

      await batch.commit();

      toast.success("Project allocation updated");
      setAllocateOpen(false);
      setSelectedProject(null);
      setSelectedRecordIds([]);
      fetchData();
    } catch (error) {
      console.error("Error saving allocation:", error);
      toast.error("Failed to update allocation");
    } finally {
      setSavingAllocation(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRecords = records.filter((record) => {
    const q = allocateSearch.trim().toLowerCase();
    if (!q) return true;

    const name = (record.name || "").toLowerCase();
    const email = (record.email || "").toLowerCase();
    const designation = (record.designation || "").toLowerCase();
    const project = (record.project || "").toLowerCase();

    return (
      name.includes(q) ||
      email.includes(q) ||
      designation.includes(q) ||
      project.includes(q)
    );
  });

  return (
    <div style={{ padding: "1.25rem", height: "100svh" }}>
      <Back
        title="Project Master"
        subtitle={projects.length}
        extra={
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <RefreshButton
              fetchingData={refreshing}
              refreshCompleted={refreshCompleted}
              onClick={() => fetchData(true)}
            />
          </div>
        }
      />

      <div style={{ marginTop: "1rem" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
            <Loader2 className="animate-spin" style={{ }} />
          </div>
        ) : projects.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
            {projects.map((p) => (
              <div
                key={p.id}
                style={{
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  background: "rgba(100,100,100,0.04)",
                  border: "1px solid rgba(100,100,100,0.1)",
                }}
              >
                
                <div style={{ fontWeight: 600, marginBottom: "0.3rem" }}>{p.name}</div>
                <div style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: "0.75rem" }}>
                  {p.description || "No description"}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", opacity: 0.8 }}>
                    <Users width="0.9rem" />
                    {p.assignedRecordIds?.length || p.assignedUserIds?.length || 0} allocated
                  </div>
                </div>

                <button
                  onClick={() => openAllocateModal(p)}
                  style={{
                    width: "100%",
                    border: "1px solid rgba(100,100,100,0.2)",
                    background: "rgba(100,100,100,0.08)",
                    color: "inherit",
                    padding: "0.55rem",
                    borderRadius: "0.55rem",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Allocate People
                </button>
              </div>
            ))}
          </div>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <Package />
              </EmptyMedia>
              <EmptyTitle>No projects found</EmptyTitle>
              <EmptyDescription>Create your first project and allocate team members.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>

      <button
        onClick={() => setCreateOpen(true)}
        style={{
          position: "fixed",
          right: "1.25rem",
          bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))",
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          gap: "0.45rem",
          border: "none",
          background: "black",
          color: "white",
          padding: "0.85rem 1rem",
          borderRadius: "1rem",
          cursor: "pointer",
          boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
          fontSize: "0.9rem",
          fontWeight: 500,
          marginBottom: "0.5rem"
        }}
      >
        <Plus width="1rem" />
        Add New
      </button>

      <ResponsiveModal open={createOpen} onOpenChange={setCreateOpen} title="" description="">
        <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>Create Project</h2>

          <input
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Project Name"
            style={{
              borderRadius: "0.55rem",
              border: "1px solid rgba(100,100,100,0.2)",
              padding: "0.8rem",
              background: "rgba(100,100,100,0.05)",
              fontSize: "0.95rem",
            }}
          />

          <textarea
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={4}
            style={{
              borderRadius: "0.55rem",
              border: "1px solid rgba(100,100,100,0.2)",
              padding: "0.8rem",
              background: "rgba(100,100,100,0.05)",
              fontSize: "0.95rem",
              resize: "vertical",
            }}
          />

          <button
            onClick={createProject}
            disabled={creating}
            style={{
              border: "none",
              background: "black",
              color: "white",
              padding: "0.8rem",
              borderRadius: "0.6rem",
              fontWeight: 500,
              cursor: creating ? "not-allowed" : "pointer",
              opacity: creating ? 0.65 : 1,
            }}
          >
            {creating ? "Creating..." : "Create Project"}
          </button>
        </div>
      </ResponsiveModal>

      <ResponsiveModal open={allocateOpen} onOpenChange={setAllocateOpen} title="" description="">
        <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>
            Allocate People
          </h2>
          <p style={{ margin: 0, opacity: 0.75, fontSize: "0.85rem" }}>
            {selectedProject ? `Project: ${selectedProject.name}` : "Select records for this project"}
          </p>

          <input
            value={allocateSearch}
            onChange={(e) => setAllocateSearch(e.target.value)}
            placeholder="Search by name, email, designation, or project"
            style={{
              borderRadius: "0.55rem",
              border: "1px solid rgba(100,100,100,0.2)",
              padding: "0.7rem 0.8rem",
              background: "rgba(100,100,100,0.05)",
              fontSize: "0.9rem",
            }}
          />

          <div
            style={{
              maxHeight: "45vh",
              overflowY: "auto",
              border: "1px solid rgba(100,100,100,0.18)",
              borderRadius: "0.6rem",
            }}
          >
            {filteredRecords.length === 0 ? (
              <div style={{ padding: "0.9rem", fontSize: "0.85rem", opacity: 0.75 }}>
                {records.length === 0 ? "No records found." : "No matching records."}
              </div>
            ) : (
              filteredRecords.map((record) => {
                const checked = selectedRecordIds.includes(record.id);
                return (
                  <label
                    key={record.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.1rem minmax(0, 1fr) auto",
                      alignItems: "center",
                      columnGap: "0.65rem",
                      padding: "0.75rem 0.85rem",
                      borderBottom: "1px solid rgba(100,100,100,0.1)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRecordSelection(record.id)}
                      style={{
                    
                        margin: 0,
                        width: "1rem",
                        height: "1rem",
                        justifySelf: "center",
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <span style={{ fontSize: "0.9rem", fontWeight: 500, lineHeight: 1.25, textAlign:"left", textTransform:"capitalize" }}>{record.name?.toLowerCase() || "Unnamed Record"}</span>
                      <span style={{ fontSize: "0.78rem", opacity: 0.75, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", textTransform:"capitalize" }}>{record.email || record.designation?.toLowerCase() || "No email"}</span>
                    </div>
                    <span
                      style={{
                        justifySelf: "end",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        padding: "0.2rem 0.45rem",
                        borderRadius: "999px",
                        background: record.project ? "rgba(30,144,255,0.14)" : "rgba(120,120,120,0.14)",
                        color: record.project ? "dodgerblue" : "rgba(120,120,120,0.9)",
                        maxWidth: "9rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={record.project || "Unassigned"}
                    >
                      {record.project || "Unassigned"}
                    </span>
                  </label>
                );
              })
            )}
          </div>

          <button
            onClick={saveAllocation}
            disabled={savingAllocation || !selectedProject}
            style={{
              border: "none",
              background: "black",
              color: "white",
              padding: "0.8rem",
              borderRadius: "0.6rem",
              fontWeight: 700,
              cursor: savingAllocation ? "not-allowed" : "pointer",
              opacity: savingAllocation ? 0.65 : 1,
            }}
          >
            {savingAllocation ? "Saving..." : "Save Allocation"}
          </button>
        </div>
      </ResponsiveModal>
    </div>
  );
}
