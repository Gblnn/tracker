import Back from "@/components/back";
import Directive from "@/components/directive";
import IndexDropDown from "@/components/index-dropdown";
import InputDialog from "@/components/input-dialog";
import DefaultDialog from "@/components/ui/default-dialog";
import { auth } from "@/firebase";
import { LoadingOutlined } from "@ant-design/icons";
import emailjs from "@emailjs/browser";
import { message } from "antd";
import { motion } from "framer-motion";
import { Bug, FileArchive, KeyRound, Mail, QrCode } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";

export default function Index() {
  const usenavigate = useNavigate();
  const [requestDialog, setRequestDialog] = useState(false);
  const [bugDialog, setBugDialog] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [valeLoginPrompt, setValeLoginPrompt] = useState(false);
  const [logoutPrompt, setLogoutPrompt] = useState(false);
  const navigate = useNavigate();
  const [issue, setIssue] = useState("");
  const [loading, setLoading] = useState(false);
  const [access, setAccess] = useState(false);
  const [admin, setAdmin] = useState(false);
  const { userData, logOut } = useAuth();

  const serviceId = "service_fixajl8";
  const templateId = "template_0f3zy3e";

  const sendBugReport = async () => {
    setLoading(true);
    await emailjs.send(serviceId, templateId, {
      name: auth.currentUser?.email,
      subject:
        "Bug Report - " +
        moment().format("ll") +
        " from " +
        auth.currentUser?.email,
      recipient: "goblinn688@gmail.com",
      message: issue,
    });
    setLoading(false);
    message.success("Bug Report sent");
    setBugDialog(false);
  };

  useEffect(() => {
    if (userData) {
      const hasAccess =
        userData.clearance === "Sohar Star United" ||
        userData.clearance === "Vale" ||
        userData.clearance === "All";
      setAccess(hasAccess);
      setAdmin(userData.role === "admin");

      if (userData.role === "profile") {
        navigate("/profile");
      }
    }
  }, [userData, navigate]);

  const Authenticate = () => {
    access ? navigate("/record-list") : message.error("Clearance required");
  };

  const handleLogout = async () => {
    try {
      setLogoutPrompt(false);
      await logOut();
    } catch (error) {
      console.error("Logout error:", error);
      message.error("Failed to logout. Please try again.");
    }
  };

  return (
    <>
      {/* <div style={{border:"", display:"flex", alignItems:"center", justifyContent:'center'}}>
        <ConfettiExplosion/>
        </div> */}
      <div
        style={{
          border: "",
          padding: "1.25rem",
          background:
            "linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%))",
          height: "100svh",
        }}
      >
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
          <Back
            title="StarBoard"
            subtitle={"v1.4"}
            icon={<img src="/stardox-bg.png" style={{ width: "1.75rem" }} />}
            noback
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

                {admin && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                  >
                    <button
                      onClick={() => navigate("/admin")}
                      style={{
                        fontSize: "0.75rem",
                        paddingLeft: "1rem",
                        paddingRight: "1rem",
                        height: "2.5rem",
                        width: "3rem",
                      }}
                    >
                      {loading ? (
                        <LoadingOutlined color="dodgerblue" />
                      ) : (
                        <KeyRound color="dodgerblue" width={"1rem"} />
                      )}
                    </button>
                  </motion.div>
                )}

                {/* <button
                  style={{
                    fontSize: "0.75rem",
                    paddingLeft: "1rem",
                    paddingRight: "1rem",
                  }}
                  onClick={() => setBugDialog(true)}
                >
                  <Bug width={"1rem"} color="lightgreen" />
                </button> */}

                <IndexDropDown
                  onLogout={() => setLogoutPrompt(true)}
                  onProfile={() => navigate("/profile")}
                />
              </div>
            }
          />
          <br />
          {loading ? (
            <div
              style={{
                border: "",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "75svh",
              }}
            >
              <LoadingOutlined style={{ color: "dodgerblue", scale: "2" }} />
            </div>
          ) : (
            <div style={{ display: "flex", flexFlow: "column", gap: "0.5rem" }}>
              <Directive
                to={access ? "/record-list" : ""}
                onClick={Authenticate}
                title={"Records Master"}
                icon={<FileArchive color="violet" width={"1.25rem"} />}
              />

              {/* <Directive
                to={"/new-hire"}
                title={"New Hire"}
                icon={<UserPlus width={"1.25rem"} color="dodgerblue" />}
              /> */}

              {/* <Directive
                title={"Vehicles"}
                icon={<Car color="salmon" width={"1.25rem"} />}
              />

              <Directive
                to={"/website"}
                title={"Website"}
                icon={<Globe width={"1.25rem"} />}
              /> */}

              {/* <Directive
                to={"/add-remarks"}
                title={"Annotate"}
                icon={<PenSquare width={"1.25rem"} color="dodgerblue" />}
              /> */}

              <Directive
                onClick={() => usenavigate("/qr-code-generator")}
                to={"/qr-code-generator"}
                title={"QR Generator"}
                icon={<QrCode width={"1.25rem"} />}
              />

              {/* <Directive
                tag="Work In Progress"
                to={"/movement-register"}
                title={"Movement"}
                icon={<ArrowUpDown width={"1.25rem"} color="dodgerblue" />}
              />

              <Directive
                tag="Work In Progress"
                status={true}
                to={"/lpos"}
                title={"LPOs"}
                icon={<FileText width={"1.25rem"} color="dodgerblue" />}
              /> */}

              {/* <Directive
              notName
              to={""}
              title={"Report a Bug"}
              icon={<Bug width={"1.25rem"} color="lightgreen" />}
              onClick={() => {
                setBugDialog(true);
              }}
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
          )}
        </motion.div>

        <DefaultDialog
          title={"Report a Bug"}
          titleIcon={<Bug color="lightgreen" />}
          extra={
            <div
              style={{
                display: "flex",
                width: "100%",
                flexFlow: "column",
                gap: "0.75rem",
                paddingBottom: "0.5rem",
              }}
            >
              <textarea
                onChange={(e) => setIssue(e.target.value)}
                rows={5}
                placeholder="Describe issue"
              />
            </div>
          }
          open={bugDialog}
          onCancel={() => setBugDialog(false)}
          OkButtonText="Report"
          disabled={issue == ""}
          onOk={() => {
            issue != "" ? sendBugReport() : "";
          }}
          updating={loading}
        />

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
          onOk={() => navigate("/records")}
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
          onOk={() => navigate("/vale-records")}
        />

        <DefaultDialog
          destructive
          title={"Logout"}
          OkButtonText="Logout"
          open={logoutPrompt}
          onCancel={() => setLogoutPrompt(false)}
          onOk={handleLogout}
        />
      </div>
      {/* <ReleaseNote /> */}
    </>
  );
}
