import { motion } from 'framer-motion'
import { MapPin, Phone } from 'lucide-react'

interface Props{
    name?:string
    issue?:string
    expiry?:string
    passport_id?:string
    nativePhone?:string
    nativeAddress?:string
}

export default function Passport(props:Props){
    return(
        <motion.div initial={{opacity:0}} whileInView={{opacity:1}} transition={{delay:0.15}}>
        <div className="civil-id" style={{width:"32ch", height:"19ch", background:"rgba(100 100 100/ 15%)", borderRadius:"0.75rem",  cursor:"pointer", zIndex:0, display:"flex", flexFlow:"column", justifyContent:"space-between"}}>


            <div style={{display:"flex", justifyContent:"space-between", borderBottom:"1px solid rgba(100 100 100/ 50%)", padding:"0.75rem", border:'', width:"100%", flexFlow:"column", gap:"0.5rem"}}>


            <div style={{display:"flex", gap:"0.25rem", alignItems:"flex-start", marginLeft:"", flexFlow:"", border:'', height:"fit-content", width:"100%", justifyContent:"space-between"}}>
                    {/* <p style={{fontSize:"0.8rem"}}>NAME : </p> */}
                    <p style={{fontWeight:"600", textTransform:"uppercase", display:"flex", border:"", fontSize:"0.9rem", textAlign:"left"}}>{props.name}</p> 

                    
                    <p style={{marginRight:"", border:"", height:"fit-content", textAlign:"right"}}>{props.passport_id}</p>
                    
                    
                </div>

                <div style={{display:"flex", border:'', width:"100%", flexFlow:"column", gap:"0.5rem"}}>
                    {
                        props.nativePhone&&
                        <a href={"tel:"+props.nativePhone} style={{fontSize:"0.75rem", textAlign:"left", border:'', display:"flex", alignItems:'center', gap:"0.5rem", background:"rgba(100 100 100/ 20%)", borderRadius:"0.5rem", paddingLeft:"0.5rem", paddingRight:"0.5rem", width:"fit-content"}}>
                            <Phone color='goldenrod' width={"0.75rem"}/>
                            <p>{props.nativePhone}</p>
                        </a>
                    }

{
                        props.nativeAddress&&
                        <div style={{fontSize:"0.75rem", textAlign:"left", border:'', display:"flex", alignItems:'center', gap:"0.5rem", background:"rgba(100 100 100/ 20%)", borderRadius:"0.5rem", paddingLeft:"0.5rem", paddingRight:"0.5rem", width:"fit-content"}}>
                            <MapPin color='goldenrod' width={"0.75rem"}/>
                            <p>{props.nativeAddress}</p>
                        </div>
                    }


                    </div>
                
                
            </div>

            

            {/* <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", paddingLeft:"1.25rem", borderBottom:"", height:"100%", gap:"0.5rem", border:""}}>

        
                
            </div> */}

            <div style={{border:"", display:"flex", alignItems:"center", justifyContent:"space-between", borderTop:"1px solid rgba(100 100 100/ 50%)", height:"2.5rem"}}>

                {/* <div id="civil-no" style={{display:"flex",border:"", alignItems:'center', gap:"1rem"}}>
                    <p style={{fontSize:"0.7rem"}}>CIVIL NUMBER : </p>
                    <p style={{fontWeight:600, fontSize:"0.9rem"}}>{props.civilid}</p>
                </div> */}

                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", width:'100%', margin:"1rem", border:''}}>
                <div id="civil-no" style={{display:"flex", alignItems:'center', gap:"0.5rem"}}>
                    <p style={{fontSize:"0.7rem", }}>ISSUE : </p>
                    <p style={{fontWeight:600, fontSize:"0.8rem"}}>{props.issue}</p>
                </div>

                <div id="civil-no" style={{display:"flex", alignItems:'center', gap:"0.5rem"}}>
                    <p style={{fontSize:"0.7rem"}}>EXPIRY : </p>
                    <p style={{fontWeight:600,fontSize:"0.8rem"}}>{props.expiry}</p>
                </div>
                </div>

                

                {/* <div style={{display:"flex", border:"", flex:1, justifyContent:"flex-end", alignItems:"center", flexFlow:"column"}}>
                    <p style={{fontSize:"0.7rem"}}>CIVIL NUMBER : </p>
                    <p style={{fontSize:"0.7rem"}}>EXPIRY DATE : </p>
                    <p style={{fontSize:"0.7rem"}}>DATE OF BIRTH : </p>
                </div>

                <div style={{display:"flex", border:"", flex:1, flexFlow:"column"}}>
                    <p style={{fontWeight:600,fontSize:"0.9rem"}}>{props.civilid}</p>
                    <p style={{fontWeight:600,fontSize:"0.9rem"}}>{props.expirydate}</p>
                    <p style={{fontWeight:600,fontSize:"0.9rem"}}>{props.DOB}</p>
                </div> */}
                
            </div>
            
        </div>
        </motion.div>
    )
}