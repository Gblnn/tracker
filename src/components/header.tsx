import { db } from "@/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Inbox } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Props{
    updateInbox?:any
}

export default function Header(props:Props){

    const [pageLoad, setPageLoad] = useState(false)
    // const [count, setCount] = useState(0)

    const fetchData = async () => {
        try {
            setPageLoad(true)
            
            const RecordCollection = collection(db, "records")
            const recordQuery = query(RecordCollection, where("civil_expiry", "!=", null))
            const querySnapshot = await getDocs(recordQuery)
            const fetchedData:any = [];

            querySnapshot.forEach((doc:any)=>{
                fetchedData.push({id: doc.id, ...doc.data()})
                
            
                
            })
            setPageLoad(false)
            // console.log(count)
            // records.forEach((r:any)=>{
            
            //     console.log(r.civil_expiry.toDate())
            // })
            
            
    

            
        } catch (error) {
            console.log(error)
        }
        
    }

    useEffect(()=>{
        fetchData()
    },[props.updateInbox])

    useEffect(()=>{
        // console.log(document.getElementById("inboxes")?.childElementCount)
        // setCount(Number(document.getElementById("inboxes")?.childElementCount))
    },[pageLoad, fetchData])

    return(
        <>
        <div style={{width:"100%", height:"4.5rem",display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.25rem", userSelect:"none", position:"fixed", WebkitBackdropFilter:"blur(25px)", backdropFilter:"blur(25px)", zIndex:5, borderBottom:"2px solid rgba(100 100 100/ 25%)", boxShadow:"1px 1px 10px rgba(0 0 0/ 20%)"}}>

            <div style={{marginLeft:"1.25rem", display:"flex", alignItems:"center", gap:"0.5rem"}}>
                {/* <img style={{width:"2.5rem", height:"2.5rem", position:"absolute"}} src="/sohar_star_logo.png"/> */}
                <h1 style={{ opacity:0.8, textTransform:"capitalize", marginLeft:"0.5rem", fontSize:"1.75rem"}}>Dashboard</h1>
                {/* <p style={{position:"absolute", fontSize:"0.5rem", marginTop:"2.35rem", letterSpacing:"0.12rem", opacity:"0.5", marginLeft:"1.65rem"}}>SOHAR STAR UNITED LLC</p> */}
            </div>

            <div style={{marginRight:"1.25rem", gap:"0.5rem", display:"flex"}}>
                {/* <NotifyButton/> */}
                
                <Link to="/inbox">
                <button onClick={()=>fetchData()} style={{display:"flex", alignItems:"center", justifyContent:"center"}}>
                    <Inbox color="crimson" width={"3rem"}/>
                    {/* {
                        count?
                        <p >{count?count:null}</p>
                        :null
                    } */}
                    
                </button>
                </Link>
                
                
            
                
                
            </div>

            <div id="inboxes" style={{display:"none", flexFlow:"column", gap:"0.75rem"}}>
                    {/* {
                        records
                        .filter((record:any)=>{
                            return (
                                record.civil_expiry&&
                                moment(record.civil_expiry.toDate()).diff(moment(today), 'months')<=2
                                ||
                                record.vehicle_expiry&&
                                moment(record.vehicle_expiry.toDate()).diff(moment(today), 'months')<=2
                                
                            )
                        })
                        .map((record:any)=>(
                            <InboxComponent key={record.id}/>
                        ))
                    } */}
                </div>
            
            
        </div>
    
        </>
        

    )
}