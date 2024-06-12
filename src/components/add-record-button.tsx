import { Plus } from "lucide-react";
import { Button } from "./ui/button";

interface Props{
    onClick?:any
}

export default function AddRecordButton(props:Props){

    
    return(
        <>
        <Button variant={"ghost"} style={{position:"absolute", bottom:0, right:0, margin:"2rem", display:"flex", gap:"0.5rem"}} onClick={props.onClick}><Plus width="1rem" height="1rem" />Add Record</Button>
        
        
        </>
    )
}