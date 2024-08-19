import {motion} from 'framer-motion'

interface Props{
    civilid?:string
    expirydate?:any 
    DOB?:string
    name?:string
}

export default function CivilID(props:Props){
    return(
        <motion.div initial={{opacity:0}} whileInView={{opacity:1}} transition={{delay:0.15}}>
        <div className="civil-id" style={{width:"32ch", height:"19ch", background:"rgba(100 100 100/ 15%)", borderRadius:"0.75rem", zIndex:0, userSelect:"none"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", paddingLeft:"1.5rem", borderBottom:"1px solid rgba(100 100 100/ 35%)"}}>
                <div style={{border:""}}>
                <p style={{textTransform:"uppercase", textAlign:"left", fontSize:"0.8rem"}}>{props.name}</p>
                <p style={{fontSize:"0.7rem", fontWeight:600, color:"dodgerblue", border:"", textAlign:"left"}}>RESIDENT CARD</p>
                </div>
                
                <img src="/oman-logo.png" style={{width:"3rem", height:"3rem", margin:"0.75rem"}}/>
            </div>

            <div style={{border:"", display:"flex", flexFlow:"column", alignItems:"center", marginTop:"1.25rem"}}>

                <div id="civil-no" style={{display:"flex",border:"", alignItems:'center', gap:"1rem"}}>
                    <p style={{fontSize:"0.7rem"}}>CIVIL NUMBER : </p>
                    <p style={{fontWeight:600, fontSize:"0.9rem"}}>{props.civilid?props.civilid:"XXXXXXXXX"}</p>
                </div>

                <div id="civil-no" style={{display:"flex", alignItems:'center', gap:"1rem"}}>
                    <p style={{fontSize:"0.7rem", }}>EXPIRY DATE : </p>
                    <p style={{fontWeight:600, fontSize:"0.9rem"}}>{props.expirydate?props.expirydate:"XXXXXXXXX"}</p>
                </div>

                <div id="civil-no" style={{display:"flex", alignItems:'center', gap:"1rem"}}>
                    <p style={{fontSize:"0.7rem"}}>DATE OF BIRTH : </p>
                    <p style={{fontWeight:600,fontSize:"0.9rem"}}>{props.DOB?props.DOB:"XXXXXXXXX"}</p>
                </div>

                {/* <div style={{display:"flex", border:"", flex:1, justifyContent:"flex-end", alignItems:"center", flexFlow:"column"}}>
                    <p style={{fontSize:"0.7rem"}}>CIVIL NUMBER : </p>
                    <p style={{fontSize:"0.7rem"}}>EXPIRY DATE : </p>
                    <p style={{fontSize:"0.7rem"}}>DATE OF BIRTH : </p>
                </div>

                <div style={{display:"flex", border:"", flex:1, flexFlow:"column"}}>
                    <p style={{fontWeight:600,fontSize:"0.9rem"}}>{props.civilid}</p>
                    <p style={{fontWeight:600,fontSize:"0.9rem"}}>{props.expirydate}</p>
                    <p style={{fontWeight:600,fontSize:"0.9rem"}}>{props.DOB}</p>
                </div> */}
                
            </div>
            
        </div>
        </motion.div>
    )
}