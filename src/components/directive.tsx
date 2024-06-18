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
        <Link to={props.to} style={{display:"flex"}}>
            {/* <div style={{background:"#1a1a1a",width:"3rem", borderTopLeftRadius:"0.5rem", borderBottomLeftRadius:"0.5rem", display:"flex", alignItems:"center", justifyContent:"center"}}>
                {props.icon}
            </div> */}

            <button onClick={props.onClick} style={{paddingLeft:"1rem", gap:"0.5rem", width:"100%", justifyContent:"space-between"}}>

                

                <div style={{display:"flex", gap:"1rem", alignItems:"center"}}>

                    {props.icon}


                    <p style={{fontWeight:400, width:"", textAlign:"left"}}>
                        {props.title}
                    </p>

                </div>

            <div style={{display:"flex", alignItems:"center", gap:"1rem"}}>
                {
                props.tag?
                
                <p style={{background:"rgba(100 100 100/ 25%)",fontSize:"0.8rem", paddingLeft:"0.5rem", paddingRight:"0.5rem", borderRadius:"0.5rem", color:props.status?"salmon":"lightgreen",  width:"", fontWeight:600, display:"flex", alignItems:"center", gap:"0.5rem"}}>
                    {props.tag}
                    {/* <div style={{height:"0.5rem", width:"0.5rem", background:"dodgerblue", borderRadius:"50%"}}></div> */}
                    </p>
                :null
                }
                <ChevronRight width={"1rem"}/>
            </div>
            
        </button>
        </Link>
        
    )
}