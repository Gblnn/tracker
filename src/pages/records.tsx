import AddDialog from "@/components/add-dialog"
import AddRecordButton from "@/components/add-record-button"
import Back from "@/components/back"
import CivilID from "@/components/civil-id"
import Directive from "@/components/directive"
import DropDown from "@/components/dropdown"
import DefaultDialog from "@/components/ui/default-dialog"
import VehicleID from "@/components/vehicle-id"
import { db } from "@/firebase"
import { LoadingOutlined } from '@ant-design/icons'
import { message } from 'antd'
import { Timestamp, addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc } from 'firebase/firestore'
import { motion } from 'framer-motion'
import { Book, Car, CreditCard, EllipsisVerticalIcon, FilePlus, GraduationCap, HeartPulse, PackageX, PenLine, Plus, RefreshCcw, TextCursor, UserCircle, X } from "lucide-react"
import moment from 'moment'
import { useEffect, useState } from "react"

type Record = {
    id:string,
    name:string
}

export default function Records(){

    const [pageLoad, setPageLoad] = useState(false)
    const [records, setRecords] = useState<any>([])
    const [name, setName] = useState("")
    const [id, setID] = useState("")
    const [recordSummary, setRecordSummary] = useState(false)
    const [civil, setCivil] = useState(false)
    const [vehicle, setVehicle] = useState(false)
    const [addcivil, setAddcivil] = useState(false)

    const [civil_number, setCivilNumber] = useState("")
    const [new_civil_number, setNewCivilNumber] = useState("")
    const [new_civil_expiry, setNewCivilExpiry] = useState<any>()
    const [civil_expiry, setCivilExpiry] = useState<any>()
    const [civil_DOB, setCivilDOB] = useState("")

    const [civilDelete, setCivilDelete] = useState(false)
    const [addDialog, setAddDialog] = useState(false)
    const [loading, setLoading] = useState(false)
    const [userDeletePrompt, setUserDeletePrompt] = useState(false)
    const [userEditPrompt, setUserEditPrompt] = useState(false)
    const [editcivilprompt, setEditcivilprompt] = useState(false)

    // const [vecicle_make, setVehicleMake] = useState("")
    // const [vehicle_issue, setVehicleIssue] = useState("")
    // const [vehicle_expiry, setVehicleExpiry] = useState("")
    // const [expiryRef, setExpiryRef] = useState()
    // const date = new Date()

    useEffect(() =>{
        fetchData()
    },[])

    

    const fetchData = async () => {
        try {
            setPageLoad(true)
            const RecordCollection = collection(db, "records")
            const recordQuery = query(RecordCollection)
            const querySnapshot = await getDocs(recordQuery)
            const fetchedData: Array<Record> = [];

            querySnapshot.forEach((doc:any)=>{
                fetchedData.push({id: doc.id, ...doc.data()} as Record)
            })
            setPageLoad(false)
            setRecords(fetchedData)
            
        } catch (error) {
            console.log(error)
        }   
    }

    const addRecord = async () => {
        setLoading(true)
        await addDoc(collection(db, "records"), {name:name})
        setAddDialog(false)
        setLoading(false)
        fetchData()
    }

    const EditRecordName = async () => {
        setLoading(true)
        await updateDoc(doc(db, "records", id), {name:name})
        setUserEditPrompt(false)
        setLoading(false)
        fetchData()
    }
    
    const EditCivilID = async () => {
        
        setLoading(true)
        try {
            await updateDoc(doc(db, "records", id),{civil_number:civil_number, 
                civil_expiry:new_civil_expiry?Timestamp.fromDate(moment(new_civil_expiry, "DD/MM/YYYY").toDate()):civil_expiry, civil_DOB:civil_DOB})
            setCivilExpiry(new_civil_expiry)
            setEditcivilprompt(false)
            setLoading(false)
            fetchData()

        } catch (error) {
            console.log(error)  
            setLoading(false)   
            message.info(String(error))
        }
    }

    const addCivilID = async () => {
        setAddcivil(false)
        setLoading(true)
        try {
            await updateDoc(doc(db, "records", id),{civil_number:new_civil_number, civil_expiry:new_civil_expiry?Timestamp.fromDate(moment(new_civil_expiry, "DD/MM/YYYY").toDate()):civil_expiry, civil_DOB:civil_DOB})
            setCivilNumber(new_civil_number)
            setCivilExpiry(new_civil_expiry)
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

    
    return(
        <>
        <div style={{margin:"1.25rem"}}>
            <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>

            <Back title="Records" extra={<button style={{paddingLeft:"1rem", paddingRight:"1rem"}} onClick={fetchData} ><RefreshCcw width="1.1rem" color="dodgerblue"/></button>}/>

            <br/>

            {!pageLoad?

            records.length<1?

            <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                <div style={{width:"100%",height:"50svh", display:"flex", justifyContent:"center", alignItems:"center", border:""}}>

                    <div style={{display:"flex", gap:"0.5rem", opacity:"0.5"}}>
                        <PackageX/>
                        <p>No Data</p>
                    </div>


                </div>
            </motion.div>
            :

                
            <div style={{display:"flex", flexFlow:"column", gap:"0.5rem", marginTop:"1"
            }}>
                <input id="search-bar" placeholder="Search Records"/>
                <p style={{height:"0.25rem"}}/>

            {
                records.map((post:any)=>(
                    <motion.div key={post.id} initial={{opacity:0}} whileInView={{opacity:1}}>
                    <Directive tag={post.civil_number?"available":null} 

                    onClick={()=>{
                        setRecordSummary(true);
                        setName(post.name);
                        setID(post.id);
                        setCivilNumber(post.civil_number);
                        setCivilExpiry(post.civil_expiry?moment((post.civil_expiry).toDate()).format("DD/MM/YYYY"):null);
                    
                        setCivilDOB(post.civil_DOB)
                    }}                        

                    key={post.id} title={post.name} icon={<UserCircle color="dodgerblue" width={"1.1rem"} height={"1.1rem"} />} />
                    </motion.div>
                ))
            }

            {/* <Directive to="/vehicles" title="Vehicles" icon={<Car color="dodgerblue" width={"1.1rem"} height={"1.1rem"}/>}/>

            <Directive to="/medicals" title="Medicals" icon={<HeartPulse color="tomato" width={"1.1rem"} height={"1.1rem"}/>}/> */}

            </div>
            
            :
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

            <AddDialog open={addDialog} OkButtonIcon={<Plus width={"1rem"}/>} titleIcon={<FilePlus/>} title="Add Record" OkButtonText="Add" onCancel={()=>setAddDialog(false)} onOk={addRecord} inputOnChange={(e:any)=>{setName(e.target.value)} } inputplaceholder="Enter Name" disabled={loading||!name?true:false} updating={loading}/>

            </motion.div>


            <DefaultDialog titleIcon={<UserCircle/>} title={name} open={recordSummary} onCancel={()=>setRecordSummary(false)} title_extra={
            <DropDown onDelete={()=>setUserDeletePrompt(true)} onEdit={()=>setUserEditPrompt(true)} trigger={<EllipsisVerticalIcon width={"1.1rem"}/>}/>
            }
            close extra={
                <div style={{border:"", width:"100%", display:"flex", flexFlow:"column", gap:"0.5rem", paddingBottom:"1rem", paddingTop:"1rem"}}>
                    
                    <Directive onClick={()=>setCivil(true)} icon={<CreditCard color="dodgerblue"/>} title="Civil ID" tag={civil_expiry} status={false}/>
                    <Directive onClick={()=>setVehicle(true)} icon={<Car color="violet"/>} title="Vehicle"/>
                    <Directive icon={<HeartPulse color="tomato"/>} title="Medical"/>
                    <Directive icon={<GraduationCap color="lightgreen"/>} title="Training"/>
                    <Directive icon={<Book color="goldenrod"/>} title="Passport"/>
                    
                </div>
            
            }/>

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
            }/>

            <DefaultDialog close titleIcon={<Car color="violet"/>} title="Vehicle ID" open={vehicle} onCancel={()=>setVehicle(false)} OkButtonText="Add" back extra={
                <div>
                    <VehicleID name={name} issuedate={"10/12/2023"} expirydate={"10/04/2024"} make={"XXXXX"}/>
                    <br/>
                </div>
            }/>

            <AddDialog open={userEditPrompt} titleIcon={<PenLine/>} title="Edit Record Name" inputplaceholder="Enter New Name" OkButtonText="Rename" OkButtonIcon={<TextCursor width={"1rem"}/>} onCancel={()=>setUserEditPrompt(false)} onOk={EditRecordName} inputOnChange={(e:any)=>setName(e.target.value)} updating={loading} disabled={loading} input1Value={name}/>



            {/* ADD CIVIL ID DIALOG */}
            <AddDialog open={addcivil} title="Add Civil ID" titleIcon={<CreditCard/>} inputplaceholder="Civil Number" input2placeholder="Expiry Date" input3placeholder="Date of Birth" OkButtonText="Add" onCancel={()=>setAddcivil(false)} onOk={addCivilID} inputOnChange={(e:any)=>setNewCivilNumber(e.target.value)} input2OnChange={(e:any)=>setNewCivilExpiry(e.target.value)} input3OnChange={(e:any)=>setCivilDOB(e.target.value)} updating={loading} disabled={loading}/>


            {/* EDIT CIVIL ID DIALOG */}
            <AddDialog open={editcivilprompt} title="Edit Civil ID" titleIcon={<PenLine/>} OkButtonText="Update" onCancel={()=>{setEditcivilprompt(false);setNewCivilExpiry(civil_expiry);setNewCivilNumber(civil_number);setCivilNumber(civil_number)}} inputplaceholder="Enter New Civil ID" input2placeholder="Enter Expiry Date" input3placeholder="Enter Date of Birth" inputOnChange={(e:any)=>setCivilNumber(e.target.value)} input2OnChange={(e:any)=>{setNewCivilExpiry(e.target.value)}} input3OnChange={(e:any)=>setCivilDOB(e.target.value)} onOk={EditCivilID} updating={loading} disabled={loading} input1Value={new_civil_number?new_civil_number:civil_number?civil_number:""} input2Value={new_civil_expiry?new_civil_expiry:civil_expiry?civil_expiry:null} input3Value={civil_DOB}/>

            <DefaultDialog updating={loading} open={civilDelete} title="Delete Civil ID?" OkButtonText="Delete" onCancel={()=>setCivilDelete(false)} onOk={deleteCivilID} disabled={loading}/>

            <DefaultDialog open={userDeletePrompt} titleIcon={<X/>} destructive title="Delete Record?" OkButtonText="Delete" onCancel={()=>setUserDeletePrompt(false)} onOk={deleteRecord} updating={loading} disabled={loading}/>

        </div>
        </>
        
    )
}