import { Button } from "@/components/ui/button";
import { auth } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { KeyRound } from "lucide-react";
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
        <div style={{display:"flex", width:'100%', height:"100svh", justifyContent:'center', alignItems:'center', flexFlow:"column"}}>
            <p style={{position:"absolute", top:0, left:0, margin:"2.5rem", fontSize:"2rem", fontWeight:"600"}}>LOGIN</p>

            <div style={{display:"flex", flexFlow:"column", gap:"0.5rem", width:"80%", position:"absolute", bottom:0, margin:"3.5rem"}}>

            <Button onClick={()=>usenavigate("/index")} variant={"ghost"}>
                <KeyRound color="dodgerblue" width={"1.25rem"}/>
                Temporary Key
            </Button>

            <Button onClick={SignUpWithGoogle} variant={"ghost"}>
                <img src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png" width={"25rem"}/>
                Continue with Google
            </Button>

            
            </div>
            
        </div>
    )
}

