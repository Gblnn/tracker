import Back from "@/components/back";
import Directive from "@/components/directive";
import DefaultDialog from "@/components/ui/default-dialog";
import { motion } from 'framer-motion';
import { File, History, Indent, Mail } from "lucide-react";
import { useState } from "react";

export default function Index(){

    const [requestDialog, setRequestDialog] = useState(false)

    return(
        <div style={{margin:"1.5rem"}}>
            <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                <Back icon={<Indent color="salmon"/>} title="Index" noback extra={
                    <div style={{display:"flex"}}>
                        <button><History color="grey"/></button>
                    </div>
                }/>
                <br/>

                <div style={{display:"flex", flexFlow:"column", gap:"0.5rem"}}>

                    <Directive to="/records" title="Personal Records" icon={<File color="violet" width={"1.1rem"} height={"1.1rem"}/>}/>

                    {/* <Directive onClick={()=>{setRequestDialog(true)}} title="Request Feature" icon={<Plus color="grey" width={"1.1rem"} height={"1.1rem"}/>}/> */}

                </div>
            </motion.div>

            <DefaultDialog titleIcon={<Mail/>} title="Request Feature" extra={<p style={{fontSize:"0.85rem", opacity:0.5, marginBottom:"0.5rem"}}>Reach out to the developer to request a new feature? You will be redirected to your e-mail client</p>} open={requestDialog} OkButtonText="Reach out" onCancel={()=>setRequestDialog(false)} sendmail/>
            
        </div>
    )
}