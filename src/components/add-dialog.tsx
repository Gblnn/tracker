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
    input3placeholder?:string
    disabled?:boolean
    OkButtonIcon?:any
    updating?:boolean
    input1Value?:string
    input2Value?:string
    input3Value?:string
}

export default function AddDialog(props:Props){
    
    return(
        <>
        <Dialog open={props.open}>

            <DialogContent style={{}}>

                <DialogHeader style={{}}>
                    <DialogTitle className="heading" style={{userSelect:"none", width:"100%", display:"flex"}}>
                        <div className="flex">
                        {props.titleIcon}
                        {props.title}
                        </div>
                        
                    </DialogTitle>
                    <div style={{display:'flex', flexFlow:"column", width:"100%", gap:"0.5rem", paddingBottom:"0.5rem"}}>


                    <input value={props.input1Value} placeholder={props.inputplaceholder} onChange={props.inputOnChange}/>
                    {
                        props.input2placeholder?
                        <input value={props.input2Value} placeholder={props.input2placeholder} onChange={props.input2OnChange}/>
                        :null
                    }

{
                        props.input3placeholder?
                        <input value={props.input3Value} placeholder={props.input3placeholder} onChange={props.input3OnChange}/>
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