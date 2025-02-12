import AddRecordButton from "@/components/add-record-button";
import AddRecordDialog from "@/components/add-record-dialog";
import Back from "@/components/back";
import CivilID from "@/components/civil-id";
import Directive from "@/components/directive";
import DropDown from "@/components/dropdown";
import InputDialog from "@/components/input-dialog";
import MedicalID from "@/components/medical-id";
import Passport from "@/components/passport";
import SearchBar from "@/components/search-bar";
import DefaultDialog from "@/components/ui/default-dialog";
import VehicleID from "@/components/vehicle-id";
import { db, storage } from "@/firebase";
import { LoadingOutlined } from "@ant-design/icons";
import * as XLSX from "@e965/xlsx";
import { message, Tooltip } from "antd";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { motion } from "framer-motion";
import {
  Archive,
  ArrowDown,
  ArrowDown01,
  ArrowDownAZ,
  ArrowUp,
  BarChart3,
  BarChart3Icon,
  BellOff,
  BellRing,
  Book,
  Car,
  Check,
  CheckSquare2,
  CircleDollarSign,
  CreditCard,
  Disc,
  Download,
  DownloadCloud,
  EllipsisVerticalIcon,
  Eye,
  File,
  FileDown,
  Globe,
  GraduationCap,
  HandHelping,
  HeartPulse,
  Image,
  ImageOff,
  Inbox,
  ListStart,
  LoaderCircle,
  MinusSquareIcon,
  PackageOpen,
  PenLine,
  Plus,
  RadioTower,
  RefreshCcw,
  ScrollText,
  Sparkles,
  Trash,
  UploadCloud,
  UserCircle,
  X,
} from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import "react-lazy-load-image-component/src/effects/blur.css";
import { useNavigate } from "react-router-dom";
import ReactTimeAgo from "react-time-ago";
import useKeyboardShortcut from "use-keyboard-shortcut";
import { exportDatabase, exportRaw, getBlank } from "./component-functions";
import DbDropDown from "./db-dropdown";
import ImageDialog from "./image-dialog";
import LazyLoader from "./lazy-loader";
import RefreshButton from "./refresh-button";
import SheetComponent from "./sheet-component";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";

type Record = {
  id: string;
  name: string;
};

// Running Notes
// Check whether expiry date minus 3 is equals to today - 3 month reminder

interface Props {
  title?: string;
  dbCategory?: string;
  loader?: any;
  noTraining?: boolean;
}

