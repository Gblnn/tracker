import AddRecordButton from "@/components/add-record-button";
import Back from "@/components/back";
import RefreshButton from "@/components/refresh-button";
import Work from "@/components/work";
import { db } from "@/firebase";
import { Checkbox, Input, message, Modal, Select } from "antd";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  writeBatch,
} from "firebase/firestore";
import { motion } from "framer-motion";
import { FileText, LoaderCircle, Plus, Trash2 } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
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
  const [applications, setApplications] = useState<any>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [allApplicationsModalOpen, setAllApplicationsModalOpen] =
    useState(false);
  const [newOpening, setNewOpening] = useState({
    jobType: "full-time",
    jobTitle: "",
    description: "",
    activelyHiring: false,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    fetchApplications();
    try {
      setfetchingData(true);
      const RecordCollection = collection(db, "openings");
      const recordQuery = query(RecordCollection);
      const querySnapshot = await getDocs(recordQuery);
      const fetchedData: any = [];

      querySnapshot.forEach((doc: any) => {
        fetchedData.push({ id: doc.id, ...doc.data() });
      });
      setRecords(fetchedData);

      setfetchingData(false);
    } catch (error) {
      console.log(error);
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

  const handleAddOpening = async () => {
    setSaving(true);
    try {
      await addDoc(collection(db, "openings"), {
        jobType: newOpening.jobType,
        jobTitle: newOpening.jobTitle,
        description: newOpening.description,
        activelyHiring: newOpening.activelyHiring,
        created_at: new Date(),
      });
      message.success("Opening added");
      setAddDialogOpen(false);
      setNewOpening({
        jobType: "full-time",
        jobTitle: "",
        description: "",
        activelyHiring: false,
      });
      fetchData();
    } catch (err) {
      message.error("Failed to add opening");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    try {
      await deleteDoc(doc(db, "applications", id));
      message.success("Application deleted");
      fetchApplications();
    } catch (err) {
      message.error("Failed to delete application");
    }
  };

  const handleClearAllApplications = async () => {
    Modal.confirm({
      title: "Clear All Applications",
      content:
        "Are you sure you want to delete all applications? This action cannot be undone.",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        setDeleting(true);
        try {
          const batch = writeBatch(db);
          applications.forEach((app: any) => {
            batch.delete(doc(db, "applications", app.id));
          });
          await batch.commit();
          message.success("All applications cleared");
          fetchApplications();
        } catch (err) {
          message.error("Failed to clear applications");
        } finally {
          setDeleting(false);
        }
      },
    });
  };

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
                  style={{ fontSize: "0.8rem", padding: "0.65rem 1rem" }}
                  onClick={() => setAllApplicationsModalOpen(true)}
                >
                  <FileText width={"0.9rem"} />
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
                color="dodgerblue"
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
                    console.log("CV URL for applicant:", e.name, ":", e.cv);
                    return {
                      name: e.name,
                      email: e.email,
                      phone: e.phone,
                      cv: e.cvLink,
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
      <Modal
        title="Add New Job Opening"
        open={addDialogOpen}
        onCancel={() => setAddDialogOpen(false)}
        onOk={handleAddOpening}
        confirmLoading={saving}
        okText="Add"
        cancelText="Cancel"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label>Job Type</label>
            <Select
              value={newOpening.jobType}
              onChange={(value) =>
                setNewOpening((prev) => ({ ...prev, jobType: value }))
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
              value={newOpening.jobTitle}
              onChange={(e) =>
                setNewOpening((prev) => ({ ...prev, jobTitle: e.target.value }))
              }
              placeholder="Enter job title"
            />
          </div>
          <div>
            <label>Description</label>
            <Input.TextArea
              value={newOpening.description}
              onChange={(e) =>
                setNewOpening((prev) => ({
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
              checked={newOpening.activelyHiring}
              onChange={(e) =>
                setNewOpening((prev) => ({
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

      {/* All Applications Modal */}
      <Modal
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>All Applications</span>
            <button
              onClick={handleClearAllApplications}
              style={{
                background: "none",
                border: "none",
                color: "crimson",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.9rem",
                marginRight: "2rem",
              }}
              disabled={deleting || applications.length === 0}
            >
              Clear All
            </button>
          </div>
        }
        open={allApplicationsModalOpen}
        onCancel={() => setAllApplicationsModalOpen(false)}
        width={1000}
        footer={null}
      >
        <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  Email
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  Phone
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  Applied For
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  Applied On
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  CV
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app: any) => {
                const jobTitle =
                  records.find((r: any) => r.id === app.jobId)?.jobTitle ||
                  "Unknown Position";
                return (
                  <tr key={app.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "12px" }}>{app.name}</td>
                    <td style={{ padding: "12px" }}>
                      <a href={`mailto:${app.email}`}>{app.email}</a>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <a href={`tel:${app.phone}`}>{app.phone}</a>
                    </td>
                    <td style={{ padding: "12px" }}>{jobTitle}</td>
                    <td style={{ padding: "12px" }}>
                      {app.created_at?.toDate
                        ? moment(app.created_at.toDate()).format("LL")
                        : "N/A"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {app.cvLink ? (
                        <a
                          href={app.cvLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View CV
                        </a>
                      ) : (
                        "No CV"
                      )}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <button
                        onClick={() => {
                          Modal.confirm({
                            title: "Delete Application",
                            content:
                              "Are you sure you want to delete this application?",
                            okText: "Yes",
                            okType: "danger",
                            cancelText: "No",
                            onOk: () => handleDeleteApplication(app.id),
                          });
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "crimson",
                          cursor: "pointer",
                          padding: "4px",
                        }}
                      >
                        <Trash2 width="1rem" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {applications.length === 0 && (
            <div
              style={{ textAlign: "center", padding: "2rem", color: "#888" }}
            >
              No applications found
            </div>
          )}
        </div>
      </Modal>
    </motion.div>
  );
}
