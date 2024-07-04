import { Button } from "./ui/button"


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
        <Button className="" style={{position:"fixed", bottom:0, right:0, marginRight:"1.5rem",marginBottom:"2.5rem", gap:"0.5rem", paddingRight:"1rem", paddingLeft:"1rem", flex:1}} onClick={props.onClickSwap?props.alternateOnClick:props.onClick}>
            {props.icon}
            
            <p className="transitions" style={{fontSize:"0.8rem"}}>{props.title}</p>
        </Button>
        
        
        </>
    )
}