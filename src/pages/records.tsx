import AddDialog from "@/components/add-dialog"
import AddRecordButton from "@/components/add-record-button"
import Back from "@/components/back"
import CivilID from "@/components/civil-id"
import Directive from "@/components/directive"
import DropDown from "@/components/dropdown"
import FileInput from "@/components/file-input"
import SearchBar from "@/components/search-bar"
import DefaultDialog from "@/components/ui/default-dialog"
import VehicleID from "@/components/vehicle-id"
import { db } from "@/firebase"
import { LoadingOutlined } from '@ant-design/icons'
import emailjs from '@emailjs/browser'
import { message } from 'antd'
import { Timestamp, addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore'
import { motion } from 'framer-motion'
import TimeAgo from 'javascript-time-ago'
import { BellRing, Book, Car, CheckSquare2, CloudUpload, CreditCard, EllipsisVerticalIcon, FilePlus, GraduationCap, HeartPulse, LucideMails, MailCheck, PackageOpen, PenLine, Plus, RefreshCcw, Sparkles, TextCursor, Trash, UserCircle, X } from "lucide-react"
import moment from 'moment'
import { useEffect, useState } from "react"
import ReactTimeAgo from 'react-time-ago'
import useKeyboardShortcut from 'use-keyboard-shortcut'

import en from 'javascript-time-ago/locale/en'

TimeAgo.addDefaultLocale(en)

type Record = {
    id:string,
    name:string
}

// Running Notes
// Check whether expiry date minus 3 is equals to today - 3 month reminder

interface Props{
    onUpdate?:any
}


export default function Records(props:Props){


    // BASIC PAGE VARIABLES
    // const [pageLoad, setPageLoad] = useState(false)
    const [records, setRecords] = useState<any>([])
    const [name, setName] = useState("")
    const [id, setID] = useState("")
    const [recordSummary, setRecordSummary] = useState(false)
    const [civil, setCivil] = useState(false)
    const [vehicle, setVehicle] = useState(false)
    const [addcivil, setAddcivil] = useState(false)
    const [created_on, setCreatedOn] = useState("")
    const [loading, setLoading] = useState(false)
    const [addButtonModeSwap, setAddButtonModeSwap] = useState(false)

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

    const [edited_vehicle_make, setEditedVehicleMake] = useState("")
    const [edited_vehicle_issue, setEditedVehicleIssue] = useState("")
    const [edited_vehicle_expiry, setEditedVehicleExpiry] = useState("")
    

    //MAIL CONFIG VARIABLES
    const [addDialog, setAddDialog] = useState(false)
    const [userDeletePrompt, setUserDeletePrompt] = useState(false)
    const [userEditPrompt, setUserEditPrompt] = useState(false)
    const [editcivilprompt, setEditcivilprompt] = useState(false)

    //MAIL CONFIG VALUES
    const [mailconfigdialog, setMailConfigDialog] = useState(false)
    const [recipient, setRecipient] = useState("")
    const [testmessage, setTestMessage] = useState("")

    //VEHICLE ID VARIABLES
    const [vehicle_make, setVehicleMake] = useState("")
    const [vehicle_issue, setVehicleIssue] = useState("")
    const [vehicle_expiry, setVehicleExpiry] = useState<any>()

    const [vehicleIdDelete, setVehicleIdDelete] = useState(false)
    const [edit_vehicle_id_prompt, setEditVehicleIDprompt] = useState(false)

    const [add_vehicle_id, setAddVehicleID] = useState(false)

    const [excel_upload_dialog, setExcelUploadDialog] = useState(false)

    const [selectable, setSelectable] = useState(false)
    const [search, setSearch] = useState("")

    const [checked, setChecked] = useState<any>([])
    const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false)

    const [recipientsDialog, setRecipientsDialog] = useState(false)

    const [progress, setProgress] = useState("")

    const [selected, setSelected] = useState(false)
    const [fetchingData, setfetchingData] = useState(false)
    const [status, setStatus] = useState("")

    // MAILJS VARIABLES
    const serviceId = "service_lunn2bp";
    const templateId = "template_1y0oq9l";

    const today = new Date()

{/* //////////////////////////////////////////////////////////////////////////////////////////////////////////////*/}

    
    // useEffect(()=>{
    //     document.addEventListener("keydown", detectKeyDown, true)
    // },[])

    // const detectKeyDown = (e:any) => {
    //     console.log(e.key)
    //     e.key == "Enter"?
    //     setAddDialog(true)
    //     :null
    // }
    
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


    

    // useEffect(()=>{
    //     console.log(checked.length)
    // },[checked])

    // useEffect(()=>{
    //     console.log(moment(civil_expiry, "DD/MM/YYYY").diff(moment(today), 'months')+1)
    // },[civil_expiry])


    //INITIAL DATA FETCH ON PAGE LOAD
    const fetchData = async () => {
        
        try {
            
            setfetchingData(true)
            const RecordCollection = collection(db, "records")
            const recordQuery = query(RecordCollection, orderBy("created_on"))
            const querySnapshot = await getDocs(recordQuery)
            const fetchedData: Array<Record> = [];

            querySnapshot.forEach((doc:any)=>{
                fetchedData.push({id: doc.id, ...doc.data()} as Record)
            })
           
            setfetchingData(false)
            setRecords(fetchedData)
            setChecked([])
            setSelectable(false)
            
        } catch (error) {
            console.log(error)
            message.info(String(error))
        }   
    }

{/* ////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}

    // FUNCTION TO ADD A RECORD
    const addRecord = async () => {
        setLoading(true)
        await addDoc(collection(db, "records"), {name:name, created_on:Timestamp.fromDate(today), civil_number:"", civil_expiry:"", civil_DOB:"", vehicle_make:"", vehicle_issue:"", vehicle_expiry:""})
        setAddDialog(false)
        setLoading(false)
        fetchData()
    }

    // FUNCTION TO EDIT RECORD
    const EditRecordName = async () => {
        setLoading(true)
        await updateDoc(doc(db, "records", id), {name:name})
        setUserEditPrompt(false)
        setLoading(false)
        fetchData()
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
        window.location.reload()
    }

{/* ////////////////////////////////////////////////////////////////////////////////////////////////////////////// */} 


    // FUNCTION TO ADD A CIVIL ID
    const addCivilID = async () => {
        setAddcivil(false)
        setLoading(true)
        try {
            await updateDoc(doc(db, "records", id),{civil_number:civil_number, 
                civil_expiry:TimeStamper(civil_expiry), civil_DOB:civil_DOB})
            
            setLoading(false)
            fetchData()
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
        await updateDoc(doc(db, "records", id),{civil_number:"", civil_expiry:"", civil_DOB:""})
        setCivilDelete(false)
        setLoading(false)
        setCivilNumber("")
        setCivilNumber("")
        setCivilExpiry("")
        setCivilDOB("")
        setNewCivilExpiry("")
        setNewCivilNumber("")
        fetchData()
    }

    // FUNCTION TO EDIT A CIVIL ID
    const EditCivilID = async () => {
        setLoading(true)
        try {
            await updateDoc(doc(db, "records", id),{civil_number:edited_civil_number?edited_civil_number:civil_number, civil_expiry:edited_civil_expiry?TimeStamper(edited_civil_expiry):TimeStamper(civil_expiry), civil_DOB:edited_civil_DOB?edited_civil_DOB:civil_DOB})
            
            setCivilNumber(edited_civil_number?edited_civil_number:civil_number)
            setCivilExpiry(edited_civil_expiry?edited_civil_expiry:civil_expiry)
            setCivilDOB(edited_civil_DOB?edited_civil_DOB:civil_DOB)

            setEditcivilprompt(false)
            setLoading(false)
            fetchData()

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
            await updateDoc(doc(db, "records", id),{vehicle_make:vehicle_make, 
            vehicle_expiry:TimeStamper(vehicle_expiry), vehicle_issue:vehicle_issue})

            setLoading(false)
            fetchData()
            
            
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

    // FUNCTION TO DELETE A CIVIL ID
    const deleteVehicleID = async () => {
        setLoading(true)
        await updateDoc(doc(db, "records", id),{vehicle_make:"", vehicle_expiry:"", vehicle_issue:""})
        setVehicleIdDelete(false)
        setLoading(false)
        setVehicleMake("")
        setVehicleExpiry("")
        setVehicleIssue("")
        fetchData()
    } 

    //FUNCTION TO EDIT VEHICLE ID
    const EditVehicleID = async () => {
        setLoading(true)
        try {
            
            await updateDoc(doc(db, "records", id),{vehicle_make:edited_vehicle_make?edited_vehicle_make:vehicle_make, vehicle_expiry:edited_vehicle_expiry?TimeStamper(edited_vehicle_expiry):TimeStamper(vehicle_expiry), vehicle_issue:edited_vehicle_issue?edited_civil_DOB:vehicle_issue})

            setVehicleMake(edited_vehicle_make?edited_vehicle_make:vehicle_make)
            setVehicleExpiry(edited_vehicle_expiry?edited_vehicle_expiry:vehicle_expiry)
            setVehicleIssue(edited_vehicle_issue?edited_vehicle_issue:vehicle_issue)

            setEditVehicleIDprompt(false)
            setLoading(false)
            fetchData()

        } catch (error) {
            console.log(error)  
            setLoading(false)   
            message.info(String(error))
        }
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

        {/* Main Container */}
        <div style={{margin:"1.25rem"}}>


            {/* Main Component */}
            <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>

            <div>

            </div>
                {/* BACK BUTTON */}
                <Back title={"Records"+
                
                " ("+records.length+")"} 
                extra={
                    !selectable?
                    <div style={{display:"flex", gap:"0.5rem", height:"2.5rem"}}>
                        
                        {/* <button style={{paddingLeft:"1rem", paddingRight:"1rem"}} onClick={()=>{setExcelUploadDialog(true)}}><Upload width={"1rem"} color="dodgerblue"/></button> */}
                    
                        <button style={{paddingLeft:"1rem", paddingRight:"1rem"}} onClick={()=>setMailConfigDialog(true)}>
                        {
                            loading?
                            <LoadingOutlined color="dodgerblue"/>
                            :
                            <BellRing width="1.1rem" color="dodgerblue"/>
                            
                        }
                        </button>
                        

                    
                        
            

                        
                        
                        <button className="transitions" style={{paddingLeft:"1rem", paddingRight:"1rem", width:"3rem"}} onClick={fetchData} >

                            {
                                fetchingData?
                                <>
                                <LoadingOutlined style={{color:"dodgerblue"}} width={"1.5rem"}/>
                                {/* <p style={{fontSize:"0.8rem", opacity:0.5}}>Updating</p> */}
                                </>
                                
                                :
                                <RefreshCcw width="1.1rem" color="dodgerblue"/>
                            }
                            

                            </button>
            
                    </div>
                    :
                    <div style={{height:"2.25rem", border:"", width:"7.5rem", background:"rgba(100 100 100/ 20%)", padding:"0.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", paddingLeft:"1rem", paddingRight:"1rem", borderRadius:"0.5rem"}}>
                        <p style={{opacity:0.75}}>Selected</p>
                        <p style={{color:"dodgerblue", fontWeight:600}}>{checked.length}</p>
                    </div>
                    }
                />
                <br/>

                {// if page doesn't load : 

                


                // IF NUMBER OF RECORDS IS LESS THAN 1
                records.length<1?

                status=="false"?
                <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                    <div style={{width:"100%",height:"55svh", display:"flex", justifyContent:"center", alignItems:"center", border:"", flexFlow:"column"}}>

                        <div style={{display:"flex", gap:"0.25rem", opacity:"0.5"}}>
                            <PackageOpen width={"1rem"}/>
                            <p>No Internet Connection</p>
                            
                        </div>
                        <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                        <p style={{opacity:0.5, fontSize:"0.7rem"}}>Add a record using + Add Record</p>
                        </motion.div>


                    </div>
                </motion.div>
                :

                fetchingData?
                <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                    <div style={{width:"100%",height:"55svh", display:"flex", justifyContent:"center", alignItems:"center", border:""}}>

                        {/* <div style={{display:"flex", gap:"0.5rem", opacity:"0.5", border:""}}>
                            <p style={{fontSize:"0.75rem"}} className="animate-ping">Fetching Data</p>
                        </div> */}

                        <div className="loader"></div>


                    </div>
                </motion.div>
                
                :

                // DISPLAY EMPTY SET - PAGE
                <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                    <div style={{width:"100%",height:"55svh", display:"flex", justifyContent:"center", alignItems:"center", border:"", flexFlow:"column"}}>

                        <div style={{display:"flex", gap:"0.25rem", opacity:"0.5"}}>
                            <PackageOpen width={"1rem"}/>
                            <p>No Data</p>
                            
                        </div>
                        <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                        <p style={{opacity:0.5, fontSize:"0.7rem"}}>Add a record using + Add Record</p>
                        </motion.div>


                    </div>
                </motion.div>


                : //else


                //DISPLAY Page Beginning
                <div style={{display:"flex", flexFlow:"column", gap:"0.5rem", marginTop:"1"}}>

                    {/* Searchbar */}
                    <div style={{display:"flex", gap:"0.5rem", border:"", flex:1}}>

                        <button className={selectable?"blue":""} onClick={()=>{setSelectable(!selectable);setAddButtonModeSwap(!addButtonModeSwap);selectable && setChecked([]); !selectable && setSelected(false)
                            //  selectable && fetchData()
                             }}><CheckSquare2 color={selectable?"white":"dodgerblue"}/></button>

                        <SearchBar placeholder="Search Records" onChange={(e:any)=>{setSearch(e.target.value.toLowerCase())}}/>
                    </div>
                     

                    <p style={{height:"0.25rem"}}/>
                
                <div className="record-list" style={{display:"flex", gap:"0.6rem", flexFlow:"column", overflowY:"auto", height:"55svh", paddingRight:"0.5rem", paddingTop:"0.25rem"}}>
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

                                    post.civil_expiry != "" || post.vehicle_expiry != ""?

                                    Math.round(moment(new Date(post.civil_expiry)).diff(moment(), 'months'))<=2
                                    ||
                                    Math.round(moment(new Date(post.vehicle_expiry)).diff(moment(), 'months'))<=2
                                    ?
                                    "Expiring"
                                    :"Available"

                                    

                                    :"No Data"
                                    
                                    
                                    
                                    // Math.round(moment(new Date(post.civil_expiry)).diff(moment(today), 'months'))+1<=3
                                    // ||
                                    // Math.round(moment(new Date(post.vehicle_expiry)).diff(moment(today), 'months'))+1<=3?
                                    // "Expiring"
                                    // :""


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

                                    setVehicleMake(post.vehicle_make)
                                    setVehicleExpiry(post.vehicle_expiry?moment((post.vehicle_expiry).toDate()).format("DD/MM/YYYY"):"")
                                    setVehicleIssue(post.vehicle_issue)

                                    setCreatedOn(post.created_on?moment((post.created_on).toDate()).format("DD/MM/YYYY"):"")
                    
                                    
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
                icon={addButtonModeSwap?<Trash color="dodgerblue" width="1rem"/>:<Plus color="crimson" width="1rem"/>}/>


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
            <DefaultDialog titleIcon={<MailCheck/>} title="Mail Configuration" open={mailconfigdialog} onCancel={()=>setMailConfigDialog(false)} onOk={TestMail} updating={loading} OkButtonText="Send Test Mail" extra={
                <div style={{display:"flex", border:"", width:"100%", flexFlow:"column", gap:"0.5rem"}}>
                    <input placeholder="Enter E-Mail Address" onChange={(e)=>setRecipient(e.target.value)}/>
                    <textarea onChange={(e:any)=>setTestMessage(e.target.value)} placeholder="Message..." rows={4}/>
                {/* <Button variant={"ghost"} style={{flex:1}} onClick={()=>{setRecipientsDialog(true)}}>
                    <Plus style={{width:"1rem"}} color="dodgerblue"/>
                    Add Recipient
                </Button> */}
                </div>
                
                }/>


            <DefaultDialog titleIcon={<LucideMails/>} title="Recipients" open={recipientsDialog} onCancel={()=>setRecipientsDialog(false)} close/> 

{/* ////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}

            {/* DISPLAY RECORD DIALOG */}
            <DefaultDialog titleIcon={<UserCircle/>} title={name} open={recordSummary} onCancel={()=>setRecordSummary(false)} 
            created_on={
    
                <ReactTimeAgo date={moment(created_on, "DD/MM/YYYY").toDate()} locale="en" timeStyle={"twitter"}/>
                    
            } 
            title_extra={
            <DropDown onDelete={()=>setUserDeletePrompt(true)} onEdit={()=>setUserEditPrompt(true)} trigger={<EllipsisVerticalIcon width={"1.1rem"}/>}/>
            }
            close extra={
                <div style={{border:"", width:"100%", display:"flex", flexFlow:"column", gap:"0.5rem", paddingBottom:"1rem", paddingTop:"1rem"}}>
                    
                    <Directive onClick={()=>setCivil(true)} icon={<CreditCard color="dodgerblue"/>} title="Civil ID" tag={civil_expiry} 
                    status={
                        moment(civil_expiry, "DD/MM/YYYY").diff(moment(today), 'months')+1<=3?
                        false:true
                    }/>

                    <Directive tag={vehicle_expiry} onClick={()=>setVehicle(true)} icon={<Car color="violet"/>} title="Vehicle" 
                    status={
                        moment(vehicle_expiry, "DD/MM/YYYY").diff(moment(today), 'months')+1<=3?
                        false
                        :true
                    }/>
                    <Directive icon={<HeartPulse color="tomato"/>} title="Medical"/>
                    <Directive icon={<GraduationCap color="lightgreen"/>} title="Training"/>
                    <Directive icon={<Book color="goldenrod"/>} title="Passport"/>
                    
                </div>
            
            }/>

            {/* ADD RECORD DIALOG */}
            <AddDialog open={addDialog} OkButtonIcon={<Plus width={"1rem"}/>} titleIcon={<FilePlus/>} title="Add Record" OkButtonText="Add" onCancel={()=>setAddDialog(false)} onOk={addRecord} inputOnChange={(e:any)=>{setName(e.target.value)} } inputplaceholder="Enter Name" disabled={loading||!name?true:false} updating={loading}/>


            {/* EDIT RECORD DIALOG */}
            <AddDialog open={userEditPrompt} titleIcon={<PenLine/>} title="Edit Record Name" inputplaceholder="Enter New Name" OkButtonText="Rename" OkButtonIcon={<TextCursor width={"1rem"}/>} onCancel={()=>setUserEditPrompt(false)} onOk={EditRecordName} inputOnChange={(e:any)=>setName(e.target.value)} updating={loading} disabled={loading} input1Value={name}/>

            {/* DELETE RECORD DIALOG */}
            <DefaultDialog open={userDeletePrompt} titleIcon={<X/>} destructive title="Delete Record?" OkButtonText="Delete" onCancel={()=>setUserDeletePrompt(false)} onOk={deleteRecord} updating={loading} disabled={loading}/>

{/* ////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}


            {/*DISPLAY CIVIL ID DIALOG */}
            <DefaultDialog back close titleIcon={<CreditCard color="dodgerblue"/>} title="Civil ID" open={civil} onCancel={()=>setCivil(false)} OkButtonText="Add" 
            
            title_extra={civil_number?
            
            <div style={{display:"flex", gap:"0.5rem", height:"2.25rem"}}>
            

            {
                moment(civil_expiry, "DD/MM/YYYY").diff(moment(today), 'months')+1<=3?
                <button className="" style={{fontSize:"0.85rem", width:"6rem", display:"flex", gap:"0.5rem", background:"goldenrod", color:"black"}}>
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
            <AddDialog open={addcivil} title="Add Civil ID" titleIcon={<CreditCard/>} inputplaceholder="Civil Number" input2placeholder="Expiry Date" input3placeholder="Date of Birth" OkButtonText="Add" onCancel={()=>setAddcivil(false)} onOk={addCivilID} inputOnChange={(e:any)=>setCivilNumber(e.target.value)} input2OnChange={(e:any)=>setCivilExpiry(e.target.value)} input3OnChange={(e:any)=>setCivilDOB(e.target.value)} updating={loading} disabled={loading}/>


            {/* EDIT CIVIL ID DIALOG */}
            <AddDialog open={editcivilprompt} title="Edit Civil ID" titleIcon={<PenLine/>} OkButtonText="Update" onCancel={()=>{setEditcivilprompt(false);setEditedCivilNumber("");setEditedCivilExpiry(null);setEditedCivilDOB("")}} inputplaceholder="Enter New Civil ID" input2placeholder="Enter Expiry Date" input3placeholder="Enter Date of Birth" inputOnChange={(e:any)=>setEditedCivilNumber(e.target.value)} input2OnChange={(e:any)=>{setEditedCivilExpiry(e.target.value)}} input3OnChange={(e:any)=>setEditedCivilDOB(e.target.value)} onOk={EditCivilID} updating={loading} disabled={loading} input1Value={civil_number} input2Value={civil_expiry} input3Value={civil_DOB} input1Label="Civil Number : " input2Label="Expiry Date : " input3Label="Date of Birth : "/>

            {/* DELETE CIVIL ID DIALOG */}
            <DefaultDialog updating={loading} open={civilDelete} title="Delete Civil ID?" OkButtonText="Delete" onCancel={()=>setCivilDelete(false)} onOk={deleteCivilID} disabled={loading}/>

{/* ////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}

            {/*DISPLAY VEHICLE ID DIALOG */}
            <DefaultDialog close titleIcon={<Car color="violet"/>} title="Vehicle ID" open={vehicle} onCancel={()=>setVehicle(false)} OkButtonText="Add" back

            title_extra=
            {vehicle_make?

                <div style={{display:"flex", gap:"0.5rem", height:"2.25rem"}}>

                {
                    moment(vehicle_expiry, "DD/MM/YYYY").diff(moment(today), 'months')<=2?
                    <button className="" style={{fontSize:"0.85rem", width:"6rem", display:"flex", gap:"0.5rem", background:"goldenrod", color:"black"}}>
                        <Sparkles width={"0.85rem"} color="black"/>
                        
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
                        !vehicle_make || loading?
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
                        <VehicleID name={name} expirydate={vehicle_expiry} make={vehicle_make?vehicle_make:vehicle_make} issuedate={vehicle_issue}/>
                        {/* <br/>
                        <button style={{width:"100%"}}>Edit</button> */}
                        </div>  
                    }
                    <br/>         
                </div>
            }/>

            {/* ADD VEHICLE ID DIALOG */}
            <AddDialog open={add_vehicle_id} title="Add Vehicle ID" titleIcon={<Car/>} inputplaceholder="Vehicle Make" input2placeholder="Expiry Date" input3placeholder="Issue Date" OkButtonText="Add" onCancel={()=>setAddVehicleID(false)} onOk={addVehicleID} inputOnChange={(e:any)=>setVehicleMake(e.target.value)} input2OnChange={(e:any)=>setVehicleExpiry(e.target.value)} input3OnChange={(e:any)=>setVehicleIssue(e.target.value)} updating={loading} disabled={loading}/>

            {/* EDIT VEHICLE ID DIALOG */}
            <AddDialog open={edit_vehicle_id_prompt} title="Edit Vehicle ID" titleIcon={<PenLine/>} OkButtonText="Update" onCancel={()=>{setEditVehicleIDprompt(false)}} inputplaceholder="Enter Vehicle Make" input2placeholder="Enter Expiry Date" input3placeholder="Enter Issue Date" inputOnChange={(e:any)=>setEditedVehicleMake(e.target.value)} input2OnChange={(e:any)=>{setEditedVehicleExpiry(e.target.value)}} input3OnChange={(e:any)=>setEditedVehicleIssue(e.target.value)} onOk={EditVehicleID} updating={loading} disabled={loading} input1Value={vehicle_make} input2Value={vehicle_expiry} input3Value={vehicle_issue} input1Label="Vehicle Make : " input2Label="Expiry Date" input3Label="Issue Date"/>

            {/* DELETE VEHICLE ID DIALOG */}
            <DefaultDialog updating={loading} open={vehicleIdDelete} title="Delete Vehicle ID?" OkButtonText="Delete" onCancel={()=>setVehicleIdDelete(false)} onOk={deleteVehicleID} disabled={loading}/>

            {/* BULK DELETE DIALOG */}
            <DefaultDialog progress={progress} destructive updating={loading} title="Delete record(s)?" open={bulkDeleteDialog} OkButtonText="Confirm" onCancel={()=>setBulkDeleteDialog(false)} onOk={handleBulkDelete}/>


                </div>
            
    
        </>
    )
}