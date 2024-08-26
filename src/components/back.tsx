import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from 'framer-motion'

interface Props{
    icon?:any
    title?:any
    extra?:any
    noback?:boolean
    subtitle?:any
}

export default function Back(props:Props){
    const usenavigate = useNavigate()
    return(
        <div style={{display:"flex", alignItems:'center', gap:"0.5rem", zIndex:5, justifyContent:"space-between" }}>
            <div style={{display:"flex"}}>
                {props.noback?
                null
                :
                <button onClick={()=>{usenavigate(-1)}} style={{ backdropFilter:"blur(16px)"}}>
                    <ChevronLeft/>
                </button>
                }
                
                
                <div style={{display:"flex", alignItems:"",marginLeft:"1rem",gap:"", flexFlow:"column", border:'', justifyContent:'center'}}>

                    <div style={{border:"", display:'flex', height:"1.25rem", alignItems:'center', gap:"0.5rem"}}>
                        {props.icon}
                        <h2 style={{letterSpacing:"0.025rem", fontWeight:400, fontSize:"1.5rem"}}>
                            {props.title}
                        </h2>
                        {
                        props.subtitle?
                        <motion.div initial={{opacity:0}} whileInView={{opacity:1}} 
                        transition={{duration:"0.5"}}>
                            <p style={{fontSize:"0.85rem", border:"",opacity:"", display:'flex', alignItems:'center', height:'', borderRadius:"0.5rem", background:"white", color:"black", padding:"0.25rem", paddingTop:"0.025rem", paddingBottom:"0.025rem", fontWeight:"500", marginBottom:"0.1rem"}}>{props.subtitle}</p>
                        </motion.div>
                        :""
                    }
                    </div>
                    
                    
                    
                </div>
                

            </div>
            

            {props.extra}
            
                
        </div>
    )
}