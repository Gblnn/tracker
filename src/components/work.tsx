import { motion } from "framer-motion";
import { ChevronRight, PenLine, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ApplicationCard from "@/components/application-card";
import { toast } from "sonner";

interface Props {
  id?: string;
  date?: string;
  designation?: string;
  experience?: string;
  desc?: string;
  mailto?: string;
  jobType?: string;
  activelyHiring?: boolean;
  applicants?: any;
  applicantsList?: Array<{
    id?: string;
    name: string;
    email: string;
    phone: string;
    cv: string;
    cvLink?: string;
    jobId?: string;
    jobTitle?: string;
    created_at?: any;
  }>;
}

export default function Work(props: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editData, setEditData] = useState({
    jobType: props.jobType || "full-time",
    jobTitle: props.designation || "",
    description: props.desc || "",
    activelyHiring: props.activelyHiring || false,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [applicantsData, setApplicantsData] = useState(props.applicantsList || []);
  const [shortlistedApplicationIds, setShortlistedApplicationIds] = useState<
    Set<string>
  >(new Set());
  const [shortlistingId, setShortlistingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [applicantsRenderLimit, setApplicantsRenderLimit] = useState(24);

  useEffect(() => {
    setApplicantsData(props.applicantsList || []);
  }, [props.applicantsList]);

  useEffect(() => {
    if (!drawerOpen) return;

    setApplicantsRenderLimit(24);

    const fetchShortlistedApplications = async () => {
      try {
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
      } catch (error) {
        console.error("Failed to load shortlist state", error);
      }
    };

    fetchShortlistedApplications();
  }, [drawerOpen]);

  const handleSave = async () => {
    if (!props.id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "openings", props.id), {
        jobType: editData.jobType,
        jobTitle: editData.jobTitle,
        description: editData.description,
        activelyHiring: editData.activelyHiring,
      });
      toast.success("Opening updated");
      setEditOpen(false);
      window.location.reload();
    } catch (err) {
      toast.error("Failed to update opening");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!props.id) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "openings", props.id));
      toast.success("Opening deleted");
      setEditOpen(false);
      window.location.reload();
    } catch (err) {
      toast.error("Failed to delete opening");
    } finally {
      setDeleting(false);
    }
  };

  const handleShortlistApplicant = async (app: any) => {
    if (!app?.id) {
      toast.error("Unable to shortlist this applicant");
      return;
    }

    if (shortlistedApplicationIds.has(app.id)) {
      toast("Already shortlisted");
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
        toast("Already shortlisted");
        return;
      }

      const { id, ...payload } = app;
      await addDoc(collection(db, "shortlist"), {
        ...payload,
        applicationId: id,
        shortlistedAt: new Date(),
        sourceCollection: "applications",
      });

      setShortlistedApplicationIds((prev) => new Set(prev).add(id));
      toast.success("Application added to shortlist");
    } catch (error) {
      console.error("Shortlist failed", error);
      toast.error("Failed to add to shortlist");
    } finally {
      setShortlistingId(null);
    }
  };

  const handleDeclineApplicant = async (app: any) => {
    if (!app?.id) {
      toast.error("Unable to decline this applicant");
      return;
    }

    setDecliningId(app.id);
    try {
      await deleteDoc(doc(db, "applications", app.id));
      setApplicantsData((prev) => prev.filter((item) => item.id !== app.id));
      toast.success("Application declined");
    } catch (error) {
      console.error("Decline failed", error);
      toast.error("Failed to decline applicant");
    } finally {
      setDecliningId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
        opacity: { duration: 0.6 },
        y: { duration: 0.4 },
      }}
      viewport={{ once: true }}
      className="work-card"
      style={{
        width: "32ch",
        height: "",
        borderRadius: "0.75rem",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexFlow: "column",
          flex: 1,
          background: "linear-gradient(120deg, #002244, midnightblue)",
          color:"white",
          padding: "",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            border: "",
            display: "flex",
            justifyContent: "flex-end",
            padding: "1rem",
          }}
        >
          <button
            style={{ padding: "0.15rem 0.75rem", fontSize: "0.8rem" }}
            onClick={() => setEditOpen(true)}
          >
            <PenLine width={"0.8rem"} />
            Update
          </button>
        </div>

        <div style={{ padding: "2rem", paddingTop: 0 }}>
          <div style={{ marginBottom: "1.75rem" }}>
            <p
              style={{
                fontSize: "0.75rem",
                fontWeight: "800",
                color: "white",
                background: "rgba(220,20,60)",
                padding: "0.25rem 0.75rem",
                borderRadius: "1rem",
                width: "fit-content",
                marginBottom: "1rem",
              }}
            >
              {props.jobType ? props.jobType.toUpperCase() : "FULL TIME"}
            </p>

            <p
              style={{
                fontSize: "1.35rem",
                fontWeight: "500",
                color: "white",
                lineHeight: "1.3",
                marginBottom: "0.75rem",
              }}
            >
              {props.designation}
            </p>

            <p style={{ fontSize: "0.8rem", opacity: 0.5 }}>
              Posted on {props.date}
            </p>
          </div>

          <p
            style={{
              fontSize: "0.85rem",
              opacity: 0.7,
              lineHeight: "1.6",
              height: "2.5rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {props.desc}
          </p>
        </div>

        <div
          style={{
            padding: "1.25rem 2rem",
            border: "1px solid rgba(100 100 100/ 10%)",
            borderBottomLeftRadius: "0.5rem",
            borderBottomRightRadius: "0.5rem",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
          }}
          onClick={() =>
            props.applicants &&
            Number(props.applicants) > 0 &&
            setDrawerOpen(true)
          }
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              justifyContent: "space-between",
            }}
          >
            <Users width="1rem" color="crimson" />
            <div></div>
            <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
              <b>{props.applicants}</b>{" "}
              {Number(props.applicants) > 1 || Number(props.applicants) == 0
                ? "Applicants"
                : "Applicant"}
            </p>
            <ChevronRight width={"1rem"} />
          </div>
        </div>
      </div>
      <ResponsiveModal
        title="Update Job Posting"
        open={editOpen}
        onOpenChange={setEditOpen}
        description="Edit details for this opening"
      >
        <div style={{ padding: "0 1rem 1rem", display: "grid", gap: "0.85rem" }}>
          <div style={{ display: "grid", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600 }}>Job Type</label>
            <Select
              value={editData.jobType}
              onValueChange={(value) =>
                setEditData((prev) => ({ ...prev, jobType: value }))
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
              value={editData.jobTitle}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, jobTitle: e.target.value }))
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
              value={editData.description}
              onChange={(e) =>
                setEditData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
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
              checked={editData.activelyHiring}
              onCheckedChange={(checked) =>
                setEditData((prev) => ({
                  ...prev,
                  activelyHiring: checked === true,
                }))
              }
            />
            Actively Hiring
          </label>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginTop: "0.5rem" }}>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving || deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={saving || deleting}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || deleting}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </ResponsiveModal>
      {/* Applicants Dialog */}
      <ResponsiveModal
        title="Applicants"
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        description={`${applicantsData.length || 0} applicant${Number(applicantsData.length) === 1 ? "" : "s"} for this role`}
      >
        <div style={{ padding: "0 1rem 1rem" }}>
          {applicantsData && applicantsData.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "0.8rem",
                maxHeight: "70vh",
                overflowY: "auto",
              }}
            >
              {applicantsData.slice(0, applicantsRenderLimit).map((app, idx) => {
                const shortlisted = app.id
                  ? shortlistedApplicationIds.has(app.id)
                  : false;

                return (
                  <ApplicationCard
                    key={app.id || idx}
                    app={app}
                    shortlisted={shortlisted}
                    shortlisting={shortlistingId === app.id}
                    declining={decliningId === app.id}
                    onShortlist={handleShortlistApplicant}
                    onDecline={handleDeclineApplicant}
                  />
              )})}
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "#888", padding: "2rem 0" }}>
              No applicants found.
            </div>
          )}

          {applicantsData.length > applicantsRenderLimit && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "0.9rem" }}>
              <Button
                variant="outline"
                onClick={() =>
                  setApplicantsRenderLimit((prev) =>
                    Math.min(prev + 24, applicantsData.length)
                  )
                }
              >
                Load More ({applicantsData.length - applicantsRenderLimit} remaining)
              </Button>
            </div>
          )}
        </div>
      </ResponsiveModal>
    </motion.div>
  );
}
