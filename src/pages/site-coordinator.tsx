import Back from "@/components/back";
import IndexDropDown from "@/components/index-dropdown";
import DefaultDialog from "@/components/ui/default-dialog";
import { useAuth } from "@/components/AuthProvider";
import { useState } from "react";
import { Factory } from "lucide-react";

export default function SiteCoordinator(){
    const [logoutPrompt, setLogoutPrompt] = useState(false);
    const { userData, logoutUser: logOut } = useAuth();
    return(
        <>
        <div>
            <Back icon={<Factory color="dodgerblue"/>} subtitle={userData?.assignedSite} noback fixed title={userData?.assignedProject} extra={<div style={{ display: "flex", gap: "0.75rem", alignItems:"center" }} >
                {/* <button style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
                                        v2.0
                                      </button> */}
                                      <IndexDropDown onProfile={()=>{}} onLogout={() => setLogoutPrompt(true)} />
                                      
                                    </div>}/>
                                    <DefaultDialog
                                                    destructive
                                                    OkButtonText="Logout"
                                                    title={"Confirm Logout?"}
                                                    open={logoutPrompt}
                                                    onCancel={() => {
                                                      setLogoutPrompt(false);
                                                      window.location.reload();
                                                    }}
                                                    onOk={async () => {
                                                      try {
                                                        await logOut();
                                                      } catch (error) {
                                                        console.error("Logout error:", error);
                                                      }
                                                    }}
                                                  />

        </div>
        </>
    )
}