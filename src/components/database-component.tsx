import AddRecordButton from "@/components/add-record-button"
import AddRecordDialog from "@/components/add-record-dialog"
import Back from "@/components/back"
import CivilID from "@/components/civil-id"
import Directive from "@/components/directive"
import DropDown from "@/components/dropdown"
import FileInput from "@/components/file-input"
import InputDialog from "@/components/input-dialog"
import MedicalID from "@/components/medical-id"
import Passport from "@/components/passport"
import SearchBar from "@/components/search-bar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import DefaultDialog from "@/components/ui/default-dialog"
import VehicleID from "@/components/vehicle-id"
import { db, storage } from "@/firebase"
import { LoadingOutlined } from '@ant-design/icons'
import * as XLSX from '@e965/xlsx'
import emailjs from '@emailjs/browser'
import { message } from 'antd'
import { saveAs } from 'file-saver'
import { addDoc, collection, deleteDoc, doc, getAggregateFromServer, getDocs, onSnapshot, orderBy, query, sum, Timestamp, updateDoc, where } from 'firebase/firestore'
import {
    deleteObject,
    getDownloadURL,
    ref,
    ref as storageRef,
    uploadBytes,
} from "firebase/storage"
import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp, BellOff, BellRing, Book, Car, CheckSquare2, CircleDollarSign, CloudUpload, CreditCard, Disc, Download, EllipsisVerticalIcon, Globe, GraduationCap, HeartPulse, Image, ImageOff, MailCheck, MinusSquareIcon, PackageOpen, PenLine, Plus, RadioTower, RefreshCcw, Sparkles, Trash, User, UserCircle, X } from "lucide-react"
import moment from 'moment'
import { useEffect, useState } from "react"
import { LazyLoadImage } from 'react-lazy-load-image-component'
import 'react-lazy-load-image-component/src/effects/blur.css'
import { useNavigate } from "react-router-dom"
import ReactTimeAgo from 'react-time-ago'
import useKeyboardShortcut from 'use-keyboard-shortcut'
import DbDropDown from "./db-dropdown"
import ImageDialog from "./image-dialog"


type Record = {
    id:string,
    name:string
}

// Running Notes
// Check whether expiry date minus 3 is equals to today - 3 month reminder

interface Props{
    title?:string
    dbCategory?:string
    loader?:any
    noTraining?:boolean
}


export default function DbComponent(props:Props){

    const [companyName, setCompanyName] = useState("")
    const [thumbnails, setThumbnails] = useState(true)
    const [remarksDialog, setRemarksDialog] = useState(false)
    const [remarks, setRemarks] = useState("")
    const [archivePrompt, setArchivePrompt] = useState(false)
    const [state, setState] = useState("")
    const [imageDialog, setImageDialog] = useState(false)
    const [created_on, setCreatedOn] = useState("")
    const [contact, setContact] = useState("")
    const [editedContact, setEditedContact] = useState("")
    const [nativePhone, setNativePhone] = useState("")
    const [nativeAddress, setNativeAddress] = useState("")
    const [editedNativePhone, setEditedNativePhone] = useState("")
    const [editedNativeAddress, setEditedNativeAddress] = useState("")
    const [leaveReview, setLeaveReview] = useState(false)
    const [editedLeaveFrom, setEditedLeaveFrom] = useState("")
    const [editedLeaveTill, setEditedLeaveTill] = useState("")

    const usenavigate = useNavigate()
    // BASIC PAGE VARIABLES
    // const [pageLoad, setPageLoad] = useState(false)
    const [notify, setNotify] = useState(true)
    const [records, setRecords] = useState<any>([])
    const [name, setName] = useState("")
    let id = ""
    const [doc_id, setDocID] = useState("")
    const [recordSummary, setRecordSummary] = useState(false)
    const [civil, setCivil] = useState(false)
    const [vehicle, setVehicle] = useState(false)
    const [addcivil, setAddcivil] = useState(false)
    const [modified_on, setModifiedOn] = useState<any>()
    const [loading, setLoading] = useState(false)
    const [addButtonModeSwap, setAddButtonModeSwap] = useState(false)
    const [deleteMedicalIDdialog, setDeleteMedicalIDdialog] = useState(false)
    const [email, setEmail] = useState("")


    const [editedName, setEditedName] = useState("")
    const [editedEmail, setEditedEmail] = useState("")
    const [editedEmployeeCode, setEditedEmployeeCode] = useState("")
    const [editedCompanyName, setEditedCompanyName] = useState("")
    const [editedDateofJoin, setEditedDateofJoin] = useState("")
    const [editedSalarybasic, setEditedSalaryBasic] = useState(0)
    const [editedAllowance, setEditedAllowance] = useState(0)
    


    const [image, setImage] = useState("")

    // CIVIL ID VARIABLES
    const [civil_number, setCivilNumber] = useState<any>()
    const [new_civil_number, setNewCivilNumber] = useState<any>()
    const [new_civil_expiry, setNewCivilExpiry] = useState<any>()
    const [civil_expiry, setCivilExpiry] = useState<any>()
    const [civil_DOB, setCivilDOB] = useState<any>()

    //EDIT CIVIL ID VARIABLES
    const [edited_civil_number, setEditedCivilNumber] = useState("")
    const [edited_civil_expiry, setEditedCivilExpiry] = useState<any>()
    const [edited_civil_DOB, setEditedCivilDOB] = useState("")
    const [civilDelete, setCivilDelete] = useState(false)

    const [edited_vehicle_number, setEditedVehicleNumber] = useState("")
    const [edited_vehicle_issue, setEditedVehicleIssue] = useState("")
    const [edited_vehicle_expiry, setEditedVehicleExpiry] = useState("")

    const [editedPassportID, setEditedPassportID] = useState("")
    const [editedPassportIssue, setEditedPassportIssue] = useState("")
    const [editedPassportExpiry, setEditedPassportExpiry] = useState<any>()

    const [passportDialog, setPassportDialog] = useState(false)

    const [editedCompletedOn, setEditedCompletedOn] = useState("")
    const [editedDueOn, setEditedDueOn] = useState<any>()

    //MAIL CONFIG VARIABLES
    const [addDialog, setAddDialog] = useState(false)
    const [userDeletePrompt, setUserDeletePrompt] = useState(false)
    const [userEditPrompt, setUserEditPrompt] = useState(false)
    const [editcivilprompt, setEditcivilprompt] = useState(false)
    const [valeTrainingDialog, setValeTrainingDialog] = useState(false)
    const [renewMedicalIDdialog, setRenewMedicalIDdialog] = useState(false)
    const [renewPassportDialog, setRenewPassportDialog] = useState(false)

    //MAIL CONFIG VALUES
    const [mailconfigdialog, setMailConfigDialog] = useState(false)
    const [recipient, setRecipient] = useState("")
    const [testmessage, setTestMessage] = useState("")

    //VEHICLE ID VARIABLES
    const [vehicle_number, setVehicleNumber] = useState("")
    const [vehicle_issue, setVehicleIssue] = useState("")
    const [vehicle_expiry, setVehicleExpiry] = useState<any>()

    const [medical_completed_on, setCompletedOn] = useState("")
    const [medical_due_on, setDueOn] = useState<any>()
    const [MedicalIDdialog, setMedicalIDdialog] = useState(false)

    const [passportID, setPassportID] = useState("")
    const [passportIssue, setPassportIssue] = useState("")
    const [passportExpiry, setPassportExpiry] = useState<any>()

    const [addPassportDialog, setAddPassportDialog] = useState(false)

    const [vehicleIdDelete, setVehicleIdDelete] = useState(false)
    const [edit_vehicle_id_prompt, setEditVehicleIDprompt] = useState(false)
    const [editMedicalIDdialog, setEditMedicalIDdialog] = useState(false)
    const [editPassportDialog, setEditPassportDialog] = useState(false)

    const [DeletePassportDialog, setDeletePassportDialog] = useState(false)

    const [trainingAddDialog, setTrainingAddDialog] = useState(false)
    const [trainingAddDialogTitle, setTrainingAddDialogTitle] = useState("")
    const [EditedTrainingAddDialogInput, setEditedTrainingAddDialogInput] = useState("")
    const [trainingAddDialogInputValue, setTrainingAddDialogInputValue] = useState("")

    const [add_vehicle_id, setAddVehicleID] = useState(false)

    const [excel_upload_dialog, setExcelUploadDialog] = useState(false)

    const [selectable, setSelectable] = useState(false)
    const [search, setSearch] = useState("")

    const [checked, setChecked] = useState<any>([])
    const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false)

    // const [recipientsDialog, setRecipientsDialog] = useState(false)

    const [progress, setProgress] = useState("")

    const [selected, setSelected] = useState(false)
    const [fetchingData, setfetchingData] = useState(false)
    const [status, setStatus] = useState("")

    const [renewDocDialog, setRenewDocDialog] = useState(false)
    const [renewVehicleDialog, setRenewVehicleDialog] = useState(false)

    const [newExpiry, setNewExpiry] = useState<any>()

    // MAILJS VARIABLES
    const serviceId = "service_lunn2bp";
    const templateId = "template_1y0oq9l";

    const today = new Date()


    const [progressItem, setProgressItem] = useState("")
    const [trainingDialog, setTrainingDialog] = useState(false)
    const [healthDialog, setHealthDialog] = useState(false)

    const [notifyLoading, setNotifyLoading] = useState(false)

    const [trainingType, setTrainingType] = useState("")

    const [vt_hse_induction, setHseInduction] = useState<any>()
    const [vt_car_1, setVtCar1] = useState<any>()
    const [vt_car_2, setVtCar2] = useState<any>()
    const [vt_car_3, setVtCar3] = useState<any>()
    const [vt_car_4, setVtCar4] = useState<any>()
    const [vt_car_5, setVtCar5] = useState<any>()
    const [vt_car_6, setVtCar6] = useState<any>()
    const [vt_car_7, setVtCar7] = useState<any>()
    const [vt_car_8, setVtCar8] = useState<any>()
    const [vt_car_9, setVtCar9] = useState<any>()
    const [vt_car_10, setVtCar10] = useState<any>()

    const [imageUpload, setImageUpload] = useState(null);
    const [fileName, setFileName] = useState("")
    const [profileName, setProfileName] = useState("")

    const [salaryDialog, setSalaryDialog] = useState(false)
    const [employeeCode, setEmployeeCode] = useState("")
    const [dateofJoin, setDateofJoin] = useState("")
    const [salaryBasic, setSalaryBasic] = useState(0)
    const [allowance, setAllowance] = useState(0)

    const [newSalary, setNewSalary] = useState(0)
    const [newAllowance, setNewAllowance]  = useState(0)

    const [allowanceDialog, setAllowanceDialog] = useState(false)

    const [leaveLog, setLeaveLog] = useState(false)
    const [leaveList, setLeaveList] = useState<any>([])
    const [leaveFrom, setLeaveFrom] = useState<any>("")
    const [leaveTill, setLeaveTill] = useState<any>("")
    const [leaves, setLeaves] = useState(0)
    const [deleteLeaveDialog, setDeleteLeaveDialog] = useState(false)
    const [leaveID, setLeaveID] = useState("")

    const [salaryList, setSalaryList] = useState<any>([])
    const [deleteSalaryDialog, setDeleteSalaryDialog] = useState(false)
    const [salaryID, setSalaryID] = useState("")

    const [allowanceList, setAllowanceList] = useState<any>([])
    const [deleteAllowanceDialog, setDeleteAllowanceDialog] = useState(false)
    const [allowanceID, setAllowanceID] = useState("")

    const [recordDeleteStatus, setRecordDeleteStatus] = useState("")

    const [fetchingLeave, setFetchingLeave] = useState(false)
    const [fetchingSalary, setFetchingSalary] = useState(false)
    const [fetchingAllowance, setFetchingAllowance] = useState(false)
    let imgUrl = ""

    const [initialSalary, setInitialSalary] = useState(0)
    const [initialAllowance, setInitialAllowance] = useState(0)
    
