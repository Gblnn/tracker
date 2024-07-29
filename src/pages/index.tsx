import Back from "@/components/back";
import Directive from "@/components/directive";
import InputDialog from "@/components/input-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DefaultDialog from "@/components/ui/default-dialog";
import { motion } from 'framer-motion';
import { Inbox, KeyRound, Mail, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Index(){

    const [requestDialog, setRequestDialog] = useState(false)
    const [loginPrompt, setLoginPrompt] = useState(false)
    const usenavigate = useNavigate()

    return(
        <>
        {/* <div style={{border:"", display:"flex", alignItems:"center", justifyContent:'center'}}>
        <ConfettiExplosion/>
        </div> */}
        <div style={{padding:"1.25rem", background:"linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%))", height:"100svh"}}>
            <motion.div initial={{opacity:0}} whileInView={{opacity:1}}>
                <Back title="Index" noback 
                extra={
                    <div style={{display:"flex", gap:"0.5rem"}}>
                        <button onClick={()=>window.location.reload()} style={{paddingLeft:"1rem", paddingRight:"1rem", fontSize:"0.8rem"}}>
                            <RefreshCcw width={"1rem"} color="dodgerblue"/>
                            <p style={{opacity:0.5, letterSpacing:"0.15rem"}}>
                                v1.12
                            </p>
                        </button>

                        

                        <button onClick={()=>usenavigate("/inbox")} style={{ width:"3rem", background:"rgba(220 20 60/ 20%)"}}>
                            <Inbox className="" color="crimson"/>
                        </button>

                        {/* <button onClick={()=>{signOut(auth);usenavigate("/")}} style={{width:"3rem"}}><LogOut width={"1rem"} color='lightcoral'/></button> */}
                    </div>
                
            }/>
                <br/>

                <div style={{display:"flex", flexFlow:"column", gap:"0.5rem"}}>

                    <Directive onClick={()=>{setLoginPrompt(true)}} title="Sohar Star United" 
                    icon={

                        <Avatar style={{width:"1.25rem", height:"1.25rem", border:""}}>
                            <AvatarImage style={{objectFit:"cover"}} src={"/sohar_star_logo.png"}/>
                            <AvatarFallback>
                                <p style={{paddingTop:"0.1rem"}}>{"S"}</p>
                            </AvatarFallback>
                        </Avatar>
                
                    }/>

                    <Directive to="/vale-records" title="Vale Team" icon={<img src="/vale-logo.png" style={{width:"1.25rem", paddingBottom:"0.25rem"}}/>}/>

                    {/* <Directive onClick={()=>{setRequestDialog(true)}} title="Request Feature" icon={<Plus color="grey" width={"1.1rem"} height={"1.1rem"}/>}/> */}

                </div>
            </motion.div>

            <DefaultDialog titleIcon={<Mail/>} title="Request Feature" extra={<p style={{fontSize:"0.85rem", opacity:0.5, marginBottom:"0.5rem"}}>Reach out to the developer to request a new feature? You will be redirected to your e-mail client</p>} open={requestDialog} OkButtonText="Reach out" onCancel={()=>setRequestDialog(false)} sendmail/>

            <InputDialog title={"Protected Route"} desc="Enter key to continue" titleIcon={<KeyRound color="dodgerblue"/>} open={loginPrompt} onCancel={()=>setLoginPrompt(false)} OkButtonText="Continue" inputplaceholder="Password"  onOk={()=>usenavigate("/records")}/>
            
        </div>
        </>
        
    )
}