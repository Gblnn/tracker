import { BellOff, CheckSquare2, ChevronRight, EllipsisVerticalIcon, Inbox, LockKeyholeIcon } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import DropDown from "./dropdown"
import { LoadingOutlined } from '@ant-design/icons'

interface Props{
    title?:string
    titleSize?:string
    icon?:any
    to?:any
    tag?:any
    status?:boolean
    onClick?:any
    subtext?:string
    selectable?:boolean
    onSelect?:any
    noArrow?:boolean
    selected?:boolean
    extra?:any
    extraOnDelete?:any
    extraOnEdit?:any
    notify?:boolean
    id_subtitle?:string
    loading?:boolean
    archived?:boolean
    protected?:boolean
    tagOnClick?:any
}

export default function Directive(props:Props){

    const [selected, setSelected] = useState(false)

    return(

        <Link onClick={()=>props.selectable?setSelected(!selected):null} to={props.to} style={{display:"flex", width:"100%", opacity:props.archived?0.5:1}}>
            {/* <div style={{background:"#1a1a1a",width:"3rem", borderTopLeftRadius:"0.5rem", borderBottomLeftRadius:"0.5rem", display:"flex", alignItems:"center", justifyContent:"center"}}>
                {props.icon}
            </div> */}

            <button onClick={props.selectable?props.onSelect:props.onClick} style={{paddingLeft:"1rem", gap:"0.5rem", width:"100%", justifyContent:"space-between"}}>

                

                <div style={{display:"flex", gap:"1rem", alignItems:"center"}}>
                    {
                        props.selectable?
                        <div style={{display:"flex", justifyContent:"center", alignItems:"center"}}>
                        <CheckSquare2 width={"1.75rem"} height={"1.75rem"} className="check-square" fill={selected||props.selected?"dodgerblue":"rgba(100 100 100/ 50%)"} stroke={selected||props.selected?"white":"none"}/>
                        {
                            selected?
                            // <Check style={{position:"relative", width:"0.75rem"}} />
                            ""
                            :null
                        }
                        
                        </div>
                        
                        :
                        props.icon

                    }
                    

                    <div style={{border:'', width:""}}>
                    <p style={{fontWeight:400, textAlign:"left", border:"", fontSize:props.titleSize?props.titleSize:"0.9rem", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis", display:"flex", flex:1, width:""}}>
                        {props.title}
                    </p>
                    <p style={{fontSize:"0.9rem", textAlign:"left", color:"lightblue",opacity:"0.75", background:"", borderRadius:"0.5rem", paddingRight:"0.25rem", paddingLeft:""}}>{props.id_subtitle}</p>
                    </div>
                    

                    
                    

                </div>

            <div style={{display:"flex", alignItems:"center", gap:"0.75rem"}}>
            {
                        props.subtext?
                        <p style={{fontWeight:400, width:"", textAlign:"left", fontSize:"0.65rem", opacity:"0.6", textTransform:"uppercase"}}>
                        {""+props.subtext+""}
                        </p>
                        :null
                    }

                {props.selectable?
                null
                :
                        props.notify?
                        <BellOff width={"1rem"} color="grey"/>
                        :null
                    }

                {
                    props.protected&&
                    <LockKeyholeIcon width={"1rem"} color="grey"/>
                }
                    
                {
                
                
                props.tag?
                    
                    
                        props.loading?
                        <LoadingOutlined/>
                        :
                    <div onClick={props.tagOnClick} style={{background:"rgba(100 100 100/ 25%)",fontSize:"0.85rem", paddingLeft:"0.5rem", paddingRight:"0.5rem", borderRadius:"0.5rem", color:props.tag=="Expiring"?"violet":props.tag=="Available"?"lightgreen":props.status?"lightblue":"goldenrod", width:"", fontWeight:600, display:"flex", alignItems:"center", gap:"0.5rem"}}>
                        
                        {
                        props.archived==true?
                        <div style={{color:"white", display:'flex', alignItems:"center", gap:"0.5rem",}}>
                        <Inbox width={"1rem"}/>
                        <p>Archived</p>
                        </div>
                        :
                        <p  style={{ textTransform:"capitalize"}}>{props.tag}</p>
                        }
                    </div>
                :null
                }
                
                {
                    props.selectable||props.noArrow?
                    <div style={{width:"1rem"}}>
                       
                    </div>
                    :
                    props.extra?
                    <DropDown className={"no-bg"} onDelete={props.extraOnDelete} onEdit={props.extraOnEdit} trigger={<EllipsisVerticalIcon width={"0.8rem"} height={"0.75rem"}/>} />
                    :
                    <ChevronRight width={"1rem"}/>

                    
                }
                
            </div>
            
        </button>
        </Link>
        
    )
}