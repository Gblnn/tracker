import AddDialog from "@/components/add-dialog"
import AddRecordButton from "@/components/add-record-button"
import Back from "@/components/back"
import CivilID from "@/components/civil-id"
import Directive from "@/components/directive"
import DropDown from "@/components/dropdown"
import FileInput from "@/components/file-input"
import { Button } from "@/components/ui/button"
import DefaultDialog from "@/components/ui/default-dialog"
import VehicleID from "@/components/vehicle-id"
import { db } from "@/firebase"
import { LoadingOutlined } from '@ant-design/icons'
import emailjs from '@emailjs/browser'
import { message } from 'antd'
import { Timestamp, addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore'
import { motion } from 'framer-motion'
import { Book, Car, CreditCard, EllipsisVerticalIcon, FilePlus, GraduationCap, HeartPulse, Mail, MailCheck, PackageX, PenLine, Plus, RefreshCcw, TextCursor, Upload, UserCircle, X } from "lucide-react"
import moment from 'moment'
import { useEffect, useState } from "react"

type Record = {
    id:string,
    name:string
}

export default function Records(){

    // BASIC PAGE VARIABLES
    const [pageLoad, setPageLoad] = useState(false)
    const [records, setRecords] = useState<any>([])
    const [name, setName] = useState("")
    const [id, setID] = useState("")
    const [recordSummary, setRecordSummary] = useState(false)
    const [civil, setCivil] = useState(false)
    const [vehicle, setVehicle] = useState(false)
    const [addcivil, setAddcivil] = useState(false)
    const [created_on, setCreatedOn] = useState("")

    // CIVIL ID VARIABLES
    const [civil_number, setCivilNumber] = useState("")
    const [new_civil_number, setNewCivilNumber] = useState("")
    const [new_civil_expiry, setNewCivilExpiry] = useState<any>()
    const [civil_expiry, setCivilExpiry] = useState<any>()
    const [civil_DOB, setCivilDOB] = useState("")

    const [edited_civil_number, setEditedCivilNumber] = useState("")
    const [edited_civil_expiry, setEditedCivilExpiry] = useState<any>()
    const [edited_civil_DOB, setEditedCivilDOB] = useState("")

    
    const [civilDelete, setCivilDelete] = useState(false)
    const [addDialog, setAddDialog] = useState(false)
    const [loading, setLoading] = useState(false)
    const [userDeletePrompt, setUserDeletePrompt] = useState(false)
    const [userEditPrompt, setUserEditPrompt] = useState(false)
    const [editcivilprompt, setEditcivilprompt] = useState(false)


    const [mailconfigdialog, setMailConfigDialog] = useState(false)
    const [recipient, setRecipient] = useState("")
    const [testmessage, setTestMessage] = useState("")

    const [vehicle_make, setVehicleMake] = useState("")
    const [vehicle_issue, setVehicleIssue] = useState("")
    const [vehicle_expiry, setVehicleExpiry] = useState("")

    const [vehicleIdDelete, setVehicleIdDelete] = useState(false)
    const [edit_vehicle_id_prompt, setEditVehicleIDprompt] = useState(false)

    const [add_vehicle_id, setAddVehicleID] = useState(false)

    const [excel_upload_dialog, setExcelUploadDialog] = useState(false)

    // const [expiryRef, setExpiryRef] = useState()
    // const date = new Date()

    // MAILJS VARIABLES
    const serviceId = "service_lunn2bp";
    const templateId = "template_1y0oq9l";

    const today = new Date()


    // PAGE LOAD HANDLER
    useEffect(() =>{
        fetchData()
    },[])

    
    //INITIAL DATA FETCH ON PAGE LOAD
    const fetchData = async () => {
        try {
            setPageLoad(true)
            const RecordCollection = collection(db, "records")
            const recordQuery = query(RecordCollection, orderBy("created_on"))
            const querySnapshot = await getDocs(recordQuery)
            const fetchedData: Array<Record> = [];

            querySnapshot.forEach((doc:any)=>{
                fetchedData.push({id: doc.id, ...doc.data()} as Record)
            })
            setPageLoad(false)
            setRecords(fetchedData)
            
        } catch (error) {
            console.log(error)
            message.info(String(error))
        }   
    }


    // FUNCTION TO ADD RECORD TO FIRESTORE
    const addRecord = async () => {
        setLoading(true)
        await addDoc(collection(db, "records"), {name:name, created_on:Timestamp.fromDate(today)})
        setAddDialog(false)
        setLoading(false)
        fetchData()
    }

    // FUNCTION TO EDIT RECORD NAME IN FIRESTORE
    const EditRecordName = async () => {
        setLoading(true)
        await updateDoc(doc(db, "records", id), {name:name})
        setUserEditPrompt(false)
        setLoading(false)
        fetchData()
    }

    
    // FUNCTION TO EDIT CIVIL ID IN FIRESTORE
    const EditCivilID = async () => {
        setLoading(true)
        try {
            await updateDoc(doc(db, "records", id),{civil_number:edited_civil_number!=""?edited_civil_number:civil_number, civil_expiry:edited_civil_expiry?Timestamp.fromDate(moment(edited_civil_expiry, "DD/MM/YYYY").toDate()):civil_expiry, civil_DOB:edited_civil_DOB?edited_civil_DOB:civil_DOB})

            // await updateDoc(doc(db, "records", id),{civil_number:civil_number, 
            //     civil_expiry:new_civil_expiry?Timestamp.fromDate(moment(new_civil_expiry, "DD/MM/YYYY").toDate()):civil_expiry, civil_DOB:civil_DOB})
            // setCivilExpiry(new_civil_expiry)

            setEditcivilprompt(false)
            setLoading(false)
            fetchData()

        } catch (error) {
            console.log(error)  
            setLoading(false)   
            message.info(String(error))
        }
    }


    // FUNCTION TO ADD A NEW CIVIL ID IN FIRESTORE
    const addCivilID = async () => {
        setAddcivil(false)
        setLoading(true)
        try {
            await updateDoc(doc(db, "records", id),{civil_number:civil_number, civil_expiry:Timestamp.fromDate(moment(civil_expiry, "DD/MM/YYYY").toDate()), civil_DOB:civil_DOB})

            // await updateDoc(doc(db, "records", id),{civil_number:new_civil_number, civil_expiry:new_civil_expiry?Timestamp.fromDate(moment(new_civil_expiry, "DD/MM/YYYY").toDate()):civil_expiry, civil_DOB:civil_DOB})
            // setCivilNumber(new_civil_number)
            // setCivilExpiry(new_civil_expiry)

            
            setLoading(false)
            fetchData()
            
            
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


    // FUNCTION TO ADD A NEW VEHICLE ID TO FIRESTORE
    const addVehicleID = async () => {
        setAddVehicleID(false)
        setLoading(true)
        try {
            await updateDoc(doc(db, "records", id),{vehicle_make:vehicle_make, vehicle_expiry:Timestamp.fromDate(moment(vehicle_expiry, "DD/MM/YYYY").toDate()), vehicle_issue:vehicle_issue})

            // await updateDoc(doc(db, "records", id),{civil_number:new_civil_number, civil_expiry:new_civil_expiry?Timestamp.fromDate(moment(new_civil_expiry, "DD/MM/YYYY").toDate()):civil_expiry, civil_DOB:civil_DOB})
            // setCivilNumber(new_civil_number)
            // setCivilExpiry(new_civil_expiry)

            
            setLoading(false)
            fetchData()
            
            
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


    // FUNCTION TO DELETE A CIVIL ID FROM FIRESTORE
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

    // FUNCTION TO DELETE A CIVIL ID FROM FIRESTORE
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

    // FUNCTION TO DELETE A RECORD FROM FIRESTORE
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
            console.log("email successfully sent");
          } catch (error) {
            console.log(error);
            message.info("Invalid email address")
            setLoading(false)
          }
          setMailConfigDialog(false)
    }

    

    
    return(
        <>
        <div style={{margin:"1.25rem"}}>
            <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>


            {/* BACK BUTTON */}
            <Back title="Records" 
            extra={
                <div style={{display:"flex", gap:"0.5rem"}}>

                    <button style={{paddingLeft:"1rem", paddingRight:"1rem"}} onClick={()=>{setExcelUploadDialog(true)}}><FilePlus width={"1rem"} color="lightgreen"/></button>

                    <button style={{paddingLeft:"1rem", paddingRight:"1rem"}} onClick={()=>setMailConfigDialog(true)}>
                    {
                        loading?
                        <LoadingOutlined color="dodgerblue"/>
                        :
                        <Mail width="1.1rem" color="dodgerblue"/>
                        
                    }
                    {/* MAIL BUTTON LABEL */}
                    {/* <p style={{fontSize:"0.8rem"}}>Mail Configuration</p> */}
                    </button>

                    

                    <button style={{paddingLeft:"1rem", paddingRight:"1rem"}} onClick={fetchData} ><RefreshCcw width="1.1rem" color="dodgerblue"/></button>
                </div>
                
        }
            />

            <DefaultDialog onCancel={()=>setExcelUploadDialog(false)} OkButtonText="Done" open={excel_upload_dialog} title="Upload Excel Data" titleIcon={<Upload/> } 
            extra={
            <>
            <FileInput/>
            </>
        }/>

            <br/>

            {!pageLoad?

            // IF NUMBER OF RECORDS IS LESS THAN 1, DISPLAY EITHER EMPTY SET OR RECORD DATA MAPPING
            records.length<1?
            
            // EMPTY SET - PAGE
            <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                <div style={{width:"100%",height:"50svh", display:"flex", justifyContent:"center", alignItems:"center", border:""}}>

                    <div style={{display:"flex", gap:"0.5rem", opacity:"0.5"}}>
                        <PackageX/>
                        <p>No Data</p>
                    </div>


                </div>
            </motion.div>
            :

            // RECORD DATA MAPPING
            <div style={{display:"flex", flexFlow:"column", gap:"0.5rem", marginTop:"1"
            }}>
                <input id="search-bar" placeholder="Search Records"/>
                <p style={{height:"0.25rem"}}/>

            {
                records.map((post:any)=>(
                    <motion.div key={post.id} initial={{opacity:0}} whileInView={{opacity:1}}>
                    <Directive tag={post.civil_number?"available":null} 

                    // ON CLICK COLLECT REQUIRED DATA FROM RECORD COMPONENT
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

                        // console.log("civil number : ",civil_number)
                        // console.log("civil expiry : ",civil_expiry)
                        // console.log("civil DOB : ",civil_DOB)
                    }}                        

                    key={post.id} title={post.name} icon={<UserCircle color="dodgerblue" width={"1.1rem"} height={"1.1rem"} />} />
                    </motion.div>
                ))
            }

            {/* <Directive to="/vehicles" title="Vehicles" icon={<Car color="dodgerblue" width={"1.1rem"} height={"1.1rem"}/>}/>

            <Directive to="/medicals" title="Medicals" icon={<HeartPulse color="tomato" width={"1.1rem"} height={"1.1rem"}/>}/> */}

            </div>
            
            :
            // LOADING SCREEN HANDLER
            <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                <div style={{width:"100%",height:"55svh", display:"flex", justifyContent:"center", alignItems:"center", border:""}}>

                    <div style={{display:"flex", flexFlow:"column", alignItems:"center", gap:"1rem"}}>
                    <div className="loader"></div>
                    <p style={{fontSize:"1rem", opacity:"0.5"}}>Connecting</p>
                    </div>
                    

                </div>
            </motion.div>
            
            
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

            <AddRecordButton onClick={()=>{setAddDialog(true)}}/>

            {/* ADD RECORD DIALOG */}
            <AddDialog open={addDialog} OkButtonIcon={<Plus width={"1rem"}/>} titleIcon={<FilePlus/>} title="Add Record" OkButtonText="Add" onCancel={()=>setAddDialog(false)} onOk={addRecord} inputOnChange={(e:any)=>{setName(e.target.value)} } inputplaceholder="Enter Name" disabled={loading||!name?true:false} updating={loading}/>

            </motion.div>

            
            {/* RECORD SUMMARY DIALOG */}
            <DefaultDialog titleIcon={<UserCircle/>} title={name} open={recordSummary} onCancel={()=>setRecordSummary(false)} created_on={created_on} title_extra={
            <DropDown onDelete={()=>setUserDeletePrompt(true)} onEdit={()=>setUserEditPrompt(true)} trigger={<EllipsisVerticalIcon width={"1.1rem"}/>}/>
            }
            close extra={
                <div style={{border:"", width:"100%", display:"flex", flexFlow:"column", gap:"0.5rem", paddingBottom:"1rem", paddingTop:"1rem"}}>
                    
                    <Directive onClick={()=>setCivil(true)} icon={<CreditCard color="dodgerblue"/>} title="Civil ID" tag={civil_expiry} status={false}/>
                    <Directive tag={vehicle_expiry} onClick={()=>setVehicle(true)} icon={<Car color="violet"/>} title="Vehicle"/>
                    <Directive icon={<HeartPulse color="tomato"/>} title="Medical" subtext="Upcoming"/>
                    <Directive icon={<GraduationCap color="lightgreen"/>} title="Training"/>
                    <Directive icon={<Book color="goldenrod"/>} title="Passport"/>
                    
                </div>
            
            }/>


            {/* CIVIL ID DIALOG */}
            <DefaultDialog back close titleIcon={<CreditCard color="dodgerblue"/>} title="Civil ID" open={civil} onCancel={()=>setCivil(false)} OkButtonText="Add" title_extra={civil_number?
            <DropDown onDelete={()=>{setCivilDelete(true)}} onEdit={()=>{setEditcivilprompt(true)}} trigger={<EllipsisVerticalIcon width={"1.1rem"}/>
            
            }/>:null
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
                        <CivilID name={name} expirydate={new_civil_expiry?new_civil_expiry:civil_expiry} civilid={new_civil_number?new_civil_number:civil_number} DOB={civil_DOB}/>
                        {/* <br/>
                        <button style={{width:"100%"}}>Edit</button> */}
                        </div>  
                    }

                    <br/>
                        
                    
                </div>
            }
            
            />

            {/* DELETE CIVIL ID */}
            <DefaultDialog updating={loading} open={civilDelete} title="Delete Civil ID?" OkButtonText="Delete" onCancel={()=>setCivilDelete(false)} onOk={deleteCivilID} disabled={loading}/>

            {/* DELETE VEHICLE ID */}
            <DefaultDialog updating={loading} open={vehicleIdDelete} title="Delete Vehicle ID?" OkButtonText="Delete" onCancel={()=>setVehicleIdDelete(false)} onOk={deleteVehicleID} disabled={loading}/>

            {/* VEHICLE ID DIALOG */}
            <DefaultDialog close titleIcon={<Car color="violet"/>} title="Vehicle ID" open={vehicle} onCancel={()=>setVehicle(false)} OkButtonText="Add" back
            title_extra={vehicle_make?
                <DropDown onDelete={()=>{setVehicleIdDelete(true)}} onEdit={()=>{setEditVehicleIDprompt(true)}} trigger={<EllipsisVerticalIcon width={"1.1rem"}/>
                
                }/>:null
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
                        <VehicleID name={name} expirydate={vehicle_expiry?vehicle_expiry:vehicle_expiry} make={vehicle_make?vehicle_make:vehicle_make} issuedate={vehicle_issue}/>
                        {/* <br/>
                        <button style={{width:"100%"}}>Edit</button> */}
                        </div>  
                    }
                    <br/>         
                </div>
            }
            
            
            // extra={
            //     <div>
            //         <VehicleID name={name} issuedate={"10/12/2023"} expirydate={"10/04/2024"} make={"XXXXX"}/>
            //         <br/>
            //     </div>
            // }
            />


            {/* EDIT RECORD NAME */}
            <AddDialog open={userEditPrompt} titleIcon={<PenLine/>} title="Edit Record Name" inputplaceholder="Enter New Name" OkButtonText="Rename" OkButtonIcon={<TextCursor width={"1rem"}/>} onCancel={()=>setUserEditPrompt(false)} onOk={EditRecordName} inputOnChange={(e:any)=>setName(e.target.value)} updating={loading} disabled={loading} input1Value={name}/>



            {/* ADD CIVIL ID DIALOG */}
            <AddDialog open={addcivil} title="Add Civil ID" titleIcon={<CreditCard/>} inputplaceholder="Civil Number" input2placeholder="Expiry Date" input3placeholder="Date of Birth" OkButtonText="Add" onCancel={()=>setAddcivil(false)} onOk={addCivilID} inputOnChange={(e:any)=>setCivilNumber(e.target.value)} input2OnChange={(e:any)=>setCivilExpiry(e.target.value)} input3OnChange={(e:any)=>setCivilDOB(e.target.value)} updating={loading} disabled={loading}/>


            {/* EDIT CIVIL ID DIALOG */}
            <AddDialog open={editcivilprompt} title="Edit Civil ID" titleIcon={<PenLine/>} OkButtonText="Update" onCancel={()=>{setEditcivilprompt(false);setEditedCivilNumber("");setEditedCivilExpiry(null);setEditedCivilDOB("")}} inputplaceholder="Enter New Civil ID" input2placeholder="Enter Expiry Date" input3placeholder="Enter Date of Birth" inputOnChange={(e:any)=>setEditedCivilNumber(e.target.value)} input2OnChange={(e:any)=>{setEditedCivilExpiry(e.target.value)}} input3OnChange={(e:any)=>setEditedCivilDOB(e.target.value)} onOk={EditCivilID} updating={loading} disabled={loading} input1Value={civil_number} input2Value={civil_expiry} input3Value={civil_DOB}/>

            {/* EDIT VEHICLE ID DIALOG */}
            <AddDialog open={edit_vehicle_id_prompt} title="Edit Vehicle ID" titleIcon={<PenLine/>} OkButtonText="Update" onCancel={()=>{setEditcivilprompt(false);setEditedCivilNumber("");setEditedCivilExpiry(null);setEditedCivilDOB("")}} inputplaceholder="Enter New Civil ID" input2placeholder="Enter Expiry Date" input3placeholder="Enter Date of Birth" inputOnChange={(e:any)=>setEditedCivilNumber(e.target.value)} input2OnChange={(e:any)=>{setEditedCivilExpiry(e.target.value)}} input3OnChange={(e:any)=>setEditedCivilDOB(e.target.value)} onOk={EditCivilID} updating={loading} disabled={loading} input1Value={civil_number} input2Value={civil_expiry} input3Value={civil_DOB}/>


            {/* ADD VEHICLE ID DIALOG */}
            <AddDialog open={add_vehicle_id} title="Add Vehicle ID" titleIcon={<Car/>} inputplaceholder="Vehicle Make" input2placeholder="Expiry Date" input3placeholder="Issue Date" OkButtonText="Add" onCancel={()=>setAddVehicleID(false)} onOk={addVehicleID} inputOnChange={(e:any)=>setVehicleMake(e.target.value)} input2OnChange={(e:any)=>setVehicleExpiry(e.target.value)} input3OnChange={(e:any)=>setVehicleIssue(e.target.value)} updating={loading} disabled={loading}/>


            {/* DELETE RECORD DIALOG */}
            <DefaultDialog open={userDeletePrompt} titleIcon={<X/>} destructive title="Delete Record?" OkButtonText="Delete" onCancel={()=>setUserDeletePrompt(false)} onOk={deleteRecord} updating={loading} disabled={loading}/>


            {/* Mail Configuration */}
            <DefaultDialog titleIcon={<MailCheck/>} title="Mail Configuration" open={mailconfigdialog} onCancel={()=>setMailConfigDialog(false)} onOk={TestMail} updating={loading} OkButtonText="Send Test Mail" extra={
                <div style={{display:"flex", border:"", width:"100%", flexFlow:"column", gap:"0.5rem"}}>
                    <input placeholder="Enter E-Mail Address" onChange={(e)=>setRecipient(e.target.value)}/>
                    <textarea onChange={(e:any)=>setTestMessage(e.target.value)} placeholder="Message..." rows={4}/>
                <Button variant={"ghost"} style={{flex:1}}>
                    <Plus style={{width:"1rem"}} color="dodgerblue"/>
                    Add Recipient
                </Button>
                </div>
                
                }/>

        </div>
        </>
        
    )
}