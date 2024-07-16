import { LoadingOutlined } from "@ant-design/icons";
import { DialogTitle } from "@radix-ui/react-dialog";
import { ChevronLeft, Hash, X } from "lucide-react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "./dialog";

interface Props {
    open?: boolean
    title?: any
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
    created_on?:any
    progress?:string
    footerExtra?:any
    progressItem?:string
    bigDate?:any
    subtitle?:string
    code?:string
    tags?:boolean
}


export default function DefaultDialog(props:Props){
    
    return(
        <>
        <Dialog open={props.open}>

            <DialogContent onOpenAutoFocus={(e)=>e.preventDefault()}>

                <DialogHeader>
                    <DialogTitle className="heading" style={{userSelect:"none", width:"100%"}}>
                        <div className="flex" style={{border:"", justifyContent:"space-between"}}>
                            <div style={{display:"flex", alignItems:"center", gap:"1rem", border:"", width:"100%"}}>
                                <div style={{border:"", height:"100%", display:"flex"}}>
                                {props.titleIcon}
                                </div>
                                
                                
                                <div style={{display:"flex", flexFlow:"column", border:""}}>
                                    <div style={{display:"flex", alignItems:"center", border:"", gap:"0.75rem"}}>
                                        {props.title}
                                        <p onClick={props.bigDate} style={{fontWeight:400, fontSize:"1rem", opacity:0.5, letterSpacing:"0.075rem", display:"flex", gap:"0.5rem"}}>    
                                            {props.created_on}
                                        </p>
                                    </div>
                                
                                {
                                    props.code?
                                    <p style={{fontSize:"0.8rem", fontWeight:400, border:"1px solid rgba(100 100 100)",borderRadius:"0.5rem",paddingLeft:"0.25rem", textAlign:"left", opacity:"0.75", display:'flex', gap:"0.5rem",alignItems:"center"}}>
                                        <Hash color="dodgerblue" width={"0.8rem"}/>
                                        {props.code}
                                    </p>
                                    :null
                                }
                                
                                </div>
                                
                            
                                
                                
                                
                                
                            </div>

                            {props.title_extra}

                            
                        
                        </div>
                        <div style={{border:"", display:"flex", fontWeight:"600", fontSize:"0.8rem", color:"dodgerblue"}}>
                            <p style={{paddingLeft:"0.5rem",paddingRight:"0.5rem", borderRadius:"0.5rem", background:"rgba(100 100 100/ 20%)", marginLeft:"0.5rem"}}>{props.subtitle}</p>
                        </div>
                        
                    </DialogTitle>
                    {
                        props.tags?
                        <div style={{display:"flex", flexFlow:"column", gap:"0.5rem", border:"", width:"100%"}}>
                        <div style={{height:"2rem", border:"", width:"100%", display:'flex', gap:"0.5rem"}}>

                            <div style={{background:"rgba(100 100 100/ 25%)", fontSize:"0.8rem", display:"flex", alignItems:"center", paddingRight:"0.75rem", paddingLeft:"0.75rem", borderRadius:"0.5rem", opacity:0.5, gap:"0.25rem", flex:1, justifyContent:"center"}}>
                            <p>
                            Joined : 
                            </p>
                            <b>XXXX</b>
                            </div>

                            <div style={{background:"rgba(100 100 100/ 25%)", fontSize:"0.8rem", display:"flex", alignItems:"center", paddingRight:"0.75rem", paddingLeft:"0.75rem", borderRadius:"0.5rem", opacity:0.5, gap:"0.25rem", flex:1, justifyContent:"center"}}>Basic Salary: <b>XXXX</b>
                            </div>

                        </div>

                        <div style={{height:"2rem", border:"", width:"100%", display:'flex', gap:"0.5rem"}}>

                            <div style={{background:"rgba(100 100 100/ 25%)", fontSize:"0.8rem", display:"flex", alignItems:"center", paddingRight:"0.75rem", paddingLeft:"0.75rem", borderRadius:"0.5rem", opacity:0.5, gap:"0.25rem", flex:1, justifyContent:"center"}}>
                            <p>
                            Allowance : 
                            </p>
                            <b>XX</b>
                            </div>

                            <div style={{background:"rgba(100 100 100/ 25%)", fontSize:"0.8rem", display:"flex", alignItems:"center", paddingRight:"0.75rem", paddingLeft:"0.75rem", borderRadius:"0.5rem", opacity:0.5, gap:"0.25rem", flex:1, justifyContent:"center"}}>Leaves : <b>XX</b>
                            </div>
                            
                        </div>
                        </div>
                        
                        

                    
                    :null
                    }
                    
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

                    {
                        props.progress?
                            <div style={{display:"flex", flexFlow:"column", gap:"0.25rem", width:"100%"}}>
                                <p style={{fontSize:"0.7rem", opacity:0.5}}>{props.progressItem}</p>

                                <div style={{width:"100%", height:"0.25rem", background:"rgba(100 100 100/ 20%)", borderRadius:"0.5rem", display:"flex", flexFlow:"column"}}>
                                    <div style={{background:"brown", width:props.progress, height:"0.25rem", borderRadius:"0.5rem"}}></div>
                                </div>

                            </div>
                            
                        :null
                    }
                    
                    
                    
                </DialogHeader>

                <DialogFooter>
                    <div style={{display:"flex", flexFlow:"column", width:"100%", gap:"0.5rem"}}>
                    {
                        props.footerExtra?
                        
                            props.footerExtra
                        
                        :null
                    }
                    {
                        props.close?
                        <button onClick={props.onCancel} style={{width:"100%", fontSize:"0.9rem"}}>
                            {
                                props.back?
                                <>
                                <ChevronLeft color="dodgerblue" width={"1rem"}/><p>Back</p>
                                </>
                                
                                :
                                <>
                                <X width="1rem" color="crimson"/><p>Close</p>
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
                    </div>
                    
                    
                </DialogFooter>

            </DialogContent>
        </Dialog>
        </>
    )
}