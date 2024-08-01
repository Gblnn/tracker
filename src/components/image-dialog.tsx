import DefaultDialog from "./ui/default-dialog";

interface Props{
    open?:boolean
    title?:string
    src?:any
    onCancel?:any

}

export default function ImageDialog(props:Props){
    return(
        <DefaultDialog title={props.title} dialogBackground={"url("+props.src+")"} dialogHeight={"20rem"} close open={props.open} onCancel={props.onCancel} extra={<div style={{height:"22rem", width:"100%"}}></div>}/>
    )
}