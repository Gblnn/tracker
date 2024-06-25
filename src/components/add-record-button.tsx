import { Button } from "./ui/button";

interface Props{
    title?:string
    onClick?:any
    classname?:string
    alternateOnClick?:any
    onClickSwap?:boolean
    icon?:any
}

export default function AddRecordButton(props:Props){

    
    return(
        <>
        <Button variant={"ghost"} style={{position:"fixed", bottom:0, right:0, margin:"2rem", gap:"0.5rem"}} onClick={props.onClickSwap?props.alternateOnClick:props.onClick}>
            {props.icon}
            
            {props.title}
        </Button>
        
        
        </>
    )
}