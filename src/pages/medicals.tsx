import Back from "@/components/back"
import { HeartPulse } from "lucide-react"
import {motion} from 'framer-motion'

export default function Medicals(){
    return(
        <div style={{margin:"1.25rem"}}>
            <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                <Back icon={<HeartPulse color="tomato"/>} title="Medicals"/>
            </motion.div>
        </div>
    )
}