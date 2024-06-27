import Back from "@/components/back";
import InboxComponent from "@/components/inbox-component";
import { db } from "@/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { motion } from 'framer-motion';
import { Info, RefreshCcw } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";

export default function Inbox(){

    const today:any = moment().toDate()
    const [records, setRecords] = useState<any>([])
    const [pageLoad, setPageLoad] = useState(false)
    
    

    useEffect(()=>{
        fetchData()
    },[])

    // useEffect(()=>{
    //     console.log(document.getElementById("inboxes")?.childElementCount)
    // },[pageLoad])

   

    

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
            <Back title="Alerts" 
                extra={
                    <button style={{paddingLeft:"1rem", paddingRight:"1rem"}} onClick={fetchData} >
                        <RefreshCcw width="1.1rem" color="grey"/></button>}/>
            {
                
                !pageLoad?
                // records.length<1?
                
                // :
            
                <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                
                <br/>
                <div id="inboxes" style={{display:"flex", flexFlow:"column", gap:"0.75rem"}}>
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
                        .map((record:any)=>(
                            <InboxComponent 
                            noArrow
                            onClick={()=>console.log(Math.round(moment(record.civil_expiry.toDate()).diff(moment(today), 'months')))}
                             icon={<Info/>} priority="low" key={record.id} title={record.name+" doc expiry reminder"} 
                             
                             civil_desc={
                                
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

            
        </div>
    )
}