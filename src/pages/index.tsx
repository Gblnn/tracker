import { useAuth } from "@/components/AuthProvider";
import Back from "@/components/back";
import BackgroundProcessDropdown from "@/components/background-process-dropdown";
import Directive from "@/components/directive";
import GridTile from "@/components/grid-tile";
import IndexDropDown from "@/components/index-dropdown";
import InputDialog from "@/components/input-dialog";
import DefaultDialog from "@/components/ui/default-dialog";
import { auth } from "@/firebase";
import { LoadingOutlined } from "@ant-design/icons";
import emailjs from "@emailjs/browser";
import { motion } from "framer-motion";
import {
  Book,
  Bug,
  Car,
  FileArchive,
  Fuel,
  KeyRound,
  LayoutGrid,
  Link,
  List,
  Mail,
  Notebook,
  QrCode,
  UserCheck,
  Users,
  Wallet
} from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
  const [admin, setAdmin] = useState(false);
  const [modulePermissions, setModulePermissions] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'directive'>('directive');
  const { userData, logoutUser: logOut } = useAuth();

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
    toast.success("Bug Report sent");
    setBugDialog(false);
  };

  useEffect(() => {
    if (userData) {
      // Parse module permissions from clearance JSON
      try {
        const permissions = JSON.parse(userData.clearance || '{}');
        setModulePermissions(permissions);
      } catch {
        // Fallback for old clearance system
        
        setModulePermissions({});
      }
      setAdmin(userData.role === "admin");

      if (userData.role === "profile") {
        navigate("/profile");
      }
    }
  }, [userData, navigate]);

  // Helper function to check module access
  const hasModuleAccess = (moduleId: string) => {
    return modulePermissions[moduleId] === true;
  };

  // Authenticate for specific module
  const authenticateModule = (moduleId: string, path: string, moduleName: string) => {
    if (hasModuleAccess(moduleId)) {
      usenavigate(path);
    } else {
      toast.error(`No clearance to access ${moduleName}`);
    }
  };

  const handleLogout = async () => {
    try {
      setLogoutPrompt(false);
      await logOut();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout. Please try again.");
    }
  };

  return (
    <>
      {/* <div style={{border:"", display:"flex", alignItems:"center", justifyContent:'center'}}>
        <ConfettiExplosion/>
        </div> */}
        <Back
        blurBG
          fixed
          editMode={userData?.editor===true? true : false}
            title="StarBoard"
            // subtitle={userData?.role}
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

                {/* {admin && (
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
                )
                
                } */}

                <BackgroundProcessDropdown />

                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'directive' : 'grid')}
                  style={{
                    width: "3rem",
                    height: "2.5rem",
                  }}
                  title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
                >
                  {viewMode === 'grid' ? (
                    <List width={"1rem"} color="dodgerblue" />
                  ) : (
                    <LayoutGrid width={"1rem"} color="dodgerblue" />
                  )}
                </button>

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
      <div
        style={{
          border: "",
          padding: "1.25rem",
          
          // background:
          //   "linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%))",
          height: "100svh",
        }}
      >
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
          <br/>
          <br/>
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
            <>
              {viewMode === 'directive' ? (
                <div style={{ display: "flex", flexFlow: "column", gap: "0.5rem" }}>
                  {hasModuleAccess('records_master') && (
                    <Directive
                      onClick={() => navigate('/records')}
                      title={"Records Master"}
                      icon={<FileArchive width={"1.25rem"} />}
                    />
                  )}

                  {admin && (
                    <Directive onClick={() => navigate('/users')} icon={<Users width={"1.25rem"}/>} title={"Users"}/>
                  )}
              

              {/* <Directive onClick={()=>usenavigate("/documents")} title={"Document Generation"} icon={<FilePen width={"1.25rem"} color="mediumslateblue"/>} /> */}

              {/* <Directive
              onClick={() => usenavigate("/mobilizacao")}
               title={"Mobilizacao"} icon={
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
              }/> */}
              {/* <Directive
                onClick={() =>
                  access
                    ? usenavigate("/human-resources")
                    : toast.error("No Clearance to Access")
                }
                // protected={userData?.role == "hr" ? false:true}
                title={"Human Resources"}
                icon={<SquareUser color="royalblue" width={"1.25rem"} />}
              /> */}

              

              {hasModuleAccess('new_hire') && (
                <Directive
                  onClick={() => authenticateModule('new_hire', '/new-hire', 'New Hire')}
                  title={"New Hire"}
                  icon={<UserCheck width={"1.25rem"} />}
                />
              )}

              {hasModuleAccess('phonebook') && (
                <Directive
                  onClick={() => authenticateModule('phonebook', '/phonebook', 'Phonebook')}
                  title={"Phonebook"}
                  icon={<Notebook width={"1.25rem"} />}
                />
              )}

              

              {hasModuleAccess('quick_links') && (
                <Directive
                  onClick={() => authenticateModule('quick_links', '/quick-links', 'Quick Links')}
                  title={"Quick Links"}
                  icon={<Link width={"1.25rem"} />}
                />
              )}

              {/* <Directive
                onClick={() => usenavigate("/agreements")}
                to={"/agreements"}
                title={"Agreements"}
                icon={<FileText width={"1.25rem"} color="mediumslateblue" />}
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

              {hasModuleAccess('qr_generator') && (
                <Directive
                  onClick={() => authenticateModule('qr_generator', '/qr-code-generator', 'QR Generator')}
                  title={"QR Generator"}
                  icon={<QrCode width={"1.25rem"} />}
                />
              )}

              {hasModuleAccess('fuel_log') && (
                <Directive
                  onClick={() => authenticateModule('fuel_log', '/fuel-log', 'Fuel Log')}
                  title={"Fuel Log"}
                  icon={<Fuel width={"1.25rem"}  />}
                />
              )}

              {hasModuleAccess('vehicle_master') && (
                <Directive
                  onClick={() => authenticateModule('vehicle_master', '/vehicle-master', 'Vehicle Master')}
                  title={"Vehicle Master"}
                  icon={<Car width={"1.25rem"} />}
                />
              )}

              {hasModuleAccess('vehicle_log_book') && (
                <Directive
                  onClick={() => authenticateModule('vehicle_log_book', '/vehicle-log-book', 'Vehicle Log Book')}
                  title={"Vehicle Log Book"}
                  icon={<Book width={"1.25rem"} />}
                />
              )}

              {hasModuleAccess('petty_cash') && (
                <Directive
                  onClick={() => authenticateModule('petty_cash', '/petty-cash', 'Petty Cash')}
                  title={"Petty Cash"}
                  icon={<Wallet width={"1.25rem"} />}
                />
              )}

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
              ) : (
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: "1rem",
                  paddingBottom: "2rem"
                }}>
                  {hasModuleAccess('records_master') && (
                    <GridTile
                      title="Records Master"
                      icon={<FileArchive width={"2rem"}  />}
                      onClick={() => navigate('/records')}
                    />
                  )}

                  {admin && (
                    <GridTile
                      title="Users"
                      icon={<Users width={"2rem"} />}
                      onClick={() => navigate('/users')}
                    />
                  )}

                  {hasModuleAccess('new_hire') && (
                    <GridTile
                      title="New Hire"
                      icon={<UserCheck width={"2rem"}  />}
                      onClick={() => authenticateModule('new_hire', '/new-hire', 'New Hire')}
                    />
                  )}

                  {hasModuleAccess('phonebook') && (
                    <GridTile
                      title="Phonebook"
                      icon={<Notebook width={"2rem"}  />}
                      onClick={() => authenticateModule('phonebook', '/phonebook', 'Phonebook')}
                    />
                  )}

                  {hasModuleAccess('quick_links') && (
                    <GridTile
                      title="Quick Links"
                      icon={<Link width={"2rem"}  />}
                      onClick={() => authenticateModule('quick_links', '/quick-links', 'Quick Links')}
                    />
                  )}

                  {hasModuleAccess('qr_generator') && (
                    <GridTile
                      title="QR Generator"
                      icon={<QrCode width={"2rem"}  />}
                      onClick={() => authenticateModule('qr_generator', '/qr-code-generator', 'QR Generator')}
                    />
                  )}

                  {hasModuleAccess('fuel_log') && (
                    <GridTile
                      title="Fuel Log"
                      icon={<Fuel width={"2rem"}  />}
                      onClick={() => authenticateModule('fuel_log', '/fuel-log', 'Fuel Log')}
                    />
                  )}

                  {hasModuleAccess('vehicle_master') && (
                    <GridTile
                      title="Vehicle Master"
                      icon={<Car width={"2rem"}  />}
                      onClick={() => authenticateModule('vehicle_master', '/vehicle-master', 'Vehicle Master')}
                    />
                  )}

                  {hasModuleAccess('vehicle_log_book') && (
                    <GridTile
                      title="Vehicle Log Book"
                      icon={<Book width={"2rem"}  />}
                      onClick={() => authenticateModule('vehicle_log_book', '/vehicle-log-book', 'Vehicle Log Book')}
                    />
                  )}

                  {hasModuleAccess('petty_cash') && (
                    <GridTile
                      title="Petty Cash"
                      icon={<Wallet width={"2rem"}  />}
                      onClick={() => authenticateModule('petty_cash', '/petty-cash', 'Petty Cash')}
                    />
                  )}
                </div>
              )}
            </>
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
