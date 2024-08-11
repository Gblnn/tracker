import Back from "@/components/back";
import Directive from "@/components/directive";
import { db } from "@/firebase";
import { LoadingOutlined } from '@ant-design/icons';
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { motion } from 'framer-motion';
import { RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import ReactTimeAgo from "react-time-ago";

export default function History(){

    const [fetchingData, setfetchingData] = useState(false)
    const [records, setRecords] = useState<any>([])

    useEffect(()=>{
        fetchData()
    },[])
    
    const fetchData = async () => {
        try {
            setfetchingData(true)
            const RecordCollection = collection(db, "history")
            const recordQuery = query(RecordCollection, orderBy("created_on"))
            const querySnapshot = await getDocs(recordQuery)
            const fetchedData: any = [];

            querySnapshot.forEach((doc:any)=>{
                fetchedData.push({id: doc.id, ...doc.data()})
            })

            setfetchingData(false)
            setRecords(fetchedData)
            
        } catch (error) {
            setfetchingData(false)
        }
    }

    return(
        <>
        {/* <div style={{border:"", display:"flex", alignItems:"center", justifyContent:'center'}}>
        <ConfettiExplosion/>
        </div> */}
        <div style={{padding:"1.25rem", background:"linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%))", height:"100svh"}}>
            <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                <Back title="History" 
                extra={
                    <div style={{display:"flex", gap:"0.5rem"}}>
                        <button onClick={fetchData} className="blue-glass" style={{width:"3rem", height:"2.5rem"}}>
                            {
                                fetchingData?
                                <LoadingOutlined/>
                                :
                                <RefreshCcw color="dodgerblue" width={"1rem"} />
                            }
                            
                            </button>
                    
                    </div>
                
            }/>
                <br/>

                <div className="record-list" style={{display:"flex", gap:"0.6rem", flexFlow:"column", overflowY:"auto", height:"72svh", paddingTop:"0.15rem", paddingRight:"0.35rem"}}>
                    {
                        records.map((e:any)=>(
                            <Directive key={e.id} title={e.desc} id_subtitle={e.user} subtext={e.doc_owner} 
                            status
                            noArrow 
                            tag={
                                <ReactTimeAgo date={e.created_on.toDate()} timeStyle={"twitter"}/>
                                
                            }/>
                        ))
                    }
                </div>
                
            </motion.div>

                        
        </div>
        </>
        
    )
}