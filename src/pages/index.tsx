import Back from "@/components/back";
import Directive from "@/components/directive";
import DefaultDialog from "@/components/ui/default-dialog";
import { motion } from 'framer-motion';
import { File, Indent, Mail, Plus } from "lucide-react";
import { useState } from "react";

export default function Index(){

    const [requestDialog, setRequestDialog] = useState(false)

    return(
        <div style={{margin:"1.5rem"}}>
            <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>

            <Back icon={<Indent color="salmon"/>} title="Index" noback/>

            <br/>
            <div style={{display:"flex", flexFlow:"column", gap:"0.5rem"}}>

            <Directive to="/records" title="Records" icon={<File color="violet" width={"1.1rem"} height={"1.1rem"}/>}/>

            {/* <Directive to="/vehicles" title="Vehicles" icon={<Car color="dodgerblue" width={"1.1rem"} height={"1.1rem"}/>}/>

            <Directive to="/medicals" title="Medicals" icon={<HeartPulse color="tomato" width={"1.1rem"} height={"1.1rem"}/>}/> */}

            <Directive onClick={()=>{setRequestDialog(true)}} title="Request Feature" icon={<Plus color="grey" width={"1.1rem"} height={"1.1rem"}/>}/>

            <DefaultDialog titleIcon={<Mail/>} title="Request Feature" desc="Reach out to the developer to request a new feature? You will be redirected to your e-mail client" open={requestDialog} OkButtonText="Reach out" onCancel={()=>setRequestDialog(false)} sendmail/>
            </div>
            </motion.div>
        </div>
    )
}