{/* //////////////////////////////////////////////////////////////////////////////////////////////////////////////*/}

    useEffect(()=>{
        onSnapshot(query(collection(db, 'records')), (snapshot:any) => {
            snapshot.docChanges().forEach((change:any) => {
              if (change.type === "added") {
                fetchData()   
              }
              if (change.type === "modified") {
                  fetchData()
              }
              if (change.type === "removed") {
                  fetchData()
              }
            });
          });

        
    },[])
    
    
    const {flushHeldKeys} = useKeyboardShortcut(
        ["Control", "A"],
        () => {
            
            setAddDialog(!addDialog)
            setName("")
            flushHeldKeys   
        }
    )

    const {} = useKeyboardShortcut(
        ["Control", "I"],
        () => {
            
            usenavigate("/inbox")
            flushHeldKeys
        }
    )

    const TimeStamper = (date:any) => {
        return Timestamp.fromDate(moment(date, "DD/MM/YYYY").toDate())  
    }


    // PAGE LOAD HANDLER
    useEffect(() =>{
        fetchData()
    },[])


    useEffect(()=>{
        window.addEventListener('online', () => {
            setStatus("true")
        });
        window.addEventListener('offline', () => {
            setStatus("false")
        });

        
    })

    useEffect(()=>{
        if(status=="true"){
            message.success("Connection Established")
            fetchData()
        }
        
        else if(status=="false"){
            message.error("Lost Connection.")
        }
    
        
    },[status])

    const uploadFile = async () => {
        if (imageUpload === null) {
          message.info("No image attached");
          return;
        }
        const imageRef = storageRef(storage, fileName);
        console.log("Uploading ", fileName)
        fileName==""?
        console.log("Skipped Upload")
        :
        await uploadBytes(imageRef, imageUpload)
          .then(async (snapshot) => {
            await getDownloadURL(snapshot.ref)
              .then((url:any) => {
                imgUrl = url
                setFileName("")
              })
          })
          .catch((error) => {
            message.error(error.message);
            console.log(error.message)
          });
      };


    //INITIAL DATA FETCH ON PAGE LOAD
    const fetchData = async (type?:any) => {
        
        try {

            setfetchingData(true)
            const RecordCollection = collection(db, "records")
            const recordQuery = query(RecordCollection, orderBy("created_on"), where("type", "==", props.dbCategory))
            const querySnapshot = await getDocs(recordQuery)
            const fetchedData: Array<Record> = [];

            querySnapshot.forEach((doc:any)=>{
                fetchedData.push({id: doc.id, ...doc.data()})
                
            })

            setfetchingData(false)
            setRecords(fetchedData)
            console.log(fetchedData)
            setChecked([])
            setSelectable(false)
            type=="refresh"?
            message.success("Refreshed")
            :null
            
        } catch (error) { 
            console.log(error)
            message.info(String(error))
            setStatus("false")
        }   
    }

    const fetchSalary = async () => {
        console.log(doc_id)
        setFetchingSalary(true)
        const salaryQuery = query(collection(db, "salary-record"), orderBy("created_on", "desc"), where("employeeID", "==", doc_id))
        const snapshot = await getDocs(salaryQuery)
        const SalaryData:any = [];
        snapshot.forEach((doc:any)=>{
            SalaryData.push({id: doc.id, ...doc.data()})
            setSalaryList(SalaryData)
            console.log(salaryList)
        })
        setFetchingSalary(false)
    }

    const fetchAllowance = async () => {
        console.log(doc_id)
        setFetchingAllowance(true)
        const allowanceQuery = query(collection(db, "allowance-record"), orderBy("created_on", "desc"), where("employeeID", "==", doc_id))
        const snapshot = await getDocs(allowanceQuery)
        const AllowanceData:any = [];
        snapshot.forEach((doc:any)=>{
            AllowanceData.push({id: doc.id, ...doc.data()})
            setAllowanceList(AllowanceData)
            console.log(allowanceList)
        })
        setFetchingAllowance(false)
    }

    const addNewSalary = async () => {
        setLoading(true)
        try {
            await addDoc(collection(db, 'salary-record'),{employeeID:doc_id, created_on:Timestamp.fromDate(new Date()), salary:newSalary})
            await updateDoc(doc(db, 'records', doc_id),{salaryBasic:newSalary})
            setSalaryBasic(newSalary)
            fetchSalary()
            setNewSalary(0)
            setLoading(false)
            
        } catch (error) {
            
        }
    }

    const addNewAllowance = async () => {
        setLoading(true)
        try {
            await addDoc(collection(db, 'allowance-record'),{employeeID:doc_id, created_on:Timestamp.fromDate(new Date()), allowance:newAllowance})
            await updateDoc(doc(db, 'records', doc_id),{allowance:newAllowance})
            setAllowance(newAllowance)
            fetchAllowance()
            setNewAllowance(0)
            setLoading(false)
            
        } catch (error) {
            setLoading(false)
        }
    }

    const deleteSalary = async () => {
        setLoading(true)
        await deleteDoc(doc(db, 'salary-record', salaryID))
        id = doc_id
        
        setDeleteSalaryDialog(false)
        if(salaryList.length==1){
            setSalaryList([])
            // await updateDoc(doc(db, 'record', doc_id),{salaryBasic:initialSalary})
        }
        setLoading(false)
        fetchSalary()
    }

    const deleteAllowance = async () => {
        setLoading(true)
        await deleteDoc(doc(db, 'allowance-record', allowanceID))
        id = doc_id
        setLoading(false)
        fetchAllowance()
        setDeleteAllowanceDialog(false)
        allowanceList.length==1&&
            setAllowanceList([])
    }

    const fetchLeave = async () => {
        setFetchingLeave(true)
        const leaveQuery = query(collection(db, "leave-record"), orderBy("created_on", "desc"), where("employeeID", "==", doc_id))
        const snapshot = await getDocs(leaveQuery)
        const LeaveData: any = [];

        snapshot.forEach((doc:any)=>{
            LeaveData.push({id: doc.id, ...doc.data()})
            setLeaveList(LeaveData)
        })
        setFetchingLeave(false)
        console.log("id @ fetchLeave()",id)
        await leaveSum() 
    }

    const leaveSum = async () => {
        setFetchingLeave(true)
        const snapshot = await getAggregateFromServer(query(collection(db, 'leave-record'), where("employeeID", "==", id), where("pending", "==", false)), {
            days:sum("days")
        })
        setFetchingLeave(false)
        setLeaves(snapshot.data().days)

        console.log(snapshot.data().days, id)
    }

{/* ////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}

const addLeave = async () => {
    setLoading(true)
    await addDoc(collection(db, "leave-record"), {employeeID:doc_id,created_on:Timestamp.fromDate(new Date()), leaveFrom:editedLeaveFrom, leaveTill:editedLeaveTill?editedLeaveTill:"Pending", days:moment(editedLeaveTill, "DD/MM/YYYY").diff(moment(editedLeaveFrom, "DD/MM/YYYY"), "days"), pending:editedLeaveTill?false:true})
    id = doc_id
    await leaveSum()
    fetchLeave()
    setEditedLeaveFrom("")
    setEditedLeaveTill("")
    setLoading(false)    
}

const updateLeave = async () => {
    setLoading(true)
    await updateDoc(doc(db, 'leave-record', leaveID),{leaveFrom:leaveFrom, leaveTill:leaveTill, pending:leaveTill=="Pending"?true:false, days:leaveTill!="Pending"&&moment(leaveTill, "DD/MM/YYYY").diff(moment(leaveFrom, "DD/MM/YYYY"), "days")})
    await leaveSum()
    fetchLeave()
    setLeaveReview(false)
    setLoading(false)
}

const deleteLeave = async () => {
    setLoading(true)
    await deleteDoc(doc(db, 'leave-record', leaveID))
    id = doc_id
    await leaveSum()
    setLoading(false)
    fetchLeave()
    setDeleteLeaveDialog(false)
    leaveList.length==1&&
    setLeaveList([])
}

const RenewID = async () => {
    setLoading(true)
    await updateDoc(doc(db, "records", doc_id),{civil_expiry:TimeStamper(newExpiry), modified_on:Timestamp.fromDate(new Date())})
    setCivilExpiry(newExpiry)
    setLoading(false)
    setRenewDocDialog(false)
    fetchData()
    setNewExpiry("")
    setModifiedOn(new Date())
}

    const archiveRecord = async () => {
        setLoading(true)
        try {
            await updateDoc(doc(db, 'records', doc_id),{state:state=="active"?"archived":"active", notify:state=="active"?false:true})
            setLoading(false)
            setArchivePrompt(false)
            setState(state=="active"?"archived":"active")
            setNotify(state=="active"?false:true)
        } catch (error) {
            setLoading(false)
        }
    }

    const exportDB = () => {
        const myHeader = ["id","name","employeeCode","type","companyName","state","notify", "civil_expiry", "license_expiry", "medical_due_on", "passportExpiry", "vt_hse_induction", "vt_car_1", "vt_car_2", "vt_car_3", "vt_car_4", "vt_car_5", "vt_car_6", "vt_car_7", "vt_car_8", "vt_car_9", "vt_car_10","civil_number","license_number", "passportID", "salaryBasic", "allowance"];

        records.forEach((e:any) => {
            
            e.civil_expiry==""?
            {}
            :
            e.civil_expiry = String(moment(e.civil_expiry.toDate()).format("DD/MM/YYYY"))

            e.license_expiry==""?
            {}
            :
            e.license_expiry = String(moment(e.license_expiry.toDate()).format("DD/MM/YYYY"))


            e.medical_due_on==""?
            {}
            :
            e.medical_due_on = String(moment(e.medical_due_on.toDate()).format("DD/MM/YYYY"))

            e.passportExpiry==""?
            {}
            :
            e.passportExpiry = String(moment(e.passportExpiry.toDate()).format("DD/MM/YYYY"))
            
            e.vt_hse_induction==""?
            {}
            :
            e.vt_hse_induction = String(moment(e.vt_hse_induction.toDate()).format("DD/MM/YYYY"))

            e.vt_car_1==""?
            {}
            :
            e.vt_car_1 = String(moment(e.vt_car_1.toDate()).format("DD/MM/YYYY"))

            e.vt_car_2==""?
            {}
            :
            e.vt_car_2 = String(moment(e.vt_car_2.toDate()).format("DD/MM/YYYY"))

            e.vt_car_3==""?
            {}
            :
            e.vt_car_3 = String(moment(e.vt_car_3.toDate()).format("DD/MM/YYYY"))

            e.vt_car_4==""?
            {}
            :
            e.vt_car_4 = String(moment(e.vt_car_4.toDate()).format("DD/MM/YYYY"))

            e.vt_car_5==""?
            {}
            :
            e.vt_car_5 = String(moment(e.vt_car_5.toDate()).format("DD/MM/YYYY"))

            e.vt_car_6==""?
            {}
            :
            e.vt_car_6 = String(moment(e.vt_car_6.toDate()).format("DD/MM/YYYY"))

            e.vt_car_7==""?
            {}
            :
            e.vt_car_7 = String(moment(e.vt_car_7.toDate()).format("DD/MM/YYYY"))

            e.vt_car_8==""?
            {}
            :
            e.vt_car_8 = String(moment(e.vt_car_8.toDate()).format("DD/MM/YYYY"))

            e.vt_car_9==""?
            {}
            :
            e.vt_car_9 = String(moment(e.vt_car_9.toDate()).format("DD/MM/YYYY"))

            e.vt_car_10==""?
            {}
            :
            e.vt_car_10 = String(moment(e.vt_car_10.toDate()).format("DD/MM/YYYY"))
        });

        const worksheet = XLSX.utils.json_to_sheet(records, {header: myHeader});
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        // Buffer to store the generated Excel file
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

        saveAs(blob, "exportedData.xlsx");
        fetchData()

    }

    const addRemark = async () => {
        setLoading(true)
        try {
            await updateDoc(doc(db, 'records', doc_id),{remarks:remarks})
            setLoading(false)
            setRemarksDialog(false)
            fetchData()
        } catch (error) {
            setLoading(false)
        }
    }

    // FUNCTION TO ADD A RECORD
    const addRecord = async () => {
        imgUrl = ""
        setLoading(true)
        await uploadFile()
        await addDoc(collection(db, "records"), {name:name, email:email, employeeCode:employeeCode, companyName:companyName, dateofJoin:dateofJoin, salaryBasic:salaryBasic, initialSalary:salaryBasic, allowance:allowance, initialAllowance:allowance, contact:contact, created_on:Timestamp.fromDate(new Date()), modified_on:Timestamp.fromDate(new Date()), type:props.dbCategory, notify:true, profile:imgUrl, profile_name:fileName, civil_number:"", civil_expiry:"", civil_DOB:"", license_number:"",  license_issue:"", license_expiry:"", medical_completed_on:"", medical_due_on:"", passportID:"", passportIssue:"", passportExpiry:"", vt_hse_induction:"", vt_car_1:"", vt_car_2:"", vt_car_3:"", vt_car_4:"", vt_car_5:"", vt_car_6:"", vt_car_7:"", vt_car_8:"", vt_car_9:"", vt_car_10:"", state:"active", remarks:""})
        setAddDialog(false)
        setName(editedName?editedName:name)
        setEmail(editedEmail?editedEmail:email)
        setLoading(false)
        fetchData()
        setModifiedOn(new Date())
    }

    // FUNCTION TO EDIT RECORD
    const EditRecordName = async () => {
        
        console.log("fileName",fileName)
        setLoading(true)
        if(fileName!=""){
            imgUrl = ""
            if (profileName!=""){
                console.log("Deleting ", profileName)
                await deleteObject(ref(storage, profileName))
            }
         
            await uploadFile()
            setImage(imgUrl)
            setFileName("")
            console.log(fileName)
        }

        await updateDoc(doc(db, "records", doc_id), {name:editedName?editedName:name, email:editedEmail?editedEmail:email, employeeCode:editedEmployeeCode?editedEmployeeCode:employeeCode, companyName:editedCompanyName?editedCompanyName:companyName, dateofJoin:editedDateofJoin?editedDateofJoin:dateofJoin, initialSalary:editedSalarybasic?editedSalarybasic:salaryBasic, initialAllowance:editedAllowance?editedAllowance:allowance, contact:editedContact?editedContact:contact, modified_on:Timestamp.fromDate(new Date)})
        
        if(fileName!=""){
            await updateDoc(doc(db, 'records', doc_id),{profile:imgUrl, profile_name:fileName})
            setProfileName(fileName)
        }
         
        

        setUserEditPrompt(false)
        setName(editedName?editedName:name)
        setEmail(editedEmail?editedEmail:email)
        setEmployeeCode(editedEmployeeCode?editedEmployeeCode:employeeCode)
        setCompanyName(editedCompanyName?editedCompanyName:companyName)
        setDateofJoin(editedDateofJoin?editedDateofJoin:dateofJoin)
        setSalaryBasic(editedSalarybasic?editedSalarybasic:salaryBasic)
        setAllowance(editedAllowance?editedAllowance:allowance)
        setContact(editedContact?editedContact:contact)
        setLoading(false)
        fetchData()
        setModifiedOn(new Date())
    }

    // FUNCTION TO DELETE RECORD
    const deleteRecord = async () => {
        setLoading(true)
        setRecordDeleteStatus("Deleting Record "+doc_id+" (1/2)")
        await deleteDoc(doc(db, "records", doc_id))
        if(profileName!=""){
            setRecordDeleteStatus("Deleting Image "+profileName+" (2/2)")
            try {
                await deleteObject(ref(storage, profileName))  
            } catch (error) {
                setLoading(false)
                message.error(String(error))
            } 
        }
        setRecordDeleteStatus("Deleting Day offs")
        leaveList.forEach(async (item:any) => {
            await deleteDoc(doc(db, "leave-record", item.id))
        })

        setRecordDeleteStatus("Deleting Salary Records")
        salaryList.forEach(async (item:any) => {
            await deleteDoc(doc(db, "salary-record", item.id))
        })

        setRecordDeleteStatus("Deleting Allowance Records")
        allowanceList.forEach(async (item:any) => {
            await deleteDoc(doc(db, "allowance-record", item.id))
        })
        
        setRecordDeleteStatus("")
        setCivilNumber("")
        setCivilNumber("")
        setCivilExpiry("")
        setCivilDOB("")
        setName("")
        setEmail("")
        setCompanyName("")
        setDateofJoin("")
        setSalaryBasic(0)
        setAllowance(0)
        setContact("")
        setNewCivilExpiry("")
        setNewCivilNumber("")
        setUserDeletePrompt(false)
        setRecordSummary(false)
        setLoading(false)
        fetchData()
    }

{/* ////////////////////////////////////////////////////////////////////////////////////////////////////////////// */} 


    // FUNCTION TO ADD A CIVIL ID
    const addCivilID = async () => {
        setAddcivil(false)
        setLoading(true)
        try {
            await updateDoc(doc(db, "records", doc_id),{civil_number:edited_civil_number, 
                civil_expiry:edited_civil_expiry?TimeStamper(edited_civil_expiry):"", civil_DOB:edited_civil_DOB, modified_on:Timestamp.fromDate(new Date)})
            setCivilNumber(edited_civil_number)
            setCivilExpiry(edited_civil_expiry)
            setCivilDOB(edited_civil_DOB)
            setLoading(false)
            fetchData()
            setModifiedOn(new Date())
            
        } catch (error) {
            console.log(error)
            setCivilNumber("")
            setCivilExpiry("")
            setCivilDOB("")
            setNewCivilExpiry("")
            setNewCivilNumber("")
            setLoading(false)
            message.info("ID generation failed "+String(error))
        }
        
    }

    // FUNCTION TO DELETE A CIVIL ID
    const deleteCivilID = async () => {
        setLoading(true)
        await updateDoc(doc(db, "records", doc_id),{civil_number:"", civil_expiry:"", civil_DOB:"", modified_on:Timestamp.fromDate(new Date)})
        setCivilDelete(false)
        setLoading(false)
        setCivilNumber("")
        setCivilNumber("")
        setCivilExpiry("")
        setCivilDOB("")
        setNewCivilExpiry("")
        setNewCivilNumber("")
        fetchData()
        setModifiedOn(new Date())
    }

    // FUNCTION TO EDIT A CIVIL ID
    const EditCivilID = async () => {
        setLoading(true)
        try {
            await updateDoc(doc(db, "records", doc_id),{civil_number:edited_civil_number?edited_civil_number:civil_number, civil_expiry:edited_civil_expiry?TimeStamper(edited_civil_expiry):TimeStamper(civil_expiry), civil_DOB:edited_civil_DOB?edited_civil_DOB:civil_DOB, modified_on:Timestamp.fromDate(new Date)})
            
            setCivilNumber(edited_civil_number?edited_civil_number:civil_number)
            setCivilExpiry(edited_civil_expiry?edited_civil_expiry:civil_expiry)
            setCivilDOB(edited_civil_DOB?edited_civil_DOB:civil_DOB)

            setEditcivilprompt(false)
            setLoading(false)
            fetchData()
            setModifiedOn(new Date())

        } catch (error) {
            console.log(error)  
            setLoading(false)   
            message.info(String(error))
        }
    }

