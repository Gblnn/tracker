import { DialogTitle } from "@radix-ui/react-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "./dialog";
import { Button } from "./button";
import { ChevronLeft, X } from "lucide-react";
import {LoadingOutlined} from "@ant-design/icons"

interface Props {
    open?: boolean
    title?: string
    titleIcon?:any
    desc?:string
    OkButtonText?: string
    CancelButtonText?:string
    onOk?:any
    onCancel?:any
    destructive?:boolean
    extra?:any
    close?:boolean
    title_extra?:any
    disabled?:boolean
    back?:boolean
    sendmail?:boolean
    updating?:boolean
    created_on?:string
}

export default function DefaultDialog(props:Props){
    
    return(
        <>
        <Dialog open={props.open}>

            <DialogContent onOpenAutoFocus={(e)=>e.preventDefault()}>

                <DialogHeader>
                    <DialogTitle className="heading" style={{userSelect:"none", width:"100%"}}>
                        <div className="flex" style={{border:"", justifyContent:"space-between"}}>
                            <div style={{display:"flex", alignItems:"center", gap:"0.75rem"}}>
                                {props.titleIcon}
                                {props.title}
                                <p style={{fontWeight:500, fontSize:"0.8rem", opacity:0.5, letterSpacing:"0.075rem", display:"flex", gap:"0.5rem"}}>
                                    
                                    {props.created_on}
                                    
                                    
                                </p>
                            </div>

                            {props.title_extra}
                        
                        </div>
                        
                    </DialogTitle>
                    {
                        props.desc?
                        <p style={{textAlign:"left",width:"100%", fontSize:"0.9rem", opacity:0.5, height:"2rem", marginBottom:""}}>{props.desc}</p>
                        :null
                    }

                    {
                        props.extra?
                        
                            props.extra
                        
                        :null 
                    }
                    
                    
                    
                </DialogHeader>

                <DialogFooter>
                    {
                        props.close?
                        <button onClick={props.onCancel} style={{width:"100%", fontSize:"0.9rem"}}>
                            {
                                props.back?
                                <>
                                <ChevronLeft width={"1rem"}/><p>Back</p>
                                </>
                                
                                :
                                <>
                                <X width="1rem"/><p>Close</p>
                                </>
                                
                            }
                        </button>
                            
                        :
                        <div style={{width:"100%", display:"flex", gap:"0.5rem", justifyContent:"center"}}>
                            
                        <Button className={props.disabled?"disabled":""} variant={props.destructive?"destructive":"default"} id="okBtn" onClick={!props.updating?props.onOk:null} style={{flex:1}}>
                            {
                                props.sendmail?
                                <a href="mailto:Gokul.nathiel2305@gmail.com" target="_blank" rel="noopener noreferer">
                                    {props.OkButtonText}
                                </a>
                                :
                                
                                <div style={{display:"flex", gap:"0.5rem", alignItems:"center"}}>
                                    {
                                        props.updating?
                                        <LoadingOutlined/>
                                        :null    
                                    }
                                    
                                    {props.OkButtonText}
                                </div>
                                
                            }
                            
                            
                        </Button>

                        <Button variant={"ghost"} id="cancelBtn" onClick={props.onCancel} style={{flex:1}}>
                            Cancel
                        </Button>
                    </div>
                    }
                    
                </DialogFooter>

            </DialogContent>
        </Dialog>
        </>
    )
}