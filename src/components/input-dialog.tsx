import { LoadingOutlined } from '@ant-design/icons';
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { ImageIcon } from 'lucide-react';
import { DialogDescription } from '@radix-ui/react-dialog';

interface Props{
    open?: boolean
    title?: string
    titleIcon?:any
    desc?:string
    OkButtonText?: string
    CancelButtonText?:string
    onOk?:any
    onCancel?:any
    inputOnChange?:any
    inputplaceholder?:string
    input2OnChange?:any
    input2placeholder?:string
    input3OnChange?:any
    input4OnChange?:any
    input5OnChange?:any
    input6OnChange?:any
    input7OnChange?:any
    input8OnChange?:any
    input3placeholder?:string
    input4placeholder?:string
    input5placeholder?:string
    input6placeholder?:string
    input7placeholder?:string
    input8placeholder?:string
    disabled?:boolean
    OkButtonIcon?:any
    updating?:boolean
    input1Value?:string
    input2Value?:string
    input3Value?:string
    input4Value?:string
    input5Value?:string
    input6Value?:string
    input7Value?:string
    input8Value?:string
    input1Label?:string
    input2Label?:string
    input3Label?:string
    input4Label?:string
    input5Label?:string
    input6Label?:string
    input7Label?:string
    input8Label?:string
    input1Type?:string
    extra?:any
    image?:any
}

export default function InputDialog(props:Props){
    return(
        <Dialog open={props.open}>
            <DialogContent onOpenAutoFocus={(e)=>e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="heading" style={{userSelect:"none", width:"100%", display:"flex", flexFlow:"column"}}>

                        
                        
                        
                        <div className="flex" style={{border:"", textAlign:"left", display:"flex", justifyContent:"flex-start"}}>
                            {props.titleIcon}
                            {props.title}
                        </div>
                    </DialogTitle>

                    <div style={{display:'flex', flexFlow:"column", width:"100%", gap:"0.5rem", paddingBottom:"0.5rem"}}>

                    {
                            props.image?
                            <div style={{display:"flex", marginBottom:"1rem", alignItems:"center", gap:"0.5rem"}}>
                                <ImageIcon/>
                                {props.image}
                                {/* <button style={{fontSize:"0.8rem", width:"10rem"}}>Upload XLSX</button> */}
                            </div>
                            :null
                        }

                        <div style={{display:"flex", alignItems:"center", gap:"1rem"}}>
                            
                            {
                                props.input1Label?
                                <p style={{width:"7.5rem", opacity:0.5, fontSize:"0.8rem", textAlign:"right"}}>
                                    {props.input1Label}
                                </p>
                                :null
                            }
                        
                            <input id='input-1' type={props.input1Type} style={{letterSpacing:props.input1Type?"0.15rem":""}} defaultValue={props.input1Value} placeholder={props.inputplaceholder} onChange={props.inputOnChange}/>

                        </div>
                        {
                        props.input2placeholder?
                        <div style={{display:"flex", alignItems:"center", gap:"1rem"}}>

                            {
                                props.input2Label?
                                <p style={{width:"7.5rem", opacity:0.5, fontSize:"0.8rem", textAlign:"right"}}>
                                    {props.input2Label}
                                </p>
                                :null
                            }
                            
                            <input id='input-2' defaultValue={props.input2Value} placeholder={props.input2placeholder} onChange={props.input2OnChange}/>
                        </div>
                        
                        :null
                    }

{
                        props.input3placeholder?
                        <div style={{display:"flex", alignItems:"center", gap:"1rem"}}>
                            {
                                props.input3Label?
                                <p style={{width:"7.5rem", opacity:0.5, fontSize:"0.8rem", textAlign:"right"}}>
                                    {props.input3Label}
                                </p>
                                :null
                            }
                            
                            <input id='input-3' defaultValue={props.input3Value} placeholder={props.input3placeholder} onChange={props.input3OnChange}/>
                        </div>
                        
                        :null
                    }

                    {
                        props.input4placeholder?
                        <div style={{display:"flex", alignItems:"center", gap:"1rem"}}>
                            {
                                props.input4Label?
                                <p style={{width:"7.5rem", opacity:0.5, fontSize:"0.8rem", textAlign:"right"}}>
                                    {props.input4Label}
                                </p>
                                :null
                            }
                            
                            <input id='input-4' defaultValue={props.input4Value} placeholder={props.input4placeholder} onChange={props.input4OnChange}/>
                        </div>
                        
                        :null
                    }

                    {
                        props.input5placeholder?
                        <div style={{display:"flex", alignItems:"center", gap:"1rem"}}>
                            {
                                props.input5Label?
                                <p style={{width:"7.5rem", opacity:0.5, fontSize:"0.8rem", textAlign:"right"}}>
                                    {props.input5Label}
                                </p>
                                :null
                            }
                            
                            <input id='input-5' defaultValue={props.input5Value} placeholder={props.input5placeholder} onChange={props.input5OnChange}/>
                        </div>
                        
                        :null
                    }

{
                        props.input6placeholder?
                        <div style={{display:"flex", alignItems:"center", gap:"1rem"}}>
                            {
                                props.input6Label?
                                <p style={{width:"7.5rem", opacity:0.5, fontSize:"0.8rem", textAlign:"right"}}>
                                    {props.input6Label}
                                </p>
                                :null
                            }
                            
                            <input id='input-6' defaultValue={props.input6Value} placeholder={props.input6placeholder} onChange={props.input6OnChange}/>
                        </div>
                        
                        :null
                    }

                    {
                        props.input7placeholder?
                        <div style={{display:"flex", alignItems:"center", gap:"1rem"}}>
                            {
                                props.input7Label?
                                <p style={{width:"7.5rem", opacity:0.5, fontSize:"0.8rem", textAlign:"right"}}>
                                    {props.input7Label}
                                </p>
                                :null
                            }
                            
                            <input id='input-7' defaultValue={props.input7Value} placeholder={props.input7placeholder} onChange={props.input7OnChange}/>
                        </div>
                        
                        :null
                    }

{
                        props.input8placeholder?
                        <div style={{display:"flex", alignItems:"center", gap:"1rem"}}>
                            {
                                props.input8Label?
                                <p style={{width:"7.5rem", opacity:0.5, fontSize:"0.8rem", textAlign:"right"}}>
                                    {props.input8Label}
                                </p>
                                :null
                            }
                            
                            <input id='input-8' defaultValue={props.input8Value} placeholder={props.input8placeholder} onChange={props.input8OnChange}/>
                        </div>
                        
                        :null
                    }

                    {/* {
                        props.combo1?
                        <div>

                        </div>
                        :null
                    } */}

                    </div>
                </DialogHeader>

                {
                        props.extra?
                        
                            props.extra
                        
                        :null 
                    }

                <DialogDescription style={{display:"none"}}/>

                <DialogFooter>
                    <div style={{width:"100%", display:"flex", gap:"0.5rem", justifyContent:"center"}}>
                        <Button variant={"default"} className={props.disabled?"disabled":""} id="okBtn" onClick={props.disabled?null:props.onOk} style={{flex:1}}>
                            
                            
                            {
                                props.updating?
                                <LoadingOutlined/>
                                :props.OkButtonIcon
                            }
                                {props.OkButtonText}
                                
                            
                        </Button>

                        <Button variant={"ghost"} id="cancelBtn" onClick={props.onCancel} style={{flex:1}}>
                            Cancel
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
            
        </Dialog>
    )
}