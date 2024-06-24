import { Check, CheckSquare2, ChevronRight } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

interface Props{
    title?:string
    icon?:any
    to?:any
    tag?:any
    status?:boolean
    onClick?:any
    subtext?:string
    selectable?:boolean
    onSelect?:any
}

export default function Directive(props:Props){

    

    const [selected, setSelected] = useState(false)

    return(

        <Link onClick={()=>props.selectable?setSelected(!selected):null} to={props.to} style={{display:"flex"}}>
            {/* <div style={{background:"#1a1a1a",width:"3rem", borderTopLeftRadius:"0.5rem", borderBottomLeftRadius:"0.5rem", display:"flex", alignItems:"center", justifyContent:"center"}}>
                {props.icon}
            </div> */}

            <button onClick={props.selectable?props.onSelect:props.onClick} style={{paddingLeft:"1rem", gap:"0.5rem", width:"100%", justifyContent:"space-between"}}>

                

                <div style={{display:"flex", gap:"1rem", alignItems:"center"}}>
                    {
                        props.selectable?
                        <div style={{display:"flex", justifyContent:"center", alignItems:"center"}}>
                        <CheckSquare2 className="check-square" fill={selected?"dodgerblue":"rgba(100 100 100/ 50%)"} stroke="none"/>
                        {
                            selected?
                            <Check style={{position:"absolute", width:"0.75rem"}} />
                            :null
                        }
                        
                        </div>
                        
                        :
                        props.icon

                    }
                    


                    <p style={{fontWeight:400, width:"", textAlign:"left"}}>
                        {props.title}
                    </p>

                    
                    

                </div>

            <div style={{display:"flex", alignItems:"center", gap:"0.75rem"}}>
            {
                        props.subtext?
                        <p style={{fontWeight:400, width:"", textAlign:"left", fontSize:"0.65rem", opacity:"0.6", textTransform:"uppercase"}}>
                        {""+props.subtext+""}
                        </p>
                        :null
                    }
                {
                props.tag?
                
                <p style={{background:"rgba(100 100 100/ 25%)",fontSize:"0.8rem", paddingLeft:"0.5rem", paddingRight:"0.5rem", borderRadius:"0.5rem", color:props.tag=="Expiring"?"violet  ":props.tag=="Available"?"lightgreen":props.status?"rgba(200 200 200/ 100%)":"violet", width:"", fontWeight:600, display:"flex", alignItems:"center", gap:"0.5rem"}}>
                    {props.tag}
                    {/* <div style={{height:"0.5rem", width:"0.5rem", background:"dodgerblue", borderRadius:"50%"}}></div> */}
                    </p>
                :null
                }
                {
                    props.selectable?
                    <div style={{width:"1rem"}}></div>
                    :<ChevronRight width={"1rem"}/>
                }
                
            </div>
            
        </button>
        </Link>
        
    )
}