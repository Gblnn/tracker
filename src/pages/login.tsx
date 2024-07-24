import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { auth } from "@/firebase";
import { message } from "antd";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { ChevronRight, FileArchiveIcon, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
 
export default function Login(){

    const usenavigate = useNavigate()

    const SignUpWithGoogle = async () => {

        try {
            const provider = new GoogleAuthProvider();
    
        const result=await signInWithPopup(auth, provider)
         
           
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (!credential){
                console.error("Error in user Credential")
                return
            }
            const token = credential.accessToken;
            const user = result.user;
            console.log(user,token)
           
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error:any) {
            
            console.log(error.code);
    
        }
      };
    return(
        <div style={{display:"flex", padding:"1.25rem", height:"100svh"}}>

            <div className="desktop-only" style={{border:'', flex:1, background:"linear-gradient(darkslateblue, midnightblue)", alignItems:"flex-end", borderRadius:"1rem"}}>
                
                <div style={{display:"flex", border:'', alignItems:"center", margin:"2.5rem", gap:"0.75rem"}}>
                <FileArchiveIcon color="salmon" width={"4rem"} height={"4rem"}/>

                    <div style={{display:"flex", flexFlow:"column"}}>
                    <p style={{fontWeight:400, fontSize:"2.25rem"}}>DocRecord</p>

                </div>
                
                </div>
                
            </div>

            <div style={{display:"flex", flex:1, height:"100%", justifyContent:'center', alignItems:'center', flexFlow:"column", border:""}}>
                
                <div style={{display:"flex", justifyContent:'center', alignItems:'center', flexFlow:"column", border:"", borderRadius:"1rem", width:"32ch"}}>

                <div style={{display:"flex", border:"",borderRadius:"1rem", padding:"", flexFlow:"column",width:"100%", gap:"0.75rem", marginTop:"2rem"}}>
                <p style={{ top:0, left:0, fontSize:"2rem", fontWeight:"600", border:"", width:"100%", paddingLeft:"0.5rem", marginTop:""}}>LOGIN</p>
                <br/>
                
                    <input type="username" placeholder="Email Address"/>
                    <input type="password" placeholder="Password"/>
                    <p/>
                    <div style={{display:"flex", alignItems:"center", gap:"0.5rem", width:'100%', justifyContent:"", paddingRight:"1rem", paddingLeft:"1rem"}}>
                    <Checkbox/>
                    <p style={{ fontSize:"0.75rem"}}>Stay logged in</p>
                    </div>
                    
                    
                    <p/>
                    <button onClick={()=>message.info("Login functionality is curently unavailable please use developer key")} style={{background:"midnightblue"}}>LOGIN
                        <ChevronRight width={"0.75rem"}/>
                    </button>
                </div>

                <br/>
                <br/>
                <br/>

                <div style={{display:"flex", flexFlow:"column", gap:"0.5rem", bottom:0, width:"100%"}}>

                    <Button onClick={()=>usenavigate("/index")} variant={"ghost"}>
                        <KeyRound color="dodgerblue" width={"1.25rem"}/>
                        Developer Key
                    </Button>

                    <Button onClick={SignUpWithGoogle} variant={"ghost"}>
                        <img src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png" width={"25rem"}/>
                        Continue with Google
                    </Button>
                </div>

                </div>

                
                
            </div>


        </div>
    )
}

