import Back from "@/components/back";
import DefaultDialog from "@/components/ui/default-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { auth } from "@/firebase";
import { LoadingOutlined } from "@ant-design/icons";
import emailjs from "@emailjs/browser";
import { Drawer, message } from "antd";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Bug, Menu, Sparkles } from "lucide-react";
import moment from "moment";
import { useRef, useState } from "react";

// Add styles at the top of the file
const styles = {
  mobileMenuButton: {
    display: "none",
  },
  inputForm: {
    width: "30%",
    background: "rgba(255 255 255/ 5%)",
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
  fontSize: "0.7rem",
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
  const [formData, setFormData] = useState({
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
  });

  const tableRef = useRef<HTMLDivElement>(null);
  const restRef = useRef<HTMLDivElement>(null);

  const serviceId = "service_fixajl8";
  const templateId = "template_0f3zy3e";

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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // PDF Generation Handler (multi-page)
  const handleGeneratePDF = async () => {
    setPdfLoading(true);
    try {
      const tableNode = tableRef.current;
      const restNode = restRef.current;
      if (!tableNode || !restNode) return;

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

      pdf.save(`Offer_Letter_${formData.candidateName || "Candidate"}.pdf`);
    } catch (err) {
      message.error("Failed to generate PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const renderInputForm = () => (
    <div
      style={{
        border: "",
        padding: "",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        height: "100%",
        overflowY: "auto",
        fontSize: "0.8rem",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "50ch",
          display: "flex",
          padding: "1.25rem",
          border: "",
          background: "rgba(100 100 100/ 1%)",
          backdropFilter: "blur(16px)",
          borderTopLeftRadius: "1rem",
        }}
      >
        <h2>Offer Letter Details</h2>
      </div>

      <div
        style={{
          padding: "1.5rem",
          display: "flex",
          flexFlow: "column",
          gap: "0.75rem",
          paddingTop: "5rem",
        }}
      >
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
            placeholder="Enter Attendance Criteria"
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
            placeholder="Enter Visa Terms"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Report for Duty</label>
          <input
            type="date"
            name="Report for Duty"
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
          <label>Insurance</label>
          <input
            type="text"
            name="insurance"
            value={formData.insurance}
            onChange={handleInputChange}
            placeholder="Enter Leave Encashment"
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
      </div>
    </div>
  );

  const renderPreview = () => (
    <ScrollArea>
      {/* Page 1: Table only */}
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
        <div
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
        </div>

        <br />
        <br />
        <br />
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
        <p style={{ marginBottom: "1rem", textAlign: "justify" }}>
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
              <td style={tableCellStyle}>Attendance</td>
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
              <td style={tableCellStyle}>Notice Period</td>
              <td style={tableCellStyle}>
                {formData.noticePeriod ||
                  "No notice period shall be accepted until the end of the project"}
              </td>
            </tr>
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
                A postpaid Company SIM shall be provided for official use only
              </td>
            </tr>
            <tr>
              <td style={tableCellStyle}>Medical</td>
              <td style={tableCellStyle}>Shall be provided by Company</td>
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
                No leave shall be granted throughout the project unless there is
                an extreme emergency.
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
        {/* Acknowledgment */}
        <h3
          style={{
            fontWeight: "600",
            marginBottom: "0.5rem",
            fontSize: "0.9rem",
          }}
        >
          Acknowledgment:
        </h3>
        <p style={{ marginBottom: "2rem", textAlign: "justify" }}>
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
            marginTop: "5rem",
            display: "flex",
            flexFlow: "column",
            justifyContent: "flex-start",
          }}
        >
          <div style={{}}>
            <div style={{ marginBottom: "2.5rem" }}>
              Employee Signature _____________________________________
            </div>
          </div>
          <div style={{}}>
            <div style={{ marginBottom: "2.5rem" }}>
              HR Manager _____________________________________________
            </div>
          </div>
          <div style={{}}>
            <div style={{ marginBottom: "2.5rem" }}>
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
          background:
            "linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%))",
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
    </>
  );
}
