import * as PusherPushNotifications from "@pusher/push-notifications-web";
import { Bell, BellOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DefaultDialog from "../components/ui/default-dialog";
import '../../app/globals.css'

function NotifyButton() {

    const beamsClient = new PusherPushNotifications.Client({
        instanceId: 'a0778d43-e9c4-4ba8-bf32-ad8788e08d1b',
      });

    const [notify, setNotify] = useState(Boolean(beamsClient.getRegistrationState))
    const [enableprompt, setEnablePrompt] = useState(false)
    const [disableprompt, setDisablePrompt] = useState(false)
    

  

  const handleClick = () => {
    !notify?
    setEnablePrompt(true)
    :
    setDisablePrompt(true)
  }

  const Register = () => {
    beamsClient.start()
    .then(() => beamsClient.addDeviceInterest('debug-test'))
    .then(() => {console.log('Successfully registered and subscribed!');})
    .catch(console.error);
    console.log(beamsClient.getRegistrationState)
    setEnablePrompt(false)
    setNotify(true)
    toast("Notification Enabled", {
        description: "Notifications enabled on channel debug",
        action: {
          label: "Close",
          onClick: () => console.log("Undo"),
        },
      })
  }

  const Disable = () => {
    setDisablePrompt(false)
    setNotify(false)
    beamsClient.clearDeviceInterests().then(()=>console.log("Notifications Disabled")).catch(console.error)
    toast("Notification Disabled", {
        description: "Notifications disabled on channel debug",
        action: {
          label: "Close",
          onClick: () => console.log("Undo"),
        },
      })
  }

  
    
  return (
    <>
    {/* Enable Prompt */}
    <DefaultDialog onCancel={()=>{setEnablePrompt(!enableprompt)}} open={enableprompt} titleIcon={<Bell/>} title="Enable Notifications?" OkButtonText="Enable" onOk={()=>{Register();}}/>

    <DefaultDialog open={disableprompt} titleIcon={<BellOff/>} title="Disable Notifications?" OkButtonText="Disable" onCancel={()=>setDisablePrompt(!disableprompt)} onOk={Disable}/>

    
    
    <button style={{}} onClick={handleClick}>{notify?<Bell width={"1.25rem"} height={"1.25rem"}/>:<BellOff width={"1.25rem"} height={"1.25rem"}/>}</button>

    
    </>
  )
}

export default NotifyButton
