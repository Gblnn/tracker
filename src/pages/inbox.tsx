import Back from "@/components/back";
import InboxComponent from "@/components/inbox-component";
import { db } from "@/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
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

    

    const fetchData = async () => {
        try {
            setPageLoad(true)
            
            const RecordCollection = collection(db, "records")
            const recordQuery = query(RecordCollection, where("civil_expiry", "!=", null))
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
            <Back title="Inbox" 
                extra={
                    <button style={{paddingLeft:"1rem", paddingRight:"1rem"}} onClick={fetchData} >
                        <RefreshCcw width="1.1rem" color="grey"/></button>}/>
            {
                !pageLoad?
                <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                
                <br/>
                <div style={{display:"flex", flexFlow:"column", gap:"0.75rem"}}>

                    {
                        records.map((record:any)=>(
                            <InboxComponent 
                            onClick={()=>console.log(Math.round(moment(record.civil_expiry.toDate()).diff(moment(today), 'months')))}
                            hidden={
                                (Math.round(moment(record.civil_expiry.toDate()).diff(moment(today), 'months')))<=3?
                                false:true
                            } icon={<Info/>} priority="low" key={record.id} title={record.name+" expiry reminder"} desc={"Civil expiry in "+Math.round(moment(record.civil_expiry.toDate()).diff(moment(today), 'months'))+" month(s)"+" on "+moment(record.civil_expiry.toDate()).format("DD/MM/YYYY")}/>
                        ))
                    }

                    {/* <InboxComponent title="Civil ID Expiry Reminder" desc="Civil ID number XXXXXXXX is expiring on 12/10/2024 (in 4 months)" priority="low" icon={<Info/>}/>

                    <InboxComponent title="Vehicle ID Expiry Reminder" desc="Vehicle ID number XXXXXXXX is expiring on 12/10/2024 (in 4 months)" priority="low" icon={<Car/>}/> */}
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