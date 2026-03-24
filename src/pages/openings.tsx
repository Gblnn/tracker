import AddRecordButton from "@/components/add-record-button";
import ApplicationCard from "@/components/application-card";
import Back from "@/components/back";
import RefreshButton from "@/components/refresh-button";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import Work from "@/components/work";
import { db } from "@/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { motion } from "framer-motion";
import { FileText, LoaderCircle, Plus } from "lucide-react";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
// import { Opening } from "@/components/opening";

interface JobOpening {
  id: string;
  jobTitle: string;
  jobType: string;
  description: string;
  activelyHiring: boolean;
  created_at: any;
}

export default function Openings() {
  const [fetchingData, setfetchingData] = useState(false);
  const [records, setRecords] = useState<JobOpening[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [allApplicationsModalOpen, setAllApplicationsModalOpen] =
    useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmClearAllOpen, setConfirmClearAllOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<any | null>(
    null
  );
  const [shortlistingId, setShortlistingId] = useState<string | null>(null);
  const [shortlistedApplicationIds, setShortlistedApplicationIds] = useState<
    Set<string>
  >(new Set());
  const [applicationsRenderLimit, setApplicationsRenderLimit] = useState(24);
  const [newOpening, setNewOpening] = useState({
    jobType: "full-time",
    jobTitle: "",
    description: "",
    activelyHiring: false,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 900 : false
  );

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (allApplicationsModalOpen) {
      setApplicationsRenderLimit(24);
    }
  }, [allApplicationsModalOpen]);

  const fetchData = async () => {
    try {
      setfetchingData(true);
      const openingQuery = query(collection(db, "openings"));
      const openingSnapshot = await getDocs(openingQuery);
      const fetchedOpenings: JobOpening[] = [];

      openingSnapshot.forEach((openingDoc: any) => {
        fetchedOpenings.push({ id: openingDoc.id, ...openingDoc.data() });
      });
      setRecords(fetchedOpenings);

      await Promise.all([fetchApplications(), fetchShortlistedApplications()]);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load openings");
    } finally {
      setfetchingData(false);
    }
  };

  const fetchApplications = async () => {
    const RecordCollection = collection(db, "applications");
    const recordQuery = query(RecordCollection);
    const querySnapshot = await getDocs(recordQuery);
    const fetchedData: any = [];

    querySnapshot.forEach((doc: any) => {
      fetchedData.push({ id: doc.id, ...doc.data() });
    });
    setApplications(fetchedData);
  };

  const fetchShortlistedApplications = async () => {
    const shortlistQuery = query(collection(db, "shortlist"));
    const shortlistSnapshot = await getDocs(shortlistQuery);
    const ids = new Set<string>();

    shortlistSnapshot.forEach((shortlistedDoc: any) => {
      const shortlisted = shortlistedDoc.data();
      if (shortlisted.applicationId) {
        ids.add(shortlisted.applicationId);
      }
    });

    setShortlistedApplicationIds(ids);
  };

  const handleAddOpening = async () => {
    if (!newOpening.jobTitle.trim() || !newOpening.description.trim()) {
      toast.error("Please fill job title and description");
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, "openings"), {
        jobType: newOpening.jobType,
        jobTitle: newOpening.jobTitle,
        description: newOpening.description,
        activelyHiring: newOpening.activelyHiring,
        created_at: new Date(),
      });
      toast.success("Opening added");
      setAddDialogOpen(false);
      setNewOpening({
        jobType: "full-time",
        jobTitle: "",
        description: "",
        activelyHiring: false,
      });
      fetchData();
    } catch (err) {
      toast.error("Failed to add opening");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    try {
      await deleteDoc(doc(db, "applications", id));
      toast.success("Application deleted");
      fetchApplications();
      setApplicationToDelete(null);
      setConfirmDeleteOpen(false);
    } catch (err) {
      toast.error("Failed to delete application");
    }
  };

  const handleShortlistApplication = async (app: any) => {
    if (!app?.id) return;

    if (shortlistedApplicationIds.has(app.id)) {
      toast("Already in shortlist");
      return;
    }

    setShortlistingId(app.id);
    try {
      const existingShortlistQuery = query(
        collection(db, "shortlist"),
        where("applicationId", "==", app.id)
      );
      const existingSnapshot = await getDocs(existingShortlistQuery);

      if (!existingSnapshot.empty) {
        setShortlistedApplicationIds((prev) => new Set(prev).add(app.id));
        toast("Already in shortlist");
        return;
      }

      const { id, ...applicationPayload } = app;
      await addDoc(collection(db, "shortlist"), {
        ...applicationPayload,
        applicationId: id,
        shortlistedAt: new Date(),
        sourceCollection: "applications",
      });

      setShortlistedApplicationIds((prev) => new Set(prev).add(id));
      toast.success("Application added to shortlist");
    } catch (error) {
      console.error("Error adding to shortlist:", error);
      toast.error("Failed to add to shortlist");
    } finally {
      setShortlistingId(null);
    }
  };

  const handleClearAllApplications = async () => {
    setDeleting(true);
    try {
      const deletePromises = applications.map((app: any) =>
        deleteDoc(doc(db, "applications", app.id))
      );
      await Promise.all(deletePromises);
      toast.success("All applications cleared");
      setConfirmClearAllOpen(false);
      fetchApplications();
    } catch (err) {
      toast.error("Failed to clear applications");
    } finally {
      setDeleting(false);
    }
  };

  const visibleApplications = useMemo(
    () => applications.slice(0, applicationsRenderLimit),
    [applications, applicationsRenderLimit]
  );

  const renderApplicationsContent = () => (
    <div style={{ padding: "0 1rem 1rem" }}>
      <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "0.8rem",
          }}
        >
          {visibleApplications.map((app: any) => {
            const shortlisted = shortlistedApplicationIds.has(app.id);
            return (
              <ApplicationCard
                key={app.id}
                app={app}
                shortlisted={shortlisted}
                shortlisting={shortlistingId === app.id}
                declining={false}
                onShortlist={handleShortlistApplication}
                onDecline={(selectedApp:any) => {
                  setApplicationToDelete(selectedApp);
                  setConfirmDeleteOpen(true);
                }}
              />
            );
          })}
        </div>

        {applications.length > applicationsRenderLimit && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "0.9rem" }}>
            <Button
              variant="outline"
              onClick={() =>
                setApplicationsRenderLimit((prev) =>
                  Math.min(prev + 24, applications.length)
                )
              }
            >
              Load More ({applications.length - applicationsRenderLimit} remaining)
            </Button>
          </div>
        )}

        {applications.length === 0 && (
          <div style={{ textAlign: "center", padding: "2rem", color: "#888" }}>
            No applications found
          </div>
        )}
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
      <div
        className=""
        style={{
          minHeight: "",
          paddingTop: "",
          background: "",
        }}
      >
        <div
          style={{
            padding: "",
            width: "100%",
            maxWidth: "",
            margin: "0 auto",
          }}
        >
          <Back
            title={"Openings"}
            fixed
            extra={
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <button
                  style={{ fontSize: "0.8rem", padding: "0.65rem 1.25rem", boxShadow:"1px 1px 5px rgba( 0 0 0/ 0.4)" }}
                  onClick={() => setAllApplicationsModalOpen(true)}
                >
                  <FileText width={"0.9rem"} />
                  All
                </button>
                <RefreshButton
                  onClick={fetchData}
                  fetchingData={fetchingData}
                />
              </div>
            }
          />

          {fetchingData ? (
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100svh",
              }}
            >
              <LoaderCircle
                color="mediumslateblue"
                className="animate-spin"
                width={"3rem"}
                height={"3rem"}
              />
            </div>
          ) : records.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="careers-grid"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "2rem",
                padding: "2rem",
                paddingTop: "6rem",
              }}
            >
              {records.map((record: any) => {
                let applicants = 0;
                const applicantsList = applications
                  .filter((e: any) => e.jobId === record.id)
                  .map((e: any) => {
                    return {
                      id: e.id,
                      name: e.name,
                      email: e.email,
                      phone: e.phone,
                      jobId: e.jobId,
                      jobTitle: e.jobTitle,
                      created_at: e.created_at,
                      cv: e.cvLink,
                      cvLink: e.cvLink,
                    };
                  });
                applicants = applicantsList.length;
                return (
                  <Work
                    key={record.id}
                    id={record.id}
                    date={moment(record.created_at.toDate()).format("LL")}
                    designation={record.jobTitle}
                    mailto={record.mailto}
                    desc={record.description}
                    jobType={record.jobType}
                    activelyHiring={record.activelyHiring}
                    applicants={applicants}
                    applicantsList={applicantsList}
                  />
                );
              })}
            </motion.div>
          ) : (
            <div
              style={{
                display: "flex",
                height: "100svh",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                opacity: "0.5",
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexFlow: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <p>No Openings Found</p>
                  <p style={{ fontSize: "0.6rem" }}>Add a New Opening</p>
                </div>
              </motion.div>
            </div>
          )}
        </div>
        <AddRecordButton
          icon={<Plus />}
          onClick={() => setAddDialogOpen(true)}
        />
      </div>
      <ResponsiveModal
        title="Add New Job Opening"
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        description="Create a clean and mobile-friendly opening card for applicants"
      >
        <div style={{ padding: "0 1rem 1rem", display: "grid", gap: "0.9rem" }}>
          <div style={{ display: "grid", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600 }}>Job Type</label>
            <Select
              value={newOpening.jobType}
              onValueChange={(value) =>
                setNewOpening((prev) => ({ ...prev, jobType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Full Time</SelectItem>
                <SelectItem value="part-time">Part Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div style={{ display: "grid", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600 }}>Job Title</label>
            <input
              value={newOpening.jobTitle}
              onChange={(e) =>
                setNewOpening((prev) => ({ ...prev, jobTitle: e.target.value }))
              }
              placeholder="Enter job title"
              style={{
                width: "100%",
                border: "1px solid rgba(100,100,100,0.3)",
                borderRadius: "0.5rem",
                padding: "0.6rem 0.7rem",
                fontSize: "0.9rem",
              }}
            />
          </div>

          <div style={{ display: "grid", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600 }}>Description</label>
            <textarea
              value={newOpening.description}
              onChange={(e) =>
                setNewOpening((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Enter job description"
              rows={4}
              style={{
                width: "100%",
                border: "1px solid rgba(100,100,100,0.3)",
                borderRadius: "0.5rem",
                padding: "0.6rem 0.7rem",
                fontSize: "0.9rem",
                resize: "vertical",
              }}
            />
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              fontSize: "0.85rem",
              fontWeight: 500,
            }}
          >
            <Checkbox
              checked={newOpening.activelyHiring}
              onCheckedChange={(checked) =>
                setNewOpening((prev) => ({
                  ...prev,
                  activelyHiring: checked === true,
                }))
              }
            />
            Actively Hiring
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddOpening} disabled={saving}>
              {saving ? "Adding..." : "Add Opening"}
            </Button>
          </div>
        </div>
      </ResponsiveModal>

      {/* All Applications Modal */}
      {isMobile ? (
        <ResponsiveModal
          title="All Applications"
          open={allApplicationsModalOpen}
          onOpenChange={setAllApplicationsModalOpen}
          description={`Total Applications ${applications.length}`}
        >
          {renderApplicationsContent()}
        </ResponsiveModal>
      ) : (
        <Dialog open={allApplicationsModalOpen} onOpenChange={setAllApplicationsModalOpen}>
          <DialogContent style={{ maxWidth: "1100px", width: "95vw" }}>
            <DialogHeader>
              <DialogTitle>All Applications</DialogTitle>
              <DialogDescription>
                Total applications: {applications.length}
              </DialogDescription>
            </DialogHeader>
            {renderApplicationsContent()}
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this application?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                applicationToDelete && handleDeleteApplication(applicationToDelete.id)
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmClearAllOpen} onOpenChange={setConfirmClearAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Applications</DialogTitle>
            <DialogDescription>
              This action will permanently delete all application records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClearAllOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAllApplications}
              disabled={deleting}
            >
              {deleting ? "Clearing..." : "Clear All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
