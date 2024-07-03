// import AddRecordButton from "@/components/add-record-button";
// import Back from "@/components/back";
// import Directive from "@/components/directive";
// import InboxComponent from "@/components/inbox-component";
// import DefaultDialog from "@/components/ui/default-dialog";
// import { motion } from 'framer-motion';
// import { Car, CarFront, Fuel, Plus, User, Wrench } from "lucide-react";
// import { useState } from "react";

// export default function VehicleLog(){

//     const [loading, setLoading] = useState(false)
//     const [addLogDialog, setAddLogDialog] = useState(false)
//     const [fuelExpenseDialog, setFuelExpenseDialog] = useState(false)
//     const [amount, setAmount] = useState("")

//     return(
//         <div style={{margin:"1.5rem"}}>
//             <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
//                 <Back icon={<Wrench color="salmon"/>} title="Maintenance Log" noback extra={
//                     <><button><User color="dodgerblue"/></button></>
//                     }/>
//                 <br/>

//                 <div style={{display:"flex", flexFlow:"column", gap:"0.5rem"}}>

//                     <InboxComponent hideButtons title="Vehicle Make" icon={<Car color="violet"/>} tag={"57483/H"} desc="Name of owner"/>

//                     {/* <Directive onClick={()=>{setRequestDialog(true)}} title="Request Feature" icon={<Plus color="grey" width={"1.1rem"} height={"1.1rem"}/>}/> */}

//                 </div>
//             </motion.div>

//             <AddRecordButton title="Add Log" icon={<Plus width={"1rem"} color="dodgerblue"/>} onClick={()=>setAddLogDialog(true)}/>

//             <DefaultDialog titleIcon={<Car/>} title={"Add Log"} open={addLogDialog} onCancel={()=>setAddLogDialog(false)} close
//             extra={
//                 <div style={{border:"", width:"100%", display:"flex", flexFlow:"column", gap:"0.5rem"}}>
//                     <Directive onClick={()=>setFuelExpenseDialog(true)} icon={<Fuel color="goldenrod"/>} title="Fuel Expense" />
//                     <Directive icon={<CarFront color="violet"/>} title="Oil Change"/>
//                     <Directive icon={<Wrench color="dodgerblue"/>} title="Repair"/>
//                 </div>
//             }
//             />

//             <DefaultDialog titleIcon={<Fuel color="goldenrod"/>} title={"Fuel Expense"} open={fuelExpenseDialog} disabled={loading||amount?false:true} onCancel={()=>{setFuelExpenseDialog(false);setAmount("")}} OkButtonText="Add Log" 
//             extra={
//             <div style={{display:"flex", border:"", width:"100%"}}>
//                 <input type="text" style={{fontSize:"1.5rem"}} placeholder="Enter Amount" onChange={(e)=>setAmount(e.target.value)}></input>
//             </div>
//         }/>
            
//         </div>
//     )
// }