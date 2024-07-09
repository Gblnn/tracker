import { DialogTitle } from "@radix-ui/react-dialog";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from './ui/dialog';
import {LoadingOutlined} from '@ant-design/icons'

interface Props {
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
    input3placeholder?:string
    input4placeholder?:string
    disabled?:boolean
    OkButtonIcon?:any
    updating?:boolean
    input1Value?:string
    input2Value?:string
    input3Value?:string
    input4Value?:string
    input1Label?:string
    input2Label?:string
    input3Label?:string
    input4Label?:string
}

export default function AddDialog(props:Props){
    
    return(
        <>
        <Dialog open={props.open}>

            <DialogContent onOpenAutoFocus={(e)=>e.preventDefault()} style={{}}>

                <DialogHeader style={{}}>
                    <DialogTitle className="heading" style={{userSelect:"none", width:"100%", display:"flex"}}>
                        <div className="flex">
                        {props.titleIcon}
                        {props.title}
                        </div>
                        
                    </DialogTitle>
                    <div style={{display:'flex', flexFlow:"column", width:"100%", gap:"0.5rem", paddingBottom:"0.5rem"}}>


                    <div style={{display:"flex", alignItems:"center", gap:"1rem"}}>
                        {
                            props.input1Label?
                            <p style={{width:"7.5rem", opacity:0.5, fontSize:"0.8rem", textAlign:"right"}}>
                                {props.input1Label}
                            </p>
                            :null
                        }
                    
                    <input defaultValue={props.input1Value} placeholder={props.inputplaceholder} onChange={props.inputOnChange}/>
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
                            
                            <input defaultValue={props.input2Value} placeholder={props.input2placeholder} onChange={props.input2OnChange}/>
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
                            
                            <input defaultValue={props.input3Value} placeholder={props.input3placeholder} onChange={props.input3OnChange}/>
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
                            
                            <input defaultValue={props.input4Value} placeholder={props.input4placeholder} onChange={props.input4OnChange}/>
                        </div>
                        
                        :null
                    }
                    
                    </div>
                    
                </DialogHeader>

                <DialogContent>
                    
                </DialogContent>

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
        </>
    )
}