{/* ////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}    


    // FUNCTION TO ADD A VEHICLE ID
    const addVehicleID = async () => {
        setAddVehicleID(false)
        setLoading(true)
        try {
            await updateDoc(doc(db, "records", doc_id),{license_number:vehicle_number, 
            license_expiry:TimeStamper(vehicle_expiry), license_issue:vehicle_issue, modified_on:Timestamp.fromDate(new Date)})

            setLoading(false)
            fetchData()
            setModifiedOn(new Date())
            
            
        }
         catch (error) {
            console.log(error)
            setCivilNumber("")
            setCivilExpiry("")
            setCivilDOB("")
            setNewCivilExpiry("")
            setNewCivilNumber("")
            setLoading(false)
            message.info("ID generation failed "+String(error))
        }
        
    }

    // FUNCTION TO DELETE A VEHICLE ID
    const deleteVehicleID = async () => {
        setLoading(true)
        await updateDoc(doc(db, "records", doc_id),{license_number:"", license_expiry:"", license_issue:"", modified_on:Timestamp.fromDate(new Date)})
        setVehicleIdDelete(false)
        setLoading(false)
        setVehicleNumber("")
        setVehicleExpiry("")
        setVehicleIssue("")
        fetchData()
        setModifiedOn(new Date())
    } 

    // FUNCTION TO DELETE A MEDICAL ID
    const deleteMedicalID = async () => {
        setLoading(true)
        await updateDoc(doc(db, "records", doc_id),{medical_completed_on:"", medical_due_on:"", modified_on:Timestamp.fromDate(new Date)})
        setDeleteMedicalIDdialog(false)
        setLoading(false)
        setCompletedOn("")
        setDueOn("")
        fetchData()
        setModifiedOn(new Date())
    } 

    //FUNCTION TO EDIT VEHICLE ID
    const EditVehicleID = async () => {
        setLoading(true)
        try {
            
            await updateDoc(doc(db, "records", doc_id),{license_number:edited_vehicle_number?edited_vehicle_number:vehicle_number, license_expiry:edited_vehicle_expiry?TimeStamper(edited_vehicle_expiry):TimeStamper(vehicle_expiry), license_issue:edited_vehicle_issue?edited_vehicle_issue:vehicle_issue, modified_on:Timestamp.fromDate(new Date)})

            setVehicleNumber(edited_vehicle_number?edited_vehicle_number:vehicle_number)
            setVehicleExpiry(edited_vehicle_expiry?edited_vehicle_expiry:vehicle_expiry)
            setVehicleIssue(edited_vehicle_issue?edited_vehicle_issue:vehicle_issue)
            

            setEditVehicleIDprompt(false)
            setLoading(false)
            fetchData()
            setModifiedOn(new Date())

        } catch (error) {
            console.log(error)  
            setLoading(false)   
            message.info(String(error))
        }
    }

    const renewVehicleID = async () => {
        setLoading(true)
        try {

            await updateDoc(doc(db, "records", doc_id),{license_issue:edited_vehicle_issue, license_expiry:edited_vehicle_expiry?TimeStamper(edited_vehicle_expiry):TimeStamper(vehicle_expiry), modified_on:Timestamp.fromDate(new Date)})
            setVehicleIssue(edited_vehicle_issue?edited_vehicle_issue:vehicle_issue)
            setVehicleExpiry(edited_vehicle_expiry?edited_vehicle_expiry:vehicle_expiry)
            setLoading(false)
            setRenewVehicleDialog(false)
            fetchData()
            setModifiedOn(new Date())
            
        } catch (error) {
            message.error(String(error))
            setLoading(false)
        }
    }

    const addMedicalID = async () => {
        setMedicalIDdialog(false)
        setLoading(true)
        try {
            await updateDoc(doc(db, "records", doc_id),{medical_completed_on:medical_completed_on, 
            medical_due_on:TimeStamper(medical_due_on), modified_on:Timestamp.fromDate(new Date)})

            setLoading(false)
            fetchData()
            setModifiedOn(new Date())
            
            
        }
         catch (error) {
            console.log(error)
            setCompletedOn("")
            setDueOn("")
            setLoading(false)
            message.info("ID generation failed "+String(error))
        }
    }

    const EditMedicalID = async () => {
        setLoading(true)
        try {
            await updateDoc(doc(db, 'records', doc_id),{medical_completed_on:editedCompletedOn?editedCompletedOn:medical_completed_on, medical_due_on:editedDueOn?TimeStamper(editedDueOn):TimeStamper(medical_due_on), modified_on:Timestamp.fromDate(new Date)})

            setDueOn(editedDueOn?editedDueOn:medical_due_on)
            setCompletedOn(editedCompletedOn?editedCompletedOn:medical_completed_on)
            setLoading(false)
            setEditMedicalIDdialog(false)
            fetchData()
            setModifiedOn(new Date())
            
        } catch (error) {
            message.error(String(error))
        }
    }

    const EditPassport = async () => {
        setLoading(true)
        try {
            await updateDoc(doc(db, 'records', doc_id),{passportID:editedPassportID?editedPassportID:passportID, passportIssue:editedPassportIssue?editedPassportIssue:passportIssue, passportExpiry:editedPassportExpiry?TimeStamper(editedPassportExpiry):TimeStamper(passportExpiry), nativePhone:editedNativePhone?editedNativePhone:nativePhone, nativeAddress:editedNativeAddress?editedNativeAddress:nativeAddress, modified_on:Timestamp.fromDate(new Date)})
            setPassportID(editedPassportID?editedPassportID:passportID)
            setPassportIssue(editedPassportIssue?editedPassportIssue:passportIssue)
            setPassportExpiry(editedPassportExpiry?editedPassportExpiry:passportExpiry)
            setNativePhone(editedNativePhone?editedNativePhone:nativePhone)
            setNativeAddress(editedNativeAddress?editedNativeAddress:nativeAddress)
            setLoading(false)
            setEditPassportDialog(false)
            fetchData()
            setModifiedOn(new Date())
            
        } catch (error) {
            message.error(String(error))
            setLoading(false)
            
        }
    }

    const renewMedicalID = async () => {
        setLoading(true)
        try {

            await updateDoc(doc(db, "records", doc_id),{medical_completed_on:editedCompletedOn?editedCompletedOn:medical_completed_on, medical_due_on:editedDueOn?TimeStamper(editedDueOn):TimeStamper(medical_due_on), modified_on:Timestamp.fromDate(new Date)})

            setCompletedOn(editedCompletedOn?editedCompletedOn:medical_completed_on)
            setDueOn(editedDueOn?editedDueOn:medical_due_on)
            
            setLoading(false)
            setRenewMedicalIDdialog(false)
            fetchData()
            setModifiedOn(new Date())
            
        } catch (error) {
            message.error(String(error))
            setLoading(false)
        }
    }

    const addPassport = async () => {
        setAddPassportDialog(false)
        setLoading(true)
        try {
            await updateDoc(doc(db, "records", doc_id),{passportID:passportID, 
            passportIssue:passportIssue, passportExpiry:TimeStamper(passportExpiry), nativePhone:nativePhone, nativeAddress:nativeAddress, modified_on:Timestamp.fromDate(new Date)})
            setLoading(false)
            fetchData()
            setModifiedOn(new Date())
            
            
        } catch (error) {
            message.error(String(error))
            setLoading(false)
        }
    }

    const deletePassport = async () => {
        setLoading(true)
        await updateDoc(doc(db, "records", doc_id),{passportID:"", passportExpiry:"", passportIssue:"", modified_on:Timestamp.fromDate(new Date)})
        setDeletePassportDialog(false)
        setLoading(false)
        setPassportID("")
        setPassportExpiry("")
        setPassportIssue("")
        fetchData()
        setModifiedOn(new Date())
    }
    
    const renewPassport = async () => {
        setLoading(true)
        await updateDoc(doc(db, "records", doc_id),{passportExpiry:TimeStamper(editedPassportExpiry?editedPassportExpiry:passportExpiry), passportIssue:editedPassportIssue?editedPassportIssue:passportIssue, modified_on:Timestamp.fromDate(new Date)
            
        })
        setPassportIssue(editedPassportIssue?editedPassportIssue:passportIssue)
        setPassportExpiry(editedPassportExpiry?editedPassportExpiry:passportExpiry)
        setLoading(false)
        setRenewPassportDialog(false)
        fetchData()
        setModifiedOn(new Date())
    
    }
{/* ////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}

    // FUNCTION TO SEND A TEST EMAIL
    const TestMail = async () => {
        
        try {
            setLoading(true)
            await emailjs.send(serviceId, templateId, {
              name: "User",
              recipient: recipient,
              message: testmessage
            });
            setLoading(false)
            message.success("Email Successfully Sent")
          } catch (error) {
            console.log(error);
            message.info("Invalid email address")
            setLoading(false)
          }
          setMailConfigDialog(false)
    }
{/* ////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}


    const handleSelect = (id:any) => {
        
        
        const index = checked.indexOf(id)
        // console.log(index, id)
    


        if(index == -1){
            setChecked((data:any)=>[...data,id])
        }
        else{
            const newVal = [...checked]
            newVal.splice(index, 1)
            setChecked(newVal)

            // const newVal = [...checked]
            // checked.filter((i:any) => i != id);
            // setChecked(newVal)
        }
        
    }

    const handleBulkDelete = async () => {
        try {
            let counts = 0
            let percentage = 100/checked.length
            setLoading(true)

            const snapshot = await getDocs(collection(db, 'records'))
                snapshot.forEach((e:any) => {
                    console.log(e.profile_name)
                    e.profile_name?
                    deleteObject(ref(storage, e.profile_name)) 
                    :
                    console.log("Skipped profile delete for "+e.id)  

                });
            
            await checked.forEach(async (item:any) => {
                console.log(item)
                await deleteDoc(doc(db, "records", item))
                

                
                
                counts++
                setProgress(String(percentage*counts)+"%")
                setProgressItem(item)
            

                if(checked.length==counts){
                    setLoading(false)
                    
                    setBulkDeleteDialog(false)
                    setAddButtonModeSwap(false)
                    setSelectable(false)
                    fetchData()
                    setProgress("")
                }
            });

            
            

        } catch (error) {
            message.info(String(error))
        }
    }

    const handleNotify = async () => {
        setNotifyLoading(true)
        await updateDoc(doc(db, 'records', doc_id),{notify:!notify})
        setNotify(!notify)
        setNotifyLoading(false)
        notify==true?
        message.info("Notifications Disabled")
        :
        message.success("Notifications Enabled")
    }

    const addTraining = async (type:any) => {
        setLoading(true)

        if (type=="hse_induction"){        
            await updateDoc(doc(db, 'records', doc_id), {vt_hse_induction:TimeStamper(EditedTrainingAddDialogInput), modified_on:Timestamp.fromDate(new Date())})
            setHseInduction(EditedTrainingAddDialogInput)
        }

        if(type=="car_1"){
            await updateDoc(doc(db, 'records', doc_id), {vt_car_1:TimeStamper(EditedTrainingAddDialogInput), modified_on:Timestamp.fromDate(new Date())})
            setVtCar1(EditedTrainingAddDialogInput)
        }
        

        if(type=="car_2"){
            await updateDoc(doc(db, 'records', doc_id), {vt_car_2:TimeStamper(EditedTrainingAddDialogInput), modified_on:Timestamp.fromDate(new Date())})
            setVtCar2(EditedTrainingAddDialogInput)
        }
        

        if(type=="car_3"){
            await updateDoc(doc(db, 'records', doc_id), {vt_car_3:TimeStamper(EditedTrainingAddDialogInput), modified_on:Timestamp.fromDate(new Date())})
            setVtCar3(EditedTrainingAddDialogInput)
        }
        

        if(type=="car_4"){
            await updateDoc(doc(db, 'records', doc_id), {vt_car_4:TimeStamper(EditedTrainingAddDialogInput), modified_on:Timestamp.fromDate(new Date()) })
            setVtCar4(EditedTrainingAddDialogInput)
        }
        
        if(type=="car_5"){
            await updateDoc(doc(db, 'records', doc_id), {vt_car_5:TimeStamper(EditedTrainingAddDialogInput), modified_on:Timestamp.fromDate(new Date()) })
            setVtCar5(EditedTrainingAddDialogInput)
        }
        

        if(type=="car_6"){
            await updateDoc(doc(db, 'records', doc_id), {vt_car_6:TimeStamper(EditedTrainingAddDialogInput), modified_on:Timestamp.fromDate(new Date()) })
            setVtCar6(EditedTrainingAddDialogInput)
        }
        

        if(type=="car_7"){
            await updateDoc(doc(db, 'records', doc_id), {vt_car_7:TimeStamper(EditedTrainingAddDialogInput), modified_on:Timestamp.fromDate(new Date()) })
            setVtCar7(EditedTrainingAddDialogInput)
        }
        

        if(type=="car_8"){
            await updateDoc(doc(db, 'records', doc_id), {vt_car_8:TimeStamper(EditedTrainingAddDialogInput), modified_on:Timestamp.fromDate(new Date()) })
            setVtCar8(EditedTrainingAddDialogInput)
        }
        

        if(type=="car_9"){
            await updateDoc(doc(db, 'records', doc_id), {vt_car_9:TimeStamper(EditedTrainingAddDialogInput), modified_on:Timestamp.fromDate(new Date()) })
            setVtCar9(EditedTrainingAddDialogInput)
        }
        
        if(type=="car_10"){
            await updateDoc(doc(db, 'records', doc_id), {vt_car_10:TimeStamper(EditedTrainingAddDialogInput), modified_on:Timestamp.fromDate(new Date()) })
            setVtCar10(EditedTrainingAddDialogInput)
        }
        

        
        setLoading(false)
        setModifiedOn(new Date())
        setTrainingAddDialog(false)
        fetchData()
    }

    

    

    return(
        <>
        
        
        {
            status=="false"?
            <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
            <div style={{display:"flex", width:"100%", background:"crimson", height:"1.5rem", justifyContent:"center", alignItems:"center", position:"fixed", bottom:0,}}>

                <div style={{display:"flex", gap:"0.5rem", alignItems:"center"}}>
                    <RadioTower width={"0.75rem"}/>
                    <p style={{fontSize:"0.75rem"}}>No Internet</p>
                </div>
            
            </div>
            </motion.div>
            :null
        }
        

        {/* Main Container */}
        <div style={{padding:"1.25rem", height:"100svh", border:"", 
            background:"linear-gradient(rgba(67 57 129/ 30%), rgba(100 100 100/ 0%)"}}>


            {/* Main Component */}
            <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>

            <div>

            </div>
                {/* BACK BUTTON */}
                <Back title={props.title+
                
                " ("+records.length+")"} 
                extra={
                    !selectable?
                    <div style={{display:"flex", gap:"0.5rem", height:"2.75rem"}}>
                        
                        {/* <button style={{paddingLeft:"1rem", paddingRight:"1rem"}} onClick={()=>{setExcelUploadDialog(true)}}><Upload width={"1rem"} color="dodgerblue"/></button> */}
                    
                        {/* <button style={{paddingLeft:"1rem", paddingRight:"1rem"}} onClick={()=>setMailConfigDialog(true)}>
                        {
                            loading?
                            <LoadingOutlined color="dodgerblue"/>
                            :
                            <BellRing width="1.1rem" color="dodgerblue"/>
                            
                        }
                        </button> */}

                        {/* <button style={{cursor:"default", width:"5rem", fontSize:"0.9rem", opacity:0.5}}>
                            
                            Ctrl + I
                        </button> */}
                        
                        <button className="transitions blue-glass" style={{paddingLeft:"1rem", paddingRight:"1rem", width:"3rem"}} onClick={()=>{fetchData("refresh")}} >

                            {
                                fetchingData?
                                <>
                                <LoadingOutlined style={{color:"dodgerblue"}}/>
                                {/* <p style={{fontSize:"0.8rem", opacity:0.5}}>Updating</p> */}
                                </>
                                
                                :
                                <RefreshCcw width={"1.25rem"} height={"1.25rem"} color="dodgerblue"/>
                            }
                            

                            </button>

                            <DbDropDown onExport={exportDB} onInbox={()=>usenavigate("/inbox")} onArchives={()=>usenavigate("/archives")} onAccess={()=>usenavigate("/access-control")} trigger={<EllipsisVerticalIcon width={"1.1rem"}/>}/>


                            {/* <button onClick={()=>usenavigate("/inbox")} style={{ width:"3rem", background:"rgba(220 20 60/ 20%)"}}>
                                <InboxIcon className="" color="crimson"/>
                            </button> */}

                            
            
                    </div>
                    :
                    <div 
                    className="transitions" 
                    onClick={()=>{
                        // setSelectAll(!selectAll)
                        // !selectAll?
                        // setSelected(true)
                        // :setSelected(false)
                        // !selectAll?
                        // records.forEach((item:any)=>{
                        //     setChecked((data:any)=>[...data,item.id])
                        
                        // })
                        // :setChecked([])
                        }} 
                    style={{height:"2.75rem", border:"", width:"7.5rem", background:"rgba(100 100 100/ 20%)", padding:"0.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", paddingLeft:"1rem", paddingRight:"1rem", borderRadius:"0.5rem", cursor:"pointer"}}>
                        <p style={{opacity:0.75}}>Selected</p>
                        <p style={{ fontWeight:600}}>{checked.length}</p>
                    </div>
                    }
                />
                <br/>

                {// if page doesn't load : 

                


                // IF NUMBER OF RECORDS IS LESS THAN 1
                records.length<1?

                status=="false"?
                <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                    <div style={{width:"100%",height:"75svh", display:"flex", justifyContent:"center", alignItems:"center", border:"", flexFlow:"column"}}>

                        <div style={{display:"flex", gap:"0.25rem", opacity:"0.5"}}>
                            <RadioTower width={"1rem"}/>
                            <p>No Internet Connection</p>
                            
                        </div>
                        <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                        <p style={{opacity:0.5, fontSize:"0.7rem"}}>Please check your internet connectivity</p>
                        </motion.div>


                    </div>
                </motion.div>
                :

                fetchingData?
                <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                    <div style={{width:"100%",height:"75svh", display:"flex", justifyContent:"center", alignItems:"center", border:""}}>

                        {/* <div style={{display:"flex", gap:"0.5rem", opacity:"0.5", border:""}}>
                            <p style={{fontSize:"0.75rem"}} className="animate-ping">Fetching Data</p>
                        </div> */}

                        <div style={{ border:"", display:"flex", alignItems:"center", justifyContent:"center"}}>
                            
                            {props.loader}
                            
                            
                        </div>
                        


                    </div>
                </motion.div>
                
                :

                // DISPLAY EMPTY SET - PAGE
                <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                    <div style={{width:"100%",height:"75svh", display:"flex", justifyContent:"center", alignItems:"center", border:"", flexFlow:"column"}}>

                        <div style={{display:"flex", gap:"0.25rem", opacity:"0.5"}}>
                            <PackageOpen width={"1rem"}/>
                            <p>No Data</p>
                            
                        </div>
                
                        <p style={{opacity:0.5, fontSize:"0.7rem"}}>Add a record using + Add Record</p>
                        


                    </div>
                </motion.div>


                : //else


                //DISPLAY Page Beginning
                <div style={{display:"flex", flexFlow:"column", gap:"0.5rem", marginTop:"1"}}>

                    {/* Searchbar */}
                    <div style={{display:"flex", gap:"0.5rem", border:"", flex:1}}>

                        <button className={selectable?"blue":""} onClick={()=>{setSelectable(!selectable);setAddButtonModeSwap(!addButtonModeSwap);selectable && setChecked([]); !selectable && setSelected(false)}}>

                                <CheckSquare2 color={selectable?"white":"dodgerblue"}/>

                        </button>

                        

                        <SearchBar placeholder="Search Records" onChange={(e:any)=>{setSearch(e.target.value.toLowerCase())}}/>

                        <button onClick={()=>setThumbnails(!thumbnails)} style={{width:"fit-content", fontSize:"0.7rem", display:'flex', alignItems:"center"}}>
                        {
                            thumbnails?
                            <ImageOff style={{opacity:0.5}} width={"1.5rem"}/>
                            
                            :
                            <Image color="dodgerblue" width={"1.5rem"}/>
                        }
                        {/* <p style={{opacity:0.5, fontWeight:400}}>Thumbnails</p> */}
                        
                        </button>
                    </div>
                     

                    <p style={{height:"0.25rem"}}/>
                
                <div className="record-list" style={{display:"flex", gap:"0.6rem", flexFlow:"column", overflowY:"auto", height:"72svh", paddingTop:"", paddingRight:"0.5rem"}}>
                    
                    <div style={{width:"100%", display:"flex", justifyContent:"flex-start"}}>
                    
                    </div>
                    
                {
                    // RECORD DATA MAPPING
                    records
                    .filter((post:any)=>{
                    
                        return search == ""?
                        {}
                        :
                        post.name&&
                        ((post.name).toLowerCase()).includes(search.toLowerCase())
                        
                    
                    })
                    .map((post:any)=>(
                        <motion.div key={post.id} initial={{opacity:0}} whileInView={{opacity:1}}>

                            <Directive 
                                notify={(!post.notify)}
                                archived={post.state=="archived"?true:false}
                                tag={

                                    post.civil_expiry != "" || post.license_expiry != "" || post.medical_due_on != "" || post.passportID != ""||post.vt_hse_induction != "" || post.vt_car_1 != "" || post.vt_car_2 != "" || post.vt_car_3 != "" || post.vt_car_4 != ""|| post.vt_car_5 != ""|| post.vt_car_6 != ""|| post.vt_car_7 != ""|| post.vt_car_8 != ""|| post.vt_car_9 != ""|| post.vt_car_10 != ""
                                    ?
                                    

                                    
                                    "Available"
                                    :"No Data"

                                    



                                    // ||
                                    // post.civil_expiry?
                                    // Math.round(moment(new Date(post.civil_expiry)).diff(moment(today), 'months')+1)<=3?
                                    // "Expiring"
                                    // :"No Data"
                                    // :null

                                    // ||
                                    // post.vehicle_expiry?
                                    // Math.round(moment(new Date(post.vehicle_expiry)).diff(moment(today), 'months')+1)<=3?
                                    // "Expiring"
                                    // :"No Data"
                                    // :null

                                }
                                
                                selected={selected}

                                selectable={selectable}

                                status
                            
                                // ON CLICK
                                onSelect={()=>{
                                    handleSelect(post.id)
                            
                                }}
                                onClick={()=>{
                                    setRecordSummary(true);
                                    setName(post.name);
                                    id = post.id
                                    setDocID(post.id)
                                    console.log("id:",id)
                                    setCivilNumber(post.civil_number);
                                    setCivilExpiry(post.civil_expiry?moment((post.civil_expiry).toDate()).format("DD/MM/YYYY"):null);
                                    setCivilDOB(post.civil_DOB)
                                    setCompletedOn(post.medical_completed_on)
                                    setDueOn(post.medical_due_on?moment((post.medical_due_on).toDate()).format("DD/MM/YYYY"):null)
                                    setVehicleNumber(post.license_number)
                                    setVehicleExpiry(post.license_expiry?moment((post.license_expiry).toDate()).format("DD/MM/YYYY"):"")
                                    setVehicleIssue(post.license_issue)
                                    setModifiedOn(post.modified_on?moment((post.modified_on).toDate()):"")
                                    setCreatedOn(moment(post.created_on.toDate()).format("LL"))
                                    setPassportID(post.passportID)
                                    setPassportIssue(post.passportIssue)
                                    setPassportExpiry(post.passportExpiry?moment((post.passportExpiry).toDate()).format("DD/MM/YYYY"):null)
                                    setEmail(post.email)
                                    setNotify(post.notify)

                                    setHseInduction(post.vt_hse_induction?moment(post.vt_hse_induction.toDate()).format("DD/MM/YYYY"):null)

                                    setVtCar1(post.vt_car_1?moment(post.vt_car_1.toDate()).format("DD/MM/YYYY"):null)

                                    setVtCar2(post.vt_car_2?moment(post.vt_car_2.toDate()).format("DD/MM/YYYY"):null)

                                    setVtCar3(post.vt_car_3?moment(post.vt_car_3.toDate()).format("DD/MM/YYYY"):null)

                                    setVtCar4(post.vt_car_4?moment(post.vt_car_4.toDate()).format("DD/MM/YYYY"):null)

                                    setVtCar5(post.vt_car_5?moment(post.vt_car_5.toDate()).format("DD/MM/YYYY"):null)

                                    setVtCar6(post.vt_car_6?moment(post.vt_car_6.toDate()).format("DD/MM/YYYY"):null)

                                    setVtCar7(post.vt_car_7?moment(post.vt_car_7.toDate()).format("DD/MM/YYYY"):null)

                                    setVtCar8(post.vt_car_8?moment(post.vt_car_8.toDate()).format("DD/MM/YYYY"):null)

                                    setVtCar9(post.vt_car_9?moment(post.vt_car_9.toDate()).format("DD/MM/YYYY"):null)

                                    setVtCar10(post.vt_car_10?moment(post.vt_car_10.toDate()).format("DD/MM/YYYY"):null)

                                    setImage(post.profile)
                                    setProfileName(post.profile_name)
                                    setCivilNumber(post.civil_number)
                                    setVehicleNumber(post.license_number)
                                    setPassportID(post.passportID)
                                    setEmployeeCode(post.employeeCode)
                                    setCompanyName(post.companyName)
                                    setDateofJoin(post.dateofJoin)
                                    setSalaryBasic(post.salaryBasic)
                                    setAllowance(post.allowance)
                                    setProfileName(post.profile_name)
                                    setInitialSalary(post.initialSalary)
                                    setInitialAllowance(post.initialAllowance)
                                    setRemarks(post.remarks)
                                    setState(post.state)
                                    setContact(post.contact)
                                    setNativePhone(post.nativePhone)
                                    setNativeAddress(post.nativeAddress)
                                    fetchLeave()
                                    
                                }}                        

                            key={post.id} title={post.name} 
                            icon={
                                thumbnails?
                                <UserCircle color="dodgerblue" width={"1.75rem"} height={"1.75rem"}/>
                                :
                                
                                <>
                                <div style={{background:"#1a1a1a", height:"1.75rem", width:"1.75rem", position:"absolute", borderRadius:"50%", display:"flex", justifyContent:"center", alignItems:"center"}}>
                                    <p style={{paddingTop:"0.1rem", fontWeight:600}}>{post.name.charAt(0)}</p>
                                </div>
                                <LazyLoadImage useIntersectionObserver delayMethod="debounce" threshold={100} effect="blur" style={{width:"1.75rem", height:"1.75rem", borderRadius:"50%", objectFit:"cover", display:"flex"}} src={post.profile} 
                                // placeholder={
                                //     post.name.charAt(0)
                                // }
                                	
                                />
                                </>
                                
                                
                            } />
                        </motion.div>
                    ))
                }

                </div>
                

                </div>
                
                }

                <br/>

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
            <AddRecordButton title={addButtonModeSwap?"Delete Record(s)":"Add Record"} onClickSwap={addButtonModeSwap} onClick={()=>{setAddDialog(true); setName(""); setEmail(""); setEmployeeCode(""); setCompanyName(""); setDateofJoin(""); setSalaryBasic(0); setAllowance(0); setContact("")}} alternateOnClick={()=>{checked.length<1?null:setBulkDeleteDialog(true)}}
                icon={addButtonModeSwap?<Trash color="crimson" width="1rem"/>:<Plus color="dodgerblue" width="1rem"/>}/>


