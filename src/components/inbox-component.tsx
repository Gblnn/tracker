import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

interface Props{
    title?:string
    icon?:any
    to?:any
    tag?:string
    status?:boolean
    onClick?:any
    priority?:string
    desc?:string
    hidden?:boolean
}

export default function InboxComponent(props:Props){
    return(
        <Link className={props.hidden==true?"hidden":"visible"} to={props.to}>

            <button onClick={props.onClick} style={{paddingLeft:"1rem", gap:"0.5rem", width:"100%", justifyContent:"space-between"}}>

                <div style={{display:"flex", gap:"1rem", alignItems:"center", border:''}}>

                    <div style={{border:"", color:props.priority=="low"?"dodgerblue":"goldenrod"}}>
                    {props.icon}
                    </div>
                    <div style={{border:"", display:'flex', flexFlow:"column"}}>
                    <p style={{fontWeight:500, width:"", textAlign:"left", fontSize:"0.85rem"}}>
                        {props.title}
                    </p>
                    <p style={{textAlign:"left", fontWeight:400, opacity:0.75, fontSize:"0.75rem"}}>{props.desc}</p>
                    </div>
                    

                </div>

            <div style={{display:"flex", alignItems:"center", gap:"1rem"}}>
                {
                props.tag?
                
                <p style={{background:"rgba(100 100 100/ 25%)",fontSize:"0.8rem", paddingLeft:"0.5rem", paddingRight:"0.5rem", borderRadius:"0.5rem", color:props.status?"salmon":"lightgreen",  width:"6rem", fontWeight:600 }}>{props.tag}</p>
                :null
                }
                <ChevronRight width={"1rem"}/>
            </div>
            
        </button>
        </Link>
        
    )
}