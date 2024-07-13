import { motion } from 'framer-motion'
import { Book, Car, CreditCard, HeartPulse } from "lucide-react"
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
    civil_overdue?:boolean
    vehicle_desc?:string
    vehicle_overdue?:boolean
    medical_desc?:string
    medical_overdue?:boolean
    passport_desc?:string
    passport_overdue?:boolean
    hidden?:boolean
    noArrow?:boolean
    onReminderClick?:any
    onRenewClick?:any
    hideButtons?:boolean
    desc?:string
    mail?:string
    type?:string
    typeColor?:string
}


export default function InboxComponent(props:Props){

    const overdue_color = "lightcoral"

    return(
        <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
        <Link className={props.hidden==true?"hidden":"visible"} to={props.to}>

            <div onClick={props.onClick} style={{ gap:"0.5rem", width:"100%", justifyContent:"space-between", background:"rgba(100 100 100/ 20%)", padding:"1rem", paddingLeft:"1rem", borderRadius:"0.75rem"}}>

                <div style={{display:"flex", gap:"1rem", alignItems:"center", border:'', padding:"0.15rem"}}>

                    {
                        props.icon?
                        <div style={{border:"", color:props.priority=="low"?"dodgerblue":"goldenrod", display:"flex", alignItems:"flex-start",flex:1}}>
                    {props.icon}
                    </div>
                    :null
                    }
                    

                    <div style={{border:"", display:'flex', flexFlow:"column", width:"100%", gap:"0.15rem"}}>

                        <div style={{fontWeight:500, width:"100%", textAlign:"left", fontSize:"1rem", border:"", display:"flex", gap:"0.5rem", alignItems:"center"}}>
                            
                            <div style={{border:"", display:"flex", alignItems:"center", fontSize:"1.1rem", fontWeight:500}}>{props.title}</div>
                            {
                                props.tag?
                                <p style={{display:"flex", background:"rgba(100 100 100/ 20%)", fontSize:"0.8rem", alignItems:"center", padding:"", paddingLeft:"0.5rem", paddingRight:"0.5rem", borderRadius:"0.5rem", border:""}}>{props.tag}</p>
                                :null
                            }
                            
                        </div>
                        

        

                        {
                            props.civil_desc?
                
                            <div style={{display:"flex", gap:"0.5rem", alignItems:"center",textAlign:"left", fontWeight:400, fontSize:"0.8rem"}}>
                            {/* <p style={{fontSize:"1rem", color:"lightblue"}}>•</p> */}
                            <CreditCard width={"0.75rem"} color="dodgerblue" style={{border:''}}/>   
                            <p style={{textAlign:"left", opacity:0.75, color:props.civil_overdue?overdue_color:"white", fontWeight:props.civil_overdue?600:400}}>{props.civil_desc}</p>
                            </div>
                        
                            :null
                        }

                        {
                            props.vehicle_desc?
                
                                <div style={{display:"flex", gap:"0.5rem", alignItems:"center",textAlign:"left", fontWeight:400, fontSize:"0.8rem"}}>
                                    {/* <p style={{fontSize:"1rem", color:"lightblue"}}>•</p> */}
                                    <Car width={"0.75rem"} color="violet" style={{border:''}}/>   
                                    <p style={{textAlign:"left", opacity:0.75, color:props.vehicle_overdue?overdue_color:"white", fontWeight:props.vehicle_overdue?600:400}}>{props.vehicle_desc}</p>
                                </div>
                            
                            :null

                        }

                        {
                            props.medical_desc?
                
                                <div style={{display:"flex", gap:"0.5rem", alignItems:"center",textAlign:"left", fontWeight:400, fontSize:"0.8rem"}}>
                                    {/* <p style={{fontSize:"1rem", color:"lightblue"}}>•</p> */}
                                    <HeartPulse width={"0.75rem"} color="tomato" style={{border:''}}/>   
                                    <p style={{textAlign:"left", opacity:0.75, color:props.medical_overdue?overdue_color:"white", fontWeight:props.medical_overdue?600:400}}>{props.medical_desc}</p>
                                </div>
                            
                            :null

                        }

                        {   
                            props.passport_desc?
                
                                <div style={{display:"flex", gap:"0.5rem", alignItems:"center",textAlign:"left", fontWeight:400, fontSize:"0.8rem"}}>
                                    {/* <p style={{fontSize:"1rem", color:"lightblue"}}>•</p> */}
                                    <Book width={"0.75rem"} color="goldenrod" style={{border:''}}/>   
                                    <p style={{textAlign:"left", opacity:0.75, color:props.passport_overdue?overdue_color:"white", fontWeight:props.passport_overdue?600:400}}>{props.passport_desc}</p>
                                </div>
                            
                            :null

                        }

                        {
                            props.desc?
                            <p style={{opacity:0.5, fontSize:"0.8rem", padding:"0.15rem"}}>{props.desc}</p>
                            :null
                        }
                        

                        {
                            !props.hideButtons?
                            <div style={{display:"flex", width:"100%", justifyContent:"flex-start", gap:"0.5rem", fontSize:"1.25rem", paddingTop:"0.75rem"}}>

                            

                                {/* <button onClick={props.onReminderClick} style={{display:"flex", height:"2rem", fontSize:"0.8rem", border:'', paddingRight:"0.75rem", paddingLeft:"0.5rem"}}>
                                    <AtSign width={"1.1rem"} color='dodgerblue'/>
                                    {props.mail}
                                </button> */}

                                <p style={{fontWeight:600, fontSize:"0.8rem", color:props.typeColor, borderRadius:"0.5rem", background:"rgba(100 100 100/ 20%)", width:"fit-content",paddingLeft:"1rem", paddingRight:"1rem", alignItems:"center", display:"flex", height:"2rem"}}>{props.type}</p>

                            {/* <button onClick={props.onRenewClick} style={{display:"flex", width:"5.5rem", height:"2rem", fontSize:"0.8rem", border:''}}>
                                <Sparkles width={"1rem"} color='goldenrod' fill='goldenrod'/>
                                Renew
                            </button> */}

                        </div>
                        :null
                        }
                        
                        

                        
                        
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