export default function DbComponent(props: Props) {
  const [editAccess, setEditAccess] = useState(false);
  const [sensitive_data_access, setSensitiveDataAccess] = useState(false);
  const [contractDialog, setContractDialog] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [deleteKey, setDeleteKey] = useState("");
  const [file, setFile] = useState(null);
  const [jsonData, setJsonData] = useState<any>([]);
  const [companyName, setCompanyName] = useState("");
  const [thumbnails, setThumbnails] = useState(false);
  const [remarksDialog, setRemarksDialog] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [archivePrompt, setArchivePrompt] = useState(false);
  const [state, setState] = useState("");
  const [imageDialog, setImageDialog] = useState(false);
  const [created_on, setCreatedOn] = useState("");
  const [contact, setContact] = useState("");
  const [editedContact, setEditedContact] = useState("");
  const [nativePhone, setNativePhone] = useState("");
  const [nativeAddress, setNativeAddress] = useState("");
  const [editedNativePhone, setEditedNativePhone] = useState("");
  const [editedNativeAddress, setEditedNativeAddress] = useState("");
  const [leaveReview, setLeaveReview] = useState(false);
  const [editedLeaveFrom, setEditedLeaveFrom] = useState("");
  const [editedLeaveTill, setEditedLeaveTill] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");

  const usenavigate = useNavigate();
  // BASIC PAGE VARIABLES
  // const [pageLoad, setPageLoad] = useState(false)
  const [notify, setNotify] = useState(true);
  const [records, setRecords] = useState<any>([]);
  const [name, setName] = useState("");
  const [doc_id, setDocID] = useState("");
  const [recordSummary, setRecordSummary] = useState(false);
  const [civil, setCivil] = useState(false);
  const [vehicle, setVehicle] = useState(false);
  const [addcivil, setAddcivil] = useState(false);
  const [modified_on, setModifiedOn] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [deleteMedicalIDdialog, setDeleteMedicalIDdialog] = useState(false);
  const [email, setEmail] = useState("");
  const [editedName, setEditedName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [editedEmployeeCode, setEditedEmployeeCode] = useState("");
  const [editedCompanyName, setEditedCompanyName] = useState("");
  const [editedDateofJoin, setEditedDateofJoin] = useState("");
  const [editedSalarybasic, setEditedSalaryBasic] = useState(0);
  const [editedAllowance, setEditedAllowance] = useState(0);
  const [image, setImage] = useState("");

  // CIVIL ID VARIABLES
  const [civil_number, setCivilNumber] = useState<any>();
  const [new_civil_number, setNewCivilNumber] = useState<any>();
  const [new_civil_expiry, setNewCivilExpiry] = useState<any>();
  const [civil_expiry, setCivilExpiry] = useState<any>();
  const [civil_DOB, setCivilDOB] = useState<any>();

  //EDIT CIVIL ID VARIABLES
  const [edited_civil_number, setEditedCivilNumber] = useState("");
  const [edited_civil_expiry, setEditedCivilExpiry] = useState<any>();
  const [edited_civil_DOB, setEditedCivilDOB] = useState("");
  const [civilDelete, setCivilDelete] = useState(false);

  const [edited_vehicle_number, setEditedVehicleNumber] = useState("");
  const [edited_vehicle_issue, setEditedVehicleIssue] = useState("");
  const [edited_vehicle_expiry, setEditedVehicleExpiry] = useState("");

  const [editedPassportID, setEditedPassportID] = useState("");
  const [editedPassportIssue, setEditedPassportIssue] = useState("");
  const [editedPassportExpiry, setEditedPassportExpiry] = useState<any>();

  const [passportDialog, setPassportDialog] = useState(false);

  const [editedCompletedOn, setEditedCompletedOn] = useState("");
  const [editedDueOn, setEditedDueOn] = useState<any>();

  //MAIL CONFIG VARIABLES
  const [addDialog, setAddDialog] = useState(false);
  const [userDeletePrompt, setUserDeletePrompt] = useState(false);
  const [userEditPrompt, setUserEditPrompt] = useState(false);
  const [editcivilprompt, setEditcivilprompt] = useState(false);
  const [valeTrainingDialog, setValeTrainingDialog] = useState(false);
  const [renewMedicalIDdialog, setRenewMedicalIDdialog] = useState(false);
  const [renewPassportDialog, setRenewPassportDialog] = useState(false);

  //VEHICLE ID VARIABLES
  const [vehicle_number, setVehicleNumber] = useState("");
  const [vehicle_issue, setVehicleIssue] = useState("");
  const [vehicle_expiry, setVehicleExpiry] = useState<any>();

  const [medical_completed_on, setCompletedOn] = useState("");
  const [medical_due_on, setDueOn] = useState<any>();
  const [MedicalIDdialog, setMedicalIDdialog] = useState(false);

  const [passportID, setPassportID] = useState("");
  const [passportIssue, setPassportIssue] = useState("");
  const [passportExpiry, setPassportExpiry] = useState<any>();

  const [addPassportDialog, setAddPassportDialog] = useState(false);

  const [vehicleIdDelete, setVehicleIdDelete] = useState(false);
  const [edit_vehicle_id_prompt, setEditVehicleIDprompt] = useState(false);
  const [editMedicalIDdialog, setEditMedicalIDdialog] = useState(false);
  const [editPassportDialog, setEditPassportDialog] = useState(false);

  const [DeletePassportDialog, setDeletePassportDialog] = useState(false);

  const [trainingAddDialog, setTrainingAddDialog] = useState(false);
  const [trainingAddDialogTitle, setTrainingAddDialogTitle] = useState("");
  const [EditedTrainingAddDialogInput, setEditedTrainingAddDialogInput] =
    useState("");
  const [trainingAddDialogInputValue, setTrainingAddDialogInputValue] =
    useState("");

  const [add_vehicle_id, setAddVehicleID] = useState(false);

  const [selectable, setSelectable] = useState(false);
  const [search, setSearch] = useState("");

  const [checked, setChecked] = useState<any>([]);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);

  // const [recipientsDialog, setRecipientsDialog] = useState(false)

  const [progress, setProgress] = useState("");

  const [selected, setSelected] = useState(false);
  const [fetchingData, setfetchingData] = useState(false);
  const [status, setStatus] = useState("");

  const [renewDocDialog, setRenewDocDialog] = useState(false);
  const [renewVehicleDialog, setRenewVehicleDialog] = useState(false);

  const [newExpiry, setNewExpiry] = useState<any>();

  const today = new Date();

  const [progressItem, setProgressItem] = useState("");
  const [trainingDialog, setTrainingDialog] = useState(false);
  const [healthDialog, setHealthDialog] = useState(false);

  const [notifyLoading, setNotifyLoading] = useState(false);

  const [trainingType, setTrainingType] = useState("");

  const [vt_hse_induction, setHseInduction] = useState<any>();
  const [vt_car_1, setVtCar1] = useState<any>();
  const [vt_car_2, setVtCar2] = useState<any>();
  const [vt_car_3, setVtCar3] = useState<any>();
  const [vt_car_4, setVtCar4] = useState<any>();
  const [vt_car_5, setVtCar5] = useState<any>();
  const [vt_car_6, setVtCar6] = useState<any>();
  const [vt_car_7, setVtCar7] = useState<any>();
  const [vt_car_8, setVtCar8] = useState<any>();
  const [vt_car_9, setVtCar9] = useState<any>();
  const [vt_car_10, setVtCar10] = useState<any>();

  const [imageUpload, setImageUpload] = useState(null);
  const [fileName, setFileName] = useState("");
  const [profileName, setProfileName] = useState("");

  const [salaryDialog, setSalaryDialog] = useState(false);
  const [employeeCode, setEmployeeCode] = useState("");
  const [dateofJoin, setDateofJoin] = useState("");
  const [salaryBasic, setSalaryBasic] = useState(0);
  const [allowance, setAllowance] = useState(0);

  const [newSalary, setNewSalary] = useState(0);
  const [newAllowance, setNewAllowance] = useState(0);

  const [allowanceDialog, setAllowanceDialog] = useState(false);

  const [leaveLog, setLeaveLog] = useState(false);
  const [leaveList, setLeaveList] = useState<any>([]);
  const [leaveFrom, setLeaveFrom] = useState<any>("");
  const [leaveTill, setLeaveTill] = useState<any>("");
  const [leaves, setLeaves] = useState(0);
  const [deleteLeaveDialog, setDeleteLeaveDialog] = useState(false);
  const [leaveID, setLeaveID] = useState("");

  const [salaryList, setSalaryList] = useState<any>([]);
  const [deleteSalaryDialog, setDeleteSalaryDialog] = useState(false);
  const [salaryID, setSalaryID] = useState("");

  const [allowanceList, setAllowanceList] = useState<any>([]);
  const [deleteAllowanceDialog, setDeleteAllowanceDialog] = useState(false);
  const [allowanceID, setAllowanceID] = useState("");

  const [recordDeleteStatus, setRecordDeleteStatus] = useState("");

  const [fetchingLeave, setFetchingLeave] = useState(false);
  const [fetchingSalary, setFetchingSalary] = useState(false);
  const [fetchingAllowance, setFetchingAllowance] = useState(false);
  let imgUrl = "";

  const [initialSalary, setInitialSalary] = useState(0);
  const [initialAllowance, setInitialAllowance] = useState(0);

  const [importDialog, setImportDialog] = useState(false);
  const [sortby, setSortBy] = useState("name");
  const [omni, setOmni] = useState(false);
  const [omniLoad, setOmniLoad] = useState(false);
  const [access, setAccess] = useState(false);
  const [refreshCompleted, setRefreshCompleted] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);
  const [id, setId] = useState("");

  {
    /* //////////////////////////////////////////////////////////////////////////////////////////////////////*/
  }

  useEffect(() => {
    onSnapshot(query(collection(db, "records")), (snapshot: any) => {
      snapshot.docChanges().forEach((change: any) => {
        if (change.type === "added") {
          fetchData();
        }
        if (change.type === "modified") {
          fetchData();
        }
        if (change.type === "removed") {
          fetchData();
        }
      });
    });
    console.log(id);
    setLeaves(0);
  }, []);

  const AddHistory = async (
    method: string,
    newValue?: any,
    previousValue?: any,
    fieldAltered?: any
  ) => {
    await addDoc(collection(db, "history"), {
      created_on: new Date(),
      user: window.name,
      newValue: newValue,
      previousValue: previousValue,
      fieldAltered: fieldAltered,
      doc_owner: name,
      type: props.dbCategory,
      method: method,
    });
  };

  const { flushHeldKeys } = useKeyboardShortcut(["Control", "A"], () => {
    setAddDialog(!addDialog);
    setName("");
    flushHeldKeys;
  });

  const {} = useKeyboardShortcut(["Control", "I"], () => {
    usenavigate("/inbox");
    flushHeldKeys;
  });

  const TimeStamper = (date: any) => {
    return Timestamp.fromDate(moment(date, "DD/MM/YYYY").toDate());
  };

  // PAGE LOAD HANDLER
  useEffect(() => {
    fetchData();
    fetchLeave();
    fetchSalary();
    fetchAllowance();
  }, []);

  useEffect(() => {
    window.addEventListener("online", () => {
      setStatus("true");
    });
    window.addEventListener("offline", () => {
      setStatus("false");
    });
  });

  useEffect(() => {
    if (status == "true") {
      message.success("Connection Established");
      fetchData();
    } else if (status == "false") {
      message.error("Lost Connection.");
    }
  }, [status]);

  useEffect(() => {
    fetchData();
    fetchLeave();
    fetchSalary();
    fetchAllowance();
  }, [sortby]);

  const uploadFile = async () => {
    if (imageUpload === null) {
      message.info("No image attached");
      return;
    }
    const imageRef = storageRef(storage, fileName);

    console.log("Uploading ", fileName);
    fileName == ""
      ? console.log("Skipped Upload")
      : await uploadBytes(imageRef, imageUpload)
          .then(async (snapshot) => {
            await getDownloadURL(snapshot.ref).then((url: any) => {
              imgUrl = url;
              setFileName("");
            });
          })
          .catch((error) => {
            message.error(error.message);
            console.log(error.message);
          });
  };

  const fetchBlank = () => {
    getBlank(props.dbCategory);
  };

  //INITIAL DATA FETCH ON PAGE LOAD
  const fetchData = async () => {
    try {
      setfetchingData(true);
      const RecordCollection = collection(db, "records");
      const recordQuery = query(
        RecordCollection,
        orderBy(sortby),
        where("type", "in", [props.dbCategory, "omni"]),
        limit(100)
      );
      const querySnapshot = await getDocs(recordQuery);
      const fetchedData: Array<Record> = [];

      querySnapshot.forEach((doc: any) => {
        fetchedData.push({ id: doc.id, ...doc.data() });
      });

      verifyAccess();

      setfetchingData(false);
      setRefreshCompleted(true);
      setRecords(fetchedData);
      setChecked([]);
      setSelectable(false);
      setTimeout(() => {
        setRefreshCompleted(false);
      }, 1000);
    } catch (error) {
      console.log(error);
      message.info(String(error));
      setStatus("false");
    }
  };

  const fetchSalary = async () => {
    setFetchingSalary(true);
    const salaryQuery = query(
      collection(db, "salary-record"),
      orderBy("created_on", "desc"),
      where("employeeCode", "==", employeeCode)
    );
    const snapshot = await getDocs(salaryQuery);
    const SalaryData: any = [];
    snapshot.forEach((doc: any) => {
      SalaryData.push({ id: doc.id, ...doc.data() });
      setSalaryList(SalaryData);
    });
    setFetchingSalary(false);
  };

  const fetchAllowance = async () => {
    setFetchingAllowance(true);
    const allowanceQuery = query(
      collection(db, "allowance-record"),
      orderBy("created_on", "desc"),
      where("employeeCode", "==", employeeCode)
    );
    const snapshot = await getDocs(allowanceQuery);
    const AllowanceData: any = [];
    snapshot.forEach((doc: any) => {
      AllowanceData.push({ id: doc.id, ...doc.data() });
      setAllowanceList(AllowanceData);
    });
    setFetchingAllowance(false);
  };

  const addNewSalary = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db, "salary-record"), {
        employeeID: doc_id,
        created_on: Timestamp.fromDate(new Date()),
        salary: newSalary,
      });
      await updateDoc(doc(db, "records", doc_id), { salaryBasic: newSalary });

      AddHistory("updation", newSalary, salaryBasic, "salary");

      setSalaryBasic(newSalary);
      fetchSalary();
      setNewSalary(0);
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  const addNewAllowance = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db, "allowance-record"), {
        employeeID: doc_id,
        created_on: Timestamp.fromDate(new Date()),
        allowance: newAllowance,
      });
      await updateDoc(doc(db, "records", doc_id), { allowance: newAllowance });

      AddHistory("updation", newAllowance, allowance, "allowance");
      setAllowance(newAllowance);
      fetchAllowance();
      setNewAllowance(0);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const deleteSalary = async () => {
    setLoading(true);
    await deleteDoc(doc(db, "salary-record", salaryID));
    setId(doc_id);

    setDeleteSalaryDialog(false);
    if (salaryList.length == 1) {
      setSalaryList([]);
      // await updateDoc(doc(db, 'record', doc_id),{salaryBasic:initialSalary})
    }

    AddHistory("deletion", salaryBasic, null, "salary");
    setLoading(false);
    fetchSalary();
  };

  const deleteAllowance = async () => {
    setLoading(true);
    await deleteDoc(doc(db, "allowance-record", allowanceID));
    AddHistory("deletion", allowance, null, "allowance");
    setId(doc_id);
    setLoading(false);
    fetchAllowance();
    setDeleteAllowanceDialog(false);
    allowanceList.length == 1 && setAllowanceList([]);
  };

  const fetchLeave = async () => {
    setFetchingLeave(true);
    const leaveQuery = query(
      collection(db, "leave-record"),
      orderBy("created_on", "desc"),
      where("employeeCode", "==", employeeCode)
    );
    const snapshot = await getDocs(leaveQuery);
    const LeaveData: any = [];

    snapshot.forEach((doc: any) => {
      LeaveData.push({ id: doc.id, ...doc.data() });
      setLeaveList(LeaveData);
    });
    setFetchingLeave(false);

    // await leaveSum();
  };

  {
    /*///////////////////////////////////////////////////////////////////////////////////////////////////////*/
  }

  const addLeave = async () => {
    setLoading(true);
    await addDoc(collection(db, "leave-record"), {
      name: name,
      employeeID: doc_id,
      created_on: Timestamp.fromDate(new Date()),
      leaveFrom: editedLeaveFrom,
      leaveTill: editedLeaveTill ? editedLeaveTill : "Pending",
      days: moment(editedLeaveTill, "DD/MM/YYYY").diff(
        moment(editedLeaveFrom, "DD/MM/YYYY"),
        "days"
      ),
      pending: editedLeaveTill ? false : true,
      employeeCode: employeeCode,
    });
    await AddHistory("addition", editedLeaveFrom, "Leave", "Leave");
    setId(doc_id);
    // await leaveSum();
    fetchLeave();
    setEditedLeaveFrom("");
    setEditedLeaveTill("");
    setLoading(false);
  };

  const updateLeave = async () => {
    setLoading(true);
    await updateDoc(doc(db, "leave-record", leaveID), {
      leaveFrom: leaveFrom,
      leaveTill: leaveTill,
      expectedReturn: expectedReturn ? expectedReturn : "",
      pending: leaveTill == "" ? true : false,
      days:
        leaveTill != "Pending" &&
        moment(leaveTill, "DD/MM/YYYY").diff(
          moment(leaveFrom, "DD/MM/YYYY"),
          "days"
        ),
    });
    await AddHistory(
      "updation",
      expectedReturn ? expectedReturn : leaveTill,
      null,
      expectedReturn ? "Expected Return" : "Leave Till"
    );
    setLeaveFrom(leaveFrom);
    setLeaveTill(leaveTill);
    // await leaveSum();
    fetchLeave();
    setLeaveReview(false);
    setLoading(false);
  };

  const deleteLeave = async () => {
    setLoading(true);
    await deleteDoc(doc(db, "leave-record", leaveID));
    setId(doc_id);
    // await leaveSum();
    await AddHistory("deletion", leaveFrom, null, "Leave");
    setLoading(false);
    fetchLeave();
    setDeleteLeaveDialog(false);
    leaveList.length == 1 && setLeaveList([]);
  };

  const RenewID = async () => {
    setLoading(true);
    await updateDoc(doc(db, "records", doc_id), {
      civil_expiry: TimeStamper(newExpiry),
      modified_on: Timestamp.fromDate(new Date()),
    });
    await AddHistory("renew", newExpiry, "", "Civil ID");
    setCivilExpiry(newExpiry);
    setLoading(false);
    setRenewDocDialog(false);
    fetchData();
    setNewExpiry("");
    setModifiedOn(new Date());
  };

  const archiveRecord = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "records", doc_id), {
        state: state == "active" ? "archived" : "active",
        notify: state == "active" ? false : true,
      });
      setLoading(false);
      setArchivePrompt(false);
      setState(state == "active" ? "archived" : "active");
      setNotify(state == "active" ? false : true);
    } catch (error) {
      setLoading(false);
    }
  };

  const exportDB = async () => {
    setLoading(true);
    await AddHistory("export", "", "", "Database Export");
    setLoading(false);
    exportDatabase(records, props.dbCategory);
  };

  const exportRawDB = async () => {
    await AddHistory("export", "", "", "Raw Database Data");
    exportRaw(records);
  };

  const addRemark = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "records", doc_id), { remarks: remarks });
      setLoading(false);
      setRemarksDialog(false);
      fetchData();
    } catch (error) {
      setLoading(false);
    }
  };

  // FUNCTION TO ADD A RECORD
  const addRecord = async () => {
    imgUrl = "";
    setLoading(true);
    await uploadFile();
    await addDoc(collection(db, "records"), {
      name: name,
      email: email,
      employeeCode: employeeCode,
      companyName: companyName,
      dateofJoin: dateofJoin,
      salaryBasic: salaryBasic,
      initialSalary: salaryBasic,
      allowance: allowance,
      initialAllowance: allowance,
      contact: contact,
      created_on: Timestamp.fromDate(new Date()),
      modified_on: Timestamp.fromDate(new Date()),
      type: props.dbCategory,
      notify: true,
      profile: imgUrl,
      profile_name: fileName,
      civil_number: "",
      civil_expiry: "",
      civil_DOB: "",
      license_number: "",
      license_issue: "",
      license_expiry: "",
      medical_completed_on: "",
      medical_due_on: "",
      passportID: "",
      passportIssue: "",
      passportExpiry: "",
      vt_hse_induction: "",
      vt_car_1: "",
      vt_car_2: "",
      vt_car_3: "",
      vt_car_4: "",
      vt_car_5: "",
      vt_car_6: "",
      vt_car_7: "",
      vt_car_8: "",
      vt_car_9: "",
      vt_car_10: "",
      state: "active",
      remarks: "",
    });
    await AddHistory("addition", "Created", "", "Record");
    setAddDialog(false);
    setName(editedName ? editedName : name);
    setEmail(editedEmail ? editedEmail : email);
    setLoading(false);
    fetchData();
    setModifiedOn(new Date());
  };

  // FUNCTION TO EDIT RECORD
  const EditRecordName = async () => {
    console.log("fileName", fileName);
    setLoading(true);
    if (fileName != "") {
      imgUrl = "";
      if (profileName != "") {
        console.log("Deleting ", profileName);
        await deleteObject(ref(storage, profileName));
      }

      await uploadFile();
      setImage(imgUrl);
      setFileName("");
      console.log(fileName);
    }

    await updateDoc(doc(db, "records", doc_id), {
      name: editedName ? editedName : name,
      email: editedEmail ? editedEmail : email,
      employeeCode: editedEmployeeCode ? editedEmployeeCode : employeeCode,
      companyName: editedCompanyName ? editedCompanyName : companyName,
      dateofJoin: editedDateofJoin ? editedDateofJoin : dateofJoin,
      initialSalary: editedSalarybasic ? editedSalarybasic : initialSalary,
      initialAllowance: editedAllowance ? editedAllowance : initialAllowance,
      contact: editedContact ? editedContact : contact,
      modified_on: Timestamp.fromDate(new Date()),
    });

    if (fileName != "") {
      await updateDoc(doc(db, "records", doc_id), {
        profile: imgUrl,
        profile_name: fileName,
      });
      setProfileName(fileName);
    }

    await AddHistory("addition", "Edited", "", "Record");

    setUserEditPrompt(false);
    setName(editedName ? editedName : name);
    setEmail(editedEmail ? editedEmail : email);
    setEmployeeCode(editedEmployeeCode ? editedEmployeeCode : employeeCode);
    setCompanyName(editedCompanyName ? editedCompanyName : companyName);
    setDateofJoin(editedDateofJoin ? editedDateofJoin : dateofJoin);
    setSalaryBasic(editedSalarybasic ? editedSalarybasic : salaryBasic);
    setAllowance(editedAllowance ? editedAllowance : allowance);
    setContact(editedContact ? editedContact : contact);
    setLoading(false);
    fetchData();
    setModifiedOn(new Date());
  };

  // FUNCTION TO DELETE RECORD
  const deleteRecord = async () => {
    setLoading(true);
    setRecordDeleteStatus("Deleting Record " + doc_id + " (1/2)");
    await deleteDoc(doc(db, "records", doc_id));

    if (profileName != null) {
      setRecordDeleteStatus("Deleting Image " + profileName + " (2/2)");
      try {
        await deleteObject(ref(storage, profileName));
      } catch (error) {
        setLoading(false);
      }
    }

    console.log("Deleting Day offs");
    setRecordDeleteStatus("Deleting Day offs");
    leaveList.forEach(async (item: any) => {
      await deleteDoc(doc(db, "leavFe-record", item.id));
    });

    console.log("Deleting Salary Records");
    setRecordDeleteStatus("Deleting Salary Records");
    salaryList.forEach(async (item: any) => {
      await deleteDoc(doc(db, "salary-record", item.id));
    });

    console.log("Deleting Allowance Records");
    setRecordDeleteStatus("Deleting Allowance Records");
    allowanceList.forEach(async (item: any) => {
      await deleteDoc(doc(db, "allowance-record", item.id));
    });
    await AddHistory("deletion", "Deleted", "", "Record");

    setRecordDeleteStatus("");
    setCivilNumber("");
    setCivilNumber("");
    setCivilExpiry("");
    setCivilDOB("");
    setName("");
    setEmail("");
    setCompanyName("");
    setDateofJoin("");
    setSalaryBasic(0);
    setAllowance(0);
    setContact("");
    setNewCivilExpiry("");
    setNewCivilNumber("");
    setUserDeletePrompt(false);
    setRecordSummary(false);
    setLoading(false);
    fetchData();
  };

  {
    /* ////////////////////////////////////////////////////////////////////////////////////////////////////////////// */
  }

  // FUNCTION TO ADD A CIVIL ID
  const addCivilID = async () => {
    setAddcivil(false);
    setLoading(true);
    try {
      await updateDoc(doc(db, "records", doc_id), {
        civil_number: edited_civil_number,
        civil_expiry: edited_civil_expiry
          ? TimeStamper(edited_civil_expiry)
          : "",
        civil_DOB: edited_civil_DOB,
        modified_on: Timestamp.fromDate(new Date()),
      });
      await AddHistory("addition", "Added", "", "Civil ID");
      setCivilNumber(edited_civil_number);
      setCivilExpiry(edited_civil_expiry);
      setCivilDOB(edited_civil_DOB);
      setLoading(false);
      fetchData();
      setModifiedOn(new Date());
    } catch (error) {
      console.log(error);
      setCivilNumber("");
      setCivilExpiry("");
      setCivilDOB("");
      setNewCivilExpiry("");
      setNewCivilNumber("");
      setLoading(false);
      message.info("ID generation failed " + String(error));
    }
  };

  // FUNCTION TO DELETE A CIVIL ID
  const deleteCivilID = async () => {
    setLoading(true);
    await updateDoc(doc(db, "records", doc_id), {
      civil_number: "",
      civil_expiry: "",
      civil_DOB: "",
      modified_on: Timestamp.fromDate(new Date()),
    });
    setLoading(true);
    await AddHistory("deletion", "Deleted", "", "Civil ID");
    setCivilDelete(false);
    setLoading(false);
    setCivilNumber("");
    setCivilNumber("");
    setCivilExpiry("");
    setCivilDOB("");
    setNewCivilExpiry("");
    setNewCivilNumber("");
    fetchData();
    setModifiedOn(new Date());
  };

  // FUNCTION TO EDIT A CIVIL ID
  const EditCivilID = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "records", doc_id), {
        civil_number: edited_civil_number ? edited_civil_number : civil_number,
        civil_expiry: edited_civil_expiry
          ? TimeStamper(edited_civil_expiry)
          : TimeStamper(civil_expiry),
        civil_DOB: edited_civil_DOB ? edited_civil_DOB : civil_DOB,
        modified_on: Timestamp.fromDate(new Date()),
      });
      setLoading(true);
      await AddHistory("addition", "Updated", "", "Civil ID");
      setCivilNumber(edited_civil_number ? edited_civil_number : civil_number);
      setCivilExpiry(edited_civil_expiry ? edited_civil_expiry : civil_expiry);
      setCivilDOB(edited_civil_DOB ? edited_civil_DOB : civil_DOB);

      setEditcivilprompt(false);
      setLoading(false);
      fetchData();
      setModifiedOn(new Date());
    } catch (error) {
      console.log(error);
      setLoading(false);
      message.info(String(error));
    }
  };

  {
    /* ///////////////////////////////////////////////////////////////////////////////////////////////// */
  }

  // FUNCTION TO ADD A VEHICLE ID
  const addVehicleID = async () => {
    setAddVehicleID(false);
    setLoading(true);
    try {
      await updateDoc(doc(db, "records", doc_id), {
        license_number: vehicle_number,
        license_expiry: TimeStamper(vehicle_expiry),
        license_issue: vehicle_issue,
        modified_on: Timestamp.fromDate(new Date()),
      });
      await AddHistory("addition", "Added", "", "Vehicle ID");
      setLoading(false);
      fetchData();
      setModifiedOn(new Date());
    } catch (error) {
      console.log(error);
      setCivilNumber("");
      setCivilExpiry("");
      setCivilDOB("");
      setNewCivilExpiry("");
      setNewCivilNumber("");
      setLoading(false);
      message.info("ID generation failed " + String(error));
    }
  };

  // FUNCTION TO DELETE A VEHICLE ID
  const deleteVehicleID = async () => {
    setLoading(true);
    await updateDoc(doc(db, "records", doc_id), {
      license_number: "",
      license_expiry: "",
      license_issue: "",
      modified_on: Timestamp.fromDate(new Date()),
    });
    await AddHistory("deletion", "Deleted", "", "Vehicle ID");
    setVehicleIdDelete(false);
    setLoading(false);
    setVehicleNumber("");
    setVehicleExpiry("");
    setVehicleIssue("");
    fetchData();
    setModifiedOn(new Date());
  };

  // FUNCTION TO DELETE A MEDICAL ID
  const deleteMedicalID = async () => {
    setLoading(true);
    await updateDoc(doc(db, "records", doc_id), {
      medical_completed_on: "",
      medical_due_on: "",
      modified_on: Timestamp.fromDate(new Date()),
    });
    await AddHistory("deletion", "Deleted", "", "Medical");
    setDeleteMedicalIDdialog(false);
    setLoading(false);
    setCompletedOn("");
    setDueOn("");
    fetchData();
    setModifiedOn(new Date());
  };

  //FUNCTION TO EDIT VEHICLE ID
  const EditVehicleID = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "records", doc_id), {
        license_number: edited_vehicle_number
          ? edited_vehicle_number
          : vehicle_number,
        license_expiry: edited_vehicle_expiry
          ? TimeStamper(edited_vehicle_expiry)
          : TimeStamper(vehicle_expiry),
        license_issue: edited_vehicle_issue
          ? edited_vehicle_issue
          : vehicle_issue,
        modified_on: Timestamp.fromDate(new Date()),
      });

      await AddHistory("addition", "Updated", "", "Vehicle ID");

      setVehicleNumber(
        edited_vehicle_number ? edited_vehicle_number : vehicle_number
      );
      setVehicleExpiry(
        edited_vehicle_expiry ? edited_vehicle_expiry : vehicle_expiry
      );
      setVehicleIssue(
        edited_vehicle_issue ? edited_vehicle_issue : vehicle_issue
      );

      setEditVehicleIDprompt(false);
      setLoading(false);
      fetchData();
      setModifiedOn(new Date());
    } catch (error) {
      console.log(error);
      setLoading(false);
      message.info(String(error));
    }
  };

  const renewVehicleID = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "records", doc_id), {
        license_issue: edited_vehicle_issue,
        license_expiry: edited_vehicle_expiry
          ? TimeStamper(edited_vehicle_expiry)
          : TimeStamper(vehicle_expiry),
        modified_on: Timestamp.fromDate(new Date()),
      });
      await AddHistory("renew", edited_vehicle_expiry, "", "Vehicle ID");
      setVehicleIssue(
        edited_vehicle_issue ? edited_vehicle_issue : vehicle_issue
      );
      setVehicleExpiry(
        edited_vehicle_expiry ? edited_vehicle_expiry : vehicle_expiry
      );
      setLoading(false);
      setRenewVehicleDialog(false);
      fetchData();
      setModifiedOn(new Date());
    } catch (error) {
      message.error(String(error));
      setLoading(false);
    }
  };

  const addMedicalID = async () => {
    setMedicalIDdialog(false);
    setLoading(true);
    try {
      await updateDoc(doc(db, "records", doc_id), {
        medical_completed_on: medical_completed_on,
        medical_due_on: TimeStamper(medical_due_on),
        modified_on: Timestamp.fromDate(new Date()),
      });
      await AddHistory("addition", "Added", "", "Medical ID");
      setLoading(false);
      fetchData();
      setModifiedOn(new Date());
    } catch (error) {
      console.log(error);
      setCompletedOn("");
      setDueOn("");
      setLoading(false);
      message.info("ID generation failed " + String(error));
    }
  };

  const EditMedicalID = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "records", doc_id), {
        medical_completed_on: editedCompletedOn
          ? editedCompletedOn
          : medical_completed_on,
        medical_due_on: editedDueOn
          ? TimeStamper(editedDueOn)
          : TimeStamper(medical_due_on),
        modified_on: Timestamp.fromDate(new Date()),
      });
      await AddHistory("addition", "Updated", "", "Medical");

      setDueOn(editedDueOn ? editedDueOn : medical_due_on);
      setCompletedOn(
        editedCompletedOn ? editedCompletedOn : medical_completed_on
      );
      setLoading(false);
      setEditMedicalIDdialog(false);
      fetchData();
      setModifiedOn(new Date());
    } catch (error) {
      message.error(String(error));
    }
  };

  const EditPassport = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "records", doc_id), {
        passportID: editedPassportID ? editedPassportID : passportID,
        passportIssue: editedPassportIssue
          ? editedPassportIssue
          : passportIssue,
        passportExpiry: editedPassportExpiry
          ? TimeStamper(editedPassportExpiry)
          : TimeStamper(passportExpiry),
        nativePhone: editedNativePhone ? editedNativePhone : nativePhone,
        nativeAddress: editedNativeAddress
          ? editedNativeAddress
          : nativeAddress,
        modified_on: Timestamp.fromDate(new Date()),
      });
      await AddHistory("addition", "Updated", "", "Passport");
      setPassportID(editedPassportID ? editedPassportID : passportID);
      setPassportIssue(
        editedPassportIssue ? editedPassportIssue : passportIssue
      );
      setPassportExpiry(
        editedPassportExpiry ? editedPassportExpiry : passportExpiry
      );
      setNativePhone(editedNativePhone ? editedNativePhone : nativePhone);
      setNativeAddress(
        editedNativeAddress ? editedNativeAddress : nativeAddress
      );
      setLoading(false);
      setEditPassportDialog(false);
      fetchData();
      setModifiedOn(new Date());
    } catch (error) {
      message.error(String(error));
      setLoading(false);
    }
  };

  const renewMedicalID = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "records", doc_id), {
        medical_completed_on: editedCompletedOn
          ? editedCompletedOn
          : medical_completed_on,
        medical_due_on: editedDueOn
          ? TimeStamper(editedDueOn)
          : TimeStamper(medical_due_on),
        modified_on: Timestamp.fromDate(new Date()),
      });
      await AddHistory("renew", editedCompletedOn, "", "Medical");
      setCompletedOn(
        editedCompletedOn ? editedCompletedOn : medical_completed_on
      );
      setDueOn(editedDueOn ? editedDueOn : medical_due_on);

      setLoading(false);
      setRenewMedicalIDdialog(false);
      fetchData();
      setModifiedOn(new Date());
    } catch (error) {
      message.error(String(error));
      setLoading(false);
    }
  };

  const addPassport = async () => {
    setAddPassportDialog(false);
    setLoading(true);
    try {
      await updateDoc(doc(db, "records", doc_id), {
        passportID: passportID,
        passportIssue: passportIssue,
        passportExpiry: TimeStamper(passportExpiry),
        nativePhone: nativePhone,
        nativeAddress: nativeAddress,
        modified_on: Timestamp.fromDate(new Date()),
      });
      await AddHistory("addition", "Added", "", "Passport");
      setLoading(false);
      fetchData();
      setModifiedOn(new Date());
    } catch (error) {
      message.error(String(error));
      setLoading(false);
    }
  };

  const deletePassport = async () => {
    setLoading(true);
    await updateDoc(doc(db, "records", doc_id), {
      passportID: "",
      passportExpiry: "",
      passportIssue: "",
      modified_on: Timestamp.fromDate(new Date()),
    });
    await AddHistory("deletion", "Deleted", "", "Passport");
    setDeletePassportDialog(false);
    setLoading(false);
    setPassportID("");
    setPassportExpiry("");
    setPassportIssue("");
    fetchData();
    setModifiedOn(new Date());
  };

  const renewPassport = async () => {
    setLoading(true);
    await updateDoc(doc(db, "records", doc_id), {
      passportExpiry: TimeStamper(
        editedPassportExpiry ? editedPassportExpiry : passportExpiry
      ),
      passportIssue: editedPassportIssue ? editedPassportIssue : passportIssue,
      modified_on: Timestamp.fromDate(new Date()),
    });
    await AddHistory("renew", editedPassportExpiry, "", "Passport");
    setPassportIssue(editedPassportIssue ? editedPassportIssue : passportIssue);
    setPassportExpiry(
      editedPassportExpiry ? editedPassportExpiry : passportExpiry
    );
    setLoading(false);
    setRenewPassportDialog(false);
    fetchData();
    setModifiedOn(new Date());
  };
  {
    /* ////////////////////////////////////////////////////////////////////////////////////////////////////////////// */
  }
  {
    /* ////////////////////////////////////////////////////////////////////////////////////////////////////////////// */
  }

  const handleSelect = (id: any) => {
    const index = checked.indexOf(id);
    // console.log(index, id)

    if (index == -1) {
      setChecked((data: any) => [...data, id]);
    } else {
      const newVal = [...checked];
      newVal.splice(index, 1);
      setChecked(newVal);

      // const newVal = [...checked]
      // checked.filter((i:any) => i != id);
      // setChecked(newVal)
    }
  };

  const handleBulkDelete = async () => {
    try {
      let counts = 0;
      let percentage = 100 / checked.length;
      setLoading(true);

      const snapshot = await getDocs(collection(db, "records"));
      snapshot.forEach((e: any) => {
        e.profile_name && deleteObject(ref(storage, e.profile_name));
      });

      await checked.forEach(async (item: any) => {
        // console.log(item)
        await deleteDoc(doc(db, "records", item));
        counts++;
        setProgress(String(percentage * counts) + "%");
        setProgressItem(item);

        if (checked.length == counts) {
          setLoading(false);
          setBulkDeleteDialog(false);
          setSelectable(false);
          fetchData();
          setProgress("");
        }
      });
      await AddHistory(
        "export",
        "Bulk Deletion",
        "",
        "Bulk Deletion " + checked.length + " record(s)"
      );
    } catch (error) {
      setLoading(false);
      message.info(String(error));
    }
  };

  const handleNotify = async () => {
    setNotifyLoading(true);
    await updateDoc(doc(db, "records", doc_id), { notify: !notify });
    setNotify(!notify);
    setNotifyLoading(false);
    notify == true
      ? message.info("Notifications Disabled")
      : message.success("Notifications Enabled");
  };

  const addTraining = async (type: any) => {
    setLoading(true);

    if (type == "hse_induction") {
      await updateDoc(doc(db, "records", doc_id), {
        vt_hse_induction: TimeStamper(EditedTrainingAddDialogInput),
        modified_on: Timestamp.fromDate(new Date()),
      });
      setHseInduction(EditedTrainingAddDialogInput);
    }

    if (type == "car_1") {
      await updateDoc(doc(db, "records", doc_id), {
        vt_car_1: TimeStamper(EditedTrainingAddDialogInput),
        modified_on: Timestamp.fromDate(new Date()),
      });
      setVtCar1(EditedTrainingAddDialogInput);
    }

    if (type == "car_2") {
      await updateDoc(doc(db, "records", doc_id), {
        vt_car_2: TimeStamper(EditedTrainingAddDialogInput),
        modified_on: Timestamp.fromDate(new Date()),
      });
      setVtCar2(EditedTrainingAddDialogInput);
    }

    if (type == "car_3") {
      await updateDoc(doc(db, "records", doc_id), {
        vt_car_3: TimeStamper(EditedTrainingAddDialogInput),
        modified_on: Timestamp.fromDate(new Date()),
      });
      setVtCar3(EditedTrainingAddDialogInput);
    }

    if (type == "car_4") {
      await updateDoc(doc(db, "records", doc_id), {
        vt_car_4: TimeStamper(EditedTrainingAddDialogInput),
        modified_on: Timestamp.fromDate(new Date()),
      });
      setVtCar4(EditedTrainingAddDialogInput);
    }

    if (type == "car_5") {
      await updateDoc(doc(db, "records", doc_id), {
        vt_car_5: TimeStamper(EditedTrainingAddDialogInput),
        modified_on: Timestamp.fromDate(new Date()),
      });
      setVtCar5(EditedTrainingAddDialogInput);
    }

    if (type == "car_6") {
      await updateDoc(doc(db, "records", doc_id), {
        vt_car_6: TimeStamper(EditedTrainingAddDialogInput),
        modified_on: Timestamp.fromDate(new Date()),
      });
      setVtCar6(EditedTrainingAddDialogInput);
    }

    if (type == "car_7") {
      await updateDoc(doc(db, "records", doc_id), {
        vt_car_7: TimeStamper(EditedTrainingAddDialogInput),
        modified_on: Timestamp.fromDate(new Date()),
      });
      setVtCar7(EditedTrainingAddDialogInput);
    }

    if (type == "car_8") {
      await updateDoc(doc(db, "records", doc_id), {
        vt_car_8: TimeStamper(EditedTrainingAddDialogInput),
        modified_on: Timestamp.fromDate(new Date()),
      });
      setVtCar8(EditedTrainingAddDialogInput);
    }

    if (type == "car_9") {
      await updateDoc(doc(db, "records", doc_id), {
        vt_car_9: TimeStamper(EditedTrainingAddDialogInput),
        modified_on: Timestamp.fromDate(new Date()),
      });
      setVtCar9(EditedTrainingAddDialogInput);
    }

    if (type == "car_10") {
      await updateDoc(doc(db, "records", doc_id), {
        vt_car_10: TimeStamper(EditedTrainingAddDialogInput),
        modified_on: Timestamp.fromDate(new Date()),
      });
      setVtCar10(EditedTrainingAddDialogInput);
    }

    setLoading(false);
    setModifiedOn(new Date());
    setTrainingAddDialog(false);
    fetchData();
  };

  const handleImport = () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, {
          type: "binary",
          cellDates: true,
          dateNF: "DD/MM/YYYY",
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        const string = JSON.stringify(json, null, 2);
        setJsonData(JSON.parse(string));
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const uploadJson = async () => {
    setLoading(true);
    await AddHistory("import", "", "", jsonData.length + " records from XLSX");
    let counts = 0;
    let percentage = 100 / jsonData.length;

    jsonData.forEach((e: any) => {
      e.type = e.type == "omni" ? "omni" : props.dbCategory;
      e.created_on = new Date();
      e.modified_on = new Date();
      e.notify = true;
      e.state = "active";
      e.email ? (e.email = e.email) : (e.email = "");

      e.dateofJoin
        ? (e.dateofJoin = moment(e.dateofJoin).format("DD/MM/YYYY"))
        : (e.dateofJoin = "");

      e.initialSalary ? (e.salaryBasic = e.initialSalary) : (e.salaryBasic = 0);

      e.initialAllowance
        ? (e.allowance = e.initialAllowance)
        : (e.allowance = 0);
    });

    for (let e of jsonData) {
      await addDoc(collection(db, "records"), e);
      counts++;
      setProgress(String(percentage * counts) + "%");
      setProgressItem(String(e.name));
    }
    window.location.reload();
    setLoading(false);
    setImportDialog(false);
    fetchData();
  };

  const ToggleOmniscience = async () => {
    setOmniLoad(true);
    await updateDoc(doc(db, "records", doc_id), {
      type: !omni ? "omni" : props.dbCategory,
    });
    setOmniLoad(false);
    setOmni(!omni);
    !omni
      ? message.success("Omniscience Enabled")
      : message.info("Omniscience Disabled");
  };

  const verifyAccess = async () => {
    try {
      setLoading(true);
      const RecordCollection = collection(db, "users");
      const recordQuery = query(
        RecordCollection,
        where("email", "==", window.name)
      );
      const querySnapshot = await getDocs(recordQuery);
      const fetchedData: any = [];
      querySnapshot.forEach((doc: any) => {
        fetchedData.push({ id: doc.id, ...doc.data() });
      });
      setLoading(false);
      fetchedData[0].editor == "true" ? setAccess(true) : setAccess(false);
      fetchedData[0].sensitive_data == "true"
        ? setSensitiveDataAccess(true)
        : setSensitiveDataAccess(false);
      fetchedData[0].editor == "true"
        ? setEditAccess(true)
        : setEditAccess(false);
    } catch (error: any) {
      message.error(String(error));
    }
  };

  return (
    <>
      {status == "false" ? (
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
          <div
            style={{
              display: "flex",
              width: "100%",
              background: "crimson",
              height: "1.5rem",
              justifyContent: "center",
              alignItems: "center",
              position: "fixed",
              bottom: 0,
            }}
          >
            <div
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
              <RadioTower width={"0.75rem"} />
              <p style={{ fontSize: "0.75rem" }}>No Internet</p>
            </div>
          </div>
        </motion.div>
      ) : null}

      {/* Main Container */}
      <div
        style={{
          padding: "1.25rem",
          height: "100svh",
          border: "",
          background:
            "linear-gradient(rgba(67 57 129/ 30%), rgba(100 100 100/ 0%)",
        }}
      >
        {/* Main Component */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
          {/* BACK BUTTON */}
          <Back
            editMode={access}
            // onTap={() => setAccess(!access)}
            title={
              props.title

              // +" ("+records.length+")"
            }
            subtitle={records.length}
            extra={
              !selectable ? (
                <div
                  className="transitions"
                  style={{ display: "flex", gap: "0.5rem", height: "2.75rem" }}
                >
                  {/* <button style={{cursor:"default", width:"5rem", fontSize:"0.9rem", opacity:0.5}}>
                            
                            Ctrl + I
                        </button> */}

                  <RefreshButton
                    onClick={() => fetchData()}
                    refreshCompleted={refreshCompleted}
                    fetchingData={fetchingData}
                  />

                  {access && (
                    <div style={{ display: "flex" }} className="transitions">
                      <DbDropDown
                        onUpload={() => setImportDialog(true)}
                        onExport={() => setExportDialog(true)}
                        onInbox={() => usenavigate("/inbox")}
                        onArchives={() => usenavigate("/archives")}
                        // onAccess={() => usenavigate("/access-control")}
                        trigger={<EllipsisVerticalIcon width={"1.1rem"} />}
                      />
                    </div>
                  )}
                  {!access && (
                    <div style={{ display: "flex" }} className="transitions">
                      <Tooltip title="Ctrl + I">
                        <button
                          className=""
                          onClick={() => usenavigate("/inbox")}
                          style={{
                            width: "3rem",
                            background: "rgba(220 20 60/ 20%)",
                          }}
                        >
                          <Inbox
                            className=""
                            color="crimson"
                            width={"1.25rem"}
                          />
                        </button>
                      </Tooltip>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="transitions"
                  onClick={() => {
                    setSelectAll(!selectAll);
                    !selectAll ? setSelected(true) : setSelected(false);
                    !selectAll
                      ? records.forEach((item: any) => {
                          setChecked((data: any) => [...data, item.id]);
                        })
                      : setChecked([]);
                  }}
                  style={{
                    height: "2.25rem",
                    border: "",
                    width: "",
                    background: "rgba(100 100 100/ 20%)",
                    padding: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingLeft: "1rem",
                    paddingRight: "1rem",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    marginTop: "0.25rem",
                    marginBottom: "0.25rem",
                    gap: "1rem",
                  }}
                >
                  <Check color="dodgerblue" />
                  <p style={{ fontWeight: 600 }}>{checked.length}</p>
                </div>
              )
            }
          />
          <br />

          {
            // if page doesn't load :

            // IF NUMBER OF RECORDS IS LESS THAN 1
            records.length < 1 ? (
              status == "false" ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "75svh",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      border: "",
                      flexFlow: "column",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "0.25rem",
                        opacity: "0.5",
                      }}
                    >
                      <RadioTower width={"1rem"} />
                      <p>No Internet Connection</p>
                    </div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                    >
                      <p style={{ opacity: 0.5, fontSize: "0.7rem" }}>
                        Please check your internet connectivity
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              ) : fetchingData ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "75svh",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      border: "",
                    }}
                  >
                    <div
                      style={{
                        border: "",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {props.loader}
                    </div>
                  </div>
                </motion.div>
              ) : (
                // DISPLAY EMPTY SET - PAGE
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "75svh",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      border: "",
                      flexFlow: "column",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "0.25rem",
                        opacity: "0.5",
                      }}
                    >
                      <PackageOpen width={"1rem"} />
                      <p>No Data</p>
                    </div>

                    <p style={{ opacity: 0.5, fontSize: "0.7rem" }}>
                      Add a record using + Add Record
                    </p>
                  </div>
                </motion.div>
              )
            ) : (
              //else

              //DISPLAY Page Beginning
              <div
                style={{
                  display: "flex",
                  flexFlow: "column",
                  gap: "0.5rem",
                  marginTop: "1",
                }}
              >
                {/* Searchbar */}
                <div
                  className="transitions"
                  style={{
                    display: "flex",
                    gap: "0.35rem",
                    padding: "",

                    borderRadius: "0.85rem",
                    flex: 1,
                  }}
                >
                  {access && (
                    <button
                      className={selectable ? "blue" : ""}
                      onClick={() => {
                        setSelectable(!selectable);
                        selectable && setChecked([]);
                        !selectable && setSelected(false);
                      }}
                    >
                      <CheckSquare2
                        color={selectable ? "white" : "dodgerblue"}
                      />
                    </button>
                  )}

                  <SearchBar
                    placeholder="Search"
                    onChange={(e: any) => {
                      setSearch(e.target.value.toLowerCase());
                    }}
                  />

                  <Select defaultValue="name" onValueChange={setSortBy}>
                    <SelectTrigger
                      style={{ width: "fit-content", background: "" }}
                    >
                      {sortby == "name" ? (
                        <ArrowDownAZ width={"1.25rem"} color="dodgerblue" />
                      ) : sortby == "created_on" ? (
                        <ListStart width={"1.25rem"} color="dodgerblue" />
                      ) : (
                        <ArrowDown01 width={"1.25rem"} color="dodgerblue" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        style={{ justifyContent: "flex-start" }}
                        value="name"
                      >
                        Name
                      </SelectItem>
                      {/* <SelectItem
                        style={{ justifyContent: "flex-start" }}
                        value="employeeCode"
                      >
                        Code
                      </SelectItem> */}
                      <SelectItem
                        style={{ justifyContent: "flex-start" }}
                        value="created_on"
                      >
                        Original
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <button
                    onClick={() => setThumbnails(!thumbnails)}
                    style={{
                      width: "fit-content",
                      fontSize: "0.7rem",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {thumbnails ? (
                      <ImageOff style={{ opacity: 0.5 }} width={"1.5rem"} />
                    ) : (
                      <Image color="dodgerblue" width={"1.5rem"} />
                    )}
                    {/* <p style={{opacity:0.5, fontWeight:400}}>Thumbnails</p> */}
                  </button>

                  {/* <button onClick={()=>setImportDialog(true)}>
                            <UploadCloud color="salmon"/>
                        </button> */}

                  {/* <button>
                            <ArrowDownAZ color="dodgerblue"/>
                        </button> */}
                </div>

                <p style={{ height: "0.25rem" }} />

                <div
                  className="record-list"
                  style={{
                    display: "flex",
                    gap: "0.6rem",

                    overflowY: "auto",
                    height: "74svh",
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    style={{
                      display: "flex",
                      flexFlow: "column",
                      gap: "0.6rem",
                    }}
                  >
                    {
                      // RECORD DATA MAPPING
                      records
                        .filter((post: any) => {
                          return search == ""
                            ? {}
                            : post.name &&
                                post.name
                                  .toLowerCase()
                                  .includes(search.toLowerCase());
                        })
                        .map((post: any) => (
                          // <motion.div
                          //   key={post.id}
                          //   initial={{ opacity: 0 }}
                          //   whileInView={{ opacity: 1 }}
                          // >
                          <Directive
                            className="record-item"
                            space
                            new={
                              moment(post.created_on.toDate()).fromNow() ==
                                "a few seconds ago" ||
                              (selectable && post.type == "omni")
                            }
                            dotColor={selectable ? "violet" : "dodgerblue"}
                            notify={!post.notify}
                            archived={post.state == "archived" ? true : false}
                            tag={
                              post.civil_expiry != "" ||
                              post.license_expiry != "" ||
                              post.medical_due_on != "" ||
                              post.passportID != "" ||
                              post.vt_hse_induction != "" ||
                              post.vt_car_1 != "" ||
                              post.vt_car_2 != "" ||
                              post.vt_car_3 != "" ||
                              post.vt_car_4 != "" ||
                              post.vt_car_5 != "" ||
                              post.vt_car_6 != "" ||
                              post.vt_car_7 != "" ||
                              post.vt_car_8 != "" ||
                              post.vt_car_9 != "" ||
                              post.vt_car_10 != ""
                                ? post.state == "archived"
                                  ? "Archived"
                                  : ""
                                : "No Data"
                            }
                            selected={selected}
                            selectable={selectable}
                            status
                            // ON CLICK
                            onSelect={() => {
                              handleSelect(post.id);
                            }}
                            onClick={() => {
                              setRecordSummary(true);
                              setName(post.name);
                              setId(post.id);
                              setDocID(post.id);

                              setCivilNumber(post.civil_number);
                              setCivilExpiry(
                                post.civil_expiry
                                  ? moment(post.civil_expiry).format(
                                      "DD/MM/YYYY"
                                    )
                                  : ""
                              );
                              setCivilDOB(post.civil_DOB);
                              setCompletedOn(post.medical_completed_on);
                              setDueOn(
                                post.medical_due_on
                                  ? moment(post.medical_due_on).format(
                                      "DD/MM/YYYY"
                                    )
                                  : null
                              );
                              setVehicleNumber(post.license_number);
                              setVehicleExpiry(
                                post.license_expiry
                                  ? moment(post.license_expiry.toDate()).format(
                                      "DD/MM/YYYY"
                                    )
                                  : ""
                              );
                              setVehicleIssue(post.license_issue);
                              setModifiedOn(
                                post.modified_on
                                  ? moment(post.modified_on.toDate())
                                  : ""
                              );
                              setCreatedOn(
                                moment(post.created_on.toDate()).format("LL")
                              );
                              setPassportID(post.passportID);
                              setPassportIssue(post.passportIssue);
                              setPassportExpiry(
                                post.passportExpiry
                                  ? moment(post.passportExpiry).format(
                                      "DD/MM/YYYY"
                                    )
                                  : null
                              );
                              setEmail(post.email);
                              setNotify(post.notify);

                              setHseInduction(
                                post.vt_hse_induction
                                  ? moment(
                                      post.vt_hse_induction.toDate()
                                    ).format("DD/MM/YYYY")
                                  : null
                              );

                              setVtCar1(
                                post.vt_car_1
                                  ? moment(post.vt_car_1.toDate()).format(
                                      "DD/MM/YYYY"
                                    )
                                  : null
                              );

                              setVtCar2(
                                post.vt_car_2
                                  ? moment(post.vt_car_2.toDate()).format(
                                      "DD/MM/YYYY"
                                    )
                                  : null
                              );

                              setVtCar3(
                                post.vt_car_3
                                  ? moment(post.vt_car_3).format("DD/MM/YYYY")
                                  : null
                              );

                              setVtCar4(
                                post.vt_car_4
                                  ? moment(post.vt_car_4.toDate()).format(
                                      "DD/MM/YYYY"
                                    )
                                  : null
                              );

                              setVtCar5(
                                post.vt_car_5
                                  ? moment(post.vt_car_5.toDate()).format(
                                      "DD/MM/YYYY"
                                    )
                                  : null
                              );

                              setVtCar6(
                                post.vt_car_6
                                  ? moment(post.vt_car_6.toDate()).format(
                                      "DD/MM/YYYY"
                                    )
                                  : null
                              );

                              setVtCar7(
                                post.vt_car_7
                                  ? moment(post.vt_car_7.toDate()).format(
                                      "DD/MM/YYYY"
                                    )
                                  : null
                              );

                              setVtCar8(
                                post.vt_car_8
                                  ? moment(post.vt_car_8.toDate()).format(
                                      "DD/MM/YYYY"
                                    )
                                  : null
                              );

                              setVtCar9(
                                post.vt_car_9
                                  ? moment(post.vt_car_9.toDate()).format(
                                      "DD/MM/YYYY"
                                    )
                                  : null
                              );

                              setVtCar10(
                                post.vt_car_10
                                  ? moment(post.vt_car_10.toDate()).format(
                                      "DD/MM/YYYY"
                                    )
                                  : null
                              );

                              setImage(post.profile);
                              setProfileName(post.profile_name);
                              setCivilNumber(post.civil_number);
                              setVehicleNumber(post.license_number);
                              setPassportID(post.passportID);
                              setEmployeeCode(post.employeeCode);
                              setCompanyName(post.companyName);
                              setDateofJoin(post.dateofJoin);
                              setSalaryBasic(post.salaryBasic);
                              setAllowance(post.allowance);
                              setInitialSalary(post.initialSalary);
                              setInitialAllowance(post.initialAllowance);
                              setRemarks(post.remarks);
                              setState(post.state);
                              setContact(post.contact);
                              setNativePhone(post.nativePhone);
                              setNativeAddress(post.nativeAddress);
                              post.type == "omni"
                                ? setOmni(true)
                                : setOmni(false);
                              fetchLeave();
                            }}
                            key={post.id}
                            title={post.name}
                            icon={
                              thumbnails ? (
                                <UserCircle
                                  color="dodgerblue"
                                  width={"1.75rem"}
                                  height={"1.75rem"}
                                />
                              ) : (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  whileInView={{ opacity: 1 }}
                                >
                                  <LazyLoader
                                    gradient
                                    name={post.name}
                                    type={post.type}
                                    profile={post.profile}
                                    block
                                    state={post.state}
                                    omni={post.type == "omni"}
                                  />
                                </motion.div>
                              )
                            }
                          />
                          // </motion.div>
                        ))
                    }
                  </motion.div>
                </div>
              </div>
            )
          }

          <br />

          {/* <Pagination style={{cursor:"pointer"}}>
                    <PaginationContent>

                        <PaginationItem>
                            <PaginationLink>
                                <ChevronLeft width="1rem" height="1rem"/>
                            </PaginationLink>
                        </PaginationItem>

                        <PaginationItem>
                            <PaginationLink isActive>1</PaginationLink>
                        </PaginationItem>

                        <PaginationItem>
                            <PaginationLink>2</PaginationLink>
                        </PaginationItem>
                        
                        <PaginationItem>
                            <PaginationLink><Ellipsis width="1rem" height="1rem"/></PaginationLink>
                        </PaginationItem>

                        <PaginationItem>
                            <PaginationNext/>
                        </PaginationItem>

                    </PaginationContent>
                </Pagination> */}
        </motion.div>

        {/* ADD RECORD BUTTON */}

        {access && (
          <AddRecordButton
            onClickSwap={selectable}
            onClick={() => {
              setAddDialog(true);
              setName("");
              setEmail("");
              setEmployeeCode("");
              setCompanyName("");
              setDateofJoin("");
              setSalaryBasic(0);
              setAllowance(0);
              setContact("");
            }}
            alternateOnClick={() => {
              checked.length < 1 ? null : setBulkDeleteDialog(true);
            }}
            icon={
              selectable ? (
                <Trash color={checked.length < 1 ? "#5a5a5a" : "crimson"} />
              ) : (
                <Plus color="dodgerblue" />
              )
            }
          />
        )}

        {/* ////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}

        {/* Dialog Boxes 👇*/}

        <DefaultDialog
          close
          codeIcon={<File width={"1rem"} color="dodgerblue" />}
          onCancel={() => {
            setExportDialog(false);
            window.location.reload();
          }}
          open={exportDialog}
          title_extra={
            <button
              onClick={exportRawDB}
              style={{ fontSize: "0.8rem", width: "9rem" }}
            >
              {loading ? (
                <LoaderCircle className="animate-spin" width={"1rem"} />
              ) : (
                <DownloadCloud color="dodgerblue" width={"1rem"} />
              )}
              Raw Data
            </button>
          }
          title={"Export Data"}
          titleIcon={<DownloadCloud color="lightgreen" />}
          extra={
            <div
              style={{
                width: "100%",
                display: "flex",
                flexFlow: "column",
                gap: "0.5rem",
              }}
            >
              <Directive
                loading={loading}
                icon={<File width={"1.25rem"} color="dodgerblue" />}
                title={"Export Records"}
                // tag={<DownloadCloud width={"1.25rem"} />}
                status
                onClick={exportDB}
              />
              <Directive
                icon={<BarChart3Icon color="violet" width={"1.25rem"} />}
                title={"Export Leave Log"}
                // tag={<DownloadCloud width={"1.25rem"} />}
                status
                // noArrow
              />
              <Directive
                title={"Export Salary Log"}
                icon={<CircleDollarSign width={"1.25rem"} color="lightgreen" />}
                // tag={<DownloadCloud width={"1.25rem"} />}
                status
                // noArrow
              />
              <Directive
                notName
                title={"Export Allowance Log"}
                icon={<HandHelping color="salmon" />}
                // tag={<DownloadCloud width={"1.25rem"} />}
                status
                // noArrow
              />
            </div>
          }
        />

        <DefaultDialog
          progress={progress}
          progressItem={progressItem}
          open={importDialog}
          created_on={jsonData.length == 0 ? "" : "" + jsonData.length}
          title={"Upload XLSX"}
          titleIcon={<UploadCloud color="salmon" />}
          codeIcon={<File width={"0.8rem"} />}
          code=".xls, .xlsx"
          OkButtonText="Upload"
          onCancel={() => {
            setImportDialog(false);
            setFile(null);
            setJsonData([]);
            window.location.reload();
          }}
          disabled={jsonData.length > 0 ? false : true}
          updating={loading}
          onOk={uploadJson}
          title_extra={
            <div style={{ display: "flex", flexFlow: "column", gap: "0.5rem" }}>
              <button
                onClick={fetchBlank}
                style={{
                  fontSize: "0.8rem",
                  height: "2rem",
                  paddingLeft: "1rem",
                  paddingRight: "1rem",
                }}
              >
                {
                  <>
                    <FileDown color="lightgreen" width={"1rem"} />
                    Template
                  </>
                }
              </button>
            </div>
          }
          extra={
            <>
              {jsonData.length == 0 ? (
                <div
                  style={{
                    width: "100%",
                    border: "3px dashed rgba(100 100 100/ 50%)",
                    height: "2.5rem",
                    borderRadius: "0.5rem",
                    marginBottom: "",
                  }}
                ></div>
              ) : (
                <div
                  className="recipients"
                  style={{
                    width: "100%",
                    display: "flex",
                    flexFlow: "column",
                    gap: "0.35rem",
                    maxHeight: "11.25rem",
                    overflowY: "auto",
                    paddingRight: "0.5rem",
                    minHeight: "2.25rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  {jsonData.map((e: any) => (
                    <motion.div
                      key={e.name}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                    >
                      <Directive
                        status={true}
                        noArrow
                        onClick={() => {}}
                        tag={e.employeeCode}
                        title={e.name}
                        titleSize="0.75rem"
                        key={e.id}
                        icon={<UserCircle width={"1.25rem"} color="salmon" />}
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
                <input
                  style={{ fontSize: "0.8rem" }}
                  type="file"
                  accept=".xls, .xlsx"
                  onChange={(e: any) => setFile(e.target.files[0])}
                />
                <button
                  className={file ? "" : "disabled"}
                  onClick={() => {
                    jsonData.length > 0 ? setJsonData([]) : handleImport();
                  }}
                  style={{
                    fontSize: "0.8rem",
                    paddingRight: "1rem",
                    paddingLeft: "1rem",
                  }}
                >
                  {jsonData.length > 0 ? "Clear" : "Add"}
                </button>
              </div>
            </>
          }
        />

        <SheetComponent title={name} />
        {/* ////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}

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

        <DefaultDialog
          titleIcon={<Download />}
          title={state == "active" ? "Archive Record?" : "Unarchive?"}
          open={archivePrompt}
          onCancel={() => setArchivePrompt(false)}
          OkButtonText={state == "active" ? "Archive" : "Confirm"}
          onOk={archiveRecord}
          updating={loading}
          disabled={loading}
        />

        <DefaultDialog
          close
          titleIcon={<ScrollText color="dodgerblue" />}
          title={"Contract"}
          open={contractDialog}
          onCancel={() => setContractDialog(false)}
          extra={
            <div
              style={{
                display: "flex",
                flexFlow: "column",
                width: "100%",
                border: "",
              }}
            >
              <div
                style={{
                  border: "",
                  height: "28ch",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    background: "rgba(100 100 100/ 10%)",
                    border: "2px solid rgba(100 100 100/ 40%)",
                    height: "22ch",
                    width: "16ch",
                    borderRadius: "0.5rem",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <p style={{ fontSize: "0.75rem", opacity: 0.5 }}>
                    No Preview
                  </p>
                </div>
              </div>
              {/* <p
                style={{
                  textAlign: "center",
                  padding: "0.25rem",
                  fontSize: "0.8rem",
                  background:
                    "linear-gradient(90deg, rgba(100 100 100/ 0%), rgba(100 100 100/ 20%), rgba(100 100 100/ 0%))",
                }}
              >
                Expiring Soon
              </p> */}
              <br />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                }}
              >
                <input placeholder="Contract Expiry Date" />
                <button
                  className="primary"
                  style={{
                    paddingLeft: "1rem",
                    paddingRight: "1rem",
                    fontSize: "0.8rem",
                  }}
                >
                  <RefreshCcw color="dodgerblue" width={"1rem"} />
                  Update
                </button>
              </div>
            </div>
          }
        />

        {/* DISPLAY RECORD DIALOG */}
        <DefaultDialog
          code={employeeCode}
          creation_date={created_on}
          codeTooltip="Employee Code"
          tags
          onTitleClick={() =>
            props.dbCategory == "personal"
              ? access && ToggleOmniscience()
              : message.info("Omniscience retrace on parent record")
          }
          contact={contact}
          renumeration={
            props.dbCategory == "personal" && sensitive_data_access == true
              ? true
              : false
          }
          remarksOnClick={() => access && setRemarksDialog(true)}
          remarksValue={remarks}
          tag1Text={companyName}
          tag1OnClick={() => setContractDialog(true)}
          tag2Text={dateofJoin}
          tag3Text={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.75rem",
              }}
            >
              {salaryBasic}
              <div
                style={{
                  border: "",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <p style={{ opacity: 0.5 }}>
                  {"(" +
                    Math.abs((salaryBasic - initialSalary) / initialSalary) +
                    "%" +
                    ")"}
                </p>
                <p>
                  {Math.sign((salaryBasic - initialSalary) / initialSalary) ==
                  -1 ? (
                    <ArrowDown
                      strokeWidth={"3px"}
                      width={"0.9rem"}
                      color="lightcoral"
                    />
                  ) : (salaryBasic - initialSalary) / initialSalary == 0 ? (
                    ""
                  ) : (
                    <ArrowUp
                      strokeWidth={"3px"}
                      width={"0.9rem"}
                      color="lightgreen"
                    />
                  )}
                </p>
              </div>
            </div>
          }
          tag4Text={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.75rem",
              }}
            >
              {allowance}
              <div
                style={{
                  border: "",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <p style={{ opacity: 0.5 }}>
                  {"(" +
                    Math.abs(
                      (allowance - initialAllowance) / initialAllowance
                    ) +
                    "%" +
                    ")"}
                </p>
                <p>
                  {Math.sign(
                    (allowance - initialAllowance) / initialAllowance
                  ) == -1 ? (
                    <ArrowDown
                      strokeWidth={"3px"}
                      width={"0.9rem"}
                      color="lightcoral"
                    />
                  ) : (allowance - initialAllowance) / initialAllowance == 0 ? (
                    ""
                  ) : (
                    <ArrowUp
                      strokeWidth={"3px"}
                      width={"0.9rem"}
                      color="lightgreen"
                    />
                  )}
                </p>
              </div>
            </div>
          }
          tag3OnClick={() => {
            setSalaryDialog(true);
            fetchSalary();
            setSalaryList([]);
          }}
          tag4OnClick={() => {
            setAllowanceDialog(true);
            fetchAllowance();
            setAllowanceList([]);
          }}
          onBottomTagClick={() => {
            setLeaveLog(true);
            fetchLeave();
            setLeaveList([]);
            setId(doc_id);
          }}
          bottomTagValue={leaves}
          bottomValueLoading={fetchingLeave}
          titleIcon={
            <div onClick={() => (image ? setImageDialog(true) : {})}>
              <LazyLoader
                profile={image}
                gradient
                block
                width="4rem"
                height="4rem"
                name={name}
                loading={omniLoad}
                state={state}
                omni={omni}
              />
            </div>

            // <Avatar
            //   style={{
            //     width: "3.55rem",
            //     height: "3.5rem",
            //     objectFit: "cover",
            //     display: "flex",
            //     justifyContent: "center",
            //     alignItems: "center",
            //     cursor: "pointer",
            //     border:
            //       state == "archived"
            //         ? "2px solid goldenrod"
            //         : omni
            //         ? "2px solid violet"
            //         : "",
            //   }}
            // >
            //   <AvatarImage
            //     onClick={() => setImageDialog(true)}
            //     style={{ objectFit: "cover" }}
            //     src={image}
            //   />
            //   <AvatarFallback>
            //     {omniLoad ? (
            //       <LoadingOutlined />
            //     ) : (
            //       <p style={{ paddingTop: "0.1rem" }}>{Array.from(name)[0]}</p>
            //     )}
            //   </AvatarFallback>
            // </Avatar>
          }
          title={name}
          open={recordSummary}
          onCancel={() => {
            setRecordSummary(false);
            setEmail("");
          }}
          bigDate={() =>
            message.info(
              "Last Modified : " +
                String(moment(new Date(modified_on)).format("LLL"))
            )
          }
          created_on={
            <ReactTimeAgo
              date={moment(modified_on, "DD/MM/YYYY").toDate()}
              timeStyle={"twitter"}
              locale="en-us"
            />
          }
          title_extra={
            <div
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
              {state == "active"
                ? access && (
                    <button
                      className={notify ? "blue-glass" : ""}
                      onClick={handleNotify}
                      style={{
                        paddingLeft: "1rem",
                        paddingRight: "1rem",
                        height: "2.5rem",
                      }}
                    >
                      {notifyLoading ? (
                        <LoadingOutlined color="dodgerblue" />
                      ) : notify ? (
                        <BellRing
                          color={"dodgerblue"}
                          width={"1rem"}
                          fill="dodgerblue"
                        />
                      ) : (
                        <BellOff width={"1rem"} color="grey" />
                      )}
                    </button>
                  )
                : access && (
                    <Tooltip title="All notifications paused">
                      <button
                        style={{
                          fontSize: "0.8rem",
                          width: "2.75rem",
                          opacity: "0.75",
                          border: "",
                          height: "2.5rem",
                          color: "",
                        }}
                      >
                        <Archive width={"1.15rem"} />
                      </button>
                    </Tooltip>
                  )}

              {access && (
                <DropDown
                  onExtra={() => setArchivePrompt(true)}
                  extraText={state == "active" ? "Archive" : "Unarchive"}
                  onDelete={() => {
                    setUserDeletePrompt(true);
                    fetchLeave();
                    fetchSalary();
                    fetchAllowance();
                  }}
                  onEdit={() => {
                    setUserEditPrompt(true);
                  }}
                  trigger={<EllipsisVerticalIcon width={"1.1rem"} />}
                />
              )}
              {!access && (
                <button
                  style={{
                    height: "2rem",
                    fontSize: "0.8rem",
                    opacity: "0.75",
                  }}
                >
                  <Eye width={"1rem"} color="dodgerblue" />
                  Preview
                </button>
              )}
            </div>
          }
          close
          extra={
            <div
              style={{
                border: "",
                width: "100%",
                display: "flex",
                flexFlow: "column",
                gap: "0.5rem",
                paddingBottom: "",
                paddingTop: "",
              }}
            >
              <Directive
                onClick={() => access && setCivil(true)}
                icon={<CreditCard color="dodgerblue" />}
                title="Civil ID"
                tag={civil_expiry}
                status={
                  moment(civil_expiry, "DD/MM/YYYY").diff(
                    moment(today),
                    "months"
                  ) <= 2
                    ? false
                    : true
                }
              />

              <Directive
                tag={vehicle_expiry}
                onClick={() => access && setVehicle(true)}
                icon={<Car color="violet" />}
                title="License"
                status={
                  moment(vehicle_expiry, "DD/MM/YYYY").diff(
                    moment(today),
                    "months"
                  ) <= 2
                    ? false
                    : true
                }
              />

              <Directive
                tag={passportExpiry}
                onClick={() => access && setPassportDialog(true)}
                icon={<Book color="goldenrod" />}
                title="Passport"
                status={
                  moment(passportExpiry, "DD/MM/YYYY").diff(
                    moment(today),
                    "months"
                  ) <= 6
                    ? false
                    : true
                }
              />

              {props.dbCategory == "vale" && (
                <Directive
                  tag={medical_due_on}
                  onClick={() => setHealthDialog(true)}
                  icon={<HeartPulse color="tomato" />}
                  title="Medical"
                  status={
                    moment(medical_due_on, "DD/MM/YYYY").diff(
                      moment(today),
                      "months"
                    ) <= 2
                      ? false
                      : true
                  }
                />
              )}

              {props.noTraining ? null : (
                <Directive
                  tag={
                    moment(vt_hse_induction, "DD/MM/YYYY").diff(
                      moment(today),
                      "months"
                    ) <= 2 ||
                    moment(vt_car_1, "DD/MM/YYYY").diff(
                      moment(today),
                      "months"
                    ) <= 2 ||
                    moment(vt_car_2, "DD/MM/YYYY").diff(
                      moment(today),
                      "months"
                    ) <= 2 ||
                    moment(vt_car_3, "DD/MM/YYYY").diff(
                      moment(today),
                      "months"
                    ) <= 2 ||
                    moment(vt_car_4, "DD/MM/YYYY").diff(
                      moment(today),
                      "months"
                    ) <= 2 ||
                    moment(vt_car_5, "DD/MM/YYYY").diff(
                      moment(today),
                      "months"
                    ) <= 2 ||
                    moment(vt_car_6, "DD/MM/YYYY").diff(
                      moment(today),
                      "months"
                    ) <= 2 ||
                    moment(vt_car_7, "DD/MM/YYYY").diff(
                      moment(today),
                      "months"
                    ) <= 2 ||
                    moment(vt_car_8, "DD/MM/YYYY").diff(
                      moment(today),
                      "months"
                    ) <= 2 ||
                    moment(vt_car_9, "DD/MM/YYYY").diff(
                      moment(today),
                      "months"
                    ) <= 2 ||
                    moment(vt_car_10, "DD/MM/YYYY").diff(
                      moment(today),
                      "months"
                    ) <= 2
                      ? "Expiring"
                      : ""
                  }
                  onClick={() => {
                    setValeTrainingDialog(true);
                  }}
                  icon={<GraduationCap color="lightgreen" />}
                  title="Training"
                />
              )}
            </div>
          }
        />

        <ImageDialog
          open={imageDialog}
          src={image}
          onCancel={() => setImageDialog(false)}
        />

        {/* ADD RECORD DIALOG */}
        <AddRecordDialog
          open={addDialog}
          onCancel={() => {
            setAddDialog(false);
            setEditedName("");
          }}
          updating={loading}
          disabled={loading}
          title="Add Record"
          renumeration={props.dbCategory == "personal" ? true : false}
          onImageChange={(e: any) => {
            setImageUpload(e.target.files[0]);
            setFileName(e.target.files[0].name);
          }}
          NameOnChange={(e: any) => {
            setName(e.target.value);
          }}
          EmailOnChange={(e: any) => setEmail(e.target.value)}
          CodeOnChange={(e: any) => setEmployeeCode(e.target.value)}
          CompanyNameOnChange={(e: any) => setCompanyName(e.target.value)}
          DateofJoinOnChange={(e: any) => setDateofJoin(e.target.value)}
          SalaryBasicOnChange={(e: any) => setSalaryBasic(e.target.value)}
          AllowanceOnChange={(e: any) => setAllowance(e.target.value)}
          LocalContactOnChange={(e: any) => setContact(e.target.value)}
          onOK={addRecord}
        />

        {/* EDIT RECORD DIALOG */}
        <AddRecordDialog
          open={userEditPrompt}
          onCancel={() => {
            setUserEditPrompt(false);
            setEditedName("");
          }}
          title="Edit Record"
          updating={loading}
          disabled={loading}
          renumeration={props.dbCategory == "personal" ? true : false}
          onImageChange={(e: any) => {
            setImageUpload(e.target.files[0]);
            setFileName(e.target.files[0].name);
          }}
          NameOnChange={(e: any) => {
            setEditedName(e.target.value);
          }}
          EmailOnChange={(e: any) => setEditedEmail(e.target.value)}
          CodeOnChange={(e: any) => setEditedEmployeeCode(e.target.value)}
          CompanyNameOnChange={(e: any) => setEditedCompanyName(e.target.value)}
          DateofJoinOnChange={(e: any) => setEditedDateofJoin(e.target.value)}
          SalaryBasicOnChange={(e: any) => setEditedSalaryBasic(e.target.value)}
          AllowanceOnChange={(e: any) => setEditedAllowance(e.target.value)}
          LocalContactOnChange={(e: any) => setEditedContact(e.target.value)}
          NameLabel="Full Name : "
          EmailLabel="Email : "
          CodeLabel="Code : "
          CompanyLabel="Company : "
          DateofJoinLabel="Date of Join : "
          SalaryBasicLabel="Initial Salary : "
          AllowanceLabel="Allowance : "
          LocalContactLabel="Contact : "
          NameValue={name}
          EmailValue={email}
          CodeValue={employeeCode}
          CompanyValue={companyName}
          DateofJoinValue={dateofJoin}
          SalaryBasicValue={initialSalary}
          AllowanceValue={initialAllowance}
          LocalContactValue={contact}
          onOK={EditRecordName}
        />

        {/* DELETE RECORD DIALOG */}
        <DefaultDialog
          open={userDeletePrompt}
          titleIcon={<X />}
          destructive
          title="Delete Record?"
          OkButtonText="Delete"
          onCancel={() => setUserDeletePrompt(false)}
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

        {/* ////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}

        {/*DISPLAY CIVIL ID DIALOG */}
        <DefaultDialog
          back
          close
          titleIcon={<CreditCard color="dodgerblue" />}
          title="Civil ID"
          open={civil}
          onCancel={() => setCivil(false)}
          OkButtonText="Add"
          title_extra={
            civil_number ? (
              <div
                style={{ display: "flex", gap: "0.5rem", height: "2.25rem" }}
              >
                {moment(civil_expiry, "DD/MM/YYYY").diff(
                  moment(today),
                  "months"
                ) +
                  1 <=
                3 ? (
                  <button
                    onClick={() => {
                      setRenewDocDialog(true);
                    }}
                    className=""
                    style={{
                      fontSize: "0.85rem",
                      width: "6rem",
                      display: "flex",
                      gap: "0.5rem",
                      background: "goldenrod",
                      color: "black",
                    }}
                  >
                    <Sparkles width={"0.85rem"} color="black" />
                    Renew
                  </button>
                ) : null}
                {access && (
                  <DropDown
                    onDelete={() => {
                      setCivilDelete(true);
                    }}
                    onEdit={() => {
                      setEditcivilprompt(true);
                    }}
                    trigger={<EllipsisVerticalIcon width={"1.1rem"} />}
                  />
                )}
              </div>
            ) : null
          }
          extra={
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                paddingBottom: "1rem",
              }}
            >
              {!civil_number || loading ? (
                <div style={{ height: "19ch", width: "32ch", display: "flex" }}>
                  <button
                    onClick={() => setAddcivil(true)}
                    style={{
                      width: "100%",
                      border: "2px solid rgba(100 100 100/ 50%)",
                    }}
                  >
                    {!loading ? (
                      <>
                        <Plus width={"1rem"} />
                        Add ID
                      </>
                    ) : (
                      <>
                        <LoadingOutlined />
                        Generating ID
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div>
                  <CivilID
                    name={name}
                    expirydate={
                      new_civil_expiry ? new_civil_expiry : civil_expiry
                    }
                    civilid={new_civil_number ? new_civil_number : civil_number}
                    DOB={civil_DOB}
                  />
                  {/* <br/>
                        <button style={{width:"100%"}}>Edit</button> */}
                </div>
              )}

              <br />
            </div>
          }
        />

        {/* ADD CIVIL ID DIALOG */}
        <InputDialog
          open={addcivil}
          title="Add Civil ID"
          titleIcon={<CreditCard />}
          inputplaceholder="Civil Number"
          input2placeholder="Expiry Date"
          input3placeholder="Date of Birth"
          OkButtonText="Add"
          onCancel={() => setAddcivil(false)}
          onOk={addCivilID}
          inputOnChange={(e: any) => setEditedCivilNumber(e.target.value)}
          input2OnChange={(e: any) => setEditedCivilExpiry(e.target.value)}
          input3OnChange={(e: any) => setEditedCivilDOB(e.target.value)}
          updating={loading}
          disabled={loading}
        />

        {/* EDIT CIVIL ID DIALOG */}
        <InputDialog
          open={editcivilprompt}
          title="Edit Civil ID"
          titleIcon={<PenLine />}
          OkButtonText="Update"
          onCancel={() => {
            setEditcivilprompt(false);
            setEditedCivilNumber("");
            setEditedCivilExpiry(null);
            setEditedCivilDOB("");
          }}
          inputplaceholder="Enter New Civil ID"
          input2placeholder="Enter Expiry Date"
          input3placeholder="Enter Date of Birth"
          inputOnChange={(e: any) => setEditedCivilNumber(e.target.value)}
          input2OnChange={(e: any) => {
            setEditedCivilExpiry(e.target.value);
          }}
          input3OnChange={(e: any) => setEditedCivilDOB(e.target.value)}
          onOk={EditCivilID}
          updating={loading}
          disabled={loading}
          input1Value={civil_number}
          input2Value={civil_expiry}
          input3Value={civil_DOB}
          input1Label="Civil Number : "
          input2Label="Expiry Date : "
          input3Label="Date of Birth : "
        />

        {/* DELETE CIVIL ID DIALOG */}
        <DefaultDialog
          destructive
          updating={loading}
          open={civilDelete}
          title="Delete Civil ID?"
          OkButtonText="Delete"
          onCancel={() => setCivilDelete(false)}
          onOk={deleteCivilID}
          disabled={loading}
        />

        {/* ////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}

        {/*DISPLAY VEHICLE ID DIALOG */}
        <DefaultDialog
          close
          titleIcon={<Car color="violet" />}
          title="License"
          open={vehicle}
          onCancel={() => setVehicle(false)}
          OkButtonText="Add"
          back
          title_extra={
            vehicle_number ? (
              <div
                style={{ display: "flex", gap: "0.5rem", height: "2.25rem" }}
              >
                {moment(vehicle_expiry, "DD/MM/YYYY").diff(
                  moment(today),
                  "months"
                ) <= 2 ? (
                  <button
                    onClick={() => {
                      setRenewVehicleDialog(true);
                    }}
                    className=""
                    style={{
                      fontSize: "0.85rem",
                      width: "6rem",
                      display: "flex",
                      gap: "0.5rem",
                      background: "goldenrod",
                      color: "black",
                    }}
                  >
                    <Sparkles width={"0.85rem"} color="black" />
                    Renew
                  </button>
                ) : null}

                {/* <DropDown onDelete={()=>{setVehicleIdDelete(true)}} 
                onEdit={()=>{setEditVehicleIDprompt(true)}} 
                trigger={<EllipsisVerticalIcon width={"1.1rem"}/>} */}
                {access && (
                  <DropDown
                    onDelete={() => {
                      setVehicleIdDelete(true);
                    }}
                    onEdit={() => {
                      setEditVehicleIDprompt(true);
                    }}
                    trigger={<EllipsisVerticalIcon width={"1.1rem"} />}
                  />
                )}
              </div>
            ) : null
          }
          extra={
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                paddingBottom: "1rem",
              }}
            >
              {!vehicle_number || loading ? (
                <div style={{ height: "19ch", width: "32ch", display: "flex" }}>
                  <button
                    onClick={() => setAddVehicleID(true)}
                    style={{
                      width: "100%",
                      border: "2px solid rgba(100 100 100/ 50%)",
                    }}
                  >
                    {!loading ? (
                      <>
                        <Plus width={"1rem"} />
                        Add ID
                      </>
                    ) : (
                      <>
                        <LoadingOutlined />
                        Generating ID
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div>
                  <VehicleID
                    name={name}
                    expirydate={vehicle_expiry}
                    issuedate={vehicle_issue}
                    reg_no={vehicle_number ? vehicle_number : vehicle_number}
                    year={"XXXX"}
                  />
                  {/* <br/>
                        <button style={{width:"100%"}}>Edit</button> */}
                </div>
              )}
              <br />
            </div>
          }
        />

        {/* ADD VEHICLE ID DIALOG */}
        <InputDialog
          open={add_vehicle_id}
          title="Add License"
          titleIcon={<Car />}
          inputplaceholder="License Number"
          input2placeholder="Expiry Date"
          input3placeholder="Issue Date"
          OkButtonText="Add"
          onCancel={() => {
            setAddVehicleID(false);
          }}
          onOk={addVehicleID}
          inputOnChange={(e: any) => setVehicleNumber(e.target.value)}
          input2OnChange={(e: any) => setVehicleExpiry(e.target.value)}
          input3OnChange={(e: any) => setVehicleIssue(e.target.value)}
          updating={loading}
          disabled={loading}
        />

        {/* EDIT VEHICLE ID DIALOG */}
        <InputDialog
          open={edit_vehicle_id_prompt}
          title="Edit Vehicle ID"
          titleIcon={<PenLine />}
          OkButtonText="Update"
          onCancel={() => {
            setEditVehicleIDprompt(false);
          }}
          inputplaceholder="Enter Vehicle Number"
          input2placeholder="Enter Expiry Date"
          input3placeholder="Enter Issue Date"
          inputOnChange={(e: any) => setEditedVehicleNumber(e.target.value)}
          input2OnChange={(e: any) => {
            setEditedVehicleExpiry(e.target.value);
          }}
          input3OnChange={(e: any) => setEditedVehicleIssue(e.target.value)}
          onOk={EditVehicleID}
          updating={loading}
          disabled={loading}
          input1Value={vehicle_number}
          input2Value={vehicle_expiry}
          input3Value={vehicle_issue}
          input1Label="License No : "
          input2Label="Expiry Date"
          input3Label="Issue Date"
        />

        {/* DELETE VEHICLE ID DIALOG */}
        <DefaultDialog
          updating={loading}
          open={vehicleIdDelete}
          title="Delete License?"
          OkButtonText="Delete"
          onCancel={() => setVehicleIdDelete(false)}
          onOk={deleteVehicleID}
          disabled={loading}
          destructive
        />

        {/* BULK DELETE DIALOG */}
        <DefaultDialog
          progressItem={progressItem}
          progress={progress}
          destructive
          updating={loading}
          title="Delete record(s)?"
          open={bulkDeleteDialog}
          OkButtonText="Confirm"
          onCancel={() => setBulkDeleteDialog(false)}
          onOk={() => deleteKey == "root" && handleBulkDelete()}
          disabled={loading || deleteKey != "root" ? true : false}
          extra={
            <input
              placeholder="Enter Key"
              onChange={(e) => setDeleteKey(e.target.value)}
            />
          }
        />

        {/* RENEW CIVIL ID */}
        <InputDialog
          titleIcon={<Sparkles color="goldenrod" fill="goldenrod" />}
          title={"Renew Document"}
          open={renewDocDialog}
          onCancel={() => {
            setRenewDocDialog(false);
            setNewExpiry("");
          }}
          inputplaceholder="New Expiry"
          OkButtonText="Renew"
          inputOnChange={(e: any) => setNewExpiry(e.target.value)}
          onOk={RenewID}
          updating={loading}
          disabled={loading || newExpiry ? false : true}
          input1Value={civil_expiry}
          input1Label="New Expiry : "
          OkButtonIcon={<Sparkles width={"1rem"} />}
        />

        {/* RENEW VEHICLE ID DIALOG */}
        <InputDialog
          title="Renew Vehicle ID"
          open={renewVehicleDialog}
          onCancel={() => setRenewVehicleDialog(false)}
          inputplaceholder="New Issue Date"
          input1Label="New Issue"
          input2placeholder="New Expiry"
          input2Label="New Expiry"
          input1Value={vehicle_issue}
          input2Value={vehicle_expiry}
          OkButtonText="Renew"
          OkButtonIcon={<Sparkles width={"1rem"} />}
          disabled={loading}
          onOk={renewVehicleID}
          inputOnChange={(e: any) => setEditedVehicleIssue(e.target.value)}
          input2OnChange={(e: any) => setEditedVehicleExpiry(e.target.value)}
          updating={loading}
        />

        {/* TRAINING DIALOG */}
        <DefaultDialog
          close
          back
          open={trainingDialog}
          onCancel={() => setTrainingDialog(false)}
          title={"Training"}
          titleIcon={<GraduationCap color="lightgreen" />}
          extra={
            <div
              style={{
                width: "100%",
                display: "flex",
                flexFlow: "column",
                gap: "0.5rem",
              }}
            >
              <Directive
                icon={
                  <img
                    src="/vale-logo.png"
                    style={{ width: "1.25rem", paddingBottom: "0.25rem" }}
                  />
                }
                title="Vale Training"
                onClick={() => {
                  setValeTrainingDialog(true);
                }}
              />
              <Directive
                icon={<Globe width={"1rem"} color="grey" />}
                title="Other"
              />
            </div>
          }
        />

        {/* MEDICAL ID DIALOG */}
        <DefaultDialog
          close
          titleIcon={<HeartPulse color="tomato" />}
          title="Medical ID"
          open={healthDialog}
          onCancel={() => setHealthDialog(false)}
          back
          title_extra={
            medical_due_on ? (
              <div
                style={{ display: "flex", gap: "0.5rem", height: "2.25rem" }}
              >
                {moment(medical_due_on, "DD/MM/YYYY").diff(
                  moment(today),
                  "months"
                ) <= 2 ? (
                  <button
                    onClick={() => {
                      setRenewMedicalIDdialog(true);
                    }}
                    className=""
                    style={{
                      fontSize: "0.85rem",
                      width: "6rem",
                      display: "flex",
                      gap: "0.5rem",
                      background: "goldenrod",
                      color: "black",
                    }}
                  >
                    <Sparkles width={"0.85rem"} color="black" />
                    Renew
                  </button>
                ) : null}

                {access && (
                  <DropDown
                    onDelete={() => {
                      setDeleteMedicalIDdialog(true);
                    }}
                    onEdit={() => {
                      setEditMedicalIDdialog(true);
                    }}
                    trigger={<EllipsisVerticalIcon width={"1.1rem"} />}
                  />
                )}
              </div>
            ) : null
          }
          extra={
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                paddingBottom: "1rem",
              }}
            >
              {!medical_due_on || loading ? (
                <div style={{ height: "19ch", width: "32ch", display: "flex" }}>
                  <button
                    onClick={() => setMedicalIDdialog(true)}
                    style={{
                      width: "100%",
                      border: "2px solid rgba(100 100 100/ 50%)",
                    }}
                  >
                    {!loading ? (
                      <>
                        <Plus width={"1rem"} />
                        Add ID
                      </>
                    ) : (
                      <>
                        <LoadingOutlined />
                        Generating ID
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div>
                  <MedicalID
                    // tooltip={
                    //   moment(medical_due_on, "DD/MM/YYYY").diff(
                    //     moment(today),
                    //     "months"
                    //   ) <= 2
                    // }
                    name={name}
                    completedOn={medical_completed_on}
                    dueOn={medical_due_on}
                  />
                </div>
              )}
              <br />
            </div>
          }
        />

        {/* ADD MEDICAL ID DIALOG */}
        <InputDialog
          open={MedicalIDdialog}
          OkButtonText="Add"
          onCancel={() => setMedicalIDdialog(false)}
          title="Add Medical ID"
          titleIcon={<HeartPulse color="tomato" />}
          inputplaceholder="Completed On"
          input2placeholder="Due On"
          inputOnChange={(e: any) => setCompletedOn(e.target.value)}
          input2OnChange={(e: any) => setDueOn(e.target.value)}
          onOk={addMedicalID}
          updating={loading}
        />

        {/* EDIT MEDICAl ID DIALOG */}
        <InputDialog
          open={editMedicalIDdialog}
          title="Edit Medical ID"
          titleIcon={<PenLine />}
          OkButtonText="Update"
          onCancel={() => {
            setEditMedicalIDdialog(false);
          }}
          inputplaceholder="Completed On"
          input2placeholder="Due on"
          inputOnChange={(e: any) => setEditedCompletedOn(e.target.value)}
          input2OnChange={(e: any) => {
            setEditedDueOn(e.target.value);
          }}
          onOk={EditMedicalID}
          updating={loading}
          disabled={loading}
          input1Value={medical_completed_on}
          input2Value={medical_due_on}
          input3Value={vehicle_issue}
          input1Label="Completed : "
          input2Label="Due On : "
        />

        {/* DELETE MEDICAL ID */}
        <DefaultDialog
          title={"Delete Medical ID?"}
          destructive
          OkButtonText="Delete"
          open={deleteMedicalIDdialog}
          onCancel={() => setDeleteMedicalIDdialog(false)}
          updating={loading}
          disabled={loading}
          onOk={deleteMedicalID}
        />

        {/* RENEW MEDICAL ID DIALOG */}
        <InputDialog
          titleIcon={<Sparkles color="goldenrod" />}
          title="Renew Medical ID"
          open={renewMedicalIDdialog}
          onCancel={() => setRenewMedicalIDdialog(false)}
          inputplaceholder="Completed On"
          input1Label="Completed : "
          input2placeholder="New Due"
          input2Label="New Due : "
          OkButtonIcon={<Sparkles width={"1rem"} />}
          OkButtonText="Renew"
          input1Value={medical_completed_on}
          input2Value={medical_due_on}
          onOk={renewMedicalID}
          updating={loading}
          inputOnChange={(e: any) => setEditedCompletedOn(e.target.value)}
          input2OnChange={(e: any) => setEditedDueOn(e.target.value)}
          disabled={loading}
        />

        {/* VALE TRAINING DIALOG */}
        <DefaultDialog
          open={valeTrainingDialog}
          titleIcon={
            <img
              src="/vale-logo.png"
              style={{ width: "1.75rem", paddingBottom: "0.5rem" }}
            />
          }
          title={"Vale Training"}
          onCancel={() => setValeTrainingDialog(false)}
          close
          back
          title_extra={
            <>
              {/* <button style={{fontSize:"0.8rem"}}><Plus color="dodgerblue"/></button> */}
            </>
          }
          extra={
            <div
              className="recipients"
              style={{
                width: "100%",
                display: "flex",
                flexFlow: "column",
                gap: "0.45rem",
                maxHeight: "17.5rem",
                overflowY: "auto",
                paddingRight: "0.5rem",
                minHeight: "2.25rem",
              }}
            >
              <Directive
                tag={vt_hse_induction}
                icon={<Disc color="dodgerblue" />}
                title="HSE Induction"
                onClick={() => {
                  setTrainingAddDialogTitle("HSE Induction");
                  setTrainingAddDialog(true);
                  setTrainingType("hse_induction");
                  setTrainingAddDialogInputValue(vt_hse_induction);
                }}
                status={
                  moment(vt_hse_induction, "DD/MM/YYYY").diff(
                    moment(today),
                    "months"
                  ) <= 3
                    ? false
                    : true
                }
              />

              <Directive
                tag={vt_car_1}
                icon={<Disc color="dodgerblue" />}
                title="CAR - 1"
                onClick={() => {
                  setTrainingAddDialogTitle("CAR - 1");
                  setTrainingAddDialog(true);
                  setTrainingType("car_1");
                  setTrainingAddDialogInputValue(vt_car_1);
                }}
                status={
                  moment(vt_car_1, "DD/MM/YYYY").diff(
                    moment(today),
                    "months"
                  ) <= 3
                    ? false
                    : true
                }
              />

              <Directive
                tag={vt_car_2}
                icon={<Disc color="dodgerblue" />}
                title="CAR - 2"
                onClick={() => {
                  setTrainingAddDialogTitle("CAR - 2");
                  setTrainingAddDialog(true);
                  setTrainingType("car_2");
                  setTrainingAddDialogInputValue(vt_car_2);
                }}
                status={
                  moment(vt_car_2, "DD/MM/YYYY").diff(
                    moment(today),
                    "months"
                  ) <= 3
                    ? false
                    : true
                }
              />

              <Directive
                tag={vt_car_3}
                icon={<Disc color="dodgerblue" />}
                title="CAR - 3"
                onClick={() => {
                  setTrainingAddDialogTitle("CAR - 3");
                  setTrainingAddDialog(true);
                  setTrainingType("car_3");
                  setTrainingAddDialogInputValue(vt_car_3);
                }}
                status={
                  moment(vt_car_3, "DD/MM/YYYY").diff(
                    moment(today),
                    "months"
                  ) <= 3
                    ? false
                    : true
                }
              />

              <Directive
                tag={vt_car_4}
                icon={<Disc color="dodgerblue" />}
                title="CAR - 4"
                onClick={() => {
                  setTrainingAddDialogTitle("CAR - 4");
                  setTrainingAddDialog(true);
                  setTrainingType("car_4");
                  setTrainingAddDialogInputValue(vt_car_4);
                }}
                status={
                  moment(vt_car_4, "DD/MM/YYYY").diff(
                    moment(today),
                    "months"
                  ) <= 3
                    ? false
                    : true
                }
              />

              <Directive
                tag={vt_car_5}
                icon={<Disc color="dodgerblue" />}
                title="CAR - 5"
                onClick={() => {
                  setTrainingAddDialogTitle("CAR - 5");
                  setTrainingAddDialog(true);
                  setTrainingType("car_5");
                  setTrainingAddDialogInputValue(vt_car_5);
                }}
                status={
                  moment(vt_car_5, "DD/MM/YYYY").diff(
                    moment(today),
                    "months"
                  ) <= 3
                    ? false
                    : true
                }
              />

              <Directive
                tag={vt_car_6}
                icon={<Disc color="dodgerblue" />}
                title="CAR - 6"
                onClick={() => {
                  setTrainingAddDialogTitle("CAR - 6");
                  setTrainingAddDialog(true);
                  setTrainingType("car_6");
                  setTrainingAddDialogInputValue(vt_car_6);
                }}
                status={
                  moment(vt_car_6, "DD/MM/YYYY").diff(
                    moment(today),
                    "months"
                  ) <= 3
                    ? false
                    : true
                }
              />

              <Directive
                tag={vt_car_7}
                icon={<Disc color="dodgerblue" />}
                title="CAR - 7"
                onClick={() => {
                  setTrainingAddDialogTitle("CAR - 7");
                  setTrainingAddDialog(true);
                  setTrainingType("car_7");
                  setTrainingAddDialogInputValue(vt_car_7);
                }}
                status={
                  moment(vt_car_7, "DD/MM/YYYY").diff(
                    moment(today),
                    "months"
                  ) <= 3
                    ? false
                    : true
                }
              />

              <Directive
                tag={vt_car_8}
                icon={<Disc color="dodgerblue" />}
                title="CAR - 8"
                onClick={() => {
                  setTrainingAddDialogTitle("CAR - 8");
                  setTrainingAddDialog(true);
                  setTrainingType("car_8");
                  setTrainingAddDialogInputValue(vt_car_8);
                }}
                status={
                  moment(vt_car_8, "DD/MM/YYYY").diff(
                    moment(today),
                    "months"
                  ) <= 3
                    ? false
                    : true
                }
              />

              <Directive
                tag={vt_car_9}
                icon={<Disc color="dodgerblue" />}
                title="CAR - 9"
                onClick={() => {
                  setTrainingAddDialogTitle("CAR - 9");
                  setTrainingAddDialog(true);
                  setTrainingType("car_9");
                  setTrainingAddDialogInputValue(vt_car_9);
                }}
                status={
                  moment(vt_car_9, "DD/MM/YYYY").diff(
                    moment(today),
                    "months"
                  ) <= 3
                    ? false
                    : true
                }
              />

              <Directive
                tag={vt_car_10}
                icon={<Disc color="dodgerblue" />}
                title="CAR - 10"
                onClick={() => {
                  setTrainingAddDialogTitle("CAR - 10");
                  setTrainingAddDialog(true);
                  setTrainingType("car_10");
                  setTrainingAddDialogInputValue(vt_car_10);
                }}
                status={
                  moment(vt_car_10, "DD/MM/YYYY").diff(
                    moment(today),
                    "months"
                  ) <= 3
                    ? false
                    : true
                }
              />
            </div>
          }
        />

        <DefaultDialog
          close
          titleIcon={<Book color="goldenrod" />}
          title="Passport"
          open={passportDialog}
          onCancel={() => setPassportDialog(false)}
          back
          title_extra={
            passportExpiry ? (
              <div
                style={{ display: "flex", gap: "0.5rem", height: "2.25rem" }}
              >
                {moment(passportExpiry, "DD/MM/YYYY").diff(
                  moment(today),
                  "months"
                ) <= 6 && !loading ? (
                  <button
                    onClick={() => {
                      setRenewPassportDialog(true);
                    }}
                    className=""
                    style={{
                      fontSize: "0.85rem",
                      width: "6rem",
                      display: "flex",
                      gap: "0.5rem",
                      background: "goldenrod",
                      color: "black",
                    }}
                  >
                    <Sparkles width={"0.85rem"} color="black" />
                    Renew
                  </button>
                ) : null}

                {access && (
                  <DropDown
                    onDelete={() => {
                      setDeletePassportDialog(true);
                    }}
                    onEdit={() => {
                      setEditPassportDialog(true);
                    }}
                    trigger={<EllipsisVerticalIcon width={"1.1rem"} />}
                  />
                )}
              </div>
            ) : null
          }
          extra={
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                paddingBottom: "1rem",
              }}
            >
              {!passportID || loading ? (
                <div style={{ height: "19ch", width: "32ch", display: "flex" }}>
                  <button
                    onClick={() => setAddPassportDialog(true)}
                    style={{
                      width: "100%",
                      border: "2px solid rgba(100 100 100/ 50%)",
                    }}
                  >
                    {!loading ? (
                      <>
                        <Plus width={"1rem"} />
                        Add Passport
                      </>
                    ) : (
                      <>
                        <LoadingOutlined />
                        Generating Passport
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div>
                  <Passport
                    nativePhone={nativePhone}
                    name={name}
                    passport_id={passportID}
                    issue={passportIssue}
                    nativeAddress={nativeAddress}
                    expiry={passportExpiry}
                  />
                  {/* <br/>
                        <button style={{width:"100%"}}>Edit</button> */}
                </div>
              )}
              <br />
            </div>
          }
        />

        {/* ADD PASSPORT ID DIALOG */}
        <InputDialog
          open={addPassportDialog}
          OkButtonText="Add"
          onCancel={() => setAddPassportDialog(false)}
          title="Add Passport"
          titleIcon={<Book color="goldenrod" />}
          inputplaceholder="Passport ID"
          input2placeholder="Issue Date"
          input3placeholder="Expiry Date"
          inputOnChange={(e: any) => setPassportID(e.target.value)}
          input2OnChange={(e: any) => setPassportIssue(e.target.value)}
          input3OnChange={(e: any) => setPassportExpiry(e.target.value)}
          input4placeholder="Native Phone ( with Country code )"
          input5placeholder="Native Address"
          input4OnChange={(e: any) => setNativePhone(e.target.value)}
          input5OnChange={(e: any) => setNativeAddress(e.target.value)}
          onOk={addPassport}
          updating={loading}
        />

        {/* EDIT PASSPORT DIALOG */}
        <InputDialog
          open={editPassportDialog}
          title="Edit Passport"
          titleIcon={<PenLine />}
          OkButtonText="Update"
          onCancel={() => {
            setEditPassportDialog(false);
          }}
          inputplaceholder="Passport ID"
          input2placeholder="Issue Date"
          input3placeholder="Expiry Date"
          inputOnChange={(e: any) => setEditedPassportID(e.target.value)}
          input2OnChange={(e: any) => {
            setEditedPassportIssue(e.target.value);
          }}
          input3OnChange={(e: any) => setEditedPassportExpiry(e.target.value)}
          onOk={EditPassport}
          updating={loading}
          disabled={loading}
          input1Value={passportID}
          input2Value={passportIssue}
          input3Value={passportExpiry}
          input1Label="Passport ID : "
          input2Label="Issue Date : "
          input3Label="Expiry Date"
          input4placeholder="Native Phone Number"
          input4Label="Native Phone : "
          input4Value={nativePhone}
          input5placeholder="Native Address"
          input5Label="Address : "
          input5Value={nativeAddress}
          input4OnChange={(e: any) => setEditedNativePhone(e.target.value)}
          input5OnChange={(e: any) => setEditedNativeAddress(e.target.value)}
        />

        <DefaultDialog
          title={"Delete Passport?"}
          destructive
          OkButtonText="Delete"
          open={DeletePassportDialog}
          onCancel={() => setDeletePassportDialog(false)}
          updating={loading}
          disabled={loading}
          onOk={deletePassport}
        />

        {/* RENEW PASSPORT DIALOG */}
        <InputDialog
          titleIcon={<Sparkles color="goldenrod" />}
          title="Renew Passport"
          open={renewPassportDialog}
          onCancel={() => setRenewPassportDialog(false)}
          inputplaceholder="New Issue Date"
          input1Label="New Issue : "
          input2placeholder="New Expiry"
          input2Label="New Expiry : "
          OkButtonIcon={<Sparkles width={"1rem"} />}
          OkButtonText="Renew"
          input1Value={passportIssue}
          input2Value={passportExpiry}
          onOk={renewPassport}
          updating={loading}
          inputOnChange={(e: any) => setEditedPassportIssue(e.target.value)}
          input2OnChange={(e: any) => setEditedPassportExpiry(e.target.value)}
          disabled={loading}
        />

        <InputDialog
          open={trainingAddDialog}
          onOk={() => {
            addTraining(trainingType);
          }}
          onCancel={() => {
            setTrainingAddDialog(false);
            setEditedTrainingAddDialogInput("");
          }}
          title={trainingAddDialogTitle}
          inputplaceholder="Expiry Date"
          OkButtonText="Update"
          inputOnChange={(e: any) =>
            setEditedTrainingAddDialogInput(e.target.value)
          }
          OkButtonIcon={<RefreshCcw width={"1rem"} />}
          updating={loading}
          disabled={loading || !EditedTrainingAddDialogInput ? true : false}
          input1Value={trainingAddDialogInputValue}
        />

        <DefaultDialog
          created_on={initialSalary}
          code={employeeCode}
          close
          title={"Initial Salary"}
          titleIcon={<CircleDollarSign />}
          open={salaryDialog}
          onCancel={() => setSalaryDialog(false)}
          title_extra={
            <button
              onClick={fetchSalary}
              style={{ width: "3rem", height: "2.5rem" }}
            >
              {fetchingSalary ? (
                <LoadingOutlined color="dodgerblue" />
              ) : (
                <RefreshCcw width={"1rem"} color="dodgerblue" />
              )}
            </button>
          }
          extra={
            <>
              <div
                style={{
                  display: "flex",
                  border: "",
                  width: "100%",
                  borderRadius: "0.5rem",
                  padding: "0.5rem",
                  background: "",
                  flexFlow: "column",
                }}
              >
                <div
                  style={{
                    border: "",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      border: "",
                      display: "flex",
                      flexFlow: "column",
                      alignItems: "center",
                    }}
                  >
                    <p
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        fontWeight: "500",
                        background:
                          "linear-gradient(90deg, rgba(0 0 0/ 0%), rgba(100 100 100/ 20%), rgba(0 0 0/ 0%)) ",
                        padding: "0.25rem",
                      }}
                    >
                      {name}
                    </p>
                    <br />
                    <p
                      style={{
                        fontSize: "0.8rem",
                        opacity: 0.5,
                        justifyContent: "",
                        display: "flex",
                      }}
                    >
                      Current Earnings
                    </p>
                    <div
                      style={{
                        display: "flex",
                        border: "",
                        gap: "0.5rem",
                        justifyContent: "center",
                        fontWeight: 600,
                        fontSize: "1.5rem",
                        alignItems: "center",
                      }}
                    >
                      <p style={{ fontWeight: 400, fontSize: "1rem" }}>OMR</p>
                      <p>{salaryBasic}</p>
                    </div>
                    <div
                      style={{
                        border: "",
                        display: "flex",
                        justifyContent: "center",
                        textAlign: "center",
                      }}
                    >
                      <p style={{ opacity: 0.5 }}>
                        {(salaryBasic - initialSalary) / initialSalary + "%"}
                      </p>
                      {Math.sign(
                        (salaryBasic - initialSalary) / initialSalary
                      ) == -1 ? (
                        <ArrowDown
                          strokeWidth={"3px"}
                          width={"1rem"}
                          color="lightcoral"
                        />
                      ) : (salaryBasic - initialSalary) / initialSalary == 0 ? (
                        ""
                      ) : (
                        <ArrowUp
                          strokeWidth={"3px"}
                          width={"1rem"}
                          color="lightgreen"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* <div style={{border:"", height:"3rem", paddingTop:"", marginTop:"1.5rem"}}>
                    <LineCharter lineColor="lightgreen"/>
                    </div> */}
              </div>

              {salaryList.length == 0 ? (
                <div
                  style={{
                    width: "100%",
                    border: "3px dashed rgba(100 100 100/ 50%)",
                    height: "2.5rem",
                    borderRadius: "0.5rem",
                    marginBottom: "1rem",
                  }}
                ></div>
              ) : (
                <div
                  className="recipients"
                  style={{
                    width: "100%",
                    display: "flex",
                    flexFlow: "column",
                    gap: "0.35rem",
                    maxHeight: "11.25rem",
                    overflowY: "auto",
                    paddingRight: "0.5rem",
                    minHeight: "2.25rem",
                    marginBottom: "1rem",
                  }}
                >
                  {salaryList.map((e: any) => (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                    >
                      <Directive
                        status={true}
                        tag={moment(e.created_on.toDate()).format("LL")}
                        title={"OMR " + e.salary}
                        titleSize="0.75rem"
                        key={e.id}
                        icon={
                          <MinusSquareIcon
                            onClick={() => {
                              setDeleteSalaryDialog(true);
                              setSalaryID(e.id);
                            }}
                            className="animate-pulse"
                            color="lightgreen"
                            width={"1.1rem"}
                          />
                        }
                        noArrow
                      />
                    </motion.div>
                  ))}
                </div>
              )}
              {editAccess && (
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    width: "100%",
                    zIndex: "",
                  }}
                >
                  <input
                    type="search"
                    id="input-1"
                    value={newSalary == 0 ? "" : newSalary}
                    onChange={(e: any) => setNewSalary(e.target.value)}
                    placeholder="New Salary"
                    style={{ flex: 1.5 }}
                  />
                  <button
                    onClick={addNewSalary}
                    style={{ fontSize: "0.8rem", flex: 0.15 }}
                  >
                    {loading ? (
                      <LoadingOutlined />
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                        }}
                      >
                        <Plus width={"1.25rem"} color="lightgreen" />
                      </div>
                    )}
                  </button>
                </div>
              )}
            </>
          }
        />

        {/* LEAVE LOG DIALOG */}
        <DefaultDialog
          codeTooltip="Employee Name"
          code={employeeCode}
          close
          open={leaveLog}
          titleIcon={<BarChart3 />}
          onCancel={() => setLeaveLog(false)}
          title={"Leave Log"}
          title_extra={
            <button
              onClick={fetchLeave}
              style={{ width: "3rem", height: "2.5rem" }}
            >
              {fetchingLeave ? (
                <LoadingOutlined style={{ color: "dodgerblue" }} />
              ) : (
                <RefreshCcw color="dodgerblue" width={"1rem"} />
              )}
            </button>
          }
          extra={
            <>
              <div
                style={{
                  display: "flex",
                  border: "",
                  width: "100%",
                  borderRadius: "0.5rem",
                  padding: "0.5rem",
                  background: "",
                  flexFlow: "column",
                }}
              >
                <p
                  style={{
                    border: "",
                    display: "flex",
                    gap: "0.5rem",
                    justifyContent: "center",
                    alignItems: "center",
                    background:
                      "linear-gradient(90deg, rgba(0 0 0/ 0%), rgba(100 100 100/ 20%), rgba(0 0 0/ 0%)) ",
                    padding: "0.25rem",
                    marginBottom: "1rem",
                  }}
                >
                  {name}
                </p>

                <div
                  style={{
                    border: "1px solid rgba(100 100 100/ 70%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingLeft: "0.85rem",
                    paddingRight: "1.25rem",
                    paddingBottom: "0.65rem",
                    paddingTop: "0.65rem",
                    borderRadius: "0.75rem",
                  }}
                >
                  <div style={{ border: "" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.45rem",
                        alignItems: "center",
                        border: "",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.8rem",
                          opacity: 0.5,
                          justifyContent: "",
                          display: "flex",
                          gap: "0.75rem",
                        }}
                      >
                        Block Period
                      </p>

                      <p
                        style={{
                          fontSize: "0.75rem",
                          background: "rgba(100 100 100/ 20%)",
                          borderRadius: "0.5rem",
                          paddingLeft: "0.35rem",
                          paddingRight: "0.35rem",
                          fontWeight: 600,
                          color: "dodgerblue",
                        }}
                      >
                        18 months
                      </p>
                    </div>
                    <p style={{ height: "0.5rem" }}></p>

                    <div
                      style={{
                        display: "flex",
                        border: "",
                        gap: "0.5rem",
                        justifyContent: "center",
                        fontWeight: 600,
                      }}
                    >
                      <p style={{ textAlign: "left", border: "" }}>
                        {dateofJoin}
                      </p>
                      -
                      <p>
                        {String(
                          moment(dateofJoin, "DD/MM/YYYY")
                            .add(1.5, "years")
                            .add(leaves, "days")
                            .format("DD/MM/YYYY")
                        )}
                      </p>
                    </div>
                    <p style={{ height: "0.45rem" }}></p>
                    {
                      // leaves &&
                      <p
                        style={{
                          fontSize: "0.7rem",
                          opacity: 0.5,
                          border: "",
                          display: "flex",
                        }}
                      >
                        extended by {leaves} days
                      </p>
                    }
                  </div>

                  <div
                    style={{
                      height: "100%",
                      borderLeft: "1px solid rgba(100 100 100/ 75%)",
                      paddingLeft: "1rem",
                      display: "flex",
                      flexFlow: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <p style={{ fontSize: "0.8rem", opacity: 0.5 }}>Total</p>
                    <p
                      style={{
                        fontWeight: 600,
                        border: "",
                        textAlign: "right",
                        fontSize: "1.5rem",
                        lineHeight: "1.5rem",
                      }}
                    >
                      {leaves}
                    </p>
                  </div>
                </div>

                {/* <div style={{border:"", height:"3rem", paddingTop:"", marginTop:"1.5rem"}}>
                    <LineCharter/>
                    
                    </div> */}
              </div>

              {leaveList.length == 0 ? (
                <div
                  style={{
                    width: "100%",
                    border: "3px dashed rgba(100 100 100/ 50%)",
                    height: "2.5rem",
                    borderRadius: "0.5rem",
                    marginBottom: "1rem",
                  }}
                ></div>
              ) : (
                <div
                  className="recipients"
                  style={{
                    width: "100%",
                    display: "flex",
                    flexFlow: "column",
                    gap: "0.35rem",
                    maxHeight: "12.25rem",
                    overflowY: "auto",
                    paddingRight: "",
                    minHeight: "2.25rem",
                    marginBottom: "1rem",
                    padding: "0.5rem",
                    paddingTop: "0",
                  }}
                >
                  {leaveList.map((e: any) => (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                    >
                      <Directive
                        editableTag={access}
                        notName
                        tagOnClick={() => {
                          if (access) {
                            setLeaveReview(true);
                            setLeaveFrom(e.leaveFrom);
                            e.pending == false
                              ? setLeaveTill(e.leaveTill)
                              : setLeaveTill(""),
                              setLeaveID(e.id);
                            setExpectedReturn(e.expectedReturn);
                          }
                        }}
                        status={true}
                        tag={e.pending ? "Pending" : e.days + " Days"}
                        title={e.leaveFrom + " - " + e.leaveTill}
                        titleSize="0.75rem"
                        key={e.id}
                        icon={
                          access && (
                            <MinusSquareIcon
                              onClick={() => {
                                setDeleteLeaveDialog(true);
                                setLeaveFrom(e.leaveFrom);
                                setLeaveID(e.id);
                              }}
                              className="animate-pulse"
                              color="dodgerblue"
                              width={"1.1rem"}
                            />
                          )
                        }
                        noArrow
                      />
                    </motion.div>
                  ))}
                </div>
              )}
              {access && (
                <div
                  style={{
                    display: "flex",
                    gap: "0.25rem",
                    width: "100%",
                    zIndex: "",
                    border: "1px solid rgba(100 100 100/ 75%)",
                    padding: "0.35rem",
                    borderRadius: "0.75rem",
                  }}
                >
                  <input
                    type=""
                    id="input-1"
                    value={editedLeaveFrom}
                    onChange={(e: any) => setEditedLeaveFrom(e.target.value)}
                    placeholder="From"
                    style={{ flex: 1.5 }}
                  />

                  <input
                    type=""
                    id="input-2"
                    value={editedLeaveTill}
                    onChange={(e: any) => setEditedLeaveTill(e.target.value)}
                    placeholder="Till"
                    style={{ flex: 1.5 }}
                  />
                  <button
                    onClick={addLeave}
                    style={{ fontSize: "0.8rem", flex: 0.45 }}
                  >
                    {loading ? (
                      <LoadingOutlined />
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                        }}
                      >
                        <Plus width={"1.25rem"} color="#8884d8" />
                      </div>
                    )}
                  </button>
                </div>
              )}
            </>
          }
        />

        <InputDialog
          title={"Leave Review"}
          open={leaveReview}
          onCancel={() => setLeaveReview(false)}
          inputplaceholder={"Leave From"}
          input1Value={leaveFrom}
          input2Value={leaveTill}
          input3Value={expectedReturn}
          input1Label="Leave From"
          input2Label="Leave Till"
          input3Label="Expected Return"
          inputOnChange={(e: any) => setLeaveFrom(e.target.value)}
          input2placeholder="Leave Till"
          input3placeholder={leaveTill ? "" : "Expected Return"}
          input2OnChange={(e: any) => setLeaveTill(e.target.value)}
          input3OnChange={(e: any) => setExpectedReturn(e.target.value)}
          OkButtonText="Update"
          OkButtonIcon={<RefreshCcw width={"1rem"} />}
          updating={loading}
          disabled={loading}
          onOk={updateLeave}
        />

        <DefaultDialog
          open={deleteLeaveDialog}
          title={"Delete Leave?"}
          destructive
          OkButtonText="Delete"
          updating={loading}
          disabled={loading}
          onCancel={() => setDeleteLeaveDialog(false)}
          onOk={deleteLeave}
          extra={
            <p
              style={{
                fontSize: "0.75rem",
                textAlign: "left",
                width: "100%",
                marginLeft: "1rem",
                opacity: 0.5,
              }}
            ></p>
          }
        />
      </div>

      <DefaultDialog
        destructive
        open={deleteSalaryDialog}
        onCancel={() => setDeleteSalaryDialog(false)}
        title={"Delete Salary?"}
        updating={loading}
        disabled={loading}
        onOk={deleteSalary}
        OkButtonText="Delete"
        extra={
          <p
            style={{
              width: "100%",
              textAlign: "left",
              paddingLeft: "1rem",
              fontSize: "0.75rem",
              opacity: 0.5,
            }}
          >
            {salaryID}
          </p>
        }
      />

      <DefaultDialog
        destructive
        open={deleteAllowanceDialog}
        onCancel={() => setDeleteAllowanceDialog(false)}
        title={"Delete Allowance?"}
        updating={loading}
        disabled={loading}
        onOk={deleteAllowance}
        OkButtonText="Delete"
        extra={
          <p
            style={{
              width: "100%",
              textAlign: "left",
              paddingLeft: "1rem",
              fontSize: "0.75rem",
              opacity: 0.5,
            }}
          >
            {salaryID}
          </p>
        }
      />

      <DefaultDialog
        created_on={initialAllowance}
        code={employeeCode}
        close
        title={"Initial Allowance"}
        open={allowanceDialog}
        onCancel={() => setAllowanceDialog(false)}
        title_extra={
          <button
            onClick={fetchAllowance}
            style={{ width: "3rem", height: "2.5rem" }}
          >
            {fetchingAllowance ? (
              <LoadingOutlined color="dodgerblue" />
            ) : (
              <RefreshCcw width={"1rem"} color="dodgerblue" />
            )}
          </button>
        }
        extra={
          <>
            <div
              style={{
                display: "flex",
                border: "",
                width: "100%",
                borderRadius: "0.5rem",
                padding: "0.5rem",
                background: "",
                flexFlow: "column",
              }}
            >
              <div
                style={{
                  border: "",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    border: "",
                    display: "flex",
                    flexFlow: "column",
                    alignItems: "center",
                  }}
                >
                  <p
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      fontWeight: "500",
                      background:
                        "linear-gradient(90deg, rgba(0 0 0/ 0%), rgba(100 100 100/ 20%), rgba(0 0 0/ 0%)) ",
                      padding: "0.25rem",
                    }}
                  >
                    {name}
                  </p>
                  <br />
                  <p
                    style={{
                      fontSize: "0.8rem",
                      opacity: 0.5,
                      justifyContent: "",
                      display: "flex",
                    }}
                  >
                    Current Allowance
                  </p>
                  <div
                    style={{
                      display: "flex",
                      border: "",
                      gap: "0.5rem",
                      justifyContent: "center",
                      fontWeight: 600,
                      fontSize: "1.5rem",
                      alignItems: "center",
                    }}
                  >
                    <p style={{ fontWeight: 400, fontSize: "1rem" }}>OMR</p>
                    {allowance}
                  </div>
                  <div
                    style={{
                      border: "",
                      display: "flex",
                      justifyContent: "center",
                      textAlign: "center",
                    }}
                  >
                    <p style={{ opacity: 0.5 }}>
                      {(allowance - initialAllowance) / initialAllowance + "%"}
                    </p>
                    {Math.sign(
                      (allowance - initialAllowance) / initialAllowance
                    ) == -1 ? (
                      <ArrowDown
                        strokeWidth={"3px"}
                        width={"1rem"}
                        color="lightcoral"
                      />
                    ) : (allowance - initialAllowance) / initialAllowance ==
                      0 ? (
                      ""
                    ) : (
                      <ArrowUp
                        strokeWidth={"3px"}
                        width={"1rem"}
                        color="lightgreen"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* <div style={{border:"", height:"3rem", paddingTop:"", marginTop:"1.5rem"}}>
                    <LineCharter lineColor="salmon"/>
                    </div> */}
            </div>

            {allowanceList.length == 0 ? (
              <div
                style={{
                  width: "100%",
                  border: "3px dashed rgba(100 100 100/ 50%)",
                  height: "2.5rem",
                  borderRadius: "0.5rem",
                  marginBottom: "1rem",
                }}
              ></div>
            ) : (
              <div
                className="recipients"
                style={{
                  width: "100%",
                  display: "flex",
                  flexFlow: "column",
                  gap: "0.35rem",
                  maxHeight: "11.25rem",
                  overflowY: "auto",
                  paddingRight: "0.5rem",
                  minHeight: "2.25rem",
                  marginBottom: "1rem",
                }}
              >
                {allowanceList.map((e: any) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                  >
                    <Directive
                      status={true}
                      tag={moment(e.created_on.toDate()).format("LL")}
                      title={"OMR " + e.allowance}
                      titleSize="0.75rem"
                      key={e.id}
                      icon={
                        <MinusSquareIcon
                          onClick={() => {
                            setDeleteAllowanceDialog(true);
                            setAllowanceID(e.id);
                          }}
                          className="animate-pulse"
                          color="salmon"
                          width={"1.1rem"}
                        />
                      }
                      noArrow
                    />
                  </motion.div>
                ))}
              </div>
            )}
            {access && (
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  width: "100%",
                  zIndex: "",
                }}
              >
                <input
                  type="search"
                  id="input-1"
                  value={newAllowance == 0 ? "" : newAllowance}
                  onChange={(e: any) => setNewAllowance(e.target.value)}
                  placeholder="New Allowance"
                  style={{ flex: 1.5 }}
                />

                <button
                  onClick={addNewAllowance}
                  style={{ fontSize: "0.8rem", flex: 0.15 }}
                >
                  {loading ? (
                    <LoadingOutlined />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "center",
                      }}
                    >
                      <Plus width={"1.25rem"} color="salmon" />
                    </div>
                  )}
                </button>
              </div>
            )}
          </>
        }
      />
    </>
  );
}
