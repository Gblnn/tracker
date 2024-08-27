

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
        <button style={{position:"fixed", bottom:0, right:0, marginRight:"2.5rem",marginBottom:"2.5rem", gap:"0.5rem", paddingRight:"0.5rem", paddingLeft:"0.5rem",padding:"0.75rem", flex:1, background:props.style}} onClick={props.onClickSwap?props.alternateOnClick:props.onClick}>
            {props.icon}
            {
                props.title&&
                <p className="transitions" style={{fontSize:"0.9rem"}}>{props.title}</p>
            }
            
        </button>
        
        
        </>
    )
}