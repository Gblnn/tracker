
import Back from "@/components/back";
import CustomDropDown from "@/components/custom-dropdown";
import Directive from "@/components/directive";
import InboxComponent from "@/components/inbox-component";
import InputDialog from "@/components/input-dialog";
import SearchBar from "@/components/search-bar";
import DefaultDialog from "@/components/ui/default-dialog";
import { db } from "@/firebase";
import { LoadingOutlined } from '@ant-design/icons';
import emailjs from '@emailjs/browser';
import { message } from "antd";
import { Timestamp, addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { motion } from 'framer-motion';
import { ChevronDown, File, Filter, Info, LucideMails, Mails, MinusSquareIcon, PenLine, Plus, RefreshCcw, Sparkles, Users } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";

export default function Inbox(){

    const today:any = moment().toDate()
    const [records, setRecords] = useState<any>([])
    const [pageLoad, setPageLoad] = useState(false)
    const [reminderDialog, setReminderDialog] = useState(false)

    const [search, setSearch] = useState("")
    const [count, setCount] = useState(0)

    const [email, setEmail] = useState("")
    const [mailContent, setMailContent] = useState<any>()
    const [loading, setLoading] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [mailTitle, setMailTitle] = useState("")
    const [mailPreview, setMailPreview] = useState(false)
    const [renewDocDialog, setRenewDocDialog] = useState(false)
    const [docID, setDocID] = useState("")
    const [recipientsDialog, setRecipientsDialog] = useState(false)
    const [newExpiry, setNewExpiry] = useState<any>()
    const [recipient, setRecipient] = useState("")
    const [recipientList, setRecipientList] = useState<any>([])
    const [removeRecipientDialog, setRemoveRecipientDialog] = useState(false)
    const [selectedRecipient, setSelectedRecipient] = useState("")
    const [selectedRecipientID, setSelectedRecipientID] = useState("")
    const [filterState, setFilterState] = useState("")


      // MAILJS VARIABLES
      const serviceId = "service_lunn2bp";
      const templateId = "template_1y0oq9l";
    

    useEffect(()=>{
        fetchData()
        
    },[])

    useEffect(()=>{
        setCount(Number(document.getElementById("inboxes")?.childElementCount))
    },[pageLoad])

    // FUNCTION TO SEND A TEST EMAIL
    const sendMail = async () => {
        
        try {
            setLoading(true)
            await emailjs.send(serviceId, templateId, {
              name: "User",
              subject: mailTitle,
              recipient: email,
              message: mailContent
            });
            setLoading(false)
            setEmail("")
            setMailTitle("")
            setMailContent("")
            message.success("Email Successfully Sent")
          } catch (error) {
            console.log(error);
            message.info("Invalid email address")
            setLoading(false)
            setEmail("")
            setMailTitle("")
            setMailContent("")
          }
          setReminderDialog(false)
    }

   

    

    const fetchData = async () => {
        try {
            setPageLoad(true)
            const RecordCollection = collection(db, "records")
            const recordQuery = query(RecordCollection, orderBy("created_on"))
            const querySnapshot = await getDocs(recordQuery)
            const fetchedData:any = [];

            querySnapshot.forEach((doc:any)=>{
                fetchedData.push({id: doc.id, ...doc.data()})
                
                setRecords(fetchedData)
                
            })
            setLoading(false)
            setPageLoad(false)
            // console.log(records)
            // records.forEach((r:any)=>{
            
            //     console.log(r.civil_expiry.toDate())
            // })
            
            
    

            
        } catch (error) {
            console.log(error)
        }
        
    }

    useEffect(()=>{
        onSnapshot(query(collection(db, 'records')), (snapshot:any) => {
            snapshot.docChanges().forEach((change:any) => {
              if (change.type === "added") {
                // console.log("Added Data")
                fetchData()   
              }
              if (change.type === "modified") {
                //   console.log("Modified Data")
                  fetchData()
              }
              if (change.type === "removed") {
                //   console.log("Removed Data")
                  fetchData()
              }
            });
          });

     
    },[])

    const RenewID = async () => {
        await updateDoc(doc(db, "records", docID),{civil_expiry:newExpiry})
    }


    const addRecipient = async () => {
        try {
            setLoading(true)
            await addDoc(collection(db, 'recipients'),{created_on:Timestamp.fromDate(today), recipient:recipient})    
            setLoading(false)
            message.success("Added recipient")
            await fetchRecipients()
            setRecipient("")
        } catch (error) {
            message.error(String(error))
            setLoading(false)
        }
        
    }

    const fetchRecipients = async () => {
        try {
            setUpdating(true)
            const RecordCollection = collection(db, "recipients")
            const recordQuery = query(RecordCollection, orderBy("created_on"))
            const querySnapshot = await getDocs(recordQuery)
            const fetchedData:any = [];

            querySnapshot.forEach((doc:any)=>{
                fetchedData.push({id: doc.id, ...doc.data()})
                setRecipientList(fetchedData)
                
            })
            setUpdating(false)
        } catch (error) {
            message.error(String(error))
        }
    }

    const removeRecipient = async () => {
        try {
            setLoading(true)
            await deleteDoc(doc(db, 'recipients', selectedRecipientID))
            setLoading(false)
            setRemoveRecipientDialog(false)
            fetchRecipients()

            recipientList.length==1&&
            setRecipientList([])


        } catch (error) {
            message.error(String(error))
            setLoading(false)
        }
    }

    const DescGenerator = (date:any, months:number, name:string) => {
        return(
            date&&
            Math.round(moment(date.toDate()).diff(moment(new Date()), 'months'))
            <=months&&
                (name+" expiry "+
                moment((date).toDate()).startOf('day').fromNow()
                +" on "+moment(date.toDate()).format("DD/MM/YYYY"))
        )
    }

    const OverdueGenerator = (date:any) => {
        return(
            date&&
            Math.round(moment(date.toDate()).diff(moment(today).startOf('day'), 'days'))<=0?true:false
        )
    }
    

    // const Evaluate = () => {
        
    // }

    return(
        <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
        <div style={{padding:"1.25rem", background:"linear-gradient(rgba(209 20 58/ 15%), rgba(100 100 100/ 0%)"}}>
            <Back title={"Alerts"}
                extra={
                    <div style={{display:"flex", gap:"0.5rem"}}>

                        <button onClick={()=>{setRecipientsDialog(true);fetchRecipients()}} style={{paddingLeft:"1rem", paddingRight:"1rem", fontSize:"0.85rem"}}><Users className="animate-pulse" width={"1rem"} color="salmon"/>Recipients</button>

                        <button className="blue-glass" style={{paddingLeft:"1rem", paddingRight:"1rem", height:"2.5rem", width:"3rem"}} onClick={fetchData} >
                            {
                                pageLoad?
                                <LoadingOutlined style={{color:"dodgerblue"}} width={"1.5rem"}/>
                                :
                                <RefreshCcw  width="1.1rem" color="dodgerblue"/>
                            }
                        </button>
                    </div>
                    
                }/>
            {
                
                !pageLoad?
                count<1?
                <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                    <div style={{width:"100%",height:"80svh", display:"flex", justifyContent:"center", alignItems:"center", border:"", flexFlow:"column"}}>

                        <div style={{display:"flex", gap:"0.25rem", opacity:"0.5"}}>
                            {/* <BellRingIcon width={"1rem"}/> */}
                            <p>No Alerts</p>
                            
                        </div>
                        <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                        <p style={{opacity:0.5, fontSize:"0.7rem"}}>There are no alerts at the moment</p>
                        </motion.div>


                    </div>
                </motion.div>
                :
            
                <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                
                <p style={{height:"1.5rem"}}></p>
                <div style={{display:"flex", width:"100%", border:"", gap:"0.5rem"}}>
                    {/* <button style={{display:"flex", width:"2.5rem"}}>
                        
                        <Filter width={"1rem"} color="salmon"/>
                        
                    </button> */}
                    <SearchBar placeholder="Search by name" onChange={(e:any)=>setSearch(e.target.value.toLowerCase())}/>
                    {/* <button 
                    onClick={()=>{
                        setReminderDialog(true)
                        setMailTitle("Document expiry Reminder")
                        setMailContent("There are several documents expiring soon which requires your attention.")
                        }} 
                        style={{width:"6.5rem"}}>
                        <Bell width={"1rem"} color="violet"/>
                        <p style={{fontSize:"0.8rem"}}>Notify</p>
                    </button> */}
                    <CustomDropDown 
                    trigger={
                    <div className="transitions" style={{display:"flex", gap:"0.25rem", paddingLeft:"0.25rem", paddingRight:"0.25rem", alignItems:"center", minWidth:"6rem", justifyContent:"space-between"}}>
                        
                        <>
                        <Filter color="salmon" fill={filterState!=""?"salmon":"#2a2a2a"} width={"1.25rem"}/>
                        <p style={{textTransform:"capitalize", fontSize:"0.8rem", opacity:0.75}}>       {filterState==""?"filter":filterState}
                        </p>
                        </>
                        
                        
                        <ChevronDown color="rgba(150 150 150/ 50%)" width={"1rem"}/>
                        
                    </div>}
                    option1Text="Personal"
                    option2Text="Vale"
                    onOption1={()=>setFilterState("personal")}
                    onOption2={()=>setFilterState("vale")}
                    onClear={()=>setFilterState("")}
                    
                    />
                    
                </div>
                
                <p style={{height:"1.5rem"}}></p>

                <div className="record-list" id="inboxes" style={{display:"flex", flexFlow:"column", gap:"0.75rem", height:"75svh", border:"", overflow:"auto", paddingRight:"0.5rem", paddingBottom:"1rem"}}>
                    {
                        records
                        .filter((record:any)=>{
                            return (
                                record.civil_expiry&&
                                Math.round(moment(record.civil_expiry.toDate()).diff(moment(today), 'months'))<=2
                                ||
                                record.vehicle_expiry&&
                                Math.round(moment(record.vehicle_expiry.toDate()).diff(moment(today), 'months'))<=2  
                                ||
                                record.medical_due_on&&
                                Math.round(moment(record.medical_due_on.toDate()).diff(moment(today), 'months'))<=2
                                ||
                                record.passportExpiry&&
                                Math.round(moment(record.passportExpiry.toDate()).diff(moment(today), 'months'))<=6
                                ||
                                record.vt_hse_induction&&
                                Math.round(moment(record.vt_hse_induction.toDate()).diff(moment(today), 'months'))<=2
                                ||
                                record.vt_car_1&&
                                Math.round(moment(record.vt_car_1.toDate()).diff(moment(today), 'months'))<=2   
                                ||
                                record.vt_car_2&&
                                Math.round(moment(record.vt_car_2.toDate()).diff(moment(today), 'months'))<=2    
                                ||
                                record.vt_car_3&&
                                Math.round(moment(record.vt_car_3.toDate()).diff(moment(today), 'months'))<=2 
                                ||
                                record.vt_car_4&&
                                Math.round(moment(record.vt_car_4.toDate()).diff(moment(today), 'months'))<=2
                                ||
                                record.vt_car_5&&
                                Math.round(moment(record.vt_car_5.toDate()).diff(moment(today), 'months'))<=2
                                ||
                                record.vt_car_6&&
                                Math.round(moment(record.vt_car_6.toDate()).diff(moment(today), 'months'))<=2
                                ||
                                record.vt_car_7&&
                                Math.round(moment(record.vt_car_7.toDate()).diff(moment(today), 'months'))<=2
                                ||
                                record.vt_car_8&&
                                Math.round(moment(record.vt_car_8.toDate()).diff(moment(today), 'months'))<=2
                                ||
                                record.vt_car_9&&
                                Math.round(moment(record.vt_car_9.toDate()).diff(moment(today), 'months'))<=2
                                ||
                                record.vt_car_10&&
                                Math.round(moment(record.vt_car_10.toDate()).diff(moment(today), 'months'))<=2
                            )
                        })
                        .filter((post:any)=>{
                    
                            return search == ""?
                            {}
                            :
                            post.name&&
                            ((post.name).toLowerCase()).includes(search.toLowerCase())
                            
                        
                        })
                        .filter((e:any)=>{
                            return e.type&&
                            ((e.type).toLowerCase()).includes(filterState.toLowerCase())
                        })
                        .map((record:any)=>(
                            <InboxComponent 
                            notify={!record.notify}
                            type={record.type=="personal"?"Personal Record":record.type=="vale"?"Vale Record":""}
                            typeIcon={record.type=="personal"?<File color="dodgerblue" width={"1rem"}/>:record.type=="vale"?<img src="/vale-logo.png" style={{width:"1.25rem", paddingBottom:"0.45rem"}}/>:""}
                            mail={record.email}
                            noArrow
                            onClick={()=>{}}
                            onRenewClick={()=>{
                                setRenewDocDialog(true)
                                setDocID(record.id)
                            }}
                            onReminderClick={()=>{
                                setReminderDialog(true);
                                setMailTitle(record.name+"'s document expiry reminder");
                                setMailContent(
                                    "This is a gentle reminder regarding some of "+record.name+"'s"+" document(s) expiring soon :  \n\n"+
                                                                            
                                    ("Civil ID expiry in "+
                                    Math.round(moment(record.civil_expiry.toDate()).diff(moment(today), 'months'))+
                                
                                    " month(s)"
                                    +" on "+moment(record.civil_expiry.toDate()).format("DD/MM/YYYY")+"\n")
                                )
                            }}
                            
                            key={record.id} 
                            title={record.name+"'s doc expiry reminder"}

                             
                            civil_desc={DescGenerator(record.civil_expiry, 2, "Civil ID")}
                            civil_overdue={OverdueGenerator(record.civil_expiry)}

                            vehicle_desc={DescGenerator(record.vehicle_expiry, 2, "Vehicle ID")}
                            vehicle_overdue={OverdueGenerator(record.vehicle_expiry)}

                            medical_desc={DescGenerator(record.medical_due_on, 2, "Medical ID")}
                            medical_overdue={OverdueGenerator(record.medical_due_on)}

                            passport_desc={DescGenerator(record.passportExpiry, 6, "Passport")}
                            passport_overdue={OverdueGenerator(record.passportExpiry)}

                            vt_hse_induction_desc={DescGenerator(record.vt_hse_induction, 2, "HSE Induction Training")}
                            vt_hse_induction_overdue={OverdueGenerator(record.vt_hse_induction)}

                            vt_car_1_desc={DescGenerator(record.vt_car_1, 2, "CAR - 1 Training")}
                            vt_car_1_overdue={OverdueGenerator(record.vt_car_1)}
                            
                            vt_car_2_desc={DescGenerator(record.vt_car_2, 2, "CAR - 2 Training")}
                            vt_car_2_overdue={OverdueGenerator(record.vt_car_2)}

                            vt_car_3_desc={DescGenerator(record.vt_car_3, 2, "CAR - 3 Training")}
                            vt_car_3_overdue={OverdueGenerator(record.vt_car_3)}

                            vt_car_4_desc={DescGenerator(record.vt_car_4, 2, "CAR - 4 Training")}
                            vt_car_4_overdue={OverdueGenerator(record.vt_car_4)}

                            vt_car_5_desc={DescGenerator(record.vt_car_5, 2, "CAR - 5 Training")}
                            vt_car_5_overdue={OverdueGenerator(record.vt_car_5)}

                            vt_car_6_desc={DescGenerator(record.vt_car_6, 2, "CAR - 6 Training")}
                            vt_car_6_overdue={OverdueGenerator(record.vt_car_6)}

                            vt_car_7_desc={DescGenerator(record.vt_car_7, 2, "CAR - 7 Training")}
                            vt_car_7_overdue={OverdueGenerator(record.vt_car_7)}

                            vt_car_8_desc={DescGenerator(record.vt_car_8, 2, "CAR - 8 Training")}
                            vt_car_8_overdue={OverdueGenerator(record.vt_car_8)}

                            vt_car_9_desc={DescGenerator(record.vt_car_9, 2, "CAR - 9 Training")}
                            vt_car_9_overdue={OverdueGenerator(record.vt_car_9)}

                            vt_car_10_desc={DescGenerator(record.vt_car_10, 2, "CAR - 10 Training")}
                            vt_car_10_overdue={OverdueGenerator(record.vt_car_10)}

                            
                            />
                        ))
                    }
                </div>
                </motion.div>

                :
                <div style={{border:'', display:"flex", height:"80svh", justifyContent:"center", alignItems:"center"}}>
                    <div className="loader"></div>
                </div>
            
            
            
            }

            <DefaultDialog OkButtonText="Send" open={reminderDialog} onCancel={()=>{
                setReminderDialog(false);
                setEmail("");
                setMailTitle("");
                setMailContent("");
            }} titleIcon={<Mails color="dodgerblue"/>} title="Notify via Mail" updating={loading} onOk={sendMail} disabled={email==""||loading}
            title_extra={<button onClick={()=>setMailPreview(true)} style={{fontSize:"0.8rem", height:"2rem"}}><PenLine width={"1rem"} color="dodgerblue"/>Compose</button>}
             extra={
                <div style={{display:"flex", width:"100%", border:'', flexFlow:"column", gap:"0.5rem"}}>
                    
                    <div style={{display:"flex", width:"100%", gap:"0.5rem"}}>
                    <input type="email" placeholder="Recipient E-Mail Address" onChange={(e)=>setEmail(e.target.value)}/>
                    {/* <button style={{width:"8rem"}}>
                        <MailCheck width={"1rem"} color="dodgerblue"/>
                        Send </button> */}
                    </div>
                    
                </div>
            }/>

            <DefaultDialog close back onCancel={()=>setMailPreview(false)} open={mailPreview} title={
                <input onChange={(e)=>setMailTitle(e.target.value)} style={{background:"", fontSize:"1rem", border:"", width:"100%"}} defaultValue={mailTitle}/>
            } extra={
                <div style={{opacity:0.75, paddingBottom:"0.5rem", border:"", width:"100%"}}>
                    <textarea rows={6} onChange={(e)=>setMailContent(e.target.value)} defaultValue={mailContent} style={{textAlign:"left", width:"100%", border:""}}></textarea>
                </div>
                
            }/>

            <InputDialog titleIcon={<Sparkles color="goldenrod" fill="goldenrod"/>} title={"Renew Document"} open={renewDocDialog} onCancel={()=>{setRenewDocDialog(false);setNewExpiry("")}} inputplaceholder="New Expiry" OkButtonText="Renew" inputOnChange={(e:any)=>setNewExpiry(e.target.value)} onOk={RenewID} updating={loading} disabled={loading||newExpiry?false:true}/>

            <DefaultDialog
            created_on={recipientList.length} 
            title_extra={
            <button onClick={fetchRecipients} style={{width:"3rem", height:"2.5rem"}}>
                {
                    updating?
                    <LoadingOutlined style={{color:"dodgerblue"}}/>
                    :
                    <RefreshCcw color="dodgerblue" width={"1rem"}/>
                }
                
            </button>} titleIcon={<LucideMails color="dodgerblue"/>} title="Recipients" open={recipientsDialog} onCancel={()=>setRecipientsDialog(false)} close 
            extra={
                <>
                
                
                {
                    recipientList.length==0?
                    <div style={{width:"100%", border:"3px dashed rgba(100 100 100/ 50%)", height:"2.5rem",borderRadius:"0.5rem"}}></div>
                    :
                    <div className="recipients" style={{width:"100%", display:"flex", flexFlow:"column", gap:"0.35rem", maxHeight:"11.25rem", overflowY:"auto", paddingRight:"0.5rem", minHeight:"2.25rem"}}>
                    {
                        recipientList.map((recipient:any)=>(
                            <motion.div key={recipient.id} initial={{opacity:0}} whileInView={{opacity:1}}>
                            <Directive key={recipient.id} icon={<MinusSquareIcon onClick={()=>{setRemoveRecipientDialog(true);setSelectedRecipient(recipient.recipient);setSelectedRecipientID(recipient.id)}} className="animate-pulse" color="dodgerblue" width={"1.1rem"}/>} title={recipient.recipient} noArrow/>
                            </motion.div>
                        ))
                    }
                    
                </div>
                }
                


                <div style={{width:"100%", display:"flex", gap:"0.5rem"}}>
                    <input value={recipient} id="recipient-id" type="email" placeholder="Enter E-mail ID" onChange={(e)=>{setRecipient(e.target.value);}} />

                    <button style={{width:"3rem"}} className={recipient==""?"disabled":""} onClick={()=>{recipient==""?null:addRecipient();}}>
                        {
                         loading?
                         <LoadingOutlined color="dodgerblue"/>
                         :
                         <Plus color="dodgerblue"/>
                        }
                        
                    </button>
                </div>
                <div style={{width:""}}>
                    {/* <div style={{textAlign:"left", fontSize:"0.7rem", display:"flex", alignItems:"center", gap:"0.5rem", width:"100%"}}><CalendarDaysIcon width={"1rem"} color="salmon"/><p style={{opacity:"0.75"}}>Database will be queried on the first day of every month.</p></div> */}

                    <div style={{textAlign:"left", fontSize:"0.7rem", display:"flex", alignItems:"center", gap:"0.5rem", width:"100%"}}><Info width={"1rem"} color="violet"/><p style={{opacity:"0.75"}}>If alerts are present the listed recipients will be notified.</p></div>

                </div>
                </>
                
            }/>

            <DefaultDialog disabled={loading} updating={loading} destructive title={"Remove Recipient?"}  open={removeRecipientDialog} onCancel={()=>setRemoveRecipientDialog(false)} OkButtonText="Remove" extra={<div style={{width:"100%", border:"3px dashed rgba(100 100 100/ 50%)", padding:"0.5rem", borderRadius:"0.75rem"}}>
                <p>{selectedRecipient}</p>
            </div>} onOk={removeRecipient}/>
            
        </div>
        </motion.div>
    )
}