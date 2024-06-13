import { Plus } from "lucide-react";
import { Button } from "./ui/button";

interface Props{
    onClick?:any
    classname?:string
}

export default function AddRecordButton(props:Props){

    
    return(
        <>
        <Button variant={"ghost"} style={{position:"fixed", bottom:0, right:0, margin:"2rem", gap:"0.5rem"}} onClick={props.onClick}><Plus width="1rem" height="1rem" className={props.classname}/>Add Record</Button>
        
        
        </>
    )
}