{/* ////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}

            {/* Dialog Boxes 👇*/}


            {/* Upload Excel files Dialog */}
            <DefaultDialog onCancel={()=>setExcelUploadDialog(false)} OkButtonText="Upload" open={excel_upload_dialog} title="Upload Excel Data" titleIcon={<CloudUpload/> } 
                extra={
                <>
                <FileInput/>
                </>
            }/>


            {/* Mail Configuration Dialog */}
            <DefaultDialog disabled={loading||recipient?false:true} titleIcon={<MailCheck/>} title="Test Notifications" open={mailconfigdialog} onCancel={()=>setMailConfigDialog(false)} onOk={TestMail} updating={loading} OkButtonText="Send Test Mail" extra={
                <div style={{display:"flex", border:"", width:"100%", flexFlow:"column", gap:"0.5rem"}}>
                    <input placeholder="Enter E-Mail Address" onChange={(e)=>setRecipient(e.target.value)}/>
                    <textarea onChange={(e:any)=>setTestMessage(e.target.value)} placeholder="Message..." rows={4}/>
                {/* <Button variant={"ghost"} style={{flex:1}} onClick={()=>{setRecipientsDialog(true)}}>
                    <Plus style={{width:"1rem"}} color="dodgerblue"/>
                    Add Recipient
                </Button> */}
                </div>
                
                }/>


            

