

interface Props{
    icon?:any
    desc?:string
    overdue?:boolean
}

export default function InboxComponentDesc(props:Props){

    const overdue_color = "lightcoral"

    return(
        <div style={{display:"flex", gap:"0.5rem", alignItems:"center",textAlign:"left", fontWeight:400, fontSize:"0.8rem"}}>

            {props.icon}   
            <p style={{textAlign:"left", opacity:0.75, color:props.overdue?overdue_color:"white", fontWeight:props.overdue?600:400}}>{props.desc}</p>

        </div>
    )
}