import Back from "@/components/back";
import DefaultDialog from "@/components/ui/default-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { auth, db } from "@/firebase";
import { LoadingOutlined } from "@ant-design/icons";
import emailjs from "@emailjs/browser";
import { Drawer, Input, message, Modal } from "antd";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Bug,
  Database,
  Eye,
  File,
  LoaderCircle,
  Menu,
  MinusCircle,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import moment from "moment";
import { useRef, useState } from "react";

// Add styles at the top of the file
const styles = {
  mobileMenuButton: {
    display: "none",
  },
  inputForm: {
    width: "30%",
    // background: "rgba(255 255 255/ 5%)",
    borderRadius: "0.5rem",
  },
  preview: {
    flex: 1,
    // background: "rgba(255 255 255/ 5%)",
    borderRadius: "0.5rem",
  },
};

// Input style for all fields
const inputStyle = {
  padding: "0.5rem",
  borderRadius: "0.5rem",
  border: "1px solid rgba(100 100 100/ 50%)",
  fontSize: "1rem",
};

// Table cell style for preview
const tableCellStyle = {
  border: "1px solid rgba(100 100 100/ 50%)",
  padding: "8px 12px",
  fontSize: "0.65rem",
  verticalAlign: "top",
  fontFamily: "",
  background: "#fff",
};

