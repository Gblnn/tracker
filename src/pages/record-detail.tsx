import Back from "@/components/back";
import CivilID from "@/components/civil-id";
import Directive from "@/components/directive";
import DropDown from "@/components/dropdown";
import ImageDialog from "@/components/image-dialog";
import InputDialog from "@/components/input-dialog";
import MedicalID from "@/components/medical-id";
import Passport from "@/components/passport";
import RefreshButton from "@/components/refresh-button";
import RoleSelect from "@/components/role-select";
import DefaultDialog from "@/components/ui/default-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { db, storage } from "@/firebase";
import { Tooltip } from "antd";
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { motion } from "framer-motion";
import {
  Archive,
  BellOff,
  BellRing,
  Book,
  CreditCard,
  EllipsisVertical,
  FileArchive,
  GraduationCap,
  HeartPulse,
  Loader2,
  PenLine,
  RefreshCcw,
  X
} from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ReactTimeAgo from "react-time-ago";
import { toast } from "sonner";

// Edit Record Form Component Props
interface EditRecordFormContentProps {
  record: any;
  editedName: string | undefined;
  editedEmail: string | undefined;
  editedEmployeeCode: string | undefined;
  editedCompanyName: string | undefined;
  editedDateofJoin: string | undefined;
  editedContact: string | undefined;
  editedCug: string | undefined;
  editedDesignation: string | undefined;
  editedSite: string | undefined;
  editedProject: string | undefined;
  editedSystemRole: string | undefined;
  setEditedName: (value: string) => void;
  setEditedEmail: (value: string) => void;
  setEditedEmployeeCode: (value: string) => void;
  setEditedCompanyName: (value: string) => void;
  setEditedDateofJoin: (value: string) => void;
  setEditedContact: (value: string) => void;
  setEditedCug: (value: string) => void;
  setEditedDesignation: (value: string) => void;
  setEditedSite: (value: string) => void;
  setEditedProject: (value: string) => void;
  setEditedSystemRole: (value: string) => void;
  loading: boolean;
  handleSubmit: () => void;
}

