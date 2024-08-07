
import Back from "@/components/back"
import Directive from "@/components/directive"
import InputDialog from "@/components/input-dialog"
import { motion } from "framer-motion"
import { Plus, UserPlus } from "lucide-react"
import { useState } from "react"

export default function AdminPage() {

    const [addUserDialog, setAddUserDialog] = useState(false)

    // const [email, setEmail] = useState("")
    // const [password, setPassword] = useState("")

    // const Authenticate = () => {

    // }

    return(
        <div style={{padding:"1.25rem", background:"linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%))", height:"100svh"}}>
            <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                <Back title="Admin"  
                extra={
                    <div style={{display:"flex", gap:"0.5rem"}}>

                    </div>
                }/>

                <br/>

                <div style={{display:"flex", flexFlow:"column", gap:"0.5rem"}}>

                    <Directive title="Add a user"
                    icon={<Plus width={"1.1rem"} color="dodgerblue"/>} 
                    onClick={()=>setAddUserDialog(true)}
                    />

                </div>

            </motion.div>

            <InputDialog titleIcon={<UserPlus color="dodgerblue"/>} open={addUserDialog} title={"Add User"} OkButtonText="Add" inputplaceholder="Enter Email" input2placeholder="Enter Password" input3placeholder="Confirm Password" onCancel={()=>setAddUserDialog(false)}/>

        </div>
    )
}