export default function OfferLetters() {
  //   const usenavigate = useNavigate();

  const [bugDialog, setBugDialog] = useState(false);
  const [issue, setIssue] = useState("");
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [formData, setFormData] = useState<{
    date: string;
    refNo: string;
    candidateName: string;
    position: string;
    workLocation: string;
    salary: string;
    allowance: string;
    grossSalary: string;
    attendance: string;
    probation: string;
    reportingDate: string;
    contractPeriod: string;
    noticePeriod: string;
    noticePeriodSubsections: string[];
    accomodation: string;
    food: string;
    transport: string;
    visaStatus: string;
    communication: string;
    medical: string;
    insurance: string;
    annualLeave: string;
    gratuity: string;
    leaveEncashment: string;
    workingHours: string;
    [key: string]: string | string[];
  }>({
    date: Date(),
    refNo: "",
    candidateName: "",
    position: "",
    workLocation: "",
    salary: "",
    allowance: "",
    grossSalary: "",
    attendance: "",
    probation: "",
    reportingDate: "",
    contractPeriod: "",
    noticePeriod: "",
    noticePeriodSubsections: [],
    accomodation: "",
    food: "",
    transport: "",
    visaStatus: "",
    communication: "",
    medical: "",
    insurance: "",
    annualLeave: "",
    gratuity: "",
    leaveEncashment: "",
    workingHours: "",
  });

  const tableRef = useRef<HTMLDivElement>(null);
  const restRef = useRef<HTMLDivElement>(null);
  const signatureRef = useRef<HTMLDivElement>(null);

  const serviceId = "service_fixajl8";
  const templateId = "template_0f3zy3e";

  const [offerLettersDrawerVisible, setOfferLettersDrawerVisible] =
    useState(false);
  const [offerLetters, setOfferLetters] = useState<any[]>([]);
  const [offerLettersLoading, setOfferLettersLoading] = useState(false);
  const [editingLetter, setEditingLetter] = useState<any>(null);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedLetterId, setLoadedLetterId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<any>(null);

  const sendBugReport = async () => {
    setLoading(true);
    await emailjs.send(serviceId, templateId, {
      name: auth.currentUser?.email,
      subject:
        "Bug Report - " +
        moment().format("ll") +
        " from " +
        auth.currentUser?.email,
      recipient: "goblinn688@gmail.com",
      message: issue,
    });
    setLoading(false);
    message.success("Bug Report sent");
    setBugDialog(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // Compare with original data to detect changes
      if (originalFormData) {
        const hasChanges = Object.keys(newData).some(
          (key) => newData[key] !== originalFormData[key]
        );
        setHasChanges(hasChanges);
      }
      return newData;
    });
  };

  const handleAddNoticePeriodSubsection = () => {
    setFormData((prev) => ({
      ...prev,
      noticePeriodSubsections: [...prev.noticePeriodSubsections, ""],
    }));
  };

  const handleRemoveNoticePeriodSubsection = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      noticePeriodSubsections: prev.noticePeriodSubsections.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const handleNoticePeriodSubsectionChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      noticePeriodSubsections: prev.noticePeriodSubsections.map(
        (subsection, i) => (i === index ? value : subsection)
      ),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await addDoc(collection(db, "offer_letters"), {
        ...formData,
        generated_at: Timestamp.now(),
        generated_by: auth.currentUser?.email || null,
      });
      message.success("Offer letter details saved to database");
      const tableNode = tableRef.current;
      const restNode = restRef.current;
      const signatureNode = signatureRef.current;
      if (!tableNode || !restNode || !signatureNode) return;
    } catch (error) {
      message.error("Failed to generate PDF or save to database");
    } finally {
      setSaving(false);
    }
  };

  // PDF Generation Handler (multi-page)
  const handleGeneratePDF = async () => {
    setPdfLoading(true);
    try {
      // Save offer letter details to Firestore
      await addDoc(collection(db, "offer_letters"), {
        ...formData,
        generated_at: Timestamp.now(),
        generated_by: auth.currentUser?.email || null,
      });
      message.success("Offer letter details saved to database");
      const tableNode = tableRef.current;
      const restNode = restRef.current;
      const signatureNode = signatureRef.current;
      if (!tableNode || !restNode || !signatureNode) return;

      // Render table (page 1)
      const tableCanvas = await html2canvas(tableNode, { scale: 2 });
      const tableImgData = tableCanvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "px", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const tableProps = pdf.getImageProperties(tableImgData);
      const tableHeight = (tableProps.height * pageWidth) / tableProps.width;
      pdf.addImage(tableImgData, "PNG", 0, 0, pageWidth, tableHeight);

      // Render rest (page 2)
      const restCanvas = await html2canvas(restNode, { scale: 2 });
      const restImgData = restCanvas.toDataURL("image/png");
      pdf.addPage();
      const restProps = pdf.getImageProperties(restImgData);
      const restHeight = (restProps.height * pageWidth) / restProps.width;
      pdf.addImage(restImgData, "PNG", 0, 0, pageWidth, restHeight);

      // Render signatures (page 3)
      const signatureCanvas = await html2canvas(signatureNode, { scale: 2 });
      const signatureImgData = signatureCanvas.toDataURL("image/png");
      pdf.addPage();
      const signatureProps = pdf.getImageProperties(signatureImgData);
      const signatureHeight =
        (signatureProps.height * pageWidth) / signatureProps.width;
      pdf.addImage(signatureImgData, "PNG", 0, 0, pageWidth, signatureHeight);

      pdf.save(`Offer_Letter_${formData.candidateName || "Candidate"}.pdf`);
    } catch (err) {
      message.error("Failed to generate PDF or save to database");
    } finally {
      setPdfLoading(false);
    }
  };

  // Fetch offer letters when drawer opens
  const fetchOfferLetters = async () => {
    setOfferLettersLoading(true);
    try {
      const q = query(
        collection(db, "offer_letters"),
        orderBy("generated_at", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setOfferLetters(data);
    } catch (err) {
      message.error("Failed to fetch offer letters");
    } finally {
      setOfferLettersLoading(false);
    }
  };

  const handleEditLetter = async () => {
    if (!editingLetter?.id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "offer_letters", editingLetter.id), {
        ...editingLetter,
        updated_at: Timestamp.now(),
      });
      message.success("Offer letter updated");
      setEditDialogVisible(false);
      fetchOfferLetters();
    } catch (err) {
      message.error("Failed to update offer letter");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLetter = async (id: string) => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "offer_letters", id));
      message.success("Offer letter deleted");
      fetchOfferLetters();
    } catch (err) {
      message.error("Failed to delete offer letter");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!loadedLetterId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "offer_letters", loadedLetterId), {
        ...formData,
        updated_at: Timestamp.now(),
      });
      message.success("Offer letter updated");
      setLoadedLetterId(null);
      setHasChanges(false);
      setOriginalFormData(null);
      fetchOfferLetters();
    } catch (err) {
      message.error("Failed to update offer letter");
    } finally {
      setSaving(false);
    }
  };

  const handleLetterClick = (ol: any) => {
    setFormData((prev) => {
      const newData = { ...prev };
      Object.keys(newData).forEach((key) => {
        if (ol[key] !== undefined) newData[key] = ol[key];
      });
      return newData;
    });
    setOriginalFormData(ol); // Store original data for comparison
    setLoadedLetterId(ol.id);
    setHasChanges(false);
    setOfferLettersDrawerVisible(false);
  };

  const handleClearForm = () => {
    setFormData({
      date: Date(),
      refNo: "",
      candidateName: "",
      position: "",
      workLocation: "",
      salary: "",
      allowance: "",
      grossSalary: "",
      attendance: "",
      probation: "",
      reportingDate: "",
      contractPeriod: "",
      noticePeriod: "",
      noticePeriodSubsections: [],
      accomodation: "",
      food: "",
      transport: "",
      visaStatus: "",
      communication: "",
      medical: "",
      insurance: "",
      annualLeave: "",
      gratuity: "",
      leaveEncashment: "",
      workingHours: "",
    });
    setLoadedLetterId(null);
    setHasChanges(false);
    setOriginalFormData(null);
  };

  const renderInputForm = () => (
    <div
      style={{
        position: "fixed",
        border: "",
        padding: "",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        height: "100%",
        overflowY: "auto",
        fontSize: "0.8rem",
        maxHeight: "60ch",
      }}
    >
      <div
        style={{
          width: "50ch",
          display: "flex",
          padding: "1.25rem",
          border: "",
          backdropFilter: "blur(16px)",
          borderTopLeftRadius: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <File />
          <h2>Offer Letter Details</h2>
        </div>
        <button
          onClick={handleClearForm}
          style={{
            background: "rgba(100 100 100/ 40%)",
            padding: "0.15rem 0.75rem",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "indianred",
            fontSize: "0.8rem",
          }}
        >
          <X width="0.9rem" />
          Clear
        </button>
      </div>

      <div
        style={{
          padding: "1.5rem",
          display: "flex",
          flexFlow: "column",
          gap: "0.75rem",
          paddingTop: "",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <label>Reference Number</label>
          <input
            type="text"
            name="refNo"
            value={formData.refNo}
            onChange={handleInputChange}
            placeholder="Enter Reference Number"
            style={inputStyle}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <label>Candidate Name</label>
          <input
            type="text"
            name="candidateName"
            value={formData.candidateName}
            onChange={handleInputChange}
            placeholder="Enter candidate name"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Position</label>
          <input
            type="text"
            name="position"
            value={formData.position}
            onChange={handleInputChange}
            placeholder="Enter position"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Location</label>
          <input
            type="text"
            name="workLocation"
            value={formData.workLocation}
            onChange={handleInputChange}
            placeholder="Enter work location"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Basic Salary (OMR)</label>
          <input
            type="number"
            name="salary"
            value={formData.salary}
            onChange={handleInputChange}
            placeholder="Enter salary"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Allowance (OMR)</label>
          <input
            type="number"
            name="allowance"
            value={formData.allowance}
            onChange={handleInputChange}
            placeholder="Enter Allowance"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Attendance</label>
          <input
            type="text"
            name="attendance"
            value={formData.attendance}
            onChange={handleInputChange}
            placeholder="Enter Attendance Terms"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Probation</label>
          <input
            type="text"
            name="probation"
            value={formData.probation}
            onChange={handleInputChange}
            placeholder="Enter Probation Terms"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Report for Duty</label>
          <input
            type="date"
            name="reportingDate"
            value={formData.reportingDate}
            onChange={handleInputChange}
            placeholder="Enter Reporting Date"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Contract Period</label>
          <input
            type="text"
            name="contractPeriod"
            value={formData.contractPeriod}
            onChange={handleInputChange}
            placeholder="Enter Contract Period"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Notice Period</label>
          <input
            type="text"
            name="noticePeriod"
            value={formData.noticePeriod}
            onChange={handleInputChange}
            placeholder="Enter Notice Period"
            style={inputStyle}
          />
          <div style={{ marginTop: "0.5rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              <label style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                Sub-sections
              </label>
              <button
                onClick={handleAddNoticePeriodSubsection}
                style={{
                  background: "rgba(100 100 100/ 40%)",
                  color: "skyblue",
                  border: "none",
                  padding: "0.13rem 0.75rem",
                  borderRadius: "0.25rem",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                <Plus width={"0.8rem"} />
                Add Sub-section
              </button>
            </div>
            {formData.noticePeriodSubsections.map((subsection, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid rgba(100 100 100/ 20%)",
                  borderRadius: "0.5rem",
                  padding: "0.75rem",
                  marginBottom: "",
                  background: "rgba(100 100 100/ 5%)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "",
                  }}
                >
                  <input
                    type="text"
                    value={subsection}
                    onChange={(e) =>
                      handleNoticePeriodSubsectionChange(index, e.target.value)
                    }
                    placeholder="Enter sub-section content"
                    style={inputStyle}
                  />
                  <button
                    onClick={() => handleRemoveNoticePeriodSubsection(index)}
                    style={{
                      color: "white",
                      border: "none",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.25rem",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      marginLeft: "0.5rem",
                    }}
                  >
                    <MinusCircle width={"1.25rem"} color="crimson" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Accomodation</label>
          <input
            type="text"
            name="accomodation"
            value={formData.accomodation}
            onChange={handleInputChange}
            placeholder="Enter Accomodation Terms"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Food</label>
          <input
            type="text"
            name="food"
            value={formData.food}
            onChange={handleInputChange}
            placeholder="Enter Food Terms"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Transport</label>
          <input
            type="text"
            name="transport"
            value={formData.transport}
            onChange={handleInputChange}
            placeholder="Enter Transport Terms"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Visa Status</label>
          <input
            type="text"
            name="visaStatus"
            value={formData.visaStatus}
            onChange={handleInputChange}
            placeholder="Enter Visa Terms"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Communications</label>
          <input
            type="text"
            name="communication"
            value={formData.communication}
            onChange={handleInputChange}
            placeholder="Enter Communication Terms"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Insurance</label>
          <input
            type="text"
            name="insurance"
            value={formData.insurance}
            onChange={handleInputChange}
            placeholder="Enter Insurance Terms"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Annual Leave</label>
          <input
            type="text"
            name="annualLeave"
            value={formData.annualLeave}
            onChange={handleInputChange}
            placeholder="Enter Annual Leave Terms"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Gratuity</label>
          <input
            type="text"
            name="gratuity"
            value={formData.gratuity}
            onChange={handleInputChange}
            placeholder="Enter Gratuity"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Leave Encashment</label>
          <input
            type="text"
            name="leaveEncashment"
            value={formData.leaveEncashment}
            onChange={handleInputChange}
            placeholder="Enter Leave Encashment Terms"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Working Hours</label>
          <input
            type="text"
            name="workingHours"
            value={formData.workingHours}
            onChange={handleInputChange}
            placeholder="Enter Working Terms"
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );

  const renderPreview = () => (
    <ScrollArea>
      {/* Page 1: Table only */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          alignItems: "center",
          marginBottom: "1rem",
          marginLeft: "1rem",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Eye />
          <h2>Preview</h2>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            style={{ width: "fit-content" }}
            type="date"
            name="date"
            value={formData.date}
            defaultValue={Date()}
            onChange={handleInputChange}
            placeholder="Enter Date"
          ></input>
          {!loadedLetterId && (
            <button
              onClick={handleSave}
              style={{
                background: "rgba(100 100 100/ 40%)",
                fontSize: "0.8rem",
                padding: "0.5rem 1rem ",
              }}
            >
              {saving ? (
                <LoaderCircle width={"1rem"} className="animate-spin" />
              ) : (
                <Save width={"1rem"} color="dodgerblue" />
              )}

              {saving ? "Saving" : "Save"}
            </button>
          )}
        </div>
      </div>

      <div
        ref={tableRef}
        style={{
          border: "",
          width: "100%",
          maxWidth: 800,
          boxSizing: "border-box",
          padding: "4rem",
          background: "white",
          color: "black",
          borderRadius: "0.5rem",
          boxShadow: "0 0 10px rgba(0 0 0/ 10%)",
          minHeight: "1100px",
          fontFamily: "Aptos",
          fontSize: "0.8rem",
          margin: "1 auto",
          overflowX: "auto",
        }}
      >
        {/* <div
          style={{
            position: "absolute",
            border: "",
            width: "100%",
            top: 0,
            left: 0,
            display: "flex",
            justifyContent: "center",
            marginTop: "2.5rem",
          }}
        >
          <img
            src="/sohar_star_logo.png"
            style={{
              width: "4rem",
              // position: "absolute",
              // top: 0,
              // left: 0,
              // margin: "2rem",
            }}
          />
        </div> */}

        <br />
        <br />
        <br />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {
            <p style={{ fontWeight: 600, textTransform: "uppercase" }}>
              {formData.refNo && "REF: " + formData.refNo}
            </p>
          }

          <p style={{ fontWeight: 600 }}>
            {moment(formData.date).format("DD/MM/YYYY")}
          </p>
        </div>
        {/* Title */}
        <h2
          style={{
            textAlign: "center",
            fontWeight: "",
            fontSize: "1rem",
            marginBottom: "1rem",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          JOB CONTRACT AGREEMENT LETTER
        </h2>
        {/* Intro Paragraph */}
        <p
          style={{
            marginBottom: "1.25rem",
            textAlign: "justify",
            fontSize: "0.75rem",
          }}
        >
          We at <b>Sohar Star United LLC</b>, Sohar, Sultanate of Oman, are
          delighted to offer you the position of{" "}
          <b style={{ textTransform: "uppercase" }}>
            {formData.position || "[Position]"}
          </b>{" "}
          in the organization, subject to the following terms and conditions:
        </p>
        {/* Details Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "2rem",
            fontSize: "0.9rem",
            border: "1px solid",
            textTransform: "uppercase",
          }}
        >
          <tbody>
            <tr style={{ fontSize: "0.8rem" }}>
              <td style={tableCellStyle}>Name</td>
              <td style={tableCellStyle}>
                {formData.candidateName || "[Candidate Name]"}
              </td>
            </tr>
            <tr>
              <td style={tableCellStyle}>Position</td>
              <td style={tableCellStyle}>
                {formData.position || "[Position]"}
              </td>
            </tr>

            <tr>
              <td style={tableCellStyle}>Location</td>
              <td style={tableCellStyle}>
                {formData.workLocation || "Anywhere in Oman"}
              </td>
            </tr>
            <tr>
              <td style={tableCellStyle}>Basic Salary</td>
              <td style={tableCellStyle}>
                OMR {formData.salary || "[Basic Salary]"}
              </td>
            </tr>
            <tr>
              <td style={tableCellStyle}>Allowance</td>
              <td style={tableCellStyle}>{formData.allowance || "N/A"}</td>
            </tr>
            <tr>
              <td style={tableCellStyle}>Gross Salary</td>
              <td style={tableCellStyle}>
                OMR{" "}
                {Number(formData.salary) +
                  Number(formData.allowance) +
                  " (Monthly)" || "[Gross Salary]"}
              </td>
            </tr>
            <tr>
              <td style={tableCellStyle}>
                Site/ Office Attendance, including overtime
              </td>
              <td style={tableCellStyle}>{formData.attendance || "N/A"}</td>
            </tr>
            <tr>
              <td style={tableCellStyle}>Probation Period</td>
              <td style={tableCellStyle}>{formData.probation || "N/A"}</td>
            </tr>
            <tr>
              <td style={tableCellStyle}>Report for Duty On</td>
              <td style={tableCellStyle}>
                {formData.reportingDate
                  ? `On or before ${moment(formData.reportingDate).format(
                      "DD MMMM YYYY"
                    )}`
                  : "[Reporting Date]"}
              </td>
            </tr>
            <tr>
              <td style={tableCellStyle}>Contract Period</td>
              <td style={tableCellStyle}>{formData.contractPeriod || "N/A"}</td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "8px 12px",
                  fontSize: "0.65rem",
                  verticalAlign: "top",
                  border: "none",
                }}
              >
                Notice Period
              </td>
              <td style={tableCellStyle}>
                {formData.noticePeriod ||
                  "No notice period shall be accepted until the end of the project"}
              </td>
            </tr>
            {formData.noticePeriodSubsections.map((subsection, index) => (
              <tr key={index}>
                <td
                  style={{
                    ...tableCellStyle,
                    borderTop: "none",
                    borderBottom: "none",
                    borderRight: "none",
                    background: "transparent",
                  }}
                ></td>
                <td style={{ ...tableCellStyle, borderTop: "none" }}>
                  {subsection}
                </td>
              </tr>
            ))}
            <tr>
              <td style={tableCellStyle}>Accommodation</td>
              <td style={tableCellStyle}>
                {formData.accomodation ||
                  "Single Room Bachelors Accommodation shall be provided by the Company"}
              </td>
            </tr>
            <tr>
              <td style={tableCellStyle}>Food</td>
              <td style={tableCellStyle}>
                {formData.food ||
                  "Shall be provided by the Company in Site Office and at Camp"}
              </td>
            </tr>
            <tr>
              <td style={tableCellStyle}>Transport</td>
              <td style={tableCellStyle}>
                {formData.transport ||
                  "A Car shall be provided by the Company for official use only"}
              </td>
            </tr>
            <tr>
              <td style={tableCellStyle}>VISA Status</td>
              <td style={tableCellStyle}>
                {formData.visaStatus ||
                  "Work VISA shall be provided by the Company. Employee agrees that he shall not join any competing business until the end of the Contract Project"}
              </td>
            </tr>
            <tr>
              <td style={tableCellStyle}>Communications</td>
              <td style={tableCellStyle}>
                {formData.communication ||
                  "A postpaid Company SIM shall be provided for official use only"}
              </td>
            </tr>
            <tr>
              <td style={tableCellStyle}>Medical</td>
              <td style={tableCellStyle}>
                During the service period the company will bear all medical
                expenses for self- excluding dependents, dental, optical,
                gynecology and congenital, if any, shall be borne by the
                company.
              </td>
            </tr>
            {formData.insurance && (
              <tr>
                <td style={tableCellStyle}>Insurance</td>
                <td style={tableCellStyle}>
                  {formData.insurance ||
                    "WC, Medical & Group Life Insurance, under the Company account"}
                </td>
              </tr>
            )}

            <tr>
              <td style={tableCellStyle}>Annual Leave</td>
              <td style={tableCellStyle}>
                {formData.annualLeave ||
                  "No leave shall be granted throughout the project unless there is an extreme emergency."}
              </td>
            </tr>
            {formData.gratuity && (
              <tr>
                <td style={tableCellStyle}>Gratuity</td>
                <td style={tableCellStyle}>{formData.gratuity || "N/A"}</td>
              </tr>
            )}
            {formData.leaveEncashment && (
              <tr>
                <td style={tableCellStyle}>Leave Encashment</td>
                <td style={tableCellStyle}>
                  {formData.leaveEncashment || "N/A"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Page break for preview */}
      <div style={{ height: 40 }} />
      <div
        style={{
          width: "100%",
          textAlign: "center",
          color: "#aaa",
          fontSize: "0.9rem",
          marginBottom: "2rem",
        }}
      >
        --- Page 2 ---
      </div>
      {/* Page 2: Rest of content */}
      <div
        ref={restRef}
        style={{
          border: "",
          width: "100%",
          maxWidth: 800,
          boxSizing: "border-box",
          padding: "4rem",
          background: "white",
          color: "black",
          borderRadius: "0.5rem",
          boxShadow: "0 0 10px rgba(0 0 0/ 10%)",
          minHeight: "1100px",
          fontFamily: "Aptos",
          fontSize: "0.8rem",
          margin: "1 auto",
          overflowX: "auto",
          marginBottom: "4rem",
        }}
      >
        <br />
        <br />
        <br />
        <div style={{ marginBottom: "1.5rem", fontSize: "0.7rem" }}>
          <h3
            style={{
              fontWeight: "600",
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}
          >
            Air Passage
          </h3>
          <p>
            While going on sanctioned leave, to and fro air ticket on a direct
            flight from Oman to the nearest international airport to your
            hometown, once on completion of 18 months.
          </p>
          <br />
          <p>
            <b>Sector of Travel : </b>MUSCAT - (Nearest Hometown International
            Airport )
          </p>
          <p>
            <b>Class of Travel : </b>Economy Class by any Airline
          </p>
        </div>
        <div style={{ marginBottom: "1.5rem", fontSize: "0.7rem" }}>
          <h3
            style={{
              fontWeight: "600",
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}
          >
            Increment Terms
          </h3>
          <p>
            Based on the performance of the individual and the company, at the
            discretion of management.
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem", fontSize: "0.7rem" }}>
          <h3
            style={{
              fontWeight: "600",
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}
          >
            Working Hours
          </h3>
          <p>
            {formData.workingHours ||
              "As laid down by the company from time to time. Your post being a senior level executive in nature you are not eligible for any overtime; though you shall be available during 24 hours of the day on call basis."}
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem", fontSize: "0.7rem" }}>
          <h3
            style={{
              fontWeight: "600",
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}
          >
            Medical Fitness
          </h3>
          <p>
            Your employment with us shall be subject to your medical fitness,
            which will be ascertained after a medical examination by the
            Ministry of Health, Sultanate of Oman, as soon as you arrive and
            periodically thereafter, on being found medically unfit, your
            services are liable to be terminated.
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem", fontSize: "0.7rem" }}>
          <h3
            style={{
              fontWeight: "600",
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}
          >
            Code of Conduct
          </h3>
          <p>
            The Company expects you to strictly maintain a non-alcoholic
            environment. Unlawful Possession of or being under the influence of
            alcoholic drinks or any other items creating mental stimulus will
            invite termination of service without prior notice. You are expected
            to conduct yourself properly to ensure that your conduct and
            dealings are proper, professional and ethical. Your behavior and
            conduct should not in anyway be damaging to the Company’s image and
            welfare. In all cases of inappropriate behavior or misconduct, the
            Company would ensure that the office is communicated to you in
            writing and that every opportunity is afforded for you to defend.
            However, the company reserves the right to terminate your service
            without notice pay when it is justified that you are guilty of
            misconduct. Your services may be terminated by the Company for any
            breach of terms of employment or where the Company finds that your
            services are not satisfactory or where the Company feels it is not
            of its interest to continue your employment.
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem", fontSize: "0.7rem" }}>
          <h3
            style={{
              fontWeight: "600",
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}
          >
            Documentary Evidence
          </h3>
          <p>
            Your date of birth as recorded by the Company on the basis of
            documentary evidence produced by you at the time of your appointment
            is considered as the authenticated date of birth for all purposes
            throughout your service with the Company and will not be changed
            under any circumstances.
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem", fontSize: "0.7rem" }}>
          <h3
            style={{
              fontWeight: "600",
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}
          >
            Confidentiality
          </h3>
          <p>
            During the tenure of your contract with us you may come into
            possession of various information concerned the Company’s business.
            All such information shall be held by you with utmost strict
            confidentiality and shall not be divulged to outsiders unless
            otherwise authorized to do so by the Company during the term of your
            contract and beyond up to five years. In the event of acting in any
            manner contrary to or in breach of this covenant during the course
            of your employment with the Company or thereafter, the company will
            be at the liberty to initiate appropriate action to safeguard its
            interest.
          </p>
        </div>
      </div>

      {/* Page break for preview */}
      <div style={{ height: 40 }} />
      <div
        style={{
          width: "100%",
          textAlign: "center",
          color: "#aaa",
          fontSize: "0.9rem",
          marginBottom: "2rem",
        }}
      >
        --- Page 3 ---
      </div>
      {/* Page 3: Acknowledgment and Signatures */}
      <div
        ref={signatureRef}
        style={{
          border: "",
          width: "100%",
          maxWidth: 800,
          boxSizing: "border-box",
          padding: "4rem",
          background: "white",
          color: "black",
          borderRadius: "0.5rem",
          boxShadow: "0 0 10px rgba(0 0 0/ 10%)",
          minHeight: "1100px",
          fontFamily: "Aptos",
          fontSize: "0.8rem",
          margin: "1 auto",
          overflowX: "auto",
          marginBottom: "4rem",
        }}
      >
        <br />
        <br />
        <br />
        {/* Acknowledgment */}

        <div
          style={{
            marginBottom: "1.5rem",
            fontSize: "0.7rem",
            display: "flex",
            flexFlow: "column",
            gap: "0.5rem",
          }}
        >
          <h3
            style={{
              fontWeight: "600",
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}
          >
            General Terms
          </h3>
          <p>
            In the event of your resignation within two years from your date of
            joining the Company, the costs incurred by the Company towards your
            initial mobilization like recruitment fee, processing charges for
            visa and resident card and other related expenses, and/(or) subject
            to “Employment Bond” if any, will be recovered from you.
          </p>
          <p>
            You shall communicate to the Company any change in your address as
            well as details of next of kin. All communications sent to you in
            the normal course on the address given by you shall be deemed to
            have been received at your end.
          </p>
          <p>
            You are expected to give your whole time of service to us and not
            directly or indirectly enter into any other employment or business
            without our specific consent in writing during the tenure of this
            contract. However, you will be free to seek alternative employment
            after expiry of the period of employment of this contract. You also
            agree to work and reside where we require and to abide by all
            applicable regulations, practices and instructions in operation for
            the guidance and conduct of our staff and the business.
          </p>
        </div>

        {/* Other Terms & Conditions */}
        <h3
          style={{
            fontWeight: "600",
            marginBottom: "0.5rem",
            fontSize: "0.9rem",
          }}
        >
          Other Terms & Conditions
        </h3>
        <ul
          style={{
            marginBottom: "2rem",
            paddingLeft: 24,
            display: "flex",
            flexFlow: "column",
            gap: "0.75rem",
            fontSize: "0.7rem",
          }}
        >
          <li>
            Company Assets, if any in possession are to be returned at the end
            of services, else the cost shall be deducted from the final dues.
          </li>
          <li>
            VISA expenses will be borne by the Company even in case of
            termination during contract period, but not in case the employee
            resigns during the contract period.
          </li>
          <li>
            If you damage any company assets, furniture or vehicles, the company
            will have all rights to recover its compensation from your dues.
          </li>
          <li>
            If the employee does not sign this agreement within the seven days,
            the agreement shall be deemed null and void.
          </li>
          <li>
            In case of failure to report to duty in Oman, the offer letter shall
            become null and void after seven days from the date of the signed
            agreement.
          </li>
        </ul>
        <h3
          style={{
            fontWeight: "600",
            marginBottom: "0.5rem",
            fontSize: "0.9rem",
          }}
        >
          Acknowledgment:
        </h3>
        <p
          style={{
            marginBottom: "2rem",
            textAlign: "justify",
            fontSize: "0.7rem",
          }}
        >
          You hereby confirm and undertake that you shall not, at any time,
          either during the continuance of your employment or after the
          completion of your employment, divulge or use any information acquired
          in the course of your employment, about or relating to the Company, in
          any manner which may directly or indirectly be detrimental to the
          interest of Company.
        </p>
        {/* Signature Lines */}
        <div
          style={{
            marginTop: "4rem",
            display: "flex",
            flexFlow: "column",
            justifyContent: "flex-start",
          }}
        >
          <div style={{}}>
            <div style={{ marginBottom: "2rem" }}>
              Employee Signature _____________________________________
            </div>
          </div>
          <div style={{}}>
            <div style={{ marginBottom: "2rem" }}>
              HR Manager _____________________________________________
            </div>
          </div>
          <div style={{}}>
            <div style={{ marginBottom: "2rem" }}>
              Managing Director ______________________________________
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );

  return (
    <>
      {/* <div style={{border:"", display:"flex", alignItems:"center", justifyContent:'center'}}>
        <ConfettiExplosion/>
        </div> */}
      <div
        style={{
          padding: "",
          // background:
          //   "linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%))",
          height: "100svh",
        }}
      >
        <motion.div>
          <button
            style={{
              position: "fixed",
              bottom: 0,
              right: 0,
              zIndex: 10,
              margin: "2rem",
            }}
            onClick={() => setDrawerVisible(true)}
            className="mobile-menu-button"
          >
            <Menu color="black" width="1.5rem" />
          </button>
          <Back
            fixed
            // title="Doc"
            // icon={<File color="dodgerblue" />}
            extra={
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={handleGeneratePDF}
                  style={{
                    width: "100%",
                    fontSize: "0.9rem",
                    padding: "0.5rem 1rem",
                    background: pdfLoading ? "lightblue" : "dodgerblue",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: pdfLoading ? "not-allowed" : "pointer",
                    opacity: pdfLoading ? 0.7 : 1,
                  }}
                  disabled={pdfLoading}
                >
                  <Sparkles color="white" width={"1rem"} />
                  {pdfLoading ? "Generating..." : "Generate"}
                </button>

                <button
                  style={{ background: "rgba(100 100 100/ 50%)" }}
                  onClick={() => {
                    setOfferLettersDrawerVisible(true);
                    fetchOfferLetters();
                  }}
                >
                  <Database width={"1.25rem"} />
                </button>
                {/* <button
                  onClick={handlePrintPDFPreview}
                  style={{
                    width: "100%",
                    padding: "0.5rem 1rem",
                    background: "rgba(100 100 100/ 50%)",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                  }}
                >
                  <Printer width={"1.25rem"} />
                </button> */}
              </div>
            }
          />
          <br />

          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "75svh",
              }}
            >
              <LoadingOutlined style={{ color: "dodgerblue", scale: "2" }} />
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                gap: "1rem",
                height: "calc(100vh - 8rem)",
                border: "",
                justifyContent: "center",
                paddingTop: "5rem",
              }}
            >
              {/* Input Form - Hidden on mobile */}
              <div className="input-form" style={styles.inputForm}>
                {renderInputForm()}
              </div>

              {/* Preview - Full width on mobile */}
              <div className="" style={{}}>
                {renderPreview()}
              </div>
            </div>
          )}
        </motion.div>

        {/* Mobile Drawer */}
        <Drawer
          title="Offer Letter Details"
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width="80%"
        >
          {renderInputForm()}
        </Drawer>

        <DefaultDialog
          title={"Report a Bug"}
          titleIcon={<Bug color="lightgreen" />}
          extra={
            <div
              style={{
                display: "flex",
                width: "100%",
                flexFlow: "column",
                gap: "0.75rem",
                paddingBottom: "0.5rem",
              }}
            >
              <textarea
                onChange={(e) => setIssue(e.target.value)}
                rows={5}
                placeholder="Describe issue"
              />
            </div>
          }
          open={bugDialog}
          onCancel={() => setBugDialog(false)}
          OkButtonText="Report"
          disabled={issue == ""}
          onOk={() => {
            issue != "" ? sendBugReport() : "";
          }}
          updating={loading}
        />

        {/* Offer Letters Drawer */}
        <Drawer
          title="Offer Letters"
          placement="right"
          onClose={() => setOfferLettersDrawerVisible(false)}
          open={offerLettersDrawerVisible}
          width={window.innerWidth <= 768 ? "100%" : 500}
        >
          {offerLettersLoading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 200,
              }}
            >
              <LoadingOutlined style={{ fontSize: 32, color: "dodgerblue" }} />
            </div>
          ) : offerLetters.length === 0 ? (
            <div style={{ textAlign: "center", color: "#888" }}>
              No offer letters found.
            </div>
          ) : (
            <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {offerLetters.map((ol) => (
                <div
                  key={ol.id}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 12,
                    background: "#fafbfc",
                    cursor: "pointer",
                    transition: "box-shadow 0.2s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{ flex: 1 }}
                      onClick={() => handleLetterClick(ol)}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 16,
                          color: "black",
                          textTransform: "uppercase",
                        }}
                      >
                        {ol.candidateName || "[No Name]"}
                      </div>
                      <div
                        style={{
                          color: "#555",
                          fontSize: 14,
                          textTransform: "uppercase",
                        }}
                      >
                        {ol.position || "[No Position]"}
                      </div>
                      <div style={{ color: "#888", fontSize: 12 }}>
                        {ol.generated_at && ol.generated_at.toDate
                          ? "Generated : " +
                            moment(ol.generated_at.toDate()).format(
                              "DD MMM YYYY, h:mm A"
                            )
                          : ""}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginLeft: "1rem",
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          Modal.confirm({
                            title: "Delete Offer Letter",
                            content:
                              "Are you sure you want to delete this offer letter?",
                            okText: "Yes",
                            okType: "danger",
                            cancelText: "No",
                            onOk: () => handleDeleteLetter(ol.id),
                          });
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "0.25rem",
                        }}
                      >
                        {deleting ? (
                          <LoadingOutlined />
                        ) : (
                          <Trash2 width="1.25rem" color="crimson" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Drawer>
        {loadedLetterId && hasChanges && (
          <button
            onClick={handleSaveChanges}
            style={{
              margin: "1rem",
              position: "fixed",
              bottom: 0,
              right: 0,
              width: "",
              fontSize: "0.9rem",
              padding: "0.5rem 1rem",
              background: "rgba(100 100 100/ 40%)",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
            disabled={saving}
          >
            <Save color="white" width={"1rem"} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )}
      </div>
      {/* <ReleaseNote /> */}

      <style>{`
        .mobile-menu-button {
          display: none;
        }
        .input-form {
          width: 30%;
        }
        .preview {
          flex: 1;
        }
        @media (max-width: 768px) {
          .mobile-menu-button {
            display: block;
          }
          .input-form {
            display: none;
          }
          .preview {
            width: 100%;
          }
        }
      `}</style>

      <Modal
        title="Edit Offer Letter"
        open={editDialogVisible}
        onCancel={() => setEditDialogVisible(false)}
        onOk={handleEditLetter}
        confirmLoading={saving}
        okText="Save"
        cancelText="Cancel"
      >
        {editingLetter && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label>Candidate Name</label>
              <Input
                value={editingLetter.candidateName}
                onChange={(e) =>
                  setEditingLetter((prev: any) => ({
                    ...prev,
                    candidateName: e.target.value,
                  }))
                }
                placeholder="Enter candidate name"
              />
            </div>
            <div>
              <label>Position</label>
              <Input
                value={editingLetter.position}
                onChange={(e) =>
                  setEditingLetter((prev: any) => ({
                    ...prev,
                    position: e.target.value,
                  }))
                }
                placeholder="Enter position"
              />
            </div>
            <div>
              <label>Reference Number</label>
              <Input
                value={editingLetter.refNo}
                onChange={(e) =>
                  setEditingLetter((prev: any) => ({
                    ...prev,
                    refNo: e.target.value,
                  }))
                }
                placeholder="Enter reference number"
              />
            </div>
            <div>
              <label>Work Location</label>
              <Input
                value={editingLetter.workLocation}
                onChange={(e) =>
                  setEditingLetter((prev: any) => ({
                    ...prev,
                    workLocation: e.target.value,
                  }))
                }
                placeholder="Enter work location"
              />
            </div>
            <div>
              <label>Salary (OMR)</label>
              <Input
                type="number"
                value={editingLetter.salary}
                onChange={(e) =>
                  setEditingLetter((prev: any) => ({
                    ...prev,
                    salary: e.target.value,
                  }))
                }
                placeholder="Enter salary"
              />
            </div>
            <div>
              <label>Allowance (OMR)</label>
              <Input
                type="number"
                value={editingLetter.allowance}
                onChange={(e) =>
                  setEditingLetter((prev: any) => ({
                    ...prev,
                    allowance: e.target.value,
                  }))
                }
                placeholder="Enter allowance"
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
