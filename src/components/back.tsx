import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props{
    icon?:any
    title?:any
    extra?:any
    noback?:boolean
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
                
                
                <div style={{display:"flex", alignItems:"center",marginLeft:"1rem",gap:"0.75rem"}}>
                    {props.icon}
                    <h2 style={{letterSpacing:"0.025rem", fontWeight:400, fontSize:"1.5rem"}}>{props.title}</h2>
                </div>

            </div>

            {props.extra}
            
                
        </div>
    )
}