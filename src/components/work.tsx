import { motion } from "framer-motion";
import { ChevronRight, PenLine, Users } from "lucide-react";
import { useState } from "react";
import { Modal, Input, Select, Checkbox, Button, message } from "antd";
import { db } from "@/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";

interface Props {
  id?: string;
  date?: string;
  designation?: string;
  experience?: string;
  desc?: string;
  mailto?: string;
  jobType?: string;
  activelyHiring?: boolean;
}

export default function Work(props: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    jobType: props.jobType || "full-time",
    jobTitle: props.designation || "",
    description: props.desc || "",
    activelyHiring: props.activelyHiring || false,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      message.success("Opening updated");
      setEditOpen(false);
      window.location.reload();
    } catch (err) {
      message.error("Failed to update opening");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!props.id) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "openings", props.id));
      message.success("Opening deleted");
      setEditOpen(false);
      window.location.reload();
    } catch (err) {
      message.error("Failed to delete opening");
    } finally {
      setDeleting(false);
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
        borderRadius: "0.75rem",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div
        style={{
          background: "linear-gradient(120deg, #002244, midnightblue)",
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
            style={{ marginBottom: "" }}
            onClick={() => setEditOpen(true)}
          >
            <PenLine width={"1.25rem"} />
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
            }}
          >
            {props.desc}
          </p>
        </div>

        <div
          style={{
            padding: "1.25rem 2rem",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
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
              <b>0</b> Applicants
            </p>
            <ChevronRight width={"1rem"} />
          </div>
        </div>
      </div>
      <Modal
        title="Edit Job Posting"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={handleSave}
        confirmLoading={saving}
        okText="Save"
        cancelText="Cancel"
        footer={[
          <Button
            key="delete"
            danger
            loading={deleting}
            onClick={handleDelete}
            disabled={saving}
          >
            Delete
          </Button>,
          <Button
            key="cancel"
            onClick={() => setEditOpen(false)}
            disabled={saving || deleting}
          >
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={handleSave}
            loading={saving}
            disabled={deleting}
          >
            Save
          </Button>,
        ]}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label>Job Type</label>
            <Select
              value={editData.jobType}
              onChange={(value) =>
                setEditData((prev) => ({ ...prev, jobType: value }))
              }
              style={{ width: "100%" }}
            >
              <Select.Option value="full-time">Full Time</Select.Option>
              <Select.Option value="part-time">Part Time</Select.Option>
            </Select>
          </div>
          <div>
            <label>Job Title</label>
            <Input
              value={editData.jobTitle}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, jobTitle: e.target.value }))
              }
              placeholder="Enter job title"
            />
          </div>
          <div>
            <label>Description</label>
            <Input.TextArea
              value={editData.description}
              onChange={(e) =>
                setEditData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter job description"
              rows={4}
            />
          </div>
          <div>
            <Checkbox
              checked={editData.activelyHiring}
              onChange={(e) =>
                setEditData((prev) => ({
                  ...prev,
                  activelyHiring: e.target.checked,
                }))
              }
            >
              Actively Hiring
            </Checkbox>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
