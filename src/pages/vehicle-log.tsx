import AddRecordButton from "@/components/add-record-button";
import Back from "@/components/back";
import Directive from "@/components/directive";
import InboxComponent from "@/components/inbox-component";
import DefaultDialog from "@/components/ui/default-dialog";
import { motion } from 'framer-motion';
import { Car, CarFront, Fuel, Mail, Plus, Wrench } from "lucide-react";
import { useState } from "react";

export default function VehicleLog(){

    const [addLogDialog, setAddLogDialog] = useState(false)

    return(
        <div style={{margin:"1.5rem"}}>
            <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                <Back icon={<CarFront color="salmon"/>} title="Vehicle Log" noback/>
                <br/>

                <div style={{display:"flex", flexFlow:"column", gap:"0.5rem"}}>

                    <InboxComponent hideButtons title="Log Expense" icon={<Fuel/>} desc="Spent XXXX on fuel at 12:00pm"/>

                    {/* <Directive onClick={()=>{setRequestDialog(true)}} title="Request Feature" icon={<Plus color="grey" width={"1.1rem"} height={"1.1rem"}/>}/> */}

                </div>
            </motion.div>

            <AddRecordButton title="Add Log" icon={<Plus width={"1rem"} color="dodgerblue"/>} onClick={()=>setAddLogDialog(true)}/>

            <DefaultDialog titleIcon={<Car/>} title={"Add Log"} open={addLogDialog} onCancel={()=>setAddLogDialog(false)} close
            extra={
                <div style={{border:"", width:"100%", display:"flex", flexFlow:"column", gap:"0.5rem"}}>
                    <Directive icon={<Fuel color="goldenrod"/>} title="Fuel Expense"/>
                    <Directive icon={<CarFront color="salmon"/>} title="Oil Change"/>
                    <Directive icon={<Wrench color="dodgerblue"/>} title="Repair"/>
                </div>
            }
            />
            
        </div>
    )
}