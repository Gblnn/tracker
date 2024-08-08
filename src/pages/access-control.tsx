import Back from "@/components/back";
import Directive from "@/components/directive";
import InputDialog from "@/components/input-dialog";
import DefaultDialog from "@/components/ui/default-dialog";
import { motion } from 'framer-motion';
import { KeyRound, Plus, User, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AccessControl(){

    const [manageUsersDialog, setManageUsersDialog] = useState(false)
    const [confirmDialog, setConfirmDialog] = useState(false)
    const [createUserDialog, setCreateUserDialog] = useState(false)
    const usenavigate = useNavigate()

    return(
        <>
        {/* <div style={{border:"", display:"flex", alignItems:"center", justifyContent:'center'}}>
        <ConfettiExplosion/>
        </div> */}
        <div style={{padding:"1.25rem", background:"linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%))", height:"100svh"}}>

            <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>

                <Back title="Access Control" 
                />
                <br/>

                <div style={{display:"flex", flexFlow:"column", gap:"0.5rem"}}>

                    <Directive onClick={()=>{setManageUsersDialog(true)}} icon={<User width={"1rem"} color="dodgerblue"/>} title="Manage Users"/>
                    <Directive onClick={()=>{setConfirmDialog(true)}} icon={<KeyRound width={"1rem"} color="dodgerblue"/>} title="Route Protection"/>

                </div>
            </motion.div>

            <DefaultDialog close title={"Manage Users"} titleIcon={<Users color="dodgerblue"/>} open={manageUsersDialog} onCancel={()=>setManageUsersDialog(false)} OkButtonText="Continue"  onOk={()=>usenavigate("/records")}
            extra={
                <div style={{display:"flex", width:"100%"}}>
                    <Directive onClick={()=>setCreateUserDialog(true)} title="Add a new user" icon={<Plus color="dodgerblue" width={"1rem"}/>}/>
                </div>
            }
            />

            <InputDialog open={confirmDialog} onCancel={()=>setConfirmDialog(false)} title="Verification" titleIcon={<KeyRound color="dodgerblue"/>} inputplaceholder="Enter Password" OkButtonText="Continue"/>

            <InputDialog title="Create New User" titleIcon={<UserPlus color="dodgerblue"/>} open={createUserDialog} onCancel={()=>setCreateUserDialog(false)} OkButtonText="Continue" inputplaceholder="Enter Email" input2placeholder="Enter Password" input3placeholder="Confirm Password"/>
            
        </div>
        </>
        
    )
}