import { motion } from 'framer-motion'
import { AtSign, Car, CreditCard, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"

interface Props{
    title?:string
    icon?:any
    to?:any
    tag?:string
    status?:boolean
    onClick?:any
    priority?:string
    civil_desc?:string
    vehicle_desc?:string
    hidden?:boolean
    noArrow?:boolean
    onReminderClick?:any
    onRenewClick?:any
}

export default function InboxComponent(props:Props){
    return(
        <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
        <Link className={props.hidden==true?"hidden":"visible"} to={props.to}>

            <div onClick={props.onClick} style={{ gap:"0.5rem", width:"100%", justifyContent:"space-between", background:"rgba(100 100 100/ 20%)", padding:"1rem", paddingLeft:"1rem", borderRadius:"0.75rem"}}>

                <div style={{display:"flex", gap:"1rem", alignItems:"center", border:'', padding:"0.15rem"}}>

                    {/* <div style={{border:"", color:props.priority=="low"?"dodgerblue":"goldenrod", display:"flex", alignItems:"flex-start",flex:1}}>
                    {props.icon}
                    </div> */}

                    <div style={{border:"", display:'flex', flexFlow:"column", width:"100%"}}>

                        <p style={{fontWeight:500, width:"100%", textAlign:"left", fontSize:"1rem", border:"", display:"flex", gap:"0.5rem"}}>
                            
                            {props.title}
                        </p>

        

                        {
                            props.civil_desc?
                
                                <div style={{display:"flex", gap:"0.5rem", alignItems:"center", fontWeight:400, fontSize:"0.75rem", border:""}}>
                                    {/* <p style={{fontSize:"1rem", color:"lightblue"}}>•</p> */}
                                    <div style={{display:"flex", alignItems:"flex-start", border:""}}>
                                    <CreditCard width={"1rem"} color="dodgerblue" style={{border:'', display:"flex", height:"fit-content"}}/>
                                    </div>
                                    
                                    <p style={{textAlign:"left", opacity:0.75}}>{props.civil_desc}</p>
                                </div>
                        
                            :null
                        }

                        {
                            props.vehicle_desc?
                
                                <div style={{display:"flex", gap:"0.5rem", alignItems:"center",textAlign:"left", fontWeight:400, fontSize:"0.75rem"}}>
                                    {/* <p style={{fontSize:"1rem", color:"lightblue"}}>•</p> */}
                                    <Car width={"0.8rem"} color="violet" style={{border:''}}/>   
                                    <p style={{textAlign:"left", opacity:0.75}}>{props.vehicle_desc}</p>
                                </div>
                            
                            :null

                        }
                        <p style={{height:"0.5rem"}}/>

                        <div style={{display:"flex", width:"100%", justifyContent:"flex-start", gap:"0.5rem", fontSize:"1.25rem"}}>

                            <button onClick={props.onReminderClick} style={{display:"flex", width:"5rem", height:"2rem", fontSize:"0.8rem", border:''}}>
                                <AtSign width={"1.1rem"} color='dodgerblue'/>
                                <p>Notify</p>
                            </button>

                            <button onClick={props.onRenewClick} style={{display:"flex", width:"5.5rem", height:"2rem", fontSize:"0.8rem", border:''}}>
                                <Sparkles width={"1rem"} color='goldenrod' fill='goldenrod'/>
                                <p>Renew</p>
                            </button>

                        </div>
                        

                        
                        
                    </div>
                    

                </div>

            {/* <div style={{display:"flex", alignItems:"center", gap:"1rem", marginRight:"1rem", border:""}}>
                {
                props.tag?
                
                <p style={{background:"rgba(100 100 100/ 25%)",fontSize:"0.8rem", paddingLeft:"0.5rem", paddingRight:"0.5rem", borderRadius:"0.5rem", color:props.status?"salmon":"lightgreen",  width:"6rem", fontWeight:600 }}>{props.tag}</p>
                :null
                }
                {
                    props.noArrow?
                    null
                    :
                    <ChevronRight width={"1rem"}/>
                }
                
                
                
            </div> */}
            
        </div>
        </Link>
        </motion.div>
    )
}