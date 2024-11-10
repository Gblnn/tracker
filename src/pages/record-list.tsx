import Back from "@/components/back";
import Directive from "@/components/directive";
import InputDialog from "@/components/input-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DefaultDialog from "@/components/ui/default-dialog";
import { auth, db } from "@/firebase";
import { LoadingOutlined } from "@ant-design/icons";
import { message } from "antd";
import { signOut } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import { HistoryIcon, Inbox, KeyRound, Mail } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RecordList() {
  const [requestDialog, setRequestDialog] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [valeLoginPrompt, setValeLoginPrompt] = useState(false);
  const [logoutPrompt, setLogoutPrompt] = useState(false);
  const usenavigate = useNavigate();
  const [verifyDialog, setVerifyDialog] = useState(false);
  // const [loading, setLoading] = useState(false);

  const handleLoginPrompt = (e: string) => {
    e == "ssu" && verify("ssu");

    e == "vale" && verify("vale");
  };

  const verify = async (e: string) => {
    setVerifyDialog(true);
    try {
      // setLoading(true);

      const RecordCollection = collection(db, "users");
      const recordQuery = query(
        RecordCollection,
        where("email", "==", window.name)
      );
      const querySnapshot = await getDocs(recordQuery);
      const fetchedData: any = [];
      querySnapshot.forEach((doc: any) => {
        fetchedData.push({ id: doc.id, ...doc.data() });
      });
      // setLoading(false);
      setVerifyDialog(false);

      e == "ssu" && fetchedData[0].clearance == "All"
        ? usenavigate("/records")
        : e == "vale" && fetchedData[0].clearance == "All"
        ? usenavigate("/vale-records")
        : e == "ssu" && fetchedData[0].clearance == "none"
        ? message.error("No Clearance to access")
        : e == "vale" && fetchedData[0].clearance == "none"
        ? message.error("No Clearance to access")
        : e == "ssu" && fetchedData[0].clearance == "Sohar Star United"
        ? usenavigate("/records")
        : e == "vale" && fetchedData[0].clearance == "Vale"
        ? usenavigate("/vale-records")
        : message.error("No clearance to access");
    } catch (error) {
      setVerifyDialog(false);
      // setLoading(false);
      message.error(String(error));
    }
  };

  return (
    <>
      {/* <div style={{border:"", display:"flex", alignItems:"center", justifyContent:'center'}}>
        <ConfettiExplosion/>
        </div> */}
      <div
        style={{
          padding: "1.25rem",
          background:
            "linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%))",
          height: "100svh",
        }}
      >
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
          <Back
            title="Records"
            // icon={<FileArchive color="violet" width={"2rem"} />}
            extra={
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {/* <button onClick={()=>window.location.reload()} style={{paddingLeft:"1rem", paddingRight:"1rem", fontSize:"0.8rem"}}>
                        
                            <p style={{opacity:0.5, letterSpacing:"0.15rem"}}>
                                v1.18
                            </p>
                        </button> */}

                <button
                  className="blue-glass"
                  style={{
                    width: "",
                    paddingLeft: "1rem",
                    paddingRight: "1rem",
                  }}
                  onClick={() => usenavigate("/history")}
                >
                  <p style={{ fontSize: "0.8rem" }}>History</p>
                  <HistoryIcon width={"1.1rem"} color="dodgerblue" />
                </button>

                <button
                  onClick={() => usenavigate("/inbox")}
                  style={{ width: "3rem", background: "rgba(220 20 60/ 20%)" }}
                >
                  <Inbox width={"1.25rem"} className="" color="crimson" />
                </button>
              </div>
            }
          />
          <br />

          <div style={{ display: "flex", flexFlow: "column", gap: "0.5rem" }}>
            <Directive
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
            />

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

        <DefaultDialog
          onCancel={() => setVerifyDialog(false)}
          close
          open={verifyDialog}
          title={"Verifying"}
          titleIcon={<LoadingOutlined />}
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
