

interface Props{
    title?:string
    onClick?:any
    classname?:string
    alternateOnClick?:any
    onClickSwap?:boolean
    icon?:any
    style?:string
}

export default function AddRecordButton(props:Props){

    
    return(
        <>
        <button className="" style={{position:"fixed", bottom:0, right:0, marginRight:"1.5rem",marginBottom:"2.5rem", gap:"0.5rem", paddingRight:"1rem", paddingLeft:"1rem", flex:1, background:props.style}} onClick={props.onClickSwap?props.alternateOnClick:props.onClick}>
            {props.icon}
            
            <p className="transitions" style={{fontSize:"0.9rem"}}>{props.title}</p>
        </button>
        
        
        </>
    )
}