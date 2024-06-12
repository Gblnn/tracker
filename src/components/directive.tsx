import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

interface Props{
    title?:string
    icon?:any
    to?:any
    tag?:any
    status?:boolean
    onClick?:any
}

export default function Directive(props:Props){
    return(
        <Link to={props.to}>

            <button onClick={props.onClick} style={{paddingLeft:"1rem", gap:"0.5rem", width:"100%", justifyContent:"space-between"}}>

                <div style={{display:"flex", gap:"1rem", alignItems:"center"}}>

                    {props.icon}
                    <p style={{fontWeight:400, width:"8rem", textAlign:"left"}}>
                        {props.title}
                    </p>

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