// Shared Edit Record Form Component
const EditRecordFormContent: React.FC<EditRecordFormContentProps> = ({
  record,
  editedName,
  editedEmail,
  editedEmployeeCode,
  editedCompanyName,
  editedDateofJoin,
  editedContact,
  editedCug,
  editedDesignation,
  editedSite,
  editedProject,
  editedSystemRole,
  setEditedName,
  setEditedEmail,
  setEditedEmployeeCode,
  setEditedCompanyName,
  setEditedDateofJoin,
  setEditedContact,
  setEditedCug,
  setEditedDesignation,
  setEditedSite,
  setEditedProject,
  setEditedSystemRole,
  loading,
  handleSubmit,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", maxHeight: "75vh", width: "100%" }}>
      {/* Fixed Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "1.5rem",
        paddingBottom: "1rem",
        borderBottom: "1px solid rgba(100, 100, 100, 0.1)",
        background: "var(--background)",
        boxSizing: "border-box",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            background: "black",
            padding: "0.75rem",
            borderRadius: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <PenLine color="white" width="1.5rem" />
          </div>
          <h2 style={{ fontSize: "1.5rem", letterSpacing: "-0.02em" }}>Edit Record</h2>
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{
        flex: 1,
        padding: "1.5rem",
        paddingTop: "1.5rem",
        paddingBottom: "0",
        width: "100%",
        boxSizing: "border-box",
        overflowY: "auto",
        minHeight: 0
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", paddingBottom: "1.5rem" }}>
          {/* Full Name */}
          <div>
            <label style={{ fontSize: "0.875rem", fontWeight: "600", opacity: 0.9, marginBottom: "0.5rem", display: "block" }}>
              Full Name
            </label>
            <input
              type="text"
              value={editedName !== undefined ? editedName : record?.name || ""}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="Enter Full Name"
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                borderRadius: "0.75rem",
                fontSize: "1rem",
                fontWeight: "500",
                background: "rgba(100, 100, 100, 0.08)",
              }}
            />
          </div>

          {/* Email */}
          <div>
            <label style={{ fontSize: "0.875rem", fontWeight: "600", opacity: 0.9, marginBottom: "0.5rem", display: "block" }}>
              Email
            </label>
            <input
              type="email"
              value={editedEmail !== undefined ? editedEmail : record?.email || ""}
              onChange={(e) => setEditedEmail(e.target.value)}
              placeholder="Enter Email"
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                borderRadius: "0.75rem",
                fontSize: "1rem",
                fontWeight: "500",
                background: "rgba(100, 100, 100, 0.08)",
              }}
            />
          </div>

          {/* Employee Code */}
          <div>
            <label style={{ fontSize: "0.875rem", fontWeight: "600", opacity: 0.9, marginBottom: "0.5rem", display: "block" }}>
              Employee Code
            </label>
            <input
              type="text"
              value={editedEmployeeCode !== undefined ? editedEmployeeCode : record?.employeeCode || ""}
              onChange={(e) => setEditedEmployeeCode(e.target.value)}
              placeholder="Enter Employee Code"
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                borderRadius: "0.75rem",
                fontSize: "1rem",
                fontWeight: "500",
                background: "rgba(100, 100, 100, 0.08)",
              }}
            />
          </div>

          {/* Company Name */}
          <div>
            <label style={{ fontSize: "0.875rem", fontWeight: "600", opacity: 0.9, marginBottom: "0.5rem", display: "block" }}>
              Company Name
            </label>
            <input
              type="text"
              value={editedCompanyName !== undefined ? editedCompanyName : record?.companyName || ""}
              onChange={(e) => setEditedCompanyName(e.target.value)}
              placeholder="Enter Company Name"
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                borderRadius: "0.75rem",
                fontSize: "1rem",
                fontWeight: "500",
                background: "rgba(100, 100, 100, 0.08)",
              }}
            />
          </div>

          {/* Date of Join */}
          <div>
            <label style={{ fontSize: "0.875rem", fontWeight: "600", opacity: 0.9, marginBottom: "0.5rem", display: "block" }}>
              Date of Join
            </label>
            <input
              type="text"
              value={editedDateofJoin !== undefined ? editedDateofJoin : record?.dateofJoin || ""}
              onChange={(e) => setEditedDateofJoin(e.target.value)}
              placeholder="Enter Date of Join"
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                borderRadius: "0.75rem",
                fontSize: "1rem",
                fontWeight: "500",
                background: "rgba(100, 100, 100, 0.08)",
              }}
            />
          </div>

          {/* Contact */}
          <div>
            <label style={{ fontSize: "0.875rem", fontWeight: "600", opacity: 0.9, marginBottom: "0.5rem", display: "block" }}>
              Contact
            </label>
            <input
              type="text"
              value={editedContact !== undefined ? editedContact : record?.contact || ""}
              onChange={(e) => setEditedContact(e.target.value)}
              placeholder="Enter Contact Number"
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                borderRadius: "0.75rem",
                fontSize: "1rem",
                fontWeight: "500",
                background: "rgba(100, 100, 100, 0.08)",
              }}
            />
          </div>

          {/* CUG */}
          <div>
            <label style={{ fontSize: "0.875rem", fontWeight: "600", opacity: 0.9, marginBottom: "0.5rem", display: "block" }}>
              CUG
            </label>
            <input
              type="text"
              value={editedCug !== undefined ? editedCug : record?.cug || ""}
              onChange={(e) => setEditedCug(e.target.value)}
              placeholder="Enter CUG Number"
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                borderRadius: "0.75rem",
                fontSize: "1rem",
                fontWeight: "500",
                background: "rgba(100, 100, 100, 0.08)",
              }}
            />
          </div>

          {/* Site */}
          <div>
            <label style={{ fontSize: "0.875rem", fontWeight: "600", opacity: 0.9, marginBottom: "0.5rem", display: "block" }}>
              Site
            </label>
            <input
              type="text"
              value={editedSite !== undefined ? editedSite : record?.site || ""}
              onChange={(e) => setEditedSite(e.target.value)}
              placeholder="Enter Site"
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                borderRadius: "0.75rem",
                fontSize: "1rem",
                fontWeight: "500",
                background: "rgba(100, 100, 100, 0.08)",
              }}
            />
          </div>

          {/* Project */}
          <div>
            <label style={{ fontSize: "0.875rem", fontWeight: "600", opacity: 0.9, marginBottom: "0.5rem", display: "block" }}>
              Project
            </label>
            <input
              type="text"
              value={editedProject !== undefined ? editedProject : record?.project || ""}
              onChange={(e) => setEditedProject(e.target.value)}
              placeholder="Enter Project"
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                borderRadius: "0.75rem",
                fontSize: "1rem",
                fontWeight: "500",
                background: "rgba(100, 100, 100, 0.08)",
              }}
            />
          </div>

          {/* Designation */}
          <div>
            <label style={{ fontSize: "0.875rem", fontWeight: "600", opacity: 0.9, marginBottom: "0.5rem", display: "block" }}>
              Designation
            </label>
            <input
              type="text"
              value={editedDesignation !== undefined ? editedDesignation : record?.designation || ""}
              onChange={(e) => setEditedDesignation(e.target.value)}
              placeholder="Enter Designation"
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                borderRadius: "0.75rem",
                fontSize: "1rem",
                fontWeight: "500",
                background: "rgba(100, 100, 100, 0.08)",
              }}
            />
          </div>

          {/* System Role */}
          <div>
            <label style={{ fontSize: "0.875rem", fontWeight: "600", opacity: 0.9, marginBottom: "0.5rem", display: "block" }}>
              System Role
            </label>
            <RoleSelect
              value={editedSystemRole !== undefined ? editedSystemRole : (record?.role || 'profile')}
              onChange={(value) => setEditedSystemRole(value)}
            />
          </div>
        </div>
      </div>

      {/* Fixed Footer with Buttons */}
      <div style={{
        padding: "1rem 1.5rem",
        paddingBottom: "1.5rem",
        borderTop: "1px solid rgba(100, 100, 100, 0.1)",
        background: "var(--background)",
        display: "flex",
        gap: "0.75rem"
      }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          style={{
            flex: 1,
            padding: "0.875rem",
            borderRadius: "0.75rem",
            fontSize: "1rem",
            fontWeight: "500",
            background: loading ? "rgba(100, 100, 100, 0.3)" : "black",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem"
          }}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" width="1.125rem" />
      
            </>
          ) : (
            <>
            
              Update Record
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default function RecordDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [record, setRecord] = useState<any>(location.state?.record || null);
  const [loading, setLoading] = useState(!record);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshCompleted, setRefreshCompleted] = useState(false);
  
  // Dialog states
  const [archivePrompt, setArchivePrompt] = useState(false);
  const [deletePrompt, setDeletePrompt] = useState(false);
  const [editPrompt, setEditPrompt] = useState(false);
  const [recordDeleteStatus, setRecordDeleteStatus] = useState("");
  
  // Edited values for edit dialog
  const [editedName, setEditedName] = useState<string | undefined>();
  const [editedEmail, setEditedEmail] = useState<string | undefined>();
  const [editedEmployeeCode, setEditedEmployeeCode] = useState<string | undefined>();
  const [editedCompanyName, setEditedCompanyName] = useState<string | undefined>();
  const [editedDateofJoin, setEditedDateofJoin] = useState<string | undefined>();
  const [editedContact, setEditedContact] = useState<string | undefined>();
  const [editedCug, setEditedCug] = useState<string | undefined>();
  const [editedDesignation, setEditedDesignation] = useState<string | undefined>();
  const [editedSite, setEditedSite] = useState<string | undefined>();
  const [editedProject, setEditedProject] = useState<string | undefined>();
  const [editedSystemRole, setEditedSystemRole] = useState<string | undefined>();
  const [isMobile, setIsMobile] = useState(false);
  
  // Document states
  const [civil, setCivil] = useState(false);
  const [passportDialog, setPassportDialog] = useState(false);
  const [healthDialog, setHealthDialog] = useState(false);
  const [imageDialog, setImageDialog] = useState(false);
  const [remarksDialog, setRemarksDialog] = useState(false);
  const [notify, setNotify] = useState(true);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [remarks, setRemarks] = useState("");
  
  const today = new Date();

  const refreshData = async () => {
    if (!id) return;
    try {
      setRefreshing(true);
      const docRef = doc(db, "records", id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data: any = { id: docSnap.id, ...docSnap.data() };
        setRecord(data);
        setNotify(data.notify !== false); // Default to true if not set
        setRefreshCompleted(true);
      } else {
        console.error("Record not found");
        toast.error("Record not found");
        navigate(-1);
      }
    } catch (error) {
      console.error("Error fetching record:", error);
      toast.error("Failed to fetch record");
    } finally {
      setRefreshing(false);
    }
  };
  
  const handleNotify = async () => {
    if (!id) return;
    try {
      setNotifyLoading(true);
      const docRef = doc(db, "records", id);
      await updateDoc(docRef, {
        notify: !notify
      });
      setNotify(!notify);
      setRecord((prev: any) => ({ ...prev, notify: !notify }));
      toast.success(notify ? "Notifications disabled" : "Notifications enabled");
    } catch (error) {
      console.error("Error updating notifications:", error);
      toast.error("Failed to update notifications");
    } finally {
      setNotifyLoading(false);
    }
  };
  
  const addRemark = async () => {
    if (!id || !remarks.trim()) return;
    try {
      setLoading(true);
      const docRef = doc(db, "records", id);
      await updateDoc(docRef, {
        remarks: remarks
      });
      setRecord((prev: any) => ({ ...prev, remarks: remarks }));
      toast.success("Remark added successfully");
      setRemarksDialog(false);
      setRemarks("");
    } catch (error) {
      console.error("Error adding remark:", error);
      toast.error("Failed to add remark");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If record wasn't passed via state, fetch it
    if (!record && id) {
      const fetchRecord = async () => {
        try {
          setLoading(true);
          const docRef = doc(db, "records", id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data: any = { id: docSnap.id, ...docSnap.data() };
            setRecord(data);
            setNotify(data.notify !== false); // Default to true if not set
          } else {
            console.error("Record not found");
            navigate(-1);
          }
        } catch (error) {
          console.error("Error fetching record:", error);
          navigate(-1);
        } finally {
          setLoading(false);
        }
      };
      fetchRecord();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh" 
      }}>
        <Loader2 className="animate-spin" />
      </div>
    );
  }

