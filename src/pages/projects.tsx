import Back from "@/components/back";
import RefreshButton from "@/components/refresh-button";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { db } from "@/firebase";
import { addDoc, collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { Loader2, Mail, Package, Plus, Users } from "lucide-react";
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
  focalPointEmail?: string;
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
  const [newProjectFocalPointEmail, setNewProjectFocalPointEmail] = useState("");
  const [creating, setCreating] = useState(false);

  const [viewingProject, setViewingProject] = useState<ProjectItem | null>(null);
  const [projectPersonnel, setProjectPersonnel] = useState<RecordItem[]>([]);
  const [loadingPersonnel, setLoadingPersonnel] = useState(false);
  const [focalPointModalOpen, setFocalPointModalOpen] = useState(false);
  const [selectedProjectForFocalPoint, setSelectedProjectForFocalPoint] = useState<ProjectItem | null>(null);
  const [focalPointEmailInput, setFocalPointEmailInput] = useState("");
  const [savingFocalPoint, setSavingFocalPoint] = useState(false);

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
        focalPointEmail: newProjectFocalPointEmail.trim(),
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
      setNewProjectFocalPointEmail("");
      fetchData();
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const viewProjectPersonnel = (project: ProjectItem) => {
    setViewingProject(project);
    setLoadingPersonnel(true);

    const normalizedProjectName = (project.name || "").trim().toLowerCase();
    const personnel = records.filter(
      (r) => (r.project || "").trim().toLowerCase() === normalizedProjectName
    );
    setProjectPersonnel(personnel);
    setLoadingPersonnel(false);
  };

  const getAllocatedCount = (projectName?: string) => {
    if (!projectName) return 0;
    const normalizedProjectName = projectName.trim().toLowerCase();
    return records.filter((r) => (r.project || "").trim().toLowerCase() === normalizedProjectName).length;
  };

  const openFocalPointModal = (project: ProjectItem) => {
    setSelectedProjectForFocalPoint(project);
    setFocalPointEmailInput(project.focalPointEmail || "");
    setFocalPointModalOpen(true);
  };

  const allocateFocalPointEmail = async () => {
    if (!selectedProjectForFocalPoint) return;

    const email = focalPointEmailInput.trim();
    if (!email) {
      toast.error("Please enter a focal point email");
      return;
    }

    try {
      setSavingFocalPoint(true);
      await updateDoc(doc(db, "projects", selectedProjectForFocalPoint.id), {
        focalPointEmail: email,
        updatedAt: new Date(),
      });

      toast.success("Focal point email allocated");
      setFocalPointModalOpen(false);
      setSelectedProjectForFocalPoint(null);
      setFocalPointEmailInput("");
      fetchData();
    } catch (error) {
      console.error("Error allocating focal point email:", error);
      toast.error("Failed to allocate focal point email");
    } finally {
      setSavingFocalPoint(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
   
      
       <div style={{ padding: "", height: "100svh" }}>
<Back
      blurBG
      fixed
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


      <div style={{padding:"1.25rem" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems:"center", padding: "2rem", border:"", height:"80svh" }}>
            <Loader2 className="animate-spin" style={{ }} />
          </div>
        ) : projects.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem", paddingTop:"4rem" }}>
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => viewProjectPersonnel(p)}
                style={{
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  background: "rgba(100,100,100,0.04)",
                  border: "1px solid rgba(100,100,100,0.1)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(100,100,100,0.08)";
                  e.currentTarget.style.borderColor = "rgba(100,100,100,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(100,100,100,0.04)";
                  e.currentTarget.style.borderColor = "rgba(100,100,100,0.1)";
                }}
              >
                
                <div style={{ fontWeight: 600, marginBottom: "0.3rem" }}>{p.name}</div>
                <div style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: "0.75rem" }}>
                  {p.description || "No description"}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", opacity: 0.8 }}>
                    <Users width="0.9rem" />
                    {getAllocatedCount(p.name)} allocated
                  </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  

                  <div style={{ fontSize: "0.78rem", opacity: 0.7, marginBottom: "", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Mail width="0.85rem" />
                  {p.focalPointEmail || "No focal point email"}
                </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openFocalPointModal(p);
                    }}
                    style={{
                      border: "1px solid rgba(100,100,100,0.2)",
                      background: "white",
                      borderRadius: "0.5rem",
                      fontSize: "0.75rem",
                      padding: "0.4rem 0.6rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <Mail width="0.8rem" />
                    Allocate
                  </button>
                </div>
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

          <input
            value={newProjectFocalPointEmail}
            onChange={(e) => setNewProjectFocalPointEmail(e.target.value)}
            placeholder="Focal Point Email (optional)"
            list="project-focal-point-email-options"
            style={{
              borderRadius: "0.55rem",
              border: "1px solid rgba(100,100,100,0.2)",
              padding: "0.8rem",
              background: "rgba(100,100,100,0.05)",
              fontSize: "0.95rem",
            }}
          />
          <datalist id="project-focal-point-email-options">
            {records
              .map((record) => record.email)
              .filter((email): email is string => !!email)
              .map((email) => (
                <option key={email} value={email} />
              ))}
          </datalist>

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

      <ResponsiveModal 
        open={!!viewingProject} 
        onOpenChange={(open) => {
          if (!open) {
            setViewingProject(null);
            setProjectPersonnel([]);
          }
        }} 
        title={viewingProject?.name || "Project Personnel"}
        description="People allocated to this project"
      >
        <div style={{ padding: "1.5rem", paddingTop: "0.5rem", maxHeight: "60vh", overflowY: "auto" }}>
          {loadingPersonnel ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
              <Loader2 className="animate-spin" width="1.5rem" />
            </div>
          ) : projectPersonnel.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", opacity: 0.5 }}>
              <Package width="2.5rem" height="2.5rem" style={{ margin: "0 auto 0.5rem" }} />
              <p style={{ fontSize: "0.875rem" }}>No personnel allocated to this project</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.5rem", 
                padding: "0.5rem 0.75rem",
                marginBottom: "0.5rem",
                background: "rgba(123, 104, 238, 0.08)",
                borderRadius: "0.5rem"
              }}>
                <Users width="1rem" height="1rem" color="mediumslateblue" />
                <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  {projectPersonnel.length} {projectPersonnel.length === 1 ? "person" : "people"}
                </span>
              </div>
              {projectPersonnel.map((person) => (
                <div
                  key={person.id}
                  style={{
                    padding: "0.875rem 1rem",
                    borderRadius: "0.75rem",
                    background: "rgba(100, 100, 100, 0.04)",
                    border: "1px solid rgba(100, 100, 100, 0.08)",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <span style={{ fontSize: "0.95rem", fontWeight: 600, textTransform: "capitalize" }}>
                      {person.name?.toLowerCase() || "Unnamed"}
                    </span>
                    {person.designation && (
                      <span style={{ fontSize: "0.8rem", opacity: 0.6, textTransform: "capitalize" }}>
                        {person.designation.toLowerCase()}
                      </span>
                    )}
                    {person.email && (
                      <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>
                        {person.email}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ResponsiveModal>

      <ResponsiveModal
        open={focalPointModalOpen}
        onOpenChange={(open) => {
          setFocalPointModalOpen(open);
          if (!open) {
            setSelectedProjectForFocalPoint(null);
            setFocalPointEmailInput("");
          }
        }}
        title={selectedProjectForFocalPoint?.name || "Allocate Focal Point Email"}
        description="Assign focal point email for this project"
      >
        <div style={{ padding: "", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          <input
            value={focalPointEmailInput}
            onChange={(e) => setFocalPointEmailInput(e.target.value)}
            placeholder="Enter focal point email"
            list="focal-point-email-options"
            style={{
              borderRadius: "0.55rem",
              border: "1px solid rgba(100,100,100,0.2)",
              padding: "0.8rem",
              background: "rgba(100,100,100,0.05)",
              fontSize: "0.95rem",
            }}
          />

          <datalist id="focal-point-email-options">
            {records
              .map((record) => record.email)
              .filter((email): email is string => !!email)
              .map((email) => (
                <option key={email} value={email} />
              ))}
          </datalist>

          <button
            onClick={allocateFocalPointEmail}
            disabled={savingFocalPoint}
            style={{
              border: "none",
              background: "black",
              color: "white",
              padding: "0.8rem",
              borderRadius: "0.6rem",
              fontWeight: 500,
              cursor: savingFocalPoint ? "not-allowed" : "pointer",
              opacity: savingFocalPoint ? 0.65 : 1,
            }}
          >
            {savingFocalPoint ? "Saving..." : "Save Focal Point Email"}
          </button>
        </div>
      </ResponsiveModal>
    </div>
  );
}
