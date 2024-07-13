import AddRecordButton from "@/components/add-record-button"
import Back from "@/components/back"
import CivilID from "@/components/civil-id"
import Directive from "@/components/directive"
import DropDown from "@/components/dropdown"
import FileInput from "@/components/file-input"
import InputDialog from "@/components/input-dialog"
import MedicalID from "@/components/medical-id"
import Passport from "@/components/passport"
import SearchBar from "@/components/search-bar"
import DefaultDialog from "@/components/ui/default-dialog"
import VehicleID from "@/components/vehicle-id"
import { db } from "@/firebase"
import { LoadingOutlined } from '@ant-design/icons'
import emailjs from '@emailjs/browser'
import { message } from 'antd'
import { Timestamp, addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore'
import { motion } from 'framer-motion'
import { Book, Car, CheckSquare2, Cloud, CloudUpload, CreditCard, Disc, EllipsisVerticalIcon, FilePlus, Globe, GraduationCap, HeartPulse, InboxIcon, MailCheck, PackageOpen, PenLine, Plus, RadioTower, RefreshCcw, Sparkles, TextCursor, Trash, UserCircle, X } from "lucide-react"
import moment from 'moment'
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import ReactTimeAgo from 'react-time-ago'
import useKeyboardShortcut from 'use-keyboard-shortcut'



type Record = {
    id:string,
    name:string
}

// Running Notes
// Check whether expiry date minus 3 is equals to today - 3 month reminder

interface Props{
    onUpdate?:any
}


export default function ValeRecords(props:Props){

    const usenavigate = useNavigate()
    // BASIC PAGE VARIABLES
    // const [pageLoad, setPageLoad] = useState(false)
    const [records, setRecords] = useState<any>([])
    const [name, setName] = useState("")
    const [id, setID] = useState("")
    const [recordSummary, setRecordSummary] = useState(false)
    const [civil, setCivil] = useState(false)
    const [vehicle, setVehicle] = useState(false)
    const [addcivil, setAddcivil] = useState(false)
    const [modified_on, setModifiedOn] = useState<any>()
    const [loading, setLoading] = useState(false)
    const [addButtonModeSwap, setAddButtonModeSwap] = useState(false)
    const [deleteMedicalIDdialog, setDeleteMedicalIDdialog] = useState(false)
    const [email, setEmail] = useState("")
    const [editedEmail, setEditedEmail] = useState("")
    const [editedName, setEditedName] = useState("")

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
    const [vehicle_year, setVehicleYear] = useState("")

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
    const [trainingAddDialogInput, setTrainingAddDialogInput] = useState("")

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
    const [selectAll, setSelectAll] = useState(false)
    const [renewVehicleDialog, setRenewVehicleDialog] = useState(false)

    const [newExpiry, setNewExpiry] = useState<any>()

    // MAILJS VARIABLES
    const serviceId = "service_lunn2bp";
    const templateId = "template_1y0oq9l";

    const today = new Date()


    const [progressItem, setProgressItem] = useState("")
    const [trainingDialog, setTrainingDialog] = useState(false)
    const [healthDialog, setHealthDialog] = useState(false)
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

        console.log(trainingAddDialogInput)
    },[])
    
    
    const {flushHeldKeys} = useKeyboardShortcut(
        ["Control", "A"],
        () => {
            
            setAddDialog(!addDialog)
            setName("")
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


    //INITIAL DATA FETCH ON PAGE LOAD
    const fetchData = async (type?:any) => {
        
        try {
            
            setfetchingData(true)
            const RecordCollection = collection(db, "records")
            const recordQuery = query(RecordCollection, orderBy("created_on"), where("type", "==", "vale"))
            const querySnapshot = await getDocs(recordQuery)
            const fetchedData: Array<Record> = [];

            querySnapshot.forEach((doc:any)=>{
                fetchedData.push({id: doc.id, ...doc.data()} as Record)
            })


            setfetchingData(false)
            setRecords(fetchedData)
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

{/* ////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}

const RenewID = async () => {
    setLoading(true)
    await updateDoc(doc(db, "records", id),{civil_expiry:TimeStamper(newExpiry), modified_on:Timestamp.fromDate(new Date())})
    setCivilExpiry(newExpiry)
    setLoading(false)
    setRenewDocDialog(false)
    fetchData()
    setNewExpiry("")
    setModifiedOn(new Date())
}

    // FUNCTION TO ADD A RECORD
    const addRecord = async () => {
        setLoading(true)
        await addDoc(collection(db, "records"), {name:editedName?editedName:name, email:editedEmail?editedEmail:email==""?"":email, created_on:Timestamp.fromDate(new Date()), modified_on:Timestamp.fromDate(new Date()), type:"vale", notify:true, civil_number:"", civil_expiry:"", civil_DOB:"", vehicle_make:"", vehicle_issue:"", vehicle_expiry:"", medical_completed_on:"", medical_due_on:"", passportID:"", passportIssue:"", passportExpiry:""})
        setAddDialog(false)
        setName(editedName?editedName:name)
        setEmail(editedEmail?editedEmail:email)
        setLoading(false)
        fetchData()
        setModifiedOn(new Date())
    }

    // FUNCTION TO EDIT RECORD
    const EditRecordName = async () => {
        setLoading(true)
        await updateDoc(doc(db, "records", id), {name:editedName?editedName:name, email:editedEmail?editedEmail:email, modified_on:Timestamp.fromDate(new Date)})
        setUserEditPrompt(false)
        setName(editedName?editedName:name)
        setEmail(editedEmail?editedEmail:email)
        setLoading(false)
        fetchData()
        setModifiedOn(new Date())
    }

    // FUNCTION TO DELETE RECORD
    const deleteRecord = async () => {
        setLoading(true)
        await deleteDoc(doc(db, "records", id))
        setCivilNumber("")
        setCivilNumber("")
        setCivilExpiry("")
        setCivilDOB("")
        setName("")
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
            await updateDoc(doc(db, "records", id),{civil_number:edited_civil_number, 
                civil_expiry:edited_civil_expiry?TimeStamper(edited_civil_expiry):"", civil_DOB:edited_civil_DOB, modified_on:Timestamp.fromDate(new Date)})
            setCivilNumber(edited_civil_number)
            setCivilExpiry(edited_civil_expiry)
            setCivilDOB(edited_civil_DOB)
            setLoading(false)
            fetchData()
            setModifiedOn(new Date())
            props.onUpdate
            
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
        await updateDoc(doc(db, "records", id),{civil_number:"", civil_expiry:"", civil_DOB:"", modified_on:Timestamp.fromDate(new Date)})
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
            await updateDoc(doc(db, "records", id),{civil_number:edited_civil_number?edited_civil_number:civil_number, civil_expiry:edited_civil_expiry?TimeStamper(edited_civil_expiry):TimeStamper(civil_expiry), civil_DOB:edited_civil_DOB?edited_civil_DOB:civil_DOB, modified_on:Timestamp.fromDate(new Date)})
            
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
            await updateDoc(doc(db, "records", id),{vehicle_number:vehicle_number, 
            vehicle_expiry:TimeStamper(vehicle_expiry), vehicle_issue:vehicle_issue, vehicle_year:vehicle_year, modified_on:Timestamp.fromDate(new Date)})

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
            setVehicleYear("")
            setLoading(false)
            message.info("ID generation failed "+String(error))
        }
        
    }

    // FUNCTION TO DELETE A VEHICLE ID
    const deleteVehicleID = async () => {
        setLoading(true)
        await updateDoc(doc(db, "records", id),{vehicle_number:"", vehicle_expiry:"", vehicle_issue:"", modified_on:Timestamp.fromDate(new Date)})
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
        await updateDoc(doc(db, "records", id),{medical_completed_on:"", medical_due_on:"", modified_on:Timestamp.fromDate(new Date)})
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
            
            await updateDoc(doc(db, "records", id),{vehicle_number:edited_vehicle_number?edited_vehicle_number:vehicle_number, vehicle_expiry:edited_vehicle_expiry?TimeStamper(edited_vehicle_expiry):TimeStamper(vehicle_expiry), vehicle_issue:edited_vehicle_issue?edited_vehicle_issue:vehicle_issue, modified_on:Timestamp.fromDate(new Date)})

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

            await updateDoc(doc(db, "records", id),{vehicle_issue:edited_vehicle_issue, vehicle_expiry:edited_vehicle_expiry?TimeStamper(edited_vehicle_expiry):TimeStamper(vehicle_expiry), modified_on:Timestamp.fromDate(new Date)})
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
            await updateDoc(doc(db, "records", id),{medical_completed_on:medical_completed_on, 
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
            await updateDoc(doc(db, 'records', id),{medical_completed_on:editedCompletedOn?editedCompletedOn:medical_completed_on, medical_due_on:editedDueOn?TimeStamper(editedDueOn):TimeStamper(medical_due_on), modified_on:Timestamp.fromDate(new Date)})

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
            await updateDoc(doc(db, 'records', id),{passportID:editedPassportID?editedPassportID:passportID, passportIssue:editedPassportIssue?editedPassportIssue:passportIssue, passportExpiry:editedPassportExpiry?TimeStamper(editedPassportExpiry):TimeStamper(passportExpiry), modified_on:Timestamp.fromDate(new Date)})
            setPassportID(editedPassportID?editedPassportID:passportID)
            setPassportIssue(editedPassportIssue?editedPassportIssue:passportIssue)
            setPassportExpiry(editedPassportExpiry?editedPassportExpiry:passportExpiry)
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

            await updateDoc(doc(db, "records", id),{medical_completed_on:editedCompletedOn?editedCompletedOn:medical_completed_on, medical_due_on:editedDueOn?TimeStamper(editedDueOn):TimeStamper(medical_due_on), modified_on:Timestamp.fromDate(new Date)})

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
            await updateDoc(doc(db, "records", id),{passportID:passportID, 
            passportIssue:passportIssue, passportExpiry:TimeStamper(passportExpiry), modified_on:Timestamp.fromDate(new Date)})
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
        await updateDoc(doc(db, "records", id),{passportID:"", passportExpiry:"", passportIssue:"", modified_on:Timestamp.fromDate(new Date)})
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
        await updateDoc(doc(db, "records", id),{passportExpiry:TimeStamper(editedPassportExpiry?editedPassportExpiry:passportExpiry), passportIssue:editedPassportIssue?editedPassportIssue:passportIssue, modified_on:Timestamp.fromDate(new Date)
            
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
            
            await checked.forEach(async (item:any) => {
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

    

    return(
        <>
        {
            status=="false"?
            <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
            <div style={{display:"flex", width:"100%", background:"crimson", height:"1.5rem", justifyContent:"center", alignItems:"center", position:"fixed", bottom:0, margin:"0"}}>

                <div style={{display:"flex", gap:"0.5rem", alignItems:"center"}}>
                    <RadioTower width={"0.75rem"}/>
                    <p style={{fontSize:"0.75rem"}}>No Internet</p>
                </div>
            
            </div>
            </motion.div>
            :null
        }
        

        {/* Main Container */}
        <div style={{padding:"1.25rem", height:"100svh", border:""}}>


            {/* Main Component */}
            <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>

            <div>

            </div>
                {/* BACK BUTTON */}
                <Back title={"Vale"+
                
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


                            <button onClick={()=>usenavigate("/inbox")} style={{ width:"3rem", background:"rgba(220 20 60/ 20%)"}}>
                        <InboxIcon className="" color="crimson"/>
                    </button>

                            
            
                    </div>
                    :
                    <div 
                    className="transitions" 
                    onClick={()=>{
                        setSelectAll(!selectAll)
                        !selectAll?
                        setSelected(true)
                        :setSelected(false)
                        !selectAll?
                        records.forEach((item:any)=>{
                            setChecked((data:any)=>[...data,item.id])
                        
                        })
                        :setChecked([])
                        }} 
                    style={{height:"2.75rem", border:"", width:"7.5rem", background:selectAll?"dodgerblue":"rgba(100 100 100/ 20%)", padding:"0.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", paddingLeft:"1rem", paddingRight:"1rem", borderRadius:"0.5rem", cursor:"pointer"}}>
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
                            
                            <Cloud color="dodgerblue" width={"3rem"} height={"3rem"} style={{position:"absolute"}} className="animate-ping"/>
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
                    <div style={{display:"flex", gap:"0.75rem", border:"", flex:1}}>

                        <button className={selectable?"blue":""} onClick={()=>{setSelectable(!selectable);setAddButtonModeSwap(!addButtonModeSwap);selectable && setChecked([]); !selectable && setSelected(false)}}>

                                <CheckSquare2 color={selectable?"white":"dodgerblue"}/>

                        </button>

                        <SearchBar placeholder="Search Records" onChange={(e:any)=>{setSearch(e.target.value.toLowerCase())}}/>
                    </div>
                     

                    <p style={{height:"0.25rem"}}/>
                
                <div className="record-list" style={{display:"flex", gap:"0.6rem", flexFlow:"column", overflowY:"auto", height:"72svh", paddingTop:"0.25rem", paddingRight:"0.5rem"}}>
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
                                
                                tag={

                                    post.civil_expiry != "" || post.vehicle_expiry != "" || post.medical_due_on != "" || post.passportID != ""?

                                    
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
                                    setID(post.id);
                                    setCivilNumber(post.civil_number);
                                    setCivilExpiry(post.civil_expiry?moment((post.civil_expiry).toDate()).format("DD/MM/YYYY"):null);
                                    setCivilDOB(post.civil_DOB)
                                    setCompletedOn(post.medical_completed_on)
                                    setDueOn(post.medical_due_on?moment((post.medical_due_on).toDate()).format("DD/MM/YYYY"):null)
                                    setVehicleNumber(post.vehicle_number)
                                    setVehicleExpiry(post.vehicle_expiry?moment((post.vehicle_expiry).toDate()).format("DD/MM/YYYY"):"")
                                    setVehicleIssue(post.vehicle_issue)
                                    setModifiedOn(post.modified_on?moment((post.modified_on).toDate()):"")
                                    setPassportID(post.passportID)
                                    setPassportIssue(post.passportIssue)
                                    setPassportExpiry(post.passportExpiry?moment((post.passportExpiry).toDate()).format("DD/MM/YYYY"):null)
                                    setEmail(post.email)
                    
                                    
                                }}                        

                            key={post.id} title={post.name} icon={<UserCircle color="dodgerblue" />} />
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
            <AddRecordButton title={addButtonModeSwap?"Delete Record(s)":"Add Record"} onClickSwap={addButtonModeSwap} onClick={()=>{setAddDialog(true); setName("")}} alternateOnClick={()=>{checked.length<1?null:setBulkDeleteDialog(true)}}
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

            {/* DISPLAY RECORD DIALOG */}
            <DefaultDialog titleIcon={<UserCircle/>} title={name} subtitle={email} open={recordSummary} onCancel={()=>{setRecordSummary(false);setEmail("")}} 
            bigDate={()=>message.info("Last Modified : "+String(moment(new Date(modified_on)).format("LLL")))}
            created_on={
    
                <ReactTimeAgo date={moment(modified_on, "DD/MM/YYYY").toDate()} timeStyle={ "twitter"} locale="en-us"/>
                    
            } 
            title_extra={
            <DropDown onDelete={()=>setUserDeletePrompt(true)} onEdit={()=>setUserEditPrompt(true)} trigger={<EllipsisVerticalIcon width={"1.1rem"}/>}/>
            }
            close extra={
                <div style={{border:"", width:"100%", display:"flex", flexFlow:"column", gap:"0.5rem", paddingBottom:"1rem", paddingTop:"1rem"}}>
                    
                    <Directive onClick={()=>setCivil(true)} icon={<CreditCard color="dodgerblue"/>} title="Civil ID" tag={civil_expiry} 
                    status={
                        moment(civil_expiry, "DD/MM/YYYY").diff(moment(today), 'months')<=3?
                        false:true
                    }/>

                    <Directive tag={vehicle_expiry} onClick={()=>setVehicle(true)} icon={<Car color="violet"/>} title="Vehicle" 
                    status={
                        moment(vehicle_expiry, "DD/MM/YYYY").diff(moment(today), 'months')<=3?
                        false
                        :true
                    }/>
                    <Directive tag={medical_due_on} onClick={()=>setHealthDialog(true)} icon={<HeartPulse color="tomato"/>} title="Medical" status={
                        moment(medical_due_on, "DD/MM/YYYY").diff(moment(today),'months')<=3?
                        false:true
                    }/>

                    <Directive tag={passportExpiry} onClick={()=>setPassportDialog(true)} icon={<Book color="goldenrod"/>} title="Passport" status={
                        moment(passportExpiry, "DD/MM/YYYY").diff(moment(today),'months')<=6?
                        false:true
                    }/>

                    <Directive onClick={()=>{setTrainingDialog(true)}} icon={<GraduationCap color="lightgreen"/>} title="Training"/>
                    
                </div>
            
            }/>

            {/* ADD RECORD DIALOG */}
            <InputDialog open={addDialog} OkButtonIcon={<Plus width={"1rem"}/>} titleIcon={<FilePlus/>} title="Add Record" OkButtonText="Add" onCancel={()=>setAddDialog(false)} onOk={addRecord} inputOnChange={(e:any)=>{setEditedName(e.target.value)} } inputplaceholder="Enter Full Name" disabled={loading||!editedName?true:false} updating={loading} input2placeholder="Enter Email" input2OnChange={(e:any)=>setEditedEmail(e.target.value)}/>

           


            {/* EDIT RECORD DIALOG */}
            <InputDialog open={userEditPrompt} titleIcon={<PenLine/>} title="Edit Record Name" inputplaceholder="Enter New Name" OkButtonText="Update" OkButtonIcon={<TextCursor width={"1rem"}/>} onCancel={()=>setUserEditPrompt(false)} onOk={EditRecordName} inputOnChange={(e:any)=>setEditedName(e.target.value)} updating={loading} disabled={loading} input1Value={name} input2placeholder="Email Address" input2Value={email} input2OnChange={(e:any)=>setEditedEmail(e.target.value)}/>

            {/* DELETE RECORD DIALOG */}
            <DefaultDialog open={userDeletePrompt} titleIcon={<X/>} destructive title="Delete Record?" OkButtonText="Delete" onCancel={()=>setUserDeletePrompt(false)} onOk={deleteRecord} updating={loading} disabled={loading}/>

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
            } extra={
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
            <DefaultDialog close titleIcon={<Car color="violet"/>} title="Vehicle ID" open={vehicle} onCancel={()=>setVehicle(false)} OkButtonText="Add" back

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
            <InputDialog open={add_vehicle_id} title="Add Vehicle ID" titleIcon={<Car/>} inputplaceholder="Vehicle Number" input2placeholder="Expiry Date" input3placeholder="Issue Date" OkButtonText="Add" 
            onCancel={()=>{
                setAddVehicleID(false)
            }} onOk={addVehicleID} inputOnChange={(e:any)=>setVehicleNumber(e.target.value)} input2OnChange={(e:any)=>setVehicleExpiry(e.target.value)} input3OnChange={(e:any)=>setVehicleIssue(e.target.value)} updating={loading} disabled={loading}/>

            {/* EDIT VEHICLE ID DIALOG */}
            <InputDialog open={edit_vehicle_id_prompt} title="Edit Vehicle ID" titleIcon={<PenLine/>} OkButtonText="Update" onCancel={()=>{setEditVehicleIDprompt(false)}} inputplaceholder="Enter Vehicle Number" input2placeholder="Enter Expiry Date" input3placeholder="Enter Issue Date" inputOnChange={(e:any)=>setEditedVehicleNumber(e.target.value)} input2OnChange={(e:any)=>{setEditedVehicleExpiry(e.target.value)}} input3OnChange={(e:any)=>setEditedVehicleIssue(e.target.value)} onOk={EditVehicleID} updating={loading} disabled={loading} input1Value={vehicle_number} input2Value={vehicle_expiry} input3Value={vehicle_issue} input1Label="Vehicle No : " input2Label="Expiry Date" input3Label="Issue Date"/>

            {/* DELETE VEHICLE ID DIALOG */}
            <DefaultDialog updating={loading} open={vehicleIdDelete} title="Delete Vehicle ID?" OkButtonText="Delete" onCancel={()=>setVehicleIdDelete(false)} onOk={deleteVehicleID} disabled={loading} destructive/>

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
            <DefaultDialog open={valeTrainingDialog} titleIcon={<img src="/vale-logo.png" style={{width:"1.75rem", paddingBottom:"0.5rem"}}/>} title={"Vale Training"} onCancel={()=>setValeTrainingDialog(false)} close back extra={
                <div className="recipients" style={{width:"100%", display:"flex", flexFlow:"column", gap:"0.45rem", maxHeight:"12.75rem", overflowY:"auto", paddingRight:"0.5rem", minHeight:"2.25rem"}}>
                    <Directive extra onClick={()=>{setTrainingAddDialogTitle("HSE Induction");setTrainingAddDialog(true)}} tag={"11/12/2024"} status icon={<Disc color="dodgerblue"/>} title="HSE Induction"/>
                    <Directive tag={"10/12/2024"} status={true} extra icon={<Disc color="dodgerblue"/>} title="CAR - 1"/>
                    <Directive extra icon={<Disc color="dodgerblue" />} title="CAR - 2"/>
                    <Directive extra icon={<Disc color="dodgerblue" />} title="CAR - 3"/>
                    <Directive extra icon={<Disc color="dodgerblue" />} title="CAR - 4"/>
                    <Directive extra icon={<Disc color="dodgerblue" />} title="CAR - 5"/>
                    <Directive extra icon={<Disc color="dodgerblue" />} title="CAR - 6"/>
                    <Directive extra icon={<Disc color="dodgerblue" />} title="CAR - 7"/>
                    <Directive extra icon={<Disc color="dodgerblue" />} title="CAR - 8"/>
                    <Directive extra icon={<Disc color="dodgerblue" />} title="CAR - 9"/>
                    <Directive extra icon={<Disc color="dodgerblue" />} title="CAR - 10"/>
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
                        <Passport name={name} passport_id={passportID} issue={passportIssue} expiry={passportExpiry}/>
                        {/* <br/>
                        <button style={{width:"100%"}}>Edit</button> */}
                        </div>  
                    }
                    <br/>         
                </div>
            }/>

            {/* ADD PASSPORT ID DIALOG */}
            <InputDialog open={addPassportDialog} OkButtonText="Add" onCancel={()=>setAddPassportDialog(false)} title="Add Passport" titleIcon={<Book color="goldenrod"/>} inputplaceholder="Passport ID" input2placeholder="Issue Date" input3placeholder="Expiry Date" inputOnChange={(e:any)=>setPassportID(e.target.value)} input2OnChange={(e:any)=>setPassportIssue(e.target.value)} input3OnChange={(e:any)=>setPassportExpiry(e.target.value)} onOk={addPassport} updating={loading}/>

             
            {/* EDIT PASSPORT DIALOG */}
            <InputDialog open={editPassportDialog} title="Edit Passport" titleIcon={<PenLine/>} OkButtonText="Update" onCancel={()=>{setEditPassportDialog(false)}} inputplaceholder="Passport ID" input2placeholder="Issue Date" input3placeholder="Expiry Date" inputOnChange={(e:any)=>setEditedPassportID(e.target.value)} input2OnChange={(e:any)=>{setEditedPassportIssue(e.target.value)}} input3OnChange={(e:any)=>setEditedPassportExpiry(e.target.value)} onOk={EditPassport} updating={loading} disabled={loading} input1Value={passportID} input2Value={passportIssue} input3Value={passportExpiry} input1Label="Passport ID : " input2Label="Issue Date : " input3Label="Expiry Date" />

            <DefaultDialog title={"Delete Passport?"} destructive OkButtonText="Delete" open={DeletePassportDialog} onCancel={()=>setDeletePassportDialog(false)} updating={loading} disabled={loading} onOk={deletePassport}/>

            {/* RENEW PASSPORT DIALOG */}
            <InputDialog titleIcon={<Sparkles color="goldenrod"/>} title="Renew Passport" open={renewPassportDialog} onCancel={()=>setRenewPassportDialog(false)} inputplaceholder="New Issue Date" input1Label="New Issue : " input2placeholder="New Expiry" input2Label="New Expiry : " OkButtonIcon={<Sparkles width={"1rem"}/>} OkButtonText="Renew" input1Value={passportIssue} input2Value={passportExpiry} onOk={renewPassport} updating={loading} inputOnChange={(e:any)=>setEditedPassportIssue(e.target.value)} input2OnChange={(e:any)=>setEditedPassportExpiry(e.target.value)} disabled={loading}/>

            <InputDialog open={trainingAddDialog} onCancel={()=>{setTrainingAddDialog(false);setTrainingAddDialogInput("")}} title={trainingAddDialogTitle} inputplaceholder="Expiry Date" OkButtonText="Add" inputOnChange={(e:any)=>setTrainingAddDialogInput(e.target.value)} OkButtonIcon={<Plus width={"1rem"}/>}/>

            </div>
            
    
        </>
    )
}