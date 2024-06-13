import { Inbox } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";


export default function Header(){


    return(
        <>
        <div style={{width:"100%", height:"4.5rem",display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.25rem", userSelect:"none", position:"fixed", backdropFilter:"blur(25px)", zIndex:5, borderBottom:"2px solid rgba(100 100 100/ 25%)", boxShadow:"1px 1px 10px rgba(0 0 0/ 20%)"}}>
            <div style={{marginLeft:"1rem", display:"flex", alignItems:"center", gap:"0.5rem"}}>
                <img style={{width:"2.5rem", height:"2.5rem"}} src="/sohar_star_logo.png"/>
                {/* <h1 style={{ opacity:0.8}}>Dashboard</h1> */}
            </div>

            <div style={{marginRight:"1.25rem", gap:"0.5rem", display:"flex"}}>
                {/* <NotifyButton/> */}
                <Link to="/inbox">
                <Button variant={"ghost"} style={{display:"flex", alignItems:"center", justifyContent:"center"}}>
                    <Inbox color="crimson" width={"1.5rem"}/>
                    <p style={{}}>1</p>
                </Button>
                </Link>
                
            
                
                
            </div>
            
            
        </div>
    
        </>
        

    )
}