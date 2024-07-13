
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
import { File, Filter, Info, LucideMails, Mails, MinusSquareIcon, PenLine, Plus, RefreshCcw, Sparkles, Users } from "lucide-react";
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
            fetchRecipients()
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

        } catch (error) {
            message.error(String(error))
            setLoading(false)
        }
    }
    

    // const Evaluate = () => {
        
    // }

    return(
        <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
        <div style={{margin:"1.25rem"}}>
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
                    <CustomDropDown trigger={<Filter color="salmon" width={"1.1rem"}/>}
                    option1Text="Personal Records"
                    option1Icon={<File color="dodgerblue"/>}
                    option2Text="Vale Records"
                    option2Icon={<img src="/vale-logo.png" style={{width:"1.25rem", paddingBottom:"0.45rem"}}/>}
                    />
                    
                </div>
                
                <p style={{height:"1.5rem"}}></p>

                <div className="record-list" id="inboxes" style={{display:"flex", flexFlow:"column", gap:"0.75rem", height:"75svh", border:"", overflow:"auto", paddingRight:"", paddingBottom:"1rem"}}>
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
                            )
                        })
                        .filter((post:any)=>{
                    
                            return search == ""?
                            {}
                            :
                            post.name&&
                            ((post.name).toLowerCase()).includes(search.toLowerCase())
                            
                        
                        })
                        .map((record:any)=>(
                            <InboxComponent 
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
                                            
                                        
                                        // +
                                           
                                        //     ("Vehicle ID expiry in "+
                                        //         Math.round(moment(record.vehicle_expiry.toDate()).diff(moment(today), 'months'))+" month(s)"
                                        //         +" on "+moment(record.vehicle_expiry.toDate()).format("DD/MM/YYYY"))
                            
                                        
                                    
                                    
                                    
                                        
                                    
                                    

                                )
                            }}
                            
                              priority="low" key={record.id} title={record.name+"'s doc expiry reminder"} 
                             
                             civil_desc={
                                record.civil_expiry&&
                                Math.round(moment(record.civil_expiry.toDate()).diff(moment(today), 'months'))<=2&&
                                ("Civil ID expiry "+
                                moment((record.civil_expiry).toDate()).startOf('day').fromNow()
                                +" on "+moment(record.civil_expiry.toDate()).format("DD/MM/YYYY"))
                                
                            }

                            civil_overdue={
                                record.civil_expiry&&
                                Math.round(moment(record.civil_expiry.toDate()).diff(moment(today).startOf('day'), 'days'))<=0?true:false
                            }


                            vehicle_desc={
                                
                                record.vehicle_expiry&&
                                Math.round(moment(record.vehicle_expiry.toDate()).diff(moment(today), 'months'))<=2&&
                                ("Vehicle ID expiry "+
                                    moment((record.vehicle_expiry).toDate()).startOf('day').fromNow()
                                    +" on "+moment(record.vehicle_expiry.toDate()).format("DD/MM/YYYY"))
                                    
                            }

                            vehicle_overdue={
                                record.vehicle_expiry&&
                                Math.round(moment(record.vehicle_expiry.toDate()).diff(moment(today).startOf('day'), 'days'))<=0?true:false
                            }

                            medical_desc={
                                record.medical_due_on&&
                                Math.round(moment(record.medical_due_on.toDate()).diff(moment(today), 'months'))<=2&&
                                ("Medical ID expiry "+
                                    moment((record.medical_due_on).toDate()).startOf('day').fromNow()
                                    +" on "+moment(record.medical_due_on.toDate()).format("DD/MM/YYYY"))
                                    
                            }

                            medical_overdue={
                                record.medical_due_on&&
                                Math.round(moment(record.medical_due_on.toDate()).diff(moment(today).startOf('day'), 'days'))<=0?true:false
                            }

                            passport_desc={
                                
                                record.passportExpiry&&
                                Math.round(moment(record.passportExpiry.toDate()).diff(moment(today), 'months'))<=6&&
                                ("Passport expiry "+
                                    moment((record.passportExpiry).toDate()).startOf('day').fromNow()
                                    +" on "+moment(record.passportExpiry.toDate()).format("DD/MM/YYYY"))
                                    
                            }

                            passport_overdue={
                                record.passportExpiry&&
                                Math.round(moment(record.passportExpiry.toDate()).diff(moment(today).startOf('day'), 'days'))<=0?true:false
                            }

                        
                            
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
                    <input id="recipient-id" type="email" placeholder="Enter E-mail ID" onChange={(e)=>{setRecipient(e.target.value);}}/>
                    <button style={{width:"3rem"}} className={recipient==""?"disabled":""} onClick={()=>recipient==""?null:addRecipient()}>
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