{/* ////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}


            <InputDialog title="Add Remark" inputplaceholder="Enter remarks" OkButtonText="Update" OkButtonIcon={<RefreshCcw width={"1rem"}/>} open={remarksDialog} onCancel={()=>setRemarksDialog(false)} inputOnChange={(e:any)=>setRemarks(e.target.value)} onOk={addRemark} updating={loading} disabled={loading} input1Value={remarks}/>

            <DefaultDialog titleIcon={<Download/>} title={state=="active"?"Archive Record?":"Unarchive?"} open={archivePrompt} onCancel={()=>setArchivePrompt(false)} OkButtonText={state=="active"?"Archive":"Confirm"} onOk={archiveRecord} updating={loading} disabled={loading}/>

            {/* DISPLAY RECORD DIALOG */}
            <DefaultDialog 
            code={employeeCode}
            creation_date={created_on}
            codeTooltip="Employee Code"
            tags
            contact={contact}
            renumeration={props.dbCategory=="personal"?true:false}
            remarksOnClick={()=>setRemarksDialog(true)}
            remarksValue={remarks}
            tag1Text={companyName}
            tag2Text={dateofJoin}
            tag3Text={
            <div style={{display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.75rem"}}>
                {salaryBasic}
                <div style={{border:'',display:'flex',justifyContent:"center", alignItems:"center", textAlign:"center"}}>

                <p style={{opacity:0.5}}>{"("+Math.abs((salaryBasic - initialSalary)/ initialSalary)+"%"+")"}</p>
                    <p>{
                        Math.sign((salaryBasic - initialSalary)/ initialSalary)==-1?
                        <ArrowDown strokeWidth={"3px"} width={"0.9rem"} color="lightcoral"/>
                        :
                        ((salaryBasic - initialSalary)/ initialSalary)==0?
                        ""
                        :
                        <ArrowUp strokeWidth={"3px"} width={"0.9rem"} color="lightgreen"/>

                    }</p>
                                
                </div>
            </div>
        }
        tag4Text={
            <div style={{display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.75rem"}}>
                {allowance}
                <div style={{border:'',display:'flex',justifyContent:"center", alignItems:"center", textAlign:"center"}}>
                    <p style={{opacity:0.5}}>{"("+Math.abs((allowance - initialAllowance)/ initialAllowance)+"%"+")"}</p>
                    <p>{
                        Math.sign((allowance - initialAllowance)/ initialAllowance)==-1?
                        <ArrowDown strokeWidth={"3px"} width={"0.9rem"} color="lightcoral"/>
                        :
                        ((allowance - initialAllowance)/ initialAllowance)==0?
                        ""
                        :
                        <ArrowUp strokeWidth={"3px"} width={"0.9rem"} color="lightgreen"/>

                    }</p>
                                
                </div>
            </div>
        }
            tag3OnClick={()=>{setSalaryDialog(true);fetchSalary();setSalaryList([])}}
            tag4OnClick={()=>{setAllowanceDialog(true);fetchAllowance();setAllowanceList([])}}
            onBottomTagClick={()=>{setLeaveLog(true);fetchLeave();setLeaveList([]);id=doc_id}}
            bottomTagValue={leaves}
            bottomValueLoading={fetchingLeave}
            titleIcon={
            

                <Avatar style={{width:"3.5rem", height:"3.5rem", objectFit:"cover", display:"flex", justifyContent:"center", alignItems:"center", cursor:"pointer", border:state=="archived"?"solid goldenrod":""}}>
                    <AvatarImage onClick={()=>setImageDialog(true)} style={{objectFit:"cover"}} src={image}/>
                    <AvatarFallback>
                        <p style={{paddingTop:"0.1rem"}}>{Array.from(name)[0]}</p>
                        
                    </AvatarFallback>
                </Avatar>
                
            } title={name} open={recordSummary} onCancel={()=>{setRecordSummary(false);setEmail("")}} 
            bigDate={()=>message.info("Last Modified : "+String(moment(new Date(modified_on)).format("LLL")))}
            created_on={
    
                <ReactTimeAgo date={moment(modified_on, "DD/MM/YYYY").toDate()} timeStyle={ "twitter"} locale="en-us"/>
                    
            } 
            title_extra={
                <div style={{display:"flex", gap:"0.5rem", alignItems:"center"}}>
                    {
                        state=="active"?
                        <button onClick={handleNotify} style={{paddingLeft:"1rem", paddingRight:"1rem", height:"2.5rem"}}>
                        {
                            notifyLoading?
                            <LoadingOutlined color="dodgerblue"/>
                            :
                            notify?
                            <BellRing color="dodgerblue" width={"1rem"} fill="dodgerblue"/>
                            :<BellOff width={"1rem"} color="dodgerblue"/>
                        }
                        
                        </button>
                        :
                        <button style={{fontSize:"0.8rem", width:"4.5rem", opacity:"0.5", border:"", height:"2rem"}}>Archived</button>
                    }
                    


                    <DropDown onExtra={()=>setArchivePrompt(true)} extraText={state=="active"?"Archive":"Unarchive"} onDelete={()=>{setUserDeletePrompt(true);console.log(profileName);fetchLeave();fetchSalary();fetchAllowance();console.log(leaveList, salaryList, allowanceList)}} onEdit={()=>{setUserEditPrompt(true);console.log("filename : ",fileName, "profileName : ", profileName)}} trigger={<EllipsisVerticalIcon width={"1.1rem"}/>}/>
                </div>
            
            }
            close extra={
                <div style={{border:"", width:"100%", display:"flex", flexFlow:"column", gap:"0.5rem", paddingBottom:"", paddingTop:""}}>
                    
                    <Directive onClick={()=>setCivil(true)} icon={<CreditCard color="dodgerblue"/>} title="Civil ID" tag={civil_expiry} 
                    status={
                        moment(civil_expiry, "DD/MM/YYYY").diff(moment(today), 'months')<=2?
                        false:true
                    }/>

                    <Directive tag={vehicle_expiry} onClick={()=>setVehicle(true)} icon={<Car color="violet"/>} title="License" 
                    status={
                        moment(vehicle_expiry, "DD/MM/YYYY").diff(moment(today), 'months')<=2?
                        false
                        :true
                    }/>

                    <Directive tag={passportExpiry} onClick={()=>setPassportDialog(true)} icon={<Book color="goldenrod"/>} title="Passport" status={
                        moment(passportExpiry, "DD/MM/YYYY").diff(moment(today),'months')<=6?
                        false:true
                    }/>

                    <Directive tag={medical_due_on} onClick={()=>setHealthDialog(true)} icon={<HeartPulse color="tomato"/>} title="Medical" status={
                        moment(medical_due_on, "DD/MM/YYYY").diff(moment(today),'months')<=2?
                        false:true
                    }/>

                    
                    {
                        props.noTraining?
                        null
                        :
                        <Directive
                    tag={
                        moment(vt_hse_induction, "DD/MM/YYYY").diff(moment(today),'months')<=2
                        ||
                        moment(vt_car_1, "DD/MM/YYYY").diff(moment(today),'months')<=2
                        ||
                        moment(vt_car_2, "DD/MM/YYYY").diff(moment(today),'months')<=2
                        ||
                        moment(vt_car_3, "DD/MM/YYYY").diff(moment(today),'months')<=2
                        ||
                        moment(vt_car_4, "DD/MM/YYYY").diff(moment(today),'months')<=2
                        ||
                        moment(vt_car_5, "DD/MM/YYYY").diff(moment(today),'months')<=2
                        ||
                        moment(vt_car_6, "DD/MM/YYYY").diff(moment(today),'months')<=2
                        ||
                        moment(vt_car_7, "DD/MM/YYYY").diff(moment(today),'months')<=2
                        ||
                        moment(vt_car_8, "DD/MM/YYYY").diff(moment(today),'months')<=2
                        ||
                        moment(vt_car_9, "DD/MM/YYYY").diff(moment(today),'months')<=2
                        ||
                        moment(vt_car_10, "DD/MM/YYYY").diff(moment(today),'months')<=2
                        ?
                        "Expiring Soon"
                        :
                        ""                                           
                    } 
                    onClick={()=>{
                        setValeTrainingDialog(true)
                    }} icon={<GraduationCap color="lightgreen"/>} title="Training"/>
                    }
                    
                    
                </div>
            
            }/>

        <ImageDialog open={imageDialog} src={image}  onCancel={()=>setImageDialog(false)}/>

            {/* ADD RECORD DIALOG */}
            <AddRecordDialog open={addDialog} onCancel={()=>{setAddDialog(false);setEditedName("")}}
            updating={loading}
            disabled={loading}
            title="Add Record"
            renumeration={props.dbCategory=="personal"?true:false}
            onImageChange={(e:any)=>{setImageUpload(e.target.files[0]); setFileName(e.target.files[0].name)}}
            NameOnChange={(e:any)=>{setName(e.target.value)}}
            EmailOnChange={(e:any)=>setEmail(e.target.value)}
            CodeOnChange={(e:any)=>setEmployeeCode(e.target.value)}
            CompanyNameOnChange={(e:any)=>setCompanyName(e.target.value)}
            DateofJoinOnChange={(e:any)=>setDateofJoin(e.target.value)}
            SalaryBasicOnChange={(e:any)=>setSalaryBasic(e.target.value)}
            AllowanceOnChange={(e:any)=>setAllowance(e.target.value)}
            LocalContactOnChange={(e:any)=>setContact(e.target.value)}
            onOK={addRecord}
            />

           


            {/* EDIT RECORD DIALOG */}
            <AddRecordDialog open={userEditPrompt} onCancel={()=>{setUserEditPrompt(false);setEditedName("")}}
            title="Edit Record"
            updating={loading}
            disabled={loading}
            renumeration={props.dbCategory=="personal"?true:false}
            onImageChange={
                (e:any)=>{
                    setImageUpload(e.target.files[0]); setFileName(e.target.files[0].name);
                }}

            NameOnChange={(e:any)=>{setEditedName(e.target.value)}}
            EmailOnChange={(e:any)=>setEditedEmail(e.target.value)}
            CodeOnChange={(e:any)=>setEditedEmployeeCode(e.target.value)}
            CompanyNameOnChange={(e:any)=>setEditedCompanyName(e.target.value)}
            DateofJoinOnChange={(e:any)=>setEditedDateofJoin(e.target.value)}
            SalaryBasicOnChange={(e:any)=>setEditedSalaryBasic(e.target.value)}
            AllowanceOnChange={(e:any)=>setEditedAllowance(e.target.value)}
            LocalContactOnChange={(e:any)=>setEditedContact(e.target.value)}

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
            
            {/* <InputDialog open={userEditPrompt} titleIcon={<PenLine/>} title="Edit Record Name" inputplaceholder="Enter New Name" OkButtonText="Update" OkButtonIcon={<TextCursor width={"1rem"}/>} onCancel={()=>setUserEditPrompt(false)} onOk={EditRecordName} inputOnChange={(e:any)=>setEditedName(e.target.value)} updating={loading} disabled={loading} input1Value={name} input2placeholder="Email Address" input2Value={email} input2OnChange={(e:any)=>setEditedEmail(e.target.value)} image={<input type="file" style={{fontSize:"0.8rem"}}/>} input1Label="Enter Name : " input2Label="Enter Email : "/> */}

            {/* DELETE RECORD DIALOG */}
            <DefaultDialog open={userDeletePrompt} titleIcon={<X/>} destructive title="Delete Record?" OkButtonText="Delete" onCancel={()=>setUserDeletePrompt(false)} onOk={deleteRecord} updating={loading} disabled={loading} extra={recordDeleteStatus?
            <div style={{width:"100%"}}>
                <p style={{fontSize:"0.7rem", opacity:0.5}}>{recordDeleteStatus}</p>
            </div>
            
            :null}/>

{/* ////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}


            {/*DISPLAY CIVIL ID DIALOG */}
            <DefaultDialog back close titleIcon={<CreditCard color="dodgerblue"/>} title="Civil ID" open={civil} onCancel={()=>setCivil(false)} OkButtonText="Add" 
            
            title_extra={civil_number?
            
            <div style={{display:"flex", gap:"0.5rem", height:"2.25rem"}}>
            

            {
                moment(civil_expiry, "DD/MM/YYYY").diff(moment(today), 'months')+1<=3?
                <button onClick={()=>{setRenewDocDialog(true)}} className="" style={{fontSize:"0.85rem", width:"6rem", display:"flex", gap:"0.5rem", background:"goldenrod", color:"black"}}>
                    <Sparkles width={"0.85rem"} color="black"/>
                    Renew
                </button>
                :null
            }
            

            <DropDown onDelete={()=>{setCivilDelete(true)}} onEdit={()=>{setEditcivilprompt(true)}} trigger={<EllipsisVerticalIcon width={"1.1rem"}/>} />
            </div>
            
            :null
            } 
            extra={
                <div style={{width:"100%", display:"flex", justifyContent:'center', paddingBottom:"1rem"}}>
                    {
                        !civil_number || loading?
                        <div style={{height:"19ch", width:"32ch", display:"flex"}}>
                            
                            <button onClick={()=>setAddcivil(true)} style={{width:"100%",border:"2px solid rgba(100 100 100/ 50%)"}}>
                            {
                                !loading?
                                <>
                                <Plus width={"1rem"}/>
                                    Add ID
                                </>
                                
                                :
                                <>
                                <LoadingOutlined/>
                                    Generating ID
                                </>
                            }
                            
                            </button>
                        </div>
                        :
                        <div>
                        <CivilID 
                        name={name} 
                        expirydate={new_civil_expiry?new_civil_expiry:civil_expiry} 
                        civilid={new_civil_number?new_civil_number:civil_number} 
                        DOB={civil_DOB}/>
                        {/* <br/>
                        <button style={{width:"100%"}}>Edit</button> */}
                        </div>  
                    }

                    <br/>
                        
                    
                </div>
            }
            />

            {/* ADD CIVIL ID DIALOG */}
            <InputDialog open={addcivil} title="Add Civil ID" titleIcon={<CreditCard/>} inputplaceholder="Civil Number" input2placeholder="Expiry Date" input3placeholder="Date of Birth" OkButtonText="Add" onCancel={()=>setAddcivil(false)} onOk={addCivilID} inputOnChange={(e:any)=>setEditedCivilNumber(e.target.value)} input2OnChange={(e:any)=>setEditedCivilExpiry(e.target.value)} input3OnChange={(e:any)=>setEditedCivilDOB(e.target.value)} updating={loading} disabled={loading}/>


            {/* EDIT CIVIL ID DIALOG */}
            <InputDialog open={editcivilprompt} title="Edit Civil ID" titleIcon={<PenLine/>} OkButtonText="Update" onCancel={()=>{setEditcivilprompt(false);setEditedCivilNumber("");setEditedCivilExpiry(null);setEditedCivilDOB("")}} inputplaceholder="Enter New Civil ID" input2placeholder="Enter Expiry Date" input3placeholder="Enter Date of Birth" inputOnChange={(e:any)=>setEditedCivilNumber(e.target.value)} input2OnChange={(e:any)=>{setEditedCivilExpiry(e.target.value)}} input3OnChange={(e:any)=>setEditedCivilDOB(e.target.value)} onOk={EditCivilID} updating={loading} disabled={loading} input1Value={civil_number} input2Value={civil_expiry} input3Value={civil_DOB} input1Label="Civil Number : " input2Label="Expiry Date : " input3Label="Date of Birth : "/>

            {/* DELETE CIVIL ID DIALOG */}
            <DefaultDialog destructive updating={loading} open={civilDelete} title="Delete Civil ID?" OkButtonText="Delete" onCancel={()=>setCivilDelete(false)} onOk={deleteCivilID} disabled={loading}/>

{/* ////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}

            {/*DISPLAY VEHICLE ID DIALOG */}
            <DefaultDialog close titleIcon={<Car color="violet"/>} title="License" open={vehicle} onCancel={()=>setVehicle(false)} OkButtonText="Add" back

            title_extra=
            {vehicle_number?

                <div style={{display:"flex", gap:"0.5rem", height:"2.25rem"}}>

                {
                    moment(vehicle_expiry, "DD/MM/YYYY").diff(moment(today), 'months')<=2?
                    <button onClick={()=>{setRenewVehicleDialog(true)}} className="" style={{fontSize:"0.85rem", width:"6rem", display:"flex", gap:"0.5rem", background:"goldenrod", color:"black"}}>
                        <Sparkles width={"0.85rem"} color="black" />
                        Renew
                    </button>
                    :null
                }

                {/* <DropDown onDelete={()=>{setVehicleIdDelete(true)}} 
                onEdit={()=>{setEditVehicleIDprompt(true)}} 
                trigger={<EllipsisVerticalIcon width={"1.1rem"}/>} */}

                <DropDown onDelete={()=>{setVehicleIdDelete(true)}} onEdit={()=>{setEditVehicleIDprompt(true)}} trigger={<EllipsisVerticalIcon width={"1.1rem"}/>} />

                </div>
                :null
            }    
                
                 
            extra={
                <div style={{width:"100%", display:"flex", justifyContent:'center', paddingBottom:"1rem"}}>
                    {
                        !vehicle_number || loading?
                        <div style={{height:"19ch", width:"32ch", display:"flex"}}>
                            
                            <button onClick={()=>setAddVehicleID(true)} style={{width:"100%",border:"2px solid rgba(100 100 100/ 50%)"}}>
                            {
                                !loading?
                                <>
                                <Plus width={"1rem"}/>
                                    Add ID
                                </>
                                
                                :
                                <>
                                <LoadingOutlined/>
                                    Generating ID
                                </>
                            }
                            
                            </button>
                        </div>
                        :
                        <div>
                        <VehicleID name={name} expirydate={vehicle_expiry} issuedate={vehicle_issue} reg_no={vehicle_number?vehicle_number:vehicle_number} year={"XXXX"}/>
                        {/* <br/>
                        <button style={{width:"100%"}}>Edit</button> */}
                        </div>  
                    }
                    <br/>         
                </div>
            }/>

            {/* ADD VEHICLE ID DIALOG */}
            <InputDialog open={add_vehicle_id} title="Add License" titleIcon={<Car/>} inputplaceholder="License Number" input2placeholder="Expiry Date" input3placeholder="Issue Date" OkButtonText="Add" 
            onCancel={()=>{
                setAddVehicleID(false)
            }} onOk={addVehicleID} inputOnChange={(e:any)=>setVehicleNumber(e.target.value)} input2OnChange={(e:any)=>setVehicleExpiry(e.target.value)} input3OnChange={(e:any)=>setVehicleIssue(e.target.value)} updating={loading} disabled={loading}/>

            {/* EDIT VEHICLE ID DIALOG */}
            <InputDialog open={edit_vehicle_id_prompt} title="Edit Vehicle ID" titleIcon={<PenLine/>} OkButtonText="Update" onCancel={()=>{setEditVehicleIDprompt(false)}} inputplaceholder="Enter Vehicle Number" input2placeholder="Enter Expiry Date" input3placeholder="Enter Issue Date" inputOnChange={(e:any)=>setEditedVehicleNumber(e.target.value)} input2OnChange={(e:any)=>{setEditedVehicleExpiry(e.target.value)}} input3OnChange={(e:any)=>setEditedVehicleIssue(e.target.value)} onOk={EditVehicleID} updating={loading} disabled={loading} input1Value={vehicle_number} input2Value={vehicle_expiry} input3Value={vehicle_issue} input1Label="License No : " input2Label="Expiry Date" input3Label="Issue Date"/>

            {/* DELETE VEHICLE ID DIALOG */}
            <DefaultDialog updating={loading} open={vehicleIdDelete} title="Delete License?" OkButtonText="Delete" onCancel={()=>setVehicleIdDelete(false)} onOk={deleteVehicleID} disabled={loading} destructive/>

            {/* BULK DELETE DIALOG */}
            <DefaultDialog progressItem={progressItem} progress={progress} destructive updating={loading} title="Delete record(s)?" open={bulkDeleteDialog} OkButtonText="Confirm" onCancel={()=>setBulkDeleteDialog(false)} onOk={handleBulkDelete} disabled={loading}/>

            {/* RENEW CIVIL ID */}
            <InputDialog titleIcon={<Sparkles color="goldenrod" fill="goldenrod"/>} title={"Renew Document"} open={renewDocDialog} onCancel={()=>{setRenewDocDialog(false);setNewExpiry("")}} inputplaceholder="New Expiry" OkButtonText="Renew" inputOnChange={(e:any)=>setNewExpiry(e.target.value)} onOk={RenewID} updating={loading} disabled={loading||newExpiry?false:true} input1Value={civil_expiry} input1Label="New Expiry : " OkButtonIcon={<Sparkles width={"1rem"}/>}/>

            {/* RENEW VEHICLE ID DIALOG */}
            <InputDialog title="Renew Vehicle ID" open={renewVehicleDialog} onCancel={()=>setRenewVehicleDialog(false)} inputplaceholder="New Issue Date" input1Label="New Issue" input2placeholder="New Expiry" input2Label="New Expiry" input1Value={vehicle_issue} input2Value={vehicle_expiry} OkButtonText="Renew" OkButtonIcon={<Sparkles width={"1rem"}/>} disabled={loading} onOk={renewVehicleID} inputOnChange={(e:any)=>setEditedVehicleIssue(e.target.value)} input2OnChange={(e:any)=>setEditedVehicleExpiry(e.target.value)} updating={loading}/>

            {/* TRAINING DIALOG */}
            <DefaultDialog close back open={trainingDialog} onCancel={()=>setTrainingDialog(false)} title={"Training"} titleIcon={<GraduationCap color="lightgreen"/>} 
            extra={
                <div style={{width:"100%", display:"flex", flexFlow:"column", gap:"0.5rem"}}>
                    <Directive icon={<img src="/vale-logo.png" style={{width:"1.25rem", paddingBottom:"0.25rem"}}/>} title="Vale Training" onClick={()=>{setValeTrainingDialog(true)}}/>
                    <Directive icon={<Globe width={"1rem"} color="grey"/>} title="Other"/>
                </div>
            }/>

            {/* <DefaultDialog close back titleIcon={<HeartPulse color="tomato"/>} title={"Medical"} open={healthDialog} onCancel={()=>setHealthDialog(false)} extra={
                <div>

                </div>
            }/> */}


            {/* MEDICAL ID DIALOG */}
            <DefaultDialog close titleIcon={<HeartPulse color="tomato"/>} title="Medical ID" open={healthDialog} onCancel={()=>setHealthDialog(false)} back

            title_extra=
            {medical_completed_on?

                <div style={{display:"flex", gap:"0.5rem", height:"2.25rem"}}>

                {
                    moment(medical_due_on, "DD/MM/YYYY").diff(moment(today), 'months')<=2?
                    <button onClick={()=>{setRenewMedicalIDdialog(true)}} className="" style={{fontSize:"0.85rem", width:"6rem", display:"flex", gap:"0.5rem", background:"goldenrod", color:"black"}}>
                        <Sparkles width={"0.85rem"} color="black" />
                        Renew
                    </button>
                    :null
                }

                {/* <DropDown onDelete={()=>{setVehicleIdDelete(true)}} 
                onEdit={()=>{setEditVehicleIDprompt(true)}} 
                trigger={<EllipsisVerticalIcon width={"1.1rem"}/>} */}

                <DropDown onDelete={()=>{setDeleteMedicalIDdialog(true)}} onEdit={()=>{setEditMedicalIDdialog(true)}} trigger={<EllipsisVerticalIcon width={"1.1rem"}/>} />

                </div>
                :null
            }    
                
                
            extra={
                <div style={{width:"100%", display:"flex", justifyContent:'center', paddingBottom:"1rem"}}>
                    {
                        !medical_completed_on || loading?
                        <div style={{height:"19ch", width:"32ch", display:"flex"}}>
                            
                            <button onClick={()=>setMedicalIDdialog(true)} style={{width:"100%",border:"2px solid rgba(100 100 100/ 50%)"}}>
                            {
                                !loading?
                                <>
                                <Plus width={"1rem"}/>
                                    Add ID
                                </>
                                
                                :
                                <>
                                <LoadingOutlined/>
                                    Generating ID
                                </>
                            }
                            
                            </button>
                        </div>
                        :
                        <div>
                        <MedicalID name={name} completedOn={medical_completed_on} dueOn={medical_due_on}/>
                        {/* <br/>
                        <button style={{width:"100%"}}>Edit</button> */}
                        </div>  
                    }
                    <br/>         
                </div>
            }/>

            {/* ADD MEDICAL ID DIALOG */}
            <InputDialog open={MedicalIDdialog} OkButtonText="Add" onCancel={()=>setMedicalIDdialog(false)} title="Add Medical ID" titleIcon={<HeartPulse color="tomato"/>} inputplaceholder="Completed On" input2placeholder="Due On" inputOnChange={(e:any)=>setCompletedOn(e.target.value)} input2OnChange={(e:any)=>setDueOn(e.target.value)} onOk={addMedicalID} updating={loading}/>
             
            {/* EDIT MEDICAl ID DIALOG */}
            <InputDialog open={editMedicalIDdialog} title="Edit Medical ID" titleIcon={<PenLine/>} OkButtonText="Update" onCancel={()=>{setEditMedicalIDdialog(false)}} inputplaceholder="Completed On" input2placeholder="Due on" inputOnChange={(e:any)=>setEditedCompletedOn(e.target.value)} input2OnChange={(e:any)=>{setEditedDueOn(e.target.value)}} onOk={EditMedicalID} updating={loading} disabled={loading} input1Value={medical_completed_on} input2Value={medical_due_on} input3Value={vehicle_issue} input1Label="Completed : " input2Label="Due On : "/>

            {/* DELETE MEDICAL ID */}
            <DefaultDialog title={"Delete Medical ID?"} destructive OkButtonText="Delete" open={deleteMedicalIDdialog} onCancel={()=>setDeleteMedicalIDdialog(false)} updating={loading} disabled={loading} onOk={deleteMedicalID}/>

            {/* RENEW MEDICAL ID DIALOG */}
            <InputDialog titleIcon={<Sparkles color="goldenrod"/>} title="Renew Medical ID" open={renewMedicalIDdialog} onCancel={()=>setRenewMedicalIDdialog(false)} inputplaceholder="Completed On" input1Label="Completed : " input2placeholder="New Due" input2Label="New Due : " OkButtonIcon={<Sparkles width={"1rem"}/>} OkButtonText="Renew" input1Value={medical_completed_on} input2Value={medical_due_on} onOk={renewMedicalID} updating={loading} inputOnChange={(e:any)=>setEditedCompletedOn(e.target.value)} input2OnChange={(e:any)=>setEditedDueOn(e.target.value)} disabled={loading}/>
            
            {/* VALE TRAINING DIALOG */}
            <DefaultDialog open={valeTrainingDialog} titleIcon={<img src="/vale-logo.png" style={{width:"1.75rem", paddingBottom:"0.5rem"}}/>} title={"Vale Training"} onCancel={()=>setValeTrainingDialog(false)} close back title_extra={
                <>
                {/* <button style={{fontSize:"0.8rem"}}><Plus color="dodgerblue"/></button> */}
                </>
            } extra={
                <div className="recipients" style={{width:"100%", display:"flex", flexFlow:"column", gap:"0.45rem", maxHeight:"17.5rem", overflowY:"auto", paddingRight:"0.5rem", minHeight:"2.25rem"}}>

                    <Directive tag={vt_hse_induction}  icon={<Disc color="dodgerblue"/>} title="HSE Induction" onClick={()=>{setTrainingAddDialogTitle("HSE Induction");setTrainingAddDialog(true); setTrainingType("hse_induction"); setTrainingAddDialogInputValue(vt_hse_induction)}} 
                    status={
                        moment(vt_hse_induction, "DD/MM/YYYY").diff(moment(today), 'months')<=3?
                        false
                        :true
                    }
                    />

                    <Directive tag={vt_car_1}  icon={<Disc color="dodgerblue"/>} title="CAR - 1" onClick={()=>{setTrainingAddDialogTitle("CAR - 1"); setTrainingAddDialog(true); setTrainingType("car_1"); setTrainingAddDialogInputValue(vt_car_1)}}
                    status={
                        moment(vt_car_1, "DD/MM/YYYY").diff(moment(today), 'months')<=3?
                        false
                        :true
                    }
                    />

                    <Directive tag={vt_car_2}  icon={<Disc color="dodgerblue" />} title="CAR - 2" onClick={()=>{setTrainingAddDialogTitle("CAR - 2"); setTrainingAddDialog(true); setTrainingType("car_2"); setTrainingAddDialogInputValue(vt_car_2)}}
                    status={
                        moment(vt_car_2, "DD/MM/YYYY").diff(moment(today), 'months')<=3?
                        false
                        :true
                    }
                    />

                    <Directive tag={vt_car_3}  icon={<Disc color="dodgerblue" />} title="CAR - 3" onClick={()=>{setTrainingAddDialogTitle("CAR - 3"); setTrainingAddDialog(true); setTrainingType("car_3"); setTrainingAddDialogInputValue(vt_car_3)}}
                    status={
                        moment(vt_car_3, "DD/MM/YYYY").diff(moment(today), 'months')<=3?
                        false
                        :true
                    }
                    />

                    <Directive tag={vt_car_4}  icon={<Disc color="dodgerblue" />} title="CAR - 4" onClick={()=>{setTrainingAddDialogTitle("CAR - 4"); setTrainingAddDialog(true); setTrainingType("car_4"); setTrainingAddDialogInputValue(vt_car_4)}}
                    status={
                        moment(vt_car_4, "DD/MM/YYYY").diff(moment(today), 'months')<=3?
                        false
                        :true
                    }
                    />

                    <Directive tag={vt_car_5}  icon={<Disc color="dodgerblue" />} title="CAR - 5" onClick={()=>{setTrainingAddDialogTitle("CAR - 5"); setTrainingAddDialog(true); setTrainingType("car_5"); setTrainingAddDialogInputValue(vt_car_5)}}
                    status={
                        moment(vt_car_5, "DD/MM/YYYY").diff(moment(today), 'months')<=3?
                        false
                        :true
                    }
                    />

                    <Directive tag={vt_car_6}  icon={<Disc color="dodgerblue" />} title="CAR - 6" onClick={()=>{setTrainingAddDialogTitle("CAR - 6"); setTrainingAddDialog(true); setTrainingType("car_6"); setTrainingAddDialogInputValue(vt_car_6)}}
                    status={
                        moment(vt_car_6, "DD/MM/YYYY").diff(moment(today), 'months')<=3?
                        false
                        :true
                    }
                    />

                    <Directive tag={vt_car_7}  icon={<Disc color="dodgerblue" />} title="CAR - 7" onClick={()=>{setTrainingAddDialogTitle("CAR - 7"); setTrainingAddDialog(true); setTrainingType("car_7"); setTrainingAddDialogInputValue(vt_car_7)}}
                    status={
                        moment(vt_car_7, "DD/MM/YYYY").diff(moment(today), 'months')<=3?
                        false
                        :true
                    }
                    />

                    <Directive tag={vt_car_8}  icon={<Disc color="dodgerblue" />} title="CAR - 8" onClick={()=>{setTrainingAddDialogTitle("CAR - 8"); setTrainingAddDialog(true); setTrainingType("car_8"); setTrainingAddDialogInputValue(vt_car_8)}}
                    status={
                        moment(vt_car_8, "DD/MM/YYYY").diff(moment(today), 'months')<=3?
                        false
                        :true
                    }
                    />

                    <Directive tag={vt_car_9}  icon={<Disc color="dodgerblue" />} title="CAR - 9" onClick={()=>{setTrainingAddDialogTitle("CAR - 9"); setTrainingAddDialog(true); setTrainingType("car_9"); setTrainingAddDialogInputValue(vt_car_9)}}
                    status={
                        moment(vt_car_9, "DD/MM/YYYY").diff(moment(today), 'months')<=3?
                        false
                        :true
                    }
                    />

                    <Directive tag={vt_car_10}  icon={<Disc color="dodgerblue" />} title="CAR - 10" onClick={()=>{setTrainingAddDialogTitle("CAR - 10"); setTrainingAddDialog(true); setTrainingType("car_10"); setTrainingAddDialogInputValue(vt_car_10)}}
                    status={
                        moment(vt_car_10, "DD/MM/YYYY").diff(moment(today), 'months')<=3?
                        false
                        :true
                    }
                    />

                </div> 
            }/>

            <DefaultDialog close titleIcon={<Book color="goldenrod"/>} title="Passport" open={passportDialog} onCancel={()=>setPassportDialog(false)} back

            title_extra=
            {passportExpiry?

                <div style={{display:"flex", gap:"0.5rem", height:"2.25rem"}}>

                {
                    moment(passportExpiry, "DD/MM/YYYY").diff(moment(today), 'months')<=6 && !loading?
                    <button onClick={()=>{setRenewPassportDialog(true)}} className="" style={{fontSize:"0.85rem", width:"6rem", display:"flex", gap:"0.5rem", background:"goldenrod", color:"black"}}>
                        <Sparkles width={"0.85rem"} color="black" />
                        Renew
                    </button>
                    :null
                }

                {/* <DropDown onDelete={()=>{setVehicleIdDelete(true)}} 
                onEdit={()=>{setEditVehicleIDprompt(true)}} 
                trigger={<EllipsisVerticalIcon width={"1.1rem"}/>} */}

                <DropDown onDelete={()=>{setDeletePassportDialog(true)}} onEdit={()=>{setEditPassportDialog(true)}} trigger={<EllipsisVerticalIcon width={"1.1rem"}/>} />

                </div>
                :null
            }    
                
                
            extra={
                <div style={{width:"100%", display:"flex", justifyContent:'center', paddingBottom:"1rem"}}>
                    {
                        !passportID || loading?
                        <div style={{height:"19ch", width:"32ch", display:"flex"}}>
                            
                            <button onClick={()=>setAddPassportDialog(true)} style={{width:"100%",border:"2px solid rgba(100 100 100/ 50%)"}}>
                            {
                                !loading?
                                <>
                                <Plus width={"1rem"}/>
                                    Add Passport
                                </>
                                
                                :
                                <>
                                <LoadingOutlined/>
                                    Generating Passport
                                </>
                            }
                            
                            </button>
                        </div>
                        :
                        <div>
                        <Passport nativePhone={nativePhone} name={name} passport_id={passportID} issue={passportIssue} nativeAddress={nativeAddress} expiry={passportExpiry}/>
                        {/* <br/>
                        <button style={{width:"100%"}}>Edit</button> */}
                        </div>  
                    }
                    <br/>         
                </div>
            }/>

            {/* ADD PASSPORT ID DIALOG */}
            <InputDialog open={addPassportDialog} OkButtonText="Add" onCancel={()=>setAddPassportDialog(false)} title="Add Passport" titleIcon={<Book color="goldenrod"/>} inputplaceholder="Passport ID" input2placeholder="Issue Date" input3placeholder="Expiry Date" inputOnChange={(e:any)=>setPassportID(e.target.value)} input2OnChange={(e:any)=>setPassportIssue(e.target.value)} input3OnChange={(e:any)=>setPassportExpiry(e.target.value)} input4placeholder="Native Phone ( with Country code )" input5placeholder="Native Address" input4OnChange={(e:any)=>setNativePhone(e.target.value)} input5OnChange={(e:any)=>setNativeAddress(e.target.value)} onOk={addPassport} updating={loading}/>

             
            {/* EDIT PASSPORT DIALOG */}
            <InputDialog open={editPassportDialog} title="Edit Passport" titleIcon={<PenLine/>} OkButtonText="Update" onCancel={()=>{setEditPassportDialog(false)}} inputplaceholder="Passport ID" input2placeholder="Issue Date" input3placeholder="Expiry Date" inputOnChange={(e:any)=>setEditedPassportID(e.target.value)} input2OnChange={(e:any)=>{setEditedPassportIssue(e.target.value)}} input3OnChange={(e:any)=>setEditedPassportExpiry(e.target.value)} onOk={EditPassport} updating={loading} disabled={loading} input1Value={passportID} input2Value={passportIssue} input3Value={passportExpiry} input1Label="Passport ID : " input2Label="Issue Date : " input3Label="Expiry Date" input4placeholder="Native Phone Number" input4Label="Native Phone : " input4Value={nativePhone} input5placeholder="Native Address" input5Label="Address : " input5Value={nativeAddress} input4OnChange={(e:any)=>setEditedNativePhone(e.target.value)} input5OnChange={(e:any)=>setEditedNativeAddress(e.target.value)}/>

            <DefaultDialog title={"Delete Passport?"} destructive OkButtonText="Delete" open={DeletePassportDialog} onCancel={()=>setDeletePassportDialog(false)} updating={loading} disabled={loading} onOk={deletePassport}/>

            {/* RENEW PASSPORT DIALOG */}
            <InputDialog titleIcon={<Sparkles color="goldenrod"/>} title="Renew Passport" open={renewPassportDialog} onCancel={()=>setRenewPassportDialog(false)} inputplaceholder="New Issue Date" input1Label="New Issue : " input2placeholder="New Expiry" input2Label="New Expiry : " OkButtonIcon={<Sparkles width={"1rem"}/>} OkButtonText="Renew" input1Value={passportIssue} input2Value={passportExpiry} onOk={renewPassport} updating={loading} inputOnChange={(e:any)=>setEditedPassportIssue(e.target.value)} input2OnChange={(e:any)=>setEditedPassportExpiry(e.target.value)} disabled={loading}/>

            <InputDialog open={trainingAddDialog} onOk={()=>{addTraining(trainingType)}} onCancel={()=>{setTrainingAddDialog(false);setEditedTrainingAddDialogInput("")}} title={trainingAddDialogTitle} inputplaceholder="Expiry Date" OkButtonText="Update" inputOnChange={(e:any)=>setEditedTrainingAddDialogInput(e.target.value)} OkButtonIcon={<RefreshCcw width={"1rem"}/>} updating={loading} disabled={loading||!EditedTrainingAddDialogInput?true:false} input1Value={trainingAddDialogInputValue}/>

            <DefaultDialog created_on={initialSalary} code={name} codeIcon={<User width={"0.8rem"} color="dodgerblue"/>} close title={"Initial Salary"} titleIcon={<CircleDollarSign />} open={salaryDialog} onCancel={()=>setSalaryDialog(false)}
            title_extra={<button onClick={fetchSalary} style={{width:"3rem", height:"2.5rem"}}>{fetchingSalary?<LoadingOutlined color="dodgerblue"/>:<RefreshCcw width={"1rem"} color="dodgerblue"/>}</button>}
            extra={
                <>
                <div style={{display:"flex", border:"", width:"100%", borderRadius:"0.5rem", padding:"0.5rem", background:"", flexFlow:"column"}}>
                    
                    <div style={{border:"", display:"flex", alignItems:'center', justifyContent:"center"}}>

                        <div style={{border:''}}>

                            <p style={{fontSize:"0.8rem", opacity:0.5, justifyContent:"", display:'flex'}}>Current Earnings</p>
                            <div style={{display:"flex", border:"", gap:"0.5rem", justifyContent:"center", fontWeight:600, fontSize:"1.5rem", alignItems:"center"}}>
                                <p style={{fontWeight:400, fontSize:"1rem"}}>OMR</p>
                                <p>{salaryBasic}</p>
                                
                            </div>
                            <div style={{border:'',display:'flex',justifyContent:"center", textAlign:"center"}}>
                                <p style={{opacity:0.5}}>{((salaryBasic - initialSalary)/ initialSalary)+"%"}</p>
                                {
                                    Math.sign((salaryBasic - initialSalary)/ initialSalary)==-1?
                                    <ArrowDown strokeWidth={"3px"} width={"1rem"} color="lightcoral"/>
                                    :
                                    ((salaryBasic - initialSalary)/ initialSalary)==0?
                                    ""
                                    :
                                    <ArrowUp strokeWidth={"3px"} width={"1rem"} color="lightgreen"/>

                                }
                                
                            </div>
                        
                        </div>

                        

                        {/* <div>
                            <p style={{fontSize:"0.8rem", opacity:0.5}}>Total Increment</p>
                            <p style={{fontWeight:600, border:'', textAlign:"right", fontSize:"1.5rem"}}>{leaves}</p>
                        </div> */}
                    
                    </div>

                    {/* <div style={{border:"", height:"3rem", paddingTop:"", marginTop:"1.5rem"}}>
                    <LineCharter lineColor="lightgreen"/>
                    </div> */}
                    
                
                    
                </div>

                {salaryList.length==0?
                    <div style={{width:"100%", border:"3px dashed rgba(100 100 100/ 50%)", height:"2.5rem",borderRadius:"0.5rem", marginBottom:"1rem"}}></div>
                    :
                    <div className="recipients" style={{width:"100%", display:"flex", flexFlow:"column", gap:"0.35rem", maxHeight:"11.25rem", overflowY:"auto", paddingRight:"0.5rem", minHeight:"2.25rem", marginBottom:"1rem"}}>
                        {
                        salaryList.map((e:any)=>(
                            <motion.div key={e.id} initial={{opacity:0}} whileInView={{opacity:1}}>
                            <Directive status={true} 
                            tag={
                                moment(e.created_on.toDate()).format("LL")
                            } 
                            title={"OMR "+e.salary} titleSize="0.75rem" key={e.id} icon={<MinusSquareIcon onClick={()=>{setDeleteSalaryDialog(true);setSalaryID(e.id)}}  className="animate-pulse" color="lightgreen" width={"1.1rem"}/>} noArrow/>
                            </motion.div>
                        ))
                        }
                    </div>
                }

                <div style={{display:"flex", gap:"0.5rem", width:"100%", zIndex:""}}>
                    <input type="search" id="input-1" value={newSalary==0?"":newSalary} onChange={(e:any)=>setNewSalary(e.target.value)} placeholder="New Salary" style={{flex:1.5}}/>
                    <button onClick={addNewSalary} style={{fontSize:"0.8rem", flex:0.15}}>
                        {
                            loading?
                            <LoadingOutlined/>
                            :
                            <div style={{display:"flex", gap:"0.5rem", alignItems:"center"}}>
                                <Plus width={"1.25rem"} color="lightgreen"/>
                            </div>
                            
                        }
                        
                    </button>
                </div>
                
                
                </>
                
                } 
            />
            

            {/* LEAVE LOG DIALOG */}
            <DefaultDialog code={name} codeTooltip="Employee Name" codeIcon={<User color="dodgerblue" width={"0.8rem"}/>} close open={leaveLog} onCancel={()=>setLeaveLog(false)} title={"Leave Log"}
            title_extra={
                <button onClick={fetchLeave} style={{width:"3rem", height:"2.5rem"}}>
                {
                    fetchingLeave?
                    <LoadingOutlined style={{color:"dodgerblue"}}/>
                    :
                    <RefreshCcw color="dodgerblue" width={"1rem"}/>
                }
                
            </button>
            }
            extra={
                <>
                <div style={{display:"flex", border:"", width:"100%", borderRadius:"0.5rem", padding:"0.5rem", background:"", flexFlow:"column"}}>
                    
                    <div style={{border:"", display:"flex", alignItems:'center', justifyContent:"space-between"}}>

                        <div style={{border:''}}>
                            <p style={{fontSize:"0.8rem", opacity:0.5, justifyContent:"", display:'flex'}}>Block Period</p>
                            <div style={{display:"flex", border:"", gap:"0.5rem", justifyContent:"center", fontWeight:600}}>
                                <p>11/12/2024</p>-<p>13/12/2026</p>
                            </div>
                        
                        </div>

                        <div>
                            <p style={{fontSize:"0.8rem", opacity:0.5}}>Total Leaves</p>
                            <p style={{fontWeight:600, border:'', textAlign:"right", fontSize:"1.5rem"}}>{leaves}</p>
                        </div>
                    
                    </div>

                    {/* <div style={{border:"", height:"3rem", paddingTop:"", marginTop:"1.5rem"}}>
                    <LineCharter/>
                    
                    </div> */}
                    
                
                    
                </div>

                {leaveList.length==0?
                    <div style={{width:"100%", border:"3px dashed rgba(100 100 100/ 50%)", height:"2.5rem",borderRadius:"0.5rem", marginBottom:"1rem"}}></div>
                    :
                    <div className="recipients" style={{width:"100%", display:"flex", flexFlow:"column", gap:"0.35rem", maxHeight:"11.25rem", overflowY:"auto", paddingRight:"0.5rem", minHeight:"2.25rem", marginBottom:"1rem"}}>
                        {
                        leaveList.map((e:any)=>(
                            <motion.div key={e.id} initial={{opacity:0}} whileInView={{opacity:1}}>
                            <Directive tagOnClick={()=>{setLeaveReview(true);setLeaveFrom(e.leaveFrom);setLeaveID(e.id)}} status={true} tag={e.pending?"Pending":e.days+" Days"} title={e.leaveFrom+" - "+e.leaveTill} titleSize="0.75rem" key={e.id} icon={<MinusSquareIcon onClick={()=>{setDeleteLeaveDialog(true);setLeaveID(e.id)}}  className="animate-pulse" color="dodgerblue" width={"1.1rem"}/>} noArrow/>
                            </motion.div>
                        ))
                    }
                    </div>}

                <div style={{display:"flex", gap:"0.5rem", width:"100%", zIndex:""}}>
                    <input type="search" id="input-1" value={editedLeaveFrom} onChange={(e:any)=>setEditedLeaveFrom(e.target.value)} placeholder="From" style={{flex:1.5}}/>

                    <input type="search" id="input-2" value={editedLeaveTill} onChange={(e:any)=>setEditedLeaveTill(e.target.value)} placeholder="Till" style={{flex:1.5}}/>
                    <button onClick={addLeave} style={{fontSize:"0.8rem", flex:0.45}}>
                        {
                            loading?
                            <LoadingOutlined/>
                            :
                            <div style={{display:"flex", gap:"0.5rem", alignItems:"center"}}>
                                <Plus width={"1.25rem"} color="#8884d8"/>
                            </div>
                            
                        }
                        
                    </button>
                </div>
                
                
                </>
                
                }/>

                <InputDialog title={"Leave Review"} open={leaveReview} onCancel={()=>setLeaveReview(false)}
                inputplaceholder="Leave From"
                input1Value={leaveFrom}
                input2Value={leaveTill}
                inputOnChange={(e:any)=>setLeaveFrom(e.target.value)}
                input2placeholder="Leave Till"
                input2OnChange={(e:any)=>setLeaveTill(e.target.value)}
                OkButtonText="Update"
                OkButtonIcon={<RefreshCcw width={"1rem"}/>}
                updating={loading}
                disabled={loading}
                onOk={updateLeave}
                />

                <DefaultDialog open={deleteLeaveDialog} title={"Delete Leave?"} destructive OkButtonText="Delete" updating={loading} disabled={loading} onCancel={()=>setDeleteLeaveDialog(false)} onOk={deleteLeave} extra={<p style={{fontSize:"0.75rem", textAlign:"left", width:"100%", marginLeft:"1rem", opacity:0.5}}></p>}/>

                {/* <DefaultDialog code={name} codeIcon={<User color="dodgerblue" width={"0.8rem"}/>} title={"Allowance"} close open={allowanceDialog} onCancel={()=>setAllowanceDialog(false)}
                extra={
                    <div style={{display:"flex", border:"", width:"100%", borderRadius:"0.5rem", padding:"0.5rem", background:"", flexFlow:"column"}}>


                <p style={{fontSize:"0.8rem", opacity:0.5, justifyContent:"center", display:'flex'}}>Current Allowance</p>
                    <div style={{display:"flex", border:"", gap:"0.5rem", justifyContent:"center", fontWeight:600}}>
                    <p>OMR {allowance}</p>
                    </div>

                    <div style={{border:"", height:"3rem", paddingTop:"", marginTop:"1.5rem", width:"100%"}}>
                        <LineCharter lineColor="salmon"/>
                    </div>
                </div>
                }
                /> */}

            </div>

            <DefaultDialog destructive open={deleteSalaryDialog} onCancel={()=>setDeleteSalaryDialog(false)} title={"Delete Salary?"} updating={loading} disabled={loading} onOk={deleteSalary} OkButtonText="Delete" extra={<p style={{width:"100%", textAlign:"left", paddingLeft:"1rem", fontSize:"0.75rem", opacity:0.5}}>{salaryID}</p>}/>

            <DefaultDialog destructive open={deleteAllowanceDialog} onCancel={()=>setDeleteAllowanceDialog(false)} title={"Delete Allowance?"} updating={loading} disabled={loading} onOk={deleteAllowance} OkButtonText="Delete" extra={<p style={{width:"100%", textAlign:"left", paddingLeft:"1rem", fontSize:"0.75rem", opacity:0.5}}>{salaryID}</p>}/>


            <DefaultDialog created_on={initialAllowance} code={name} codeIcon={<User width={"0.8rem"} color="dodgerblue"/>} close title={"Initial Allowance"} open={allowanceDialog} onCancel={()=>setAllowanceDialog(false)}
            title_extra={<button onClick={fetchAllowance} style={{width:"3rem", height:"2.5rem"}}>{fetchingAllowance?<LoadingOutlined color="dodgerblue"/>:<RefreshCcw width={"1rem"} color="dodgerblue"/>}</button>}
            extra={
                <>
                <div style={{display:"flex", border:"", width:"100%", borderRadius:"0.5rem", padding:"0.5rem", background:"", flexFlow:"column"}}>
                    
                    <div style={{border:"", display:"flex", alignItems:'center', justifyContent:"center"}}>

                        <div style={{border:''}}>
                            <p style={{fontSize:"0.8rem", opacity:0.5, justifyContent:"", display:'flex'}}>Current Allowance</p>
                            <div style={{display:"flex", border:"", gap:"0.5rem", justifyContent:"center", fontWeight:600, fontSize:"1.5rem", alignItems:"center"}}>
                                <p style={{fontWeight:400, fontSize:"1rem"}}>OMR</p>
                                {allowance}
                            </div>
                            <div style={{border:'',display:'flex',justifyContent:"center", textAlign:"center"}}>
                                <p style={{opacity:0.5}}>{((allowance - initialAllowance)/ initialAllowance)+"%"}</p>
                                {
                                    Math.sign((allowance - initialAllowance)/ initialAllowance)==-1?
                                    <ArrowDown strokeWidth={"3px"} width={"1rem"} color="lightcoral"/>
                                    :
                                    ((allowance - initialAllowance)/ initialAllowance)==0?
                                    ""
                                    :
                                    <ArrowUp strokeWidth={"3px"} width={"1rem"} color="lightgreen"/>

                                }
                                
                            </div>
                        
                        </div>

                        {/* <div>
                            <p style={{fontSize:"0.8rem", opacity:0.5}}>Total Increment</p>
                            <p style={{fontWeight:600, border:'', textAlign:"right", fontSize:"1.5rem"}}>{leaves}</p>
                        </div> */}
                    
                    </div>

                    {/* <div style={{border:"", height:"3rem", paddingTop:"", marginTop:"1.5rem"}}>
                    <LineCharter lineColor="salmon"/>
                    </div> */}
                    
                
                    
                </div>

                {allowanceList.length==0?
                    <div style={{width:"100%", border:"3px dashed rgba(100 100 100/ 50%)", height:"2.5rem",borderRadius:"0.5rem", marginBottom:"1rem"}}></div>
                    :
                    <div className="recipients" style={{width:"100%", display:"flex", flexFlow:"column", gap:"0.35rem", maxHeight:"11.25rem", overflowY:"auto", paddingRight:"0.5rem", minHeight:"2.25rem", marginBottom:"1rem"}}>
                        {
                        allowanceList.map((e:any)=>(
                            <motion.div key={e.id} initial={{opacity:0}} whileInView={{opacity:1}}>
                            <Directive status={true} 
                            tag={
                                moment(e.created_on.toDate()).format("LL")
                            } 
                            title={"OMR "+e.allowance} titleSize="0.75rem" key={e.id} icon={<MinusSquareIcon onClick={()=>{setDeleteAllowanceDialog(true);setAllowanceID(e.id)}}  className="animate-pulse" color="salmon" width={"1.1rem"}/>} noArrow/>
                            </motion.div>
                        ))
                    }
                    </div>}

                <div style={{display:"flex", gap:"0.5rem", width:"100%", zIndex:""}}>
                    <input type="search" id="input-1" value={newAllowance==0?"":newAllowance} onChange={(e:any)=>setNewAllowance(e.target.value)} placeholder="New Allowance" style={{flex:1.5}}/>
                    <button onClick={addNewAllowance} style={{fontSize:"0.8rem", flex:0.15}}>
                        {
                            loading?
                            <LoadingOutlined/>
                            :
                            <div style={{display:"flex", gap:"0.5rem", alignItems:"center"}}>
                                <Plus width={"1.25rem"} color="salmon"/>
                            </div>
                            
                        }
                        
                    </button>
                </div>
                
                
                </>
                
                } 
            />
            
    
        </>
    )
}