//   const getInitials = (name: string) => {
//     return name[0]?.toUpperCase() || "?";
//   };

  if (!record) {
    return null;
  }

//   const today = moment();
//   const isExpiring = (dateStr: string, months: number = 2) => {
//     if (!dateStr) return false;
//     return moment(dateStr, "DD/MM/YYYY").diff(today, "months") <= months;
//   };

  const handleEdit = () => {
    setEditPrompt(true);
  };

  const handleArchive = () => {
    setArchivePrompt(true);
  };

  const handleDelete = () => {
    setDeletePrompt(true);
  };

  const resetEditedStates = () => {
    setEditedName(undefined);
    setEditedEmail(undefined);
    setEditedEmployeeCode(undefined);
    setEditedCompanyName(undefined);
    setEditedDateofJoin(undefined);
    setEditedContact(undefined);
    setEditedCug(undefined);
    setEditedDesignation(undefined);
    setEditedSite(undefined);
    setEditedProject(undefined);
    setEditedSystemRole(undefined);
  };

  const archiveRecord = async () => {
    if (!id) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "records", id), {
        state: record.state === "active" ? "archived" : "active",
        notify: record.state === "active" ? false : true,
      });
      setRecord({ ...record, state: record.state === "active" ? "archived" : "active" });
      toast.success(record.state === "active" ? "Record archived" : "Record unarchived");
      setArchivePrompt(false);
    } catch (error) {
      console.error("Error archiving record:", error);
      toast.error("Failed to archive record");
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async () => {
    if (!id) return;
    setLoading(true);
    try {
      setRecordDeleteStatus("Deleting Record (1/2)");
      await deleteDoc(doc(db, "records", id));

      if (record.profile_name) {
        setRecordDeleteStatus("Deleting Image (2/2)");
        try {
          await deleteObject(ref(storage, record.profile_name));
        } catch (error) {
          console.error("Error deleting image:", error);
        }
      }

      toast.success("Record deleted successfully");
      navigate(-1); // Go back to previous page
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
      setLoading(false);
      setRecordDeleteStatus("");
    }
  };

  const editRecord = async () => {
    if (!id) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "records", id), {
        name: editedName !== undefined ? editedName : (record.name || ""),
        email: editedEmail !== undefined ? editedEmail : (record.email || ""),
        employeeCode: editedEmployeeCode !== undefined ? editedEmployeeCode : (record.employeeCode || ""),
        cug: editedCug !== undefined ? editedCug : (record.cug || ""),
        role: editedSystemRole !== undefined ? editedSystemRole : (record.role || "profile"),
        designation: editedDesignation !== undefined ? editedDesignation : (record.designation || ""),
        site: editedSite !== undefined ? editedSite : (record.site || ""),
        project: editedProject !== undefined ? editedProject : (record.project || ""),
        companyName: editedCompanyName !== undefined ? editedCompanyName : (record.companyName || ""),
        dateofJoin: editedDateofJoin !== undefined ? editedDateofJoin : (record.dateofJoin || ""),
        contact: editedContact !== undefined ? editedContact : (record.contact || ""),
        modified_on: new Date(),
      });

      // Update local record state
      setRecord({
        ...record,
        name: editedName !== undefined ? editedName : (record.name || ""),
        email: editedEmail !== undefined ? editedEmail : (record.email || ""),
        employeeCode: editedEmployeeCode !== undefined ? editedEmployeeCode : (record.employeeCode || ""),
        cug: editedCug !== undefined ? editedCug : (record.cug || ""),
        role: editedSystemRole !== undefined ? editedSystemRole : (record.role || "profile"),
        designation: editedDesignation !== undefined ? editedDesignation : (record.designation || ""),
        site: editedSite !== undefined ? editedSite : (record.site || ""),
        project: editedProject !== undefined ? editedProject : (record.project || ""),
        companyName: editedCompanyName !== undefined ? editedCompanyName : (record.companyName || ""),
        dateofJoin: editedDateofJoin !== undefined ? editedDateofJoin : (record.dateofJoin || ""),
        contact: editedContact !== undefined ? editedContact : (record.contact || ""),
      });

      toast.success("Record updated successfully");
      setEditPrompt(false);
      resetEditedStates();
    } catch (error) {
      console.error("Error updating record:", error);
      toast.error("Failed to update record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{border:"", height:"100svh", display:"flex", flexFlow:"column"}}>
        <Back 
        
       
          fixed 
          blurBG 
        //   subtitle={record.id} 
          extra={
            <>
            <div style={{display:"flex", gap:"0.5rem"}}>
                <RefreshButton
                onClick={refreshData}
                refreshCompleted={refreshCompleted}
                fetchingData={refreshing}
              />
              <DropDown
                trigger={<EllipsisVertical width="1.1rem" />}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onExtra={handleArchive}
                extraText={record?.state === "active" ? "Archive" : "Unarchive"}
              />
            </div>
              
            </>
          }
        />
        <div style={{border:"", marginTop:"5rem", height:"100%", overflow:"auto"}}>
            <div style={{padding:"1rem", display:"flex", flexFlow:"column", gap:"1rem"}}>
                <div style={{display:"flex", background:"rgba(100 100 100/ 0.1)", padding:"1rem", borderRadius:"0.5rem", gap:"1rem", alignItems:"center"}}>
                    {/* <div onClick={() => record?.image && setImageDialog(true)} style={{cursor: record?.image ? "pointer" : "default"}}>
                      <LazyLoader
                        profile={record?.image}
                        gradient
                        block
                        width="4rem"
                        height="4rem"
                        name={record?.name}
                        loading={false}
                        state={record?.state}
                        omni={record?.omni}
                      />
                    </div> */}
                    <FileArchive/>
                    <div style={{display:"flex", flexFlow:"column", flex: 1, minWidth: 0}}>
                        <div style={{display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap"}}>
                          <h2 style={{textTransform: "capitalize", margin: 0}}>{record?.name?.toLowerCase() || "Unknown"}</h2>
                          {record?.state === "active" ? (
                            <Tooltip title={notify ? "Notifications enabled" : "Notifications disabled"}>
                              <button
                                className={notify ? "blue-glass" : ""}
                                onClick={handleNotify}
                                style={{
                                  paddingLeft: "0.75rem",
                                  paddingRight: "0.75rem",
                                  height: "2rem",
                                  fontSize: "0.75rem"
                                }}
                              >
                                {notifyLoading ? (
                                  <Loader2 className="animate-spin" width="0.9rem" color="dodgerblue" />
                                ) : notify ? (
                                  <BellRing color={"dodgerblue"} width={"0.9rem"} fill="dodgerblue" />
                                ) : (
                                  <BellOff width={"0.9rem"} color="grey" />
                                )}
                              </button>
                            </Tooltip>
                          ) : (
                            <Tooltip title="All notifications paused">
                              <button style={{fontSize: "0.7rem", opacity: "0.75", height: "2rem", paddingLeft: "0.75rem", paddingRight: "0.75rem"}}>
                                <Archive width={"0.9rem"} />
                              </button>
                            </Tooltip>
                          )}
                        </div>
                        <p style={{margin: 0, opacity: 0.7}}>{record.employeeCode}</p>
                        {record?.modified_on && moment(record.modified_on, "DD/MM/YYYY", true).isValid() && (
                          <p style={{fontSize:"0.75rem", opacity: 0.5, margin: 0}}>
                            Last modified <ReactTimeAgo date={moment(record.modified_on, "DD/MM/YYYY").toDate()} timeStyle={"twitter"} locale="en-us" />
                          </p>
                        )}
                    </div>
                </div>
                
                <div style={{display:"flex", gap:"0.5rem", flexWrap:"wrap"}}>
                    <div style={{background:"rgba(100 100 100/ 0.1)", padding:"0.5rem 1rem", display:"flex", fontSize:"0.8rem", borderRadius:"0.5rem", gap:"0.5rem", flex:"1", minWidth:"fit-content"}}>
                        <b>Joined</b> {record?.dateofJoin || "N/A"}
                    </div>
                    <div style={{background:"rgba(100 100 100/ 0.1)", padding:"0.5rem 1rem", display:"flex", fontSize:"0.8rem", borderRadius:"0.5rem", gap:"0.5rem", flex:"1", minWidth:"fit-content"}}>
                        <b>Company</b> {record?.companyName || "N/A"}
                    </div>
                </div>

                <div style={{display:"flex", flexWrap:"wrap", gap:"1rem"}}>
                    <div style={{background:"rgba(100 100 100/ 0.1)", padding:"1rem", flex:"1", minWidth:"250px", borderRadius:"0.5rem", display:"flex", gap:"1rem"}}>
                        <div style={{flex:"1"}}>
                            <p style={{opacity:0.6, fontSize:"0.85rem"}}>Contact</p>
                            <p style={{fontWeight:"600"}}>{record?.contact || "N/A"}</p>
                        </div>
                        <div style={{borderLeft:"1px solid rgba(100 100 100/ 0.2)", paddingLeft:"1rem", flex:"1"}}>
                            <p style={{opacity:0.6, fontSize:"0.85rem"}}>CUG</p>
                            <p style={{fontWeight:"600"}}>{record?.cug || "N/A"}</p>
                        </div>
                    </div>
                    <div style={{background:"rgba(100 100 100/ 0.1)", padding:"1rem", flex:"1", minWidth:"250px", borderRadius:"0.5rem", display:"flex", flexDirection:"column", gap:"0.25rem"}}>
                        <p style={{opacity:0.6, fontSize:"0.85rem"}}>Email</p>
                        <p style={{fontWeight:"600", fontSize:"0.9rem"}}>{record?.email || "N/A"}</p>
                    </div>
                    <div style={{background:"rgba(100 100 100/ 0.1)", padding:"1rem", flex:"1", minWidth:"250px", borderRadius:"0.5rem", display:"flex", flexDirection:"column", gap:"0.25rem"}}>
                        <p style={{opacity:0.6, fontSize:"0.85rem"}}>Nationality</p>
                        <p style={{fontWeight:"600"}}>{record?.nationality || "N/A"}</p>
                    </div>
                    <div style={{background:"rgba(100 100 100/ 0.1)", padding:"1rem", flex:"1", minWidth:"250px", borderRadius:"0.5rem", display:"flex", flexDirection:"column", gap:"0.25rem"}}>
                        <p style={{opacity:0.6, fontSize:"0.85rem"}}>Role</p>
                        <p style={{fontWeight:"600"}}>{record?.role || "N/A"}</p>
                    </div>
                    <div style={{background:"rgba(100 100 100/ 0.1)", padding:"1rem", flex:"1", minWidth:"250px", borderRadius:"0.5rem", display:"flex", flexDirection:"column", gap:"0.25rem"}}>
                        <p style={{opacity:0.6, fontSize:"0.85rem"}}>Department</p>
                        <p style={{fontWeight:"600"}}>{record?.department || "N/A"}</p>
                    </div>
                    <div style={{background:"rgba(100 100 100/ 0.1)", padding:"1rem", flex:"1", minWidth:"250px", borderRadius:"0.5rem", display:"flex", flexDirection:"column", gap:"0.25rem"}}>
                        <p style={{opacity:0.6, fontSize:"0.85rem"}}>Designation</p>
                        <p style={{fontWeight:"600"}}>{record?.designation || "N/A"}</p>
                    </div>
                    <div style={{background:"rgba(100 100 100/ 0.1)", padding:"1rem", flex:"1", minWidth:"250px", borderRadius:"0.5rem", display:"flex", flexDirection:"column", gap:"0.25rem"}}>
                        <p style={{opacity:0.6, fontSize:"0.85rem"}}>Site</p>
                        <p style={{fontWeight:"600"}}>{record?.site || "N/A"}</p>
                    </div>
                    <div style={{background:"rgba(100 100 100/ 0.1)", padding:"1rem", flex:"1", minWidth:"250px", borderRadius:"0.5rem", display:"flex", flexDirection:"column", gap:"0.25rem"}}>
                        <p style={{opacity:0.6, fontSize:"0.85rem"}}>Project</p>
                        <p style={{fontWeight:"600"}}>{record?.project || "N/A"}</p>
                    </div>
                </div>
                
                {/* Remarks Section */}
                <div style={{background:"rgba(100 100 100/ 0.1)", padding:"1rem", borderRadius:"0.5rem"}}>
                    <p style={{opacity:0.6, fontSize:"0.85rem", marginBottom: "0.5rem"}}>Remarks</p>
                    <p style={{fontWeight:"500"}}>{record?.remarks || "N/A"}</p>
                </div>
                
                {/* Documents Section */}
                <div style={{display:"flex", flexFlow:"column", gap:"0.5rem"}}>
                  <h3 style={{fontSize:"0.9rem", fontWeight:"600", opacity: 0.8, margin: "0.5rem 0"}}>Documents</h3>
                  
                  <div style={{display:"flex", gap:"0.5rem", alignItems:"center", width:"100%", minWidth: 0, maxWidth:"100%", flexWrap: "wrap"}}>
                    <Directive
                      noArrow
                      id_subtitle={record?.civil_expiry ? record.civil_expiry : "No Data"}
                      onClick={() => setCivil(true)}
                      icon={<CreditCard color="dodgerblue" />}
                      title="Civil ID"
                      expiring={
                        record?.civil_expiry && moment(record.civil_expiry, "DD/MM/YYYY").diff(moment(today), "months") <= 2
                          ? true
                          : false
                      }
                    />
                    
                    <Directive
                      noArrow
                      id_subtitle={record?.passportExpiry ? record.passportExpiry : "No Data"}
                      onClick={() => setPassportDialog(true)}
                      icon={<Book color="goldenrod" />}
                      title="Passport"
                      expiring={
                        record?.passportExpiry && moment(record.passportExpiry, "DD/MM/YYYY").diff(moment(today), "months") <= 6
                          ? true
                          : false
                      }
                    />
                  </div>
                  
                  <div style={{display:"flex", gap:"0.5rem", alignItems:"center", width:"100%", minWidth: 0, maxWidth:"100%", flexWrap: "wrap"}}>
                    {(record?.type === "vale" || record?.omni) && (
                      <Directive
                        noArrow
                        id_subtitle={record?.medical_due_on ? record.medical_due_on : "No Data"}
                        onClick={() => setHealthDialog(true)}
                        icon={<HeartPulse color="tomato" />}
                        title="Medical"
                        expiring={
                          record?.medical_due_on && moment(record.medical_due_on, "DD/MM/YYYY").diff(moment(today), "months") <= 2
                            ? true
                            : false
                        }
                      />
                    )}
                    
                    {(record?.omni || record?.vt_hse_induction || record?.vt_car_1) && (
                      <Directive
                        noArrow
                        id_subtitle={
                          (record?.vt_hse_induction && moment(record.vt_hse_induction, "DD/MM/YYYY").diff(moment(today), "months") <= 2) ||
                          (record?.vt_car_1 && moment(record.vt_car_1, "DD/MM/YYYY").diff(moment(today), "months") <= 2) ||
                          (record?.vt_car_2 && moment(record.vt_car_2, "DD/MM/YYYY").diff(moment(today), "months") <= 2)
                            ? "Expiring"
                            : "No Alerts"
                        }
                        onClick={() => toast.info("Training details")}
                        icon={<GraduationCap color="lightgreen" />}
                        title="Training"
                        expiring={
                          (record?.vt_hse_induction && moment(record.vt_hse_induction, "DD/MM/YYYY").diff(moment(today), "months") <= 2) ||
                          (record?.vt_car_1 && moment(record.vt_car_1, "DD/MM/YYYY").diff(moment(today), "months") <= 2) ||
                          (record?.vt_car_2 && moment(record.vt_car_2, "DD/MM/YYYY").diff(moment(today), "months") <= 2)
                            ? true
                            : false
                        }
                      />
                    )}
                  </div>
                </div>
                
            </div>
            
        </div>
    </motion.div>
    
    {/* Archive Dialog */}
    <DefaultDialog
      titleIcon={<Archive color="orange" />}
      title={record?.state === "active" ? "Archive Record?" : "Unarchive?"}
      open={archivePrompt}
      onCancel={() => setArchivePrompt(false)}
      OkButtonText={record?.state === "active" ? "Archive" : "Confirm"}
      onOk={archiveRecord}
      updating={loading}
      disabled={loading}
    />

    {/* Delete Dialog */}
    <DefaultDialog
      open={deletePrompt}
      titleIcon={<X />}
      destructive
      title="Delete Record?"
      desc={id}
      OkButtonText="Delete"
      onCancel={() => setDeletePrompt(false)}
      onOk={deleteRecord}
      updating={loading}
      disabled={loading}
      extra={
        recordDeleteStatus ? (
          <div style={{ width: "100%" }}>
            <p style={{ fontSize: "0.7rem", opacity: 0.5 }}>
              {recordDeleteStatus}
            </p>
          </div>
        ) : null
      }
    />

    {/* Edit Dialog/Drawer - Responsive */}
    {editPrompt && (isMobile ? (
      <Drawer 
        key="edit-drawer"
        open={true} 
        onOpenChange={(open) => {
          if (!open) {
            resetEditedStates();
            setEditPrompt(false);
          }
        }}
      >
        <DrawerTitle></DrawerTitle>
        <DrawerDescription></DrawerDescription>
        <DrawerContent 
          className="pb-safe" 
          style={{ width: "100%", maxHeight: "85vh", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <EditRecordFormContent
            record={record}
            editedName={editedName}
            editedEmail={editedEmail}
            editedEmployeeCode={editedEmployeeCode}
            editedCompanyName={editedCompanyName}
            editedDateofJoin={editedDateofJoin}
            editedContact={editedContact}
            editedCug={editedCug}
            editedDesignation={editedDesignation}
            editedSite={editedSite}
            editedProject={editedProject}
            editedSystemRole={editedSystemRole}
            setEditedName={setEditedName}
            setEditedEmail={setEditedEmail}
            setEditedEmployeeCode={setEditedEmployeeCode}
            setEditedCompanyName={setEditedCompanyName}
            setEditedDateofJoin={setEditedDateofJoin}
            setEditedContact={setEditedContact}
            setEditedCug={setEditedCug}
            setEditedDesignation={setEditedDesignation}
            setEditedSite={setEditedSite}
            setEditedProject={setEditedProject}
            setEditedSystemRole={setEditedSystemRole}
            loading={loading}
            handleSubmit={editRecord}
          />
        </DrawerContent>
      </Drawer>
    ) : (
      <Dialog 
        open={true} 
        onOpenChange={(open) => {
          if (!open) {
            resetEditedStates();
            setEditPrompt(false);
          }
        }}
      >
        <DialogContent 
          style={{ maxWidth: "600px", display: "flex", flexDirection: "column", maxHeight: "90vh", padding: 0 }}
        >
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
          <EditRecordFormContent
            record={record}
            editedName={editedName}
            editedEmail={editedEmail}
            editedEmployeeCode={editedEmployeeCode}
            editedCompanyName={editedCompanyName}
            editedDateofJoin={editedDateofJoin}
            editedContact={editedContact}
            editedCug={editedCug}
            editedDesignation={editedDesignation}
            editedSite={editedSite}
            editedProject={editedProject}
            editedSystemRole={editedSystemRole}
            setEditedName={setEditedName}
            setEditedEmail={setEditedEmail}
            setEditedEmployeeCode={setEditedEmployeeCode}
            setEditedCompanyName={setEditedCompanyName}
            setEditedDateofJoin={setEditedDateofJoin}
            setEditedContact={setEditedContact}
            setEditedCug={setEditedCug}
            setEditedDesignation={setEditedDesignation}
            setEditedSite={setEditedSite}
            setEditedProject={setEditedProject}
            setEditedSystemRole={setEditedSystemRole}
            loading={loading}
            handleSubmit={editRecord}
          />
        </DialogContent>
      </Dialog>
    ))}
    
    {/* Remarks Dialog */}
    <InputDialog
      title="Add Remark"
      inputplaceholder="Enter remarks"
      OkButtonText="Update"
      OkButtonIcon={<RefreshCcw width={"1rem"} />}
      open={remarksDialog}
      onCancel={() => setRemarksDialog(false)}
      inputOnChange={(e: any) => setRemarks(e.target.value)}
      onOk={addRemark}
      updating={loading}
      disabled={loading}
      input1Value={remarks}
    />
    
    {/* Image Dialog */}
    <ImageDialog
      open={imageDialog}
      src={record?.image}
      onCancel={() => setImageDialog(false)}
    />
    
    {/* Civil ID Dialog */}
    <DefaultDialog
      close
      titleIcon={<CreditCard color="dodgerblue" />}
      title="Civil ID"
      open={civil}
      onCancel={() => setCivil(false)}
      extra={
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "20ch" }}>
          {record?.civil_number ? (
            <CivilID
              name={record?.name}
              expirydate={record?.civil_expiry}
              civilid={record?.civil_number}
              DOB={record?.civil_DOB}
            />
          ) : (
            <div style={{ opacity: 0.5, textAlign: "center" }}>
              <CreditCard width="3rem" height="3rem" style={{ margin: "1rem auto" }} />
              <p>No Civil ID data</p>
            </div>
          )}
        </div>
      }
    />
    
    {/* Passport Dialog */}
    <DefaultDialog
      close
      titleIcon={<Book color="goldenrod" />}
      title="Passport"
      open={passportDialog}
      onCancel={() => setPassportDialog(false)}
      extra={
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "20ch" }}>
          {record?.passportID ? (
            <Passport
              name={record?.name}
              expiry={record?.passportExpiry}
              passport_id={record?.passportID}
              issue={record?.passportIssue}
            />
          ) : (
            <div style={{ opacity: 0.5, textAlign: "center" }}>
              <Book width="3rem" height="3rem" style={{ margin: "1rem auto" }} />
              <p>No Passport data</p>
            </div>
          )}
        </div>
      }
    />
    
    {/* Medical Dialog */}
    <DefaultDialog
      close
      titleIcon={<HeartPulse color="tomato" />}
      title="Medical"
      open={healthDialog}
      onCancel={() => setHealthDialog(false)}
      extra={
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "20ch" }}>
          {record?.medical_due_on ? (
            <MedicalID
              name={record?.name}
              dueOn={record?.medical_due_on}
              completedOn={record?.medical_completed_on}
            />
          ) : (
            <div style={{ opacity: 0.5, textAlign: "center" }}>
              <HeartPulse width="3rem" height="3rem" style={{ margin: "1rem auto" }} />
              <p>No Medical data</p>
            </div>
          )}
        </div>
      }
    />

    </>
    
    // <div style={{ paddingBottom: "2rem", border:"solid" }}>
    //   <div style={{ padding: "1.25rem", border:"solid"}}>
    //     <Back  title={record.name} />
    //   </div>

    //   <div style={{ padding: "1.25rem", paddingTop: 0 }}>
    //     {/* Basic Information */}
    //     <div style={{ 
    //       display: "flex", 
    //       flexDirection: "column", 
    //       gap: "0.75rem",
    //       marginBottom: "1.5rem"
    //     }}>
    //       <h3 style={{ opacity: 0.7, fontSize: "0.9rem", marginBottom: "0.25rem" }}>Basic Information</h3>
          
    //       {record.email && (
    //         <Directive 
    //           icon={<Mail width="1.25rem" color="dodgerblue" />}
    //           title={record.email}
    //           notName
    //           onClick={() => window.location.href = `mailto:${record.email}`}
    //         />
    //       )}
          
    //       {record.contact && (
    //         <Directive 
    //           icon={<Phone width="1.25rem" color="dodgerblue" />}
    //           title={record.contact}
    //           onClick={() => window.location.href = `tel:${record.contact}`}
    //         />
    //       )}
          
    //       {record.cug && (
    //         <Directive 
    //           icon={<Building2 width="1.25rem" color="dodgerblue" />}
    //           title={`CUG: ${record.cug}`}
    //           onClick={() => window.location.href = `tel:${record.cug}`}
    //         />
    //       )}
          
    //       {record.designation && (
    //         <Directive 
    //           icon={<Briefcase width="1.25rem" color="dodgerblue" />}
    //           title={record.designation}
    //           subtext="Designation"
    //         />
    //       )}
          
    //       {record.site && (
    //         <Directive 
    //           icon={<MapPin width="1.25rem" color="dodgerblue" />}
    //           title={record.site}
    //           subtext="Site"
    //         />
    //       )}
          
    //       {record.project && (
    //         <Directive 
    //           icon={<Building2 width="1.25rem" color="dodgerblue" />}
    //           title={record.project}
    //           subtext="Project"
    //         />
    //       )}
    //     </div>

    //     {/* Documents Section */}
    //     <div style={{ 
    //       display: "flex", 
    //       flexDirection: "column", 
    //       gap: "0.75rem" 
    //     }}>
    //       <h3 style={{ opacity: 0.7, fontSize: "0.9rem", marginBottom: "0.25rem" }}>Documents</h3>
          
    //       <div style={{ display: "flex", gap: "0.75rem" }}>
    //         <Directive 
    //           noArrow
    //           icon={<CreditCard width="1.25rem" color="dodgerblue" />}
    //           title="Civil ID"
    //           id_subtitle={record.civil_expiry || "No Data"}
    //           expiring={isExpiring(record.civil_expiry, 2)}
    //         />
            
    //         <Directive 
    //           noArrow
    //           icon={<Book width="1.25rem" color="goldenrod" />}
    //           title="Passport"
    //           id_subtitle={record.passportExpiry || "No Data"}
    //           expiring={isExpiring(record.passportExpiry, 6)}
    //         />
    //       </div>
          
    //       {record.medical_due_on && (
    //         <Directive 
    //           noArrow
    //           icon={<HeartPulse width="1.25rem" color="tomato" />}
    //           title="Medical"
    //           id_subtitle={record.medical_due_on || "No Data"}
    //           expiring={isExpiring(record.medical_due_on, 2)}
    //         />
    //       )}
          
    //       {(record.vt_hse_induction || record.vt_car_1) && (
    //         <Directive 
    //           noArrow
    //           icon={<GraduationCap width="1.25rem" color="lightgreen" />}
    //           title="Training"
    //           id_subtitle={
    //             isExpiring(record.vt_hse_induction, 2) || 
    //             isExpiring(record.vt_car_1, 2) || 
    //             isExpiring(record.vt_car_2, 2)
    //               ? "Expiring"
    //               : "No Alerts"
    //           }
    //           expiring={
    //             isExpiring(record.vt_hse_induction, 2) || 
    //             isExpiring(record.vt_car_1, 2) || 
    //             isExpiring(record.vt_car_2, 2)
    //           }
    //         />
    //       )}
    //     </div>
        
    //     {record.employeeCode && (
    //       <div style={{ marginTop: "1.5rem", opacity: 0.5, fontSize: "0.85rem", border:"solid" }}>
    //         Employee Code: {record.employeeCode}
    //       </div>
    //     )}
    //   </div>
    // </div>
  );
}
