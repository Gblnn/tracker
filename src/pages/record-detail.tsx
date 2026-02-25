import Back from "@/components/back";
import DropDown from "@/components/dropdown";
import InputDialog from "@/components/input-dialog";
import RefreshButton from "@/components/refresh-button";
import RoleSelect from "@/components/role-select";
import DefaultDialog from "@/components/ui/default-dialog";
import { db, storage } from "@/firebase";
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import {
    Archive,
    EllipsisVertical,
    FileArchive,
    Loader2,
    PenLine,
    X
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

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

  const refreshData = async () => {
    if (!id) return;
    try {
      setRefreshing(true);
      const docRef = doc(db, "records", id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setRecord({ id: docSnap.id, ...docSnap.data() });
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

  useEffect(() => {
    // If record wasn't passed via state, fetch it
    if (!record && id) {
      const fetchRecord = async () => {
        try {
          setLoading(true);
          const docRef = doc(db, "records", id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setRecord({ id: docSnap.id, ...docSnap.data() });
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
        name: editedName !== undefined ? editedName : record.name,
        email: editedEmail !== undefined ? editedEmail : record.email,
        employeeCode: editedEmployeeCode !== undefined ? editedEmployeeCode : record.employeeCode,
        cug: editedCug !== undefined ? editedCug : record.cug,
        role: editedSystemRole !== undefined ? editedSystemRole : (record.role || "profile"),
        designation: editedDesignation !== undefined ? editedDesignation : record.designation,
        site: editedSite !== undefined ? editedSite : record.site,
        project: editedProject !== undefined ? editedProject : record.project,
        companyName: editedCompanyName !== undefined ? editedCompanyName : record.companyName,
        dateofJoin: editedDateofJoin !== undefined ? editedDateofJoin : record.dateofJoin,
        contact: editedContact !== undefined ? editedContact : record.contact,
        modified_on: new Date(),
      });

      // Update local record state
      setRecord({
        ...record,
        name: editedName !== undefined ? editedName : record.name,
        email: editedEmail !== undefined ? editedEmail : record.email,
        employeeCode: editedEmployeeCode !== undefined ? editedEmployeeCode : record.employeeCode,
        cug: editedCug !== undefined ? editedCug : record.cug,
        role: editedSystemRole !== undefined ? editedSystemRole : record.role,
        designation: editedDesignation !== undefined ? editedDesignation : record.designation,
        site: editedSite !== undefined ? editedSite : record.site,
        project: editedProject !== undefined ? editedProject : record.project,
        companyName: editedCompanyName !== undefined ? editedCompanyName : record.companyName,
        dateofJoin: editedDateofJoin !== undefined ? editedDateofJoin : record.dateofJoin,
        contact: editedContact !== undefined ? editedContact : record.contact,
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
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} style={{border:"", height:"100svh", display:"flex", flexFlow:"column"}}>
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
        <div style={{border:"", marginTop:"5rem", height:"100%"}}>
            <div style={{padding:"1rem", display:"flex", flexFlow:"column", gap:"1rem"}}>
                <div style={{display:"flex", background:"rgba(100 100 100/ 0.1)", padding:"1rem", borderRadius:"0.5rem", gap:"1rem", alignItems:"center"}}>
                    {/* <Avatar  className="h-20 w-20">
                        <AvatarFallback style={{fontWeight:"600", background:"linear-gradient( mediumslateblue, midnightblue)", fontSize:"2rem", color:"white"}} className="text-lg">
                            {record?.name
                                ? getInitials(record.name.split("@")[0])
                            : "?"}
                        </AvatarFallback>
                    </Avatar> */}
                    <FileArchive width="3rem" height={"2rem"}/>
                    <div style={{display:"flex", flexFlow:"column"}}>
                        <h2>{record?.name || "Unknown"}</h2>
                        <p>{record.employeeCode}</p>
                        {/* <p style={{fontSize:"0.8rem"}}>{record?.email || "No email available"}</p> */}
                    </div>
                    
                    
                </div>
                
                <div style={{display:"flex", gap:"0.5rem", flexWrap:"wrap"}}>
                    <div style={{background:"rgba(100 100 100/ 0.1)", padding:"0.5rem 1rem", display:"flex", fontSize:"0.8rem", borderRadius:"0.5rem", gap:"0.5rem", flex:"1", minWidth:"fit-content"}}>
                        <b>Joined On</b> {record?.dateofJoin || "N/A"}
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

    {/* Edit Dialog */}
    <InputDialog
      open={editPrompt}
      onCancel={() => {
        resetEditedStates();
        setEditPrompt(false);
      }}
      updating={loading}
      disabled={loading}
      title="Edit Record"
      titleIcon={<PenLine width={"1rem"} />}
      OkButtonText="Update Record"
      onOk={editRecord}
      
      input1Label="Full Name"
      inputplaceholder="Enter Full Name"
      inputOnChange={(e: any) => setEditedName(e.target.value)}
      input1Value={record?.name}
      
      input2Label="Email"
      input2placeholder="Enter Email"
      input2OnChange={(e: any) => setEditedEmail(e.target.value)}
      input2Value={record?.email}
      
      input3Label="Employee Code"
      input3placeholder="Enter Employee Code"
      input3OnChange={(e: any) => setEditedEmployeeCode(e.target.value)}
      input3Value={record?.employeeCode}
      
      input4Label="Company Name"
      input4placeholder="Enter Company Name"
      input4OnChange={(e: any) => setEditedCompanyName(e.target.value)}
      input4Value={record?.companyName}
      
      input5Label="Date of Join"
      input5placeholder="Enter Date of Join"
      input5OnChange={(e: any) => setEditedDateofJoin(e.target.value)}
      input5Value={record?.dateofJoin}
      
      input8Label="Contact"
      input8placeholder="Enter Contact Number"
      input8OnChange={(e: any) => setEditedContact(e.target.value)}
      input8Value={record?.contact}
      
      input9Label="CUG"
      input9placeholder="Enter CUG Number"
      input9OnChange={(e: any) => setEditedCug(e.target.value)}
      input9Value={record?.cug}

      input11Label="Site"
      input11placeholder="Enter Site"
      input11OnChange={(e: any) => setEditedSite(e.target.value)}
      input11Value={record?.site}

      input12Label="Project"
      input12placeholder="Enter Project"
      input12OnChange={(e: any) => setEditedProject(e.target.value)}
      input12Value={record?.project}

      extra={
        <div style={{ display:"flex", gap: "0.5rem", width: "100%" }}>
          <input 
            onChange={(e: any) => setEditedDesignation(e.target.value)} 
            placeholder="Enter Designation" 
            defaultValue={record?.designation} 
            style={{width: "100%", fontSize: ""}}
          />
          <RoleSelect 
            value={record?.role || 'profile'} 
            onChange={(value) => {
              setEditedSystemRole(value);
            }}
          />
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
