import Back from "@/components/back";
import InboxComponent from "@/components/inbox-component";
import SearchBar from "@/components/search-bar";
import DefaultDialog from "@/components/ui/default-dialog";
import { db } from "@/firebase";
import { LoadingOutlined } from '@ant-design/icons';
import { collection, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import { motion } from 'framer-motion';
import { Bell, Eye, Info, Mail, Mails, RefreshCcw, Sparkles } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import emailjs from '@emailjs/browser'
import { message } from "antd";
import AddDialog from "@/components/add-dialog";

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
    const [mailTitle, setMailTitle] = useState("")
    const [mailPreview, setMailPreview] = useState(false)
    const [renewDocDialog, setRenewDocDialog] = useState(false)
    const [docID, setDocID] = useState("")

    const [newExpiry, setNewExpiry] = useState<any>()

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
            setPageLoad(false)
            // console.log(records)
            // records.forEach((r:any)=>{
            
            //     console.log(r.civil_expiry.toDate())
            // })
            
            
    

            
        } catch (error) {
            console.log(error)
        }
        
    }

    const RenewID = async () => {
        await updateDoc(doc(db, "records", docID),{civil_expiry:newExpiry})
    }
    

    // const Evaluate = () => {
        
    // }

    return(
        <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
        <div style={{margin:"1.25rem"}}>
            <Back title={"Inbox"+" ("+count+")"}
                extra={
                    <div style={{display:"flex", gap:"0.5rem"}}>
                    <button style={{paddingLeft:"1rem", paddingRight:"1rem"}}><Mail width={"1rem"} color="dodgerblue"/></button>
                    <button style={{paddingLeft:"1rem", paddingRight:"1rem", height:"2.5rem", width:"3rem"}} onClick={fetchData} >
                        {
                                pageLoad?
                                <LoadingOutlined style={{color:"dodgerblue"}} width={"1.5rem"}/>
                                :
                                <RefreshCcw width="1.1rem" color="dodgerblue"/>
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
                    <button 
                    onClick={()=>{
                        setReminderDialog(true)
                        setMailTitle("Document expiry Reminder")
                        setMailContent("There are several documents expiring soon which requires your attention.")
                        }} 
                        style={{width:"6.5rem"}}>
                        <Bell width={"1rem"} color="salmon"/>
                        <p style={{fontSize:"0.8rem"}}>Notify</p>
                    </button>
                </div>
                
                <p style={{height:"1.5rem"}}></p>
                <div className="record-list" id="inboxes" style={{display:"flex", flexFlow:"column", gap:"0.75rem", height:"60svh", border:"", overflow:"auto", paddingRight:"0.5rem", paddingBottom:"1rem"}}>
                    {
                        records
                        .filter((record:any)=>{
                            return (
                                record.civil_expiry&&
                                Math.round(moment(record.civil_expiry.toDate()).diff(moment(today), 'months'))<=2
                                ||
                                record.vehicle_expiry&&
                                Math.round(moment(record.vehicle_expiry.toDate()).diff(moment(today), 'months'))<=2    
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
                                            
                                        
                                        +
                                           
                                            ("Vehicle ID expiry in "+
                                                Math.round(moment(record.vehicle_expiry.toDate()).diff(moment(today), 'months'))+" month(s)"
                                                +" on "+moment(record.vehicle_expiry.toDate()).format("DD/MM/YYYY"))
                                            // :""
                                        
                                    
                                    
                                    
                                        
                                    
                                    

                                )
                            }}
                            
                             icon={<Info/>} priority="low" key={record.id} title={record.name+"'s doc expiry reminder"} 
                             
                             civil_desc={
                                record.civil_expiry&&
                                Math.round(moment(record.civil_expiry.toDate()).diff(moment(today), 'months'))<=2?
                                ("Civil ID expiry in "+
                                Math.round(moment(record.civil_expiry.toDate()).diff(moment(today), 'months'))+
                                
                                " month(s)"
                                +" on "+moment(record.civil_expiry.toDate()).format("DD/MM/YYYY")):""
                                // ||
                                // (record.vehicle_expiry)?"Vehicle ID expiring on "+record.vehicle_expiry.toDate():""

                                

                            }
                            vehicle_desc={
                                
                                record.vehicle_expiry&&
                                Math.round(moment(record.vehicle_expiry.toDate()).diff(moment(today), 'months'))<=2?
                                ("Vehicle ID expiry in "+
                                    Math.round(moment(record.vehicle_expiry.toDate()).diff(moment(today), 'months'))+" month(s)"
                                    +" on "+moment(record.vehicle_expiry.toDate()).format("DD/MM/YYYY"))
                                    :""
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
            title_extra={<button onClick={()=>setMailPreview(true)} style={{fontSize:"0.8rem", height:"2rem"}}><Eye width={"1rem"} color="dodgerblue"/>Preview</button>}
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
                <input onChange={(e)=>setMailTitle(e.target.value)} style={{background:"", fontSize:"1rem", border:""}} defaultValue={mailTitle}/>
            } extra={
                <div style={{fontSize:"0.8rem",opacity:0.75, paddingBottom:"0.5rem", border:"", width:"100%"}}>
                    <textarea rows={6} onChange={(e)=>setMailContent(e.target.value)} defaultValue={mailContent} style={{textAlign:"left", width:"100%", border:""}}></textarea>
                </div>
                
            }/>

            <AddDialog titleIcon={<Sparkles color="goldenrod" fill="goldenrod"/>} title={"Renew Document"} open={renewDocDialog} onCancel={()=>{setRenewDocDialog(false);setNewExpiry("")}} inputplaceholder="New Expiry" OkButtonText="Renew" inputOnChange={(e:any)=>setNewExpiry(e.target.value)} onOk={RenewID} updating={loading} disabled={loading||newExpiry?false:true}/>

            
        </div>
        </motion.div>
    )
}