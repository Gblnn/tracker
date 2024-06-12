import Back from "@/components/back"
import { Car } from "lucide-react"
import {motion} from 'framer-motion'

export default function Vehicles(){
    return(
        <div style={{margin:"1.25rem"}}>
            <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
            <Back icon={<Car color="dodgerblue"/>} title="Vehicles"/>
            </motion.div>
        </div>
    )
}