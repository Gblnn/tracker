import Back from "@/components/back";
import Directive from "@/components/directive";
import DefaultDialog from "@/components/ui/default-dialog";
import { motion } from 'framer-motion';
import { File, InboxIcon, Indent, Mail } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Index(){

    const [requestDialog, setRequestDialog] = useState(false)
    const usenavigate = useNavigate()

    return(
        <div style={{margin:"1.5rem"}}>
            <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                <Back icon={<Indent color="salmon"/>} title="Index" noback extra={
                    <button onClick={()=>usenavigate("/inbox")} style={{ width:"3rem", background:"rgba(220 20 60/ 20%)"}}>
                    <InboxIcon className="" color="crimson"/>
                </button>
                }/>
                <br/>

                <div style={{display:"flex", flexFlow:"column", gap:"0.5rem"}}>

                    <Directive to="/records" title="Personal Records" icon={<File color="dodgerblue" width={"1.1rem"} height={"1.1rem"}/>}/>

                    <Directive to="/vale-records" title="Vale Records" icon={<img src="/vale-logo.png" style={{width:"1.25rem", paddingBottom:"0.25rem"}}/>}/>

                    {/* <Directive onClick={()=>{setRequestDialog(true)}} title="Request Feature" icon={<Plus color="grey" width={"1.1rem"} height={"1.1rem"}/>}/> */}

                </div>
            </motion.div>

            <DefaultDialog titleIcon={<Mail/>} title="Request Feature" extra={<p style={{fontSize:"0.85rem", opacity:0.5, marginBottom:"0.5rem"}}>Reach out to the developer to request a new feature? You will be redirected to your e-mail client</p>} open={requestDialog} OkButtonText="Reach out" onCancel={()=>setRequestDialog(false)} sendmail/>
            
        </div>
    )
}