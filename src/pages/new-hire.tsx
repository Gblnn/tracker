import Back from "@/components/back";
import Directive from "@/components/directive";
import InputDialog from "@/components/input-dialog";
import DefaultDialog from "@/components/ui/default-dialog";
import { auth } from "@/firebase";
import { signOut } from "firebase/auth";
import { motion } from "framer-motion";
import {
  BriefcaseBusiness,
  File,
  KeyRound,
  List,
  Mail,
  PartyPopper
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function NewHire() {
  const [requestDialog, setRequestDialog] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [valeLoginPrompt, setValeLoginPrompt] = useState(false);
  const [logoutPrompt, setLogoutPrompt] = useState(false);
  const usenavigate = useNavigate();

  return (
    <>
      {/* <div style={{border:"", display:"flex", alignItems:"center", justifyContent:'center'}}>
        <ConfettiExplosion/>
        </div> */}
      <div
        style={{
          padding: "1.25rem",
          // background:
          //   "linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%))",
          height: "100svh",
        }}
      >
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
          <Back
            title="New Hire"
            extra={
              <div
                style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
              >
                {/* <button
                  onClick={() => window.location.reload()}
                  style={{
                    paddingLeft: "1rem",
                    paddingRight: "1rem",
                    fontSize: "0.75rem",
                    opacity: "0.75",
                  }}
                >
                  <RefreshCcw width={"1rem"} color="dodgerblue" />
                  <p style={{ opacity: 0.5, letterSpacing: "0.15rem" }}>
                    v1.18
                  </p>
                </button> */}

                {/* <button onClick={()=>usenavigate("/inbox")} style={{ width:"3rem", background:"rgba(220 20 60/ 20%)"}}>
                            <Inbox className="" color="crimson"/>
                        </button> */}

                {/* <button
                  onClick={() => {
                    setLogoutPrompt(true);
                  }}
                  style={{ width: "3rem" }}
                >
                  <LogOut width={"1rem"} color="lightcoral" />
                </button> */}
              </div>
            }
          />
          <br />

          <div style={{ display: "flex", flexFlow: "column", gap: "0.5rem" }}>
            <Directive
              onClick={() => usenavigate("/openings")}
              icon={<BriefcaseBusiness width={"1.25rem"} color="salmon" />}
              title={"Openings"}
            />
            <Directive
              onClick={() => usenavigate("/shortlist")}
              title={"Short-list"}
              icon={<List width={"1.25rem"} />}
            />
            <Directive
              onClick={() => usenavigate("/offer-letters")}
              to={"/offer-letters"}
              title={"Prepare Offer Letter"}
              icon={<File color="mediumslateblue" width={"1.25rem"} />}
            />
            {/* <Directive
              title={"Resources Allocation"}
              icon={<Binary color="dodgerblue" />}
              tag={"Maintenance"}
            /> */}

            <Directive
              title={"OnBoarding"}
              icon={<PartyPopper color="goldenrod" />}
            
            />

            {/* <Directive
              title={"New Hire"}
              icon={<UserPlus width={"1.25rem"} color="dodgerblue" />}
            /> */}

            {/* <Directive
              onClick={() => handleLoginPrompt("ssu")}
              title="Sohar Star United"
              icon={
                <Avatar
                  style={{ width: "1.25rem", height: "1.25rem", border: "" }}
                >
                  <AvatarImage
                    style={{ objectFit: "cover" }}
                    src={"/sohar_star_logo.png"}
                  />
                  <AvatarFallback>
                    <p style={{ paddingTop: "0.1rem" }}>{"S"}</p>
                  </AvatarFallback>
                </Avatar>
              }
            />

            <Directive
              onClick={() => handleLoginPrompt("vale")}
              title="Vale Team"
              icon={
                <Avatar
                  style={{ width: "1.25rem", height: "1.25rem", border: "" }}
                >
                  <AvatarImage
                    style={{ objectFit: "cover", paddingBottom: "0.1rem" }}
                    src={"/vale-logo.png"}
                  />

                  <AvatarFallback>
                    <p style={{ paddingTop: "0.1rem" }}>{"V"}</p>
                  </AvatarFallback>
                </Avatar>
              }
            /> */}

            {/* <Directive onClick={()=>{setRequestDialog(true)}} title="Request Feature" icon={<Plus color="grey" width={"1.1rem"} height={"1.1rem"}/>}/> */}
          </div>
        </motion.div>

        <DefaultDialog
          titleIcon={<Mail />}
          title="Request Feature"
          extra={
            <p
              style={{
                fontSize: "0.85rem",
                opacity: 0.5,
                marginBottom: "0.5rem",
              }}
            >
              Reach out to the developer to request a new feature? You will be
              redirected to your e-mail client
            </p>
          }
          open={requestDialog}
          OkButtonText="Reach out"
          onCancel={() => setRequestDialog(false)}
          sendmail
        />

        <InputDialog
          title={"Protected Route"}
          input1Type="password"
          desc="Enter key to continue"
          titleIcon={<KeyRound color="dodgerblue" />}
          open={loginPrompt}
          onCancel={() => setLoginPrompt(false)}
          OkButtonText="Continue"
          inputplaceholder="Password"
          onOk={() => usenavigate("/records")}
        />

        <InputDialog
          title={"Protected Route"}
          input1Type="password"
          desc="Enter key to continue"
          titleIcon={
            <img
              src="/vale-logo.png"
              width={"28rem"}
              style={{ paddingBottom: "0.25rem", marginRight: "0.25rem" }}
            />
          }
          open={valeLoginPrompt}
          onCancel={() => setValeLoginPrompt(false)}
          OkButtonText="Continue"
          inputplaceholder="Password"
          onOk={() => usenavigate("/vale-records")}
        />

        <DefaultDialog
          destructive
          OkButtonText="Logout"
          title={"Confirm Logout?"}
          open={logoutPrompt}
          onCancel={() => setLogoutPrompt(false)}
          onOk={() => {
            signOut(auth);
            usenavigate("/");
            window.name = "";
            console.log(window.name);
            window.location.reload();
          }}
        />
      </div>
    </>
  );
}
