import AddRecordButton from "@/components/add-record-button";
import Back from "@/components/back";
import RefreshButton from "@/components/refresh-button";
import Work from "@/components/work";
import { db } from "@/firebase";
import { Checkbox, Input, message, Modal, Select } from "antd";
import { addDoc, collection, getDocs, query } from "firebase/firestore";
import { motion } from "framer-motion";
import { FileText, LoaderCircle, Plus } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
// import { Opening } from "@/components/opening";

export default function Openings() {
  const [fetchingData, setfetchingData] = useState(false);
  const [records, setRecords] = useState([]);
  const [applications, setApplications] = useState<any>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newOpening, setNewOpening] = useState({
    jobType: "full-time",
    jobTitle: "",
    description: "",
    activelyHiring: false,
  });
  const [saving, setSaving] = useState(false);

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
                <button style={{ fontSize: "0.8rem", padding: "0.75rem 1rem" }}>
                  <FileText width={"0.9rem"} />
                  All Applications
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
    </motion.div>
  );
}
