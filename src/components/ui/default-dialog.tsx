import { LoadingOutlined } from "@ant-design/icons";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Tooltip } from "antd";
import { ChevronLeft, Hash, Phone, X } from "lucide-react";
import Directive from "../directive";
import { Button } from "./button";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "./dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

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
    codeIcon?:any
    tags?:boolean
    tag1OnClick?:any
    tag2OnClick?:any
    tag3OnClick?:any
    tag4OnClick?:any
    tag1Text?:any
    tag2Text?:any
    tag3Text?:any
    tag4Text?:any
    onBottomTagClick?:any
    bottomValueLoading?:boolean
    bottomTagValue?:any
    codeTooltip?:string
    renumeration?:boolean
    remarksOnClick?:any
    remarksValue?:string
    dialogBackground?:any
    dialogHeight?:any
    creation_date?:string
    contact?:string
}


export default function DefaultDialog(props:Props){
    
    return(
        <>
        <Dialog open={props.open}>

            <DialogContent style={{background:props.dialogBackground, backgroundRepeat:"no-repeat", backgroundSize:"cover"}} onOpenAutoFocus={(e)=>e.preventDefault()}>

                <DialogHeader>
                    {
                        props.title&&
                        <DialogTitle className="heading" style={{userSelect:"none", width:"100%", borderBottom:"1px solid rgba(100 100 100/ 50%)", paddingBottom:"1rem"}}>
                        <div className="flex" style={{border:"", justifyContent:"space-between"}}>
                            <div style={{display:"flex", alignItems:"center", gap:"1rem", border:"", width:"100%"}}>
                                <div style={{border:"", height:"100%", display:"flex"}}>
                                {props.titleIcon}
                                </div>
                                
                                
                                <div style={{display:"flex", flexFlow:"column", border:"", gap:"0.25rem"}}>
                                    <div style={{display:"flex", alignItems:"center", border:"", gap:"0.75rem", fontSize:"1.1rem"}}>
                                        <p style={{border:"",maxWidth:"150px", textOverflow:"ellipsis", textAlign:"left", overflow:"hidden", whiteSpace:"nowrap"}}>{props.title}</p>
                                        
                                    </div>
                                
                                {
                                    
                                    <div style={{display:'flex', gap:"0.75rem"}}>
                                        {props.code&&
                                        <Tooltip title={props.codeTooltip} placement="right">
                                            <div style={{fontSize:"0.75rem", fontWeight:400, border:"1px solid rgba(100 100 100/ 75%)",borderRadius:"0.5rem",paddingLeft:"0.25rem", textAlign:"left", opacity:"0.75", display:'flex', gap:"0.5rem",alignItems:"center", paddingRight:"0.5rem", width:"fit-content", height:""}}>
                                                {
                                                    props.codeIcon?
                                                    props.codeIcon
                                                    :
                                                    <Hash color="dodgerblue" width={"0.8rem"}/>
                                                }
                                                
                                                {props.code}
                                            </div>
                                        </Tooltip>}

                                        <p onClick={props.bigDate} style={{fontWeight:400, fontSize:"1rem", opacity:0.5, letterSpacing:"0.075rem", display:"flex", gap:"0.5rem"}}>    
                                            {props.created_on}
                                        </p>
                                    </div>
                                    
                                    
                                }

                                        
                                
                                </div>
                                
                            
                                
                                
                                
                                
                            </div>

                            {props.title_extra}

                            
                        
                        </div>
                        <div style={{border:"", display:"flex", fontWeight:"600", fontSize:"0.8rem", color:"dodgerblue"}}>
                            <p style={{paddingLeft:"0.5rem",paddingRight:"0.5rem", borderRadius:"0.5rem", background:"rgba(100 100 100/ 20%)", marginLeft:"0.5rem"}}>{props.subtitle}</p>
                        </div>

                        {
                            props.creation_date&&
                            <div style={{display:"flex", alignItems:"center", gap:"0.5rem", marginTop:"0.95rem", background:props.contact?"":"linear-gradient(90deg, rgba(0 0 0/ 0%), rgba(100 100 100/ 25%), rgba(0 0 0/ 0%))", padding:"", borderRadius:"0.75rem", justifyContent:props.contact?'space-between':"center", height:"2.25rem", border:props.contact?"1px solid rgba(100 100 100/50%)":""}}>
                                <div style={{display:"flex", gap:"0.5rem", marginLeft:"0.65rem"}}>
                                    <p style={{fontSize:"0.8rem", opacity:"0.5", fontWeight:400}}>Created on : </p>
                                    <p style={{fontSize:"0.8rem", color:"dodgerblue"}}>{props.creation_date}</p>

                                </div>

                                {
                                    props.contact&&
                                    <a href={"tel:"+props.contact} style={{display:"flex", gap:"0.5rem", alignItems:"center", marginRight:"0.35rem", border:'', background:"rgba(100 100 100/ 25%)", borderRadius:"0.5rem", paddingLeft:"0.75rem", paddingRight:"0.75rem"}}>
                                        
                                        <Phone width={"0.8rem"} color="dodgerblue"/>
                                        <p style={{fontSize:"1rem"}}>{props.contact}</p>
                                        
                                    </a>
                                }
                                
                                
                                
                            </div>
                        }

                            
                        
                    </DialogTitle>
                    }
                    
                    
                    {
                        props.tags?
                        <div style={{display:"flex", flexFlow:"column", gap:"0.5rem", border:"", width:"100%"}}>

                            
                            
                        <div style={{height:"2rem", border:"", width:"100%", display:'flex', gap:"0.5rem"}}>

                            <div style={{background:"rgba(100 100 100/ 25%)", fontSize:"0.8rem", display:"flex", alignItems:"center", paddingRight:"0.75rem", paddingLeft:"0.75rem", borderRadius:"0.5rem", gap:"0.25rem", flex:1, justifyContent:"center", cursor:"pointer"}}>
                            {
                                props.tag1Text?
                                <p>{props.tag1Text}</p>
                                :
                                "No Data"
                            }
                            
                            
                            </div>

                            <div style={{background:"rgba(100 100 100/ 25%)", fontSize:"0.8rem", display:"flex", alignItems:"center", paddingRight:"0.75rem", paddingLeft:"0.75rem", borderRadius:"0.5rem", gap:"0.25rem", flex:1, justifyContent:"center", cursor:"pointer"}}>

                            <p style={{opacity:0.5}}>
                            Joined : 
                            </p>
                            <b>{props.tag2Text}</b>

                            
                            </div>

                        </div>

                        

                        {/* <div style={{height:"2rem", border:"", width:"100%", display:'flex', gap:"0.5rem"}}>

                            <div onClick={props.tag3OnClick} style={{background:"rgba(100 100 100/ 25%)", fontSize:"0.75rem", display:"flex", alignItems:"center", paddingRight:"0.75rem", paddingLeft:"0.75rem", borderRadius:"0.5rem", gap:"0.25rem", flex:1, justifyContent:"center", cursor:"pointer"}}>

                            <p style={{opacity:0.5}}>Basic : </p><b>{props.tag3Text}</b>  

                            
                            </div>

                            <div onClick={props.tag4OnClick} style={{background:"rgba(100 100 100/ 25%)", fontSize:"0.75rem", display:"flex", alignItems:"center", paddingRight:"0.75rem", paddingLeft:"0.75rem", borderRadius:"0.5rem", gap:"0.25rem", flex:1, justifyContent:"center", cursor:"pointer"}}>

                            <p style={{opacity:0.5}}>
                            Allow : 
                            </p>
                            <b style={{fontSize:"0.8rem"}}>{props.tag4Text}</b>
                            
                            </div>
                            
                        </div> */}

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
                        props.tags?
                        <div style={{display:"flex", flexFlow:"column", gap:"0.5rem", border:"", width:"100%", borderTop:"1px solid rgba(100 100 100/ 50%)", paddingTop:"1rem"}}>
                        <div style={{height:"", border:"", width:"100%", display:'flex', gap:"0.5rem", flexFlow:"column"}}>

                            

                            <Directive title="Day off(s)" tag={props.bottomTagValue} onClick={props.onBottomTagClick} status loading={props.bottomValueLoading}/>

                            <Directive title="Remarks" status tag={props.remarksValue} onClick={props.remarksOnClick}/>

                            {
                                props.renumeration&&
                                <Accordion type="single" collapsible style={{borderBottom:"none"}}>
                                <AccordionItem value="item-1">
                                    <AccordionTrigger style={{border:"", display:"flex", justifyContent:"space-between", height:"2.5rem", paddingLeft:"0.75rem", fontWeight:"400", fontSize:"0.9rem", background:"none", paddingBottom:"1rem"}}>Renumeration</AccordionTrigger>
                                    <AccordionContent>
                                    <div style={{height:"2.5rem", border:"", width:"100%", display:'flex', gap:"0.5rem", paddingTop:"0.5rem"}}>

                                        <div onClick={props.tag3OnClick} style={{background:"rgba(100 100 100/ 25%)", fontSize:"0.75rem", display:"flex", alignItems:"center", paddingRight:"0.75rem", paddingLeft:"0.75rem", borderRadius:"0.5rem", gap:"0.25rem", flex:1, justifyContent:"center", cursor:"pointer"}}>

                                        <p style={{opacity:0.5}}>Basic : </p><b>{props.tag3Text}</b>  

                                        
                                        </div>

                                        <div onClick={props.tag4OnClick} style={{background:"rgba(100 100 100/ 25%)", fontSize:"0.75rem", display:"flex", alignItems:"center", paddingRight:"0.75rem", paddingLeft:"0.75rem", borderRadius:"0.5rem", gap:"0.25rem", flex:1, justifyContent:"center", cursor:"pointer"}}>

                                        <p style={{opacity:0.5}}>
                                        Allow : 
                                        </p>
                                        <b style={{fontSize:"0.8rem"}}>{props.tag4Text}</b>
                                        
                                        </div>
                                        
                                    </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                            }
                            
                            

                        </div>

                        
                        </div>
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