import Back from "@/components/back";
import Directive from "@/components/directive";
import DefaultDialog from "@/components/ui/default-dialog";
import { motion } from 'framer-motion';
import { File, Indent, Mail, RefreshCwIcon } from "lucide-react";
import { useState } from "react";

export default function Index(){

    const [requestDialog, setRequestDialog] = useState(false)

    return(
        <div style={{padding:"1.5rem", background:"linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%), rgba(100 100 100/ 0%))", height:"100svh"}}>
            <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                <Back icon={<Indent color="salmon"/>} title="Index" noback extra={<button onClick={()=>window.location.reload()} style={{paddingLeft:"1rem", paddingRight:"1rem", fontSize:"0.8rem"}}><RefreshCwIcon width={"1rem"}/>Update<p style={{opacity:0.5, letterSpacing:"0.15rem"}}>v1.3</p></button>}/>
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