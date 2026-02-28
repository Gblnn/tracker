import { Tooltip } from 'antd'
import { motion } from 'framer-motion'
import { BellOff, Book, Car, CreditCard, Disc, HeartPulse, Inbox } from "lucide-react"
import { Link } from "react-router-dom"
import InboxComponentDesc from './inbox-component-desc'

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
    vt_hse_induction_desc?:string
    vt_hse_induction_overdue?:boolean
    vt_car_1_desc?:string
    vt_car_1_overdue?:boolean
    vt_car_2_desc?:string
    vt_car_2_overdue?:boolean
    vt_car_3_desc?:string
    vt_car_3_overdue?:boolean
    vt_car_4_desc?:string
    vt_car_4_overdue?:boolean
    vt_car_5_desc?:string
    vt_car_5_overdue?:boolean
    vt_car_6_desc?:string
    vt_car_6_overdue?:boolean
    vt_car_7_desc?:string
    vt_car_7_overdue?:boolean
    vt_car_8_desc?:string
    vt_car_8_overdue?:boolean
    vt_car_9_desc?:string
    vt_car_9_overdue?:boolean
    vt_car_10_desc?:string
    vt_car_10_overdue?:boolean
    hidden?:boolean
    noArrow?:boolean
    onReminderClick?:any
    onRenewClick?:any
    hideButtons?:boolean
    desc?:string
    mail?:string
    type?:string
    typeColor?:string
    typeIcon?:any
    notify?:boolean
    archived?:boolean
}


export default function InboxComponent(props:Props){

    return(
        <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
        <Link className={props.hidden==true?"hidden":"visible"} to={props.to}>

            <div onClick={props.onClick} style={{ gap:"0.5rem", width:"100%", justifyContent:"space-between", background:"rgba(100 100 100/ 10%)", padding:"1rem", paddingLeft:"1rem", borderRadius:"0.75rem"}}>

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
                            
                            <div style={{border:"", display:"flex", alignItems:"center", fontSize:"1.1rem", fontWeight:500}}><p>{props.title}</p>
                            </div>
                            {
                                props.tag?
                                <p style={{display:"flex", background:"rgba(100 100 100/ 20%)", fontSize:"0.8rem", alignItems:"center", padding:"", paddingLeft:"0.5rem", paddingRight:"0.5rem", borderRadius:"0.5rem", border:""}}>{props.tag}</p>
                                :null
                            }
                            
                        </div>
                        

        

                        {
                            props.civil_desc?
                
                            <InboxComponentDesc icon={<CreditCard width={"0.75rem"} color="dodgerblue"/>} desc={props.civil_desc} overdue={props.civil_overdue}/>
                        
                            :null
                        }
                        

                        {
                            props.vehicle_desc?

                            <InboxComponentDesc icon={<Car width={"0.75rem"} color="violet"/>} desc={props.vehicle_desc} overdue={props.vehicle_overdue}/>
                            
                            :null

                        }

                        {
                            props.medical_desc?
                
                                <InboxComponentDesc icon={<HeartPulse width={"0.75rem"} color="tomato"/>} desc={props.medical_desc} overdue={props.medical_overdue}/>
                            
                            :null

                        }

                        {   
                            props.passport_desc?
                
                            <InboxComponentDesc icon={<Book width={"0.75rem"} color="goldenrod"/>} desc={props.passport_desc} overdue={props.passport_overdue}/>
                            
                            :null

                        }

                        

{   
                            props.vt_hse_induction_desc?
                
                                <InboxComponentDesc icon={<Disc width={"0.75rem"} color="dodgerblue"/>} desc={props.vt_hse_induction_desc} overdue={props.vt_hse_induction_overdue}/>
                            
                            :null

                        }

                        {   
                            props.vt_car_1_desc?
                
                            <InboxComponentDesc icon={<Disc width={"0.75rem"} color="dodgerblue"/>} desc={props.vt_car_1_desc} overdue={props.vt_car_1_overdue}/>
                            
                            :null

                        }

                        {   
                            props.vt_car_2_desc?
                
                            <InboxComponentDesc icon={<Disc width={"0.75rem"} color="dodgerblue" style={{border:''}}/>} desc={props.vt_car_2_desc} overdue={props.vt_car_2_overdue}/>
                            
                            :null

                        }
                        {   
                            props.vt_car_3_desc?
                
                            <InboxComponentDesc icon={<Disc width={"0.75rem"} color="dodgerblue" style={{border:''}}/>} desc={props.vt_car_3_desc} overdue={props.vt_car_3_overdue}/>
                            
                            :null

                        }
                        {   
                            props.vt_car_4_desc?
                
                            <InboxComponentDesc icon={<Disc width={"0.75rem"} color="dodgerblue" style={{border:''}}/>} desc={props.vt_car_4_desc} overdue={props.vt_car_4_overdue}/>
                            
                            :null

                        }
                        {   
                            props.vt_car_5_desc?
                
                            <InboxComponentDesc icon={<Disc width={"0.75rem"} color="dodgerblue" style={{border:''}}/>} desc={props.vt_car_5_desc} overdue={props.vt_car_5_overdue}/>
                            
                            :null

                        }
                        {   
                            props.vt_car_6_desc?
                
                            <InboxComponentDesc icon={<Disc width={"0.75rem"} color="dodgerblue" style={{border:''}}/>} desc={props.vt_car_6_desc} overdue={props.vt_car_6_overdue}/>
                            
                            :null

                        }
                        {   
                            props.vt_car_7_desc?
                
                            <InboxComponentDesc icon={<Disc width={"0.75rem"} color="dodgerblue" style={{border:''}}/>} desc={props.vt_car_7_desc} overdue={props.vt_car_7_overdue}/>
                            
                            :null

                        }
                        {   
                            props.vt_car_8_desc?
                
                            <InboxComponentDesc icon={<Disc width={"0.75rem"} color="dodgerblue" style={{border:''}}/>} desc={props.vt_car_8_desc} overdue={props.vt_car_8_overdue}/>
                            
                            :null

                        }
                        {   
                            props.vt_car_9_desc?
                
                            <InboxComponentDesc icon={<Disc width={"0.75rem"} color="dodgerblue" style={{border:''}}/>} desc={props.vt_car_9_desc} overdue={props.vt_car_9_overdue}/>
                            
                            :null

                        }
                        {   
                            props.vt_car_10_desc?
                
                            <InboxComponentDesc icon={<Disc width={"0.75rem"} color="dodgerblue" style={{border:''}}/>} desc={props.vt_car_10_desc} overdue={props.vt_car_10_overdue}/>
                            
                            :null

                        }
                        

                        {
                            props.desc?
                            <p style={{opacity:0.5, fontSize:"0.8rem", padding:"0.15rem"}}>{props.desc}</p>
                            :null
                        }
                        

                        {
                            !props.hideButtons?
                            <div style={{display:"flex", width:"100%", justifyContent:"flex-start", gap:"0.5rem", fontSize:"1.25rem", paddingTop:"0.75rem", alignItems:"center"}}>

                            

                                {/* <button onClick={props.onReminderClick} style={{display:"flex", height:"2rem", fontSize:"0.8rem", border:'', paddingRight:"0.75rem", paddingLeft:"0.5rem"}}>
                                    <AtSign width={"1.1rem"} color='dodgerblue'/>
                                    {props.mail}
                                </button> */}
                                {
                                    props.type&&
                                    <div style={{fontWeight:500, fontSize:"0.8rem", color:props.typeColor, borderRadius:"0.5rem", background:"rgba(100 100 100/ 20%)", width:"fit-content",paddingLeft:"0.5rem", paddingRight:"0.75rem", alignItems:"center", display:"flex", height:"2rem", gap:"0.5rem"}}>
                                {props.typeIcon}
                                    <p>
                                        {props.type}
                                    </p>
                                    
                                </div>
                                }
                                
                                
                                {
                                    props.notify?
                                    <Tooltip title={props.archived?"All notifications paused":"This person will not be notified"}>
                                        <button style={{height:"2rem", fontSize:"0.8rem", paddingRight:"1rem", paddingLeft:"1rem", opacity:0.5}}>
                                            {
                                                props.archived&&
                                                <Inbox width={"1rem"}/>
                                                
                                            }
                                            {
                                                props.archived?
                                                "Archived"
                                                :
                                                <BellOff width={"1rem"} color='grey'/>
                                            }
                                            
                                        </button>
                                    </Tooltip>
                                    
                                    
                                    :null
                                }
                                
                                

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