import { useAuth } from "@/components/AuthProvider";
import Back from "@/components/back";
import BackgroundProcessDropdown from "@/components/background-process-dropdown";
import GridTile from "@/components/grid-tile";
import IndexDropDown from "@/components/index-dropdown";
import InputDialog from "@/components/input-dialog";
import DefaultDialog from "@/components/ui/default-dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useBackgroundProcess } from "@/context/BackgroundProcessContext";
import { auth } from "@/firebase";
import { fetchAndCacheFuelLogs } from "@/utils/fuelLogsCache";
import { getPendingFuelLogsCount, syncAllPendingFuelLogs } from "@/utils/offlineFuelLogs";
import { LoadingOutlined } from "@ant-design/icons";
import emailjs from "@emailjs/browser";
import { motion } from "framer-motion";
import {
  Book,
  Bug,
  Car,
  FileArchive,
  FileText,
  Fuel,
  KeyRound,
  Link,
  Mail,
  Notebook,
  Package,
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
  const { userData, logoutUser: logOut } = useAuth();
  const { addProcess, updateProcess } = useBackgroundProcess();

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
      recipient: "it@soharstar.com",
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

  // Sync pending fuel logs on app launch
  useEffect(() => {
    const syncPendingLogs = async () => {
      if (!navigator.onLine) return;
      
      const count = getPendingFuelLogsCount();
      if (count === 0) return;

      const processId = `sync_fuel_logs_${Date.now()}`;
      addProcess(processId, `Syncing ${count} fuel log${count > 1 ? 's' : ''}`);
      updateProcess(processId, { status: "in-progress", message: "Uploading to cloud..." });

      try {
        const result = await syncAllPendingFuelLogs((current, total) => {
          const progress = Math.round((current / total) * 100);
          updateProcess(processId, { 
            progress, 
            message: `Uploaded ${current} of ${total}...` 
          });
        });

        // If sync was skipped (already in progress), silently complete
        if (result.skipped) {
          updateProcess(processId, { 
            status: "completed", 
            message: "Sync already running" 
          });
          return;
        }

        if (result.success > 0) {
          updateProcess(processId, { 
            status: "completed", 
            message: `${result.success} fuel log${result.success > 1 ? 's' : ''} synced successfully` 
          });
        }

        if (result.failed > 0) {
          updateProcess(processId, { 
            status: "error", 
            message: `${result.failed} fuel log${result.failed > 1 ? 's' : ''} failed to sync` 
          });
        }
      } catch (error) {
        console.error("Error syncing fuel logs:", error);
        updateProcess(processId, { status: "error", message: "Sync failed" });
      }
    };

    syncPendingLogs();
  }, [addProcess, updateProcess]);

  // Cache fuel logs on app launch
  useEffect(() => {
    const cacheFuelLogs = async () => {
      if (!navigator.onLine || !userData?.email) return;
      
      try {
        console.log("🔄 Caching fuel logs on app launch...");
        await fetchAndCacheFuelLogs(userData.email);
        console.log("✅ Fuel logs cached successfully");
      } catch (error) {
        console.error("Error caching fuel logs on app launch:", error);
      }
    };

    cacheFuelLogs();
  }, [userData?.email]);

  // Helper function to check module access
  const hasModuleAccess = (moduleId: string) => {
    return modulePermissions[moduleId] === true;
  };

  // Only allow fuel-log module if user has an allocated vehicle
  const hasAllocatedVehicle = !!userData?.allocated_vehicle;

  // Check if user has any modules allocated
  const hasAnyModules = () => {
    const hasRecordsMaster = hasModuleAccess('records_master') && (!userData || userData.role !== 'user');
    const hasUsers = admin && (!userData || userData.role !== 'user');
    const hasNewHire = hasModuleAccess('new_hire');
    const hasPhonebook = hasModuleAccess('phonebook');
    const hasQuickLinks = hasModuleAccess('quick_links');
    const hasQRGenerator = hasModuleAccess('qr_generator');
    const hasFuelLog = hasModuleAccess('fuel_log') && hasAllocatedVehicle;
    const hasVehicleMaster = hasModuleAccess('vehicle_master');
    const hasVehicleLogBook = hasModuleAccess('vehicle_log_book');
    const hasPettyCash = hasModuleAccess('petty_cash');
    const hasOfferLetters = hasModuleAccess('offer_letters');

    return hasRecordsMaster || hasUsers || hasNewHire || hasPhonebook || hasQuickLinks || 
           hasQRGenerator || hasFuelLog || hasVehicleMaster || hasVehicleLogBook || 
           hasPettyCash || hasOfferLetters;
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

                <BackgroundProcessDropdown/>

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
            hasAnyModules() ? (
            <div
              style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: "1rem",
                paddingBottom: "2rem"
              }}
            >
              {hasModuleAccess('records_master') && (!userData || userData.role !== 'user') && (
                <GridTile
                  title="Records Master"
                  icon={<FileArchive width={"2rem"}  />}
                  onClick={() => navigate('/records')}
                />
              )}

              {admin && (!userData || userData.role !== 'user') && (
                <GridTile
                  title="Users"
                  icon={<Users />}
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
                  title="Links"
                  icon={<Link width={"2rem"}  />}
                  onClick={() => authenticateModule('quick_links', '/quick-links', 'Links')}
                />
              )}

              {hasModuleAccess('qr_generator') && (
                <GridTile
                  title="QR Generator"
                  icon={<QrCode width={"2rem"}  />}
                  onClick={() => authenticateModule('qr_generator', '/qr-code-generator', 'QR Generator')}
                />
              )}

              {hasModuleAccess('fuel_log') && hasAllocatedVehicle && (
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
                  title="Vehicle Log"
                  icon={<Book width={"2rem"}  />}
                  onClick={() => authenticateModule('vehicle_log_book', '/vehicle-log-book', 'Vehicle Log')}
                />
              )}

              {hasModuleAccess('petty_cash') && (
                <GridTile
                  title="Petty Cash"
                  icon={<Wallet width={"2rem"}  />}
                  onClick={() => authenticateModule('petty_cash', '/petty-cash', 'Petty Cash')}
                />
              )}

              {hasModuleAccess('offer_letters') && (
                <GridTile
                  title="Offer Letters"
                  icon={<FileText width={"2rem"}  />}
                  onClick={() => authenticateModule('offer_letters', '/offer-letters', 'Offer Letters')}
                />
              )}
            </div>
            ) : (
              <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center", 
                height: "70vh" 
              }}>
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia>
                      <Package/>
                    </EmptyMedia>
                    <EmptyTitle>No Modules Allocated</EmptyTitle>
                    <EmptyDescription>You don't have access to any modules yet. Please contact your administrator to request module access.</EmptyDescription>
                  </EmptyHeader>
                  {/* <EmptyContent>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
                      <button
                        onClick={() => navigate("/profile")}
                        style={{
                          padding: "0.5rem 1.5rem",
                          background: "dodgerblue",
                          color: "white",
                          borderRadius: "0.5rem",
                          border: "none",
                          cursor: "pointer"
                        }}
                      >
                        View Profile
                      </button>
                    </div>
                  </EmptyContent> */}
                </Empty>
              </div>
            )
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
