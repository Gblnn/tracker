import Back from "@/components/back"
import Directive from "@/components/directive"
import DropDown from "@/components/dropdown"
import DefaultDialog from "@/components/ui/default-dialog"
import { motion } from 'framer-motion'
import { Car, CreditCard, EllipsisVerticalIcon, HeartPulse, User, X } from "lucide-react"
import { useState } from "react"

export default function UserPage(){

    const [deleteDialog, setDeleteDialog] = useState(false)

    // const DeleteRecord = async () =>{

    // }

    return(
        <div style={{margin:"1.25rem"}}>
            <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                <Back icon={<User color="violet"/>} title={window.name} extra={<DropDown trigger={<EllipsisVerticalIcon width={"1.1rem"}/>} onDelete={()=>setDeleteDialog(true)}/>}/>
                <br/>
                <div style={{display:"flex", flexFlow:"column", gap:"0.5rem"}}>
                    <Directive to="civil-id" icon={<CreditCard width={"1.1rem"} height={"1.1rem"} color="dodgerblue"/>} title="Civil ID"/>

                    <Directive icon={<Car width={"1.1rem"} height={"1.1rem"} color="goldenrod"/>} title="Vehicle"/>

                    <Directive icon={<HeartPulse width={"1.1rem"} height={"1.1rem"} color="tomato"/>} title="Medical"/>
                </div>
            </motion.div>
            <DefaultDialog titleIcon={<X/>} title="Delete Record?" desc="This will permanently delete the record and all data associated to it." open={deleteDialog} onCancel={()=>setDeleteDialog(false)} OkButtonText="Delete" destructive/>
        </div>
    )
}