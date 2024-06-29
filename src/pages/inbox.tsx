import Back from "@/components/back";
import InboxComponent from "@/components/inbox-component";
import SearchBar from "@/components/search-bar";
import DefaultDialog from "@/components/ui/default-dialog";
import { db } from "@/firebase";
import { LoadingOutlined } from '@ant-design/icons';
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { motion } from 'framer-motion';
import { Bell, Filter, Info, Mail, RefreshCcw } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";

export default function Inbox(){

    const today:any = moment().toDate()
    const [records, setRecords] = useState<any>([])
    const [pageLoad, setPageLoad] = useState(false)
    const [reminderDialog, setReminderDialog] = useState(false)

    const [search, setSearch] = useState("")
    const [count, setCount] = useState(0)
    

    useEffect(()=>{
        fetchData()
    },[])

    useEffect(()=>{
        setCount(Number(document.getElementById("inboxes")?.childElementCount))
    },[pageLoad])

   

    

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
    

    // const Evaluate = () => {
        
    // }

    return(
        <div style={{margin:"1.25rem"}}>
            <Back title={"Alerts"+" ("+count+")"}
                extra={
                    <div style={{display:"flex", gap:"0.5rem"}}>
                    <button style={{paddingLeft:"1rem", paddingRight:"1rem"}}><Mail width={"1rem"} color="dodgerblue"/></button>
                    <button style={{paddingLeft:"1rem", paddingRight:"1rem", height:"2.5rem"}} onClick={fetchData} >
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
                // records.length<1?
                
                // :
            
                <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                
                <p style={{height:"1.5rem"}}></p>
                <div style={{display:"flex", width:"100%", border:"", gap:"0.5rem"}}>
                    <button style={{display:"flex", width:"2.5rem"}}>
                        {/* <p style={{fontSize:"0.75rem"}}>Sort By</p> */}
                        <Filter width={"1rem"} color="salmon"/>
                        
                    </button>
                    <SearchBar placeholder="Search by name" onChange={(e:any)=>setSearch(e.target.value.toLowerCase())}/>
                </div>
                
                <p style={{height:"1.5rem"}}></p>
                <div id="inboxes" style={{display:"flex", flexFlow:"column", gap:"0.75rem", height:"60svh", border:"", overflow:"auto", paddingRight:"0.5rem"}}>
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

                            onReminderClick={()=>{setReminderDialog(true)}}
                            
                             icon={<Info/>} priority="low" key={record.id} title={record.name+"'s doc expiry reminder"} 
                             
                             civil_desc={
                                record.civil_expiry&&
                                Math.round(moment(record.civil_expiry.toDate()).diff(moment(today), 'months'))<=2?
                                ("Civil ID expiry in "+
                                Math.round(moment(record.civil_expiry.toDate()).diff(moment(today), 'months')+1)+
                                
                                " month(s)"
                                +" on "+moment(record.civil_expiry.toDate()).format("DD/MM/YYYY")):""
                                // ||
                                // (record.vehicle_expiry)?"Vehicle ID expiring on "+record.vehicle_expiry.toDate():""

                                

                            }
                            vehicle_desc={
                                
                                record.vehicle_expiry&&
                                Math.round(moment(record.vehicle_expiry.toDate()).diff(moment(today), 'months'))<=2?
                                ("Vehicle ID expiry in "+
                                    Math.round(moment(record.vehicle_expiry.toDate()).diff(moment(today), 'months')+1)+" month(s)"
                                    +" on "+moment(record.vehicle_expiry.toDate()).format("DD/MM/YYYY"))
                                    :""
                            }
                            
                            />
                        ))
                    }
                </div>
                </motion.div>

                :
                <div style={{border:'', display:"flex", height:"65svh", justifyContent:"center", alignItems:"center"}}>
                    <div className="loader"></div>
                </div>
            
            
            
            }

            <DefaultDialog close open={reminderDialog} onCancel={()=>setReminderDialog(false)} titleIcon={<Bell color="dodgerblue"/>} title="Reminder"/>

            
        </div>
    )
}