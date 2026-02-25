import Back from "@/components/back";
import { useAuth } from "@/components/AuthProvider";
import RefreshButton from "@/components/refresh-button";
import { db } from "@/firebase";
import { getCachedProfile } from "@/utils/profileCache";
import { getCachedFuelLogs, fetchAndCacheFuelLogs, type FuelLog as FuelLogType } from "@/utils/fuelLogsCache";
import { addDoc, collection, getDocs, query } from "firebase/firestore";
import { Book, Fuel, Loader2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import moment from "moment";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Directive from "@/components/directive";

export default function FuelLog() {
  const { userData } = useAuth();
  const [date, setDate] = useState(moment().format("YYYY-MM-DD"));
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [odometerReading, setOdometerReading] = useState("");
  const [amountSpent, setAmountSpent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fuelLogs, setFuelLogs] = useState<FuelLogType[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshCompleted, setRefreshCompleted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerDetailOpen, setDrawerDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<FuelLogType | null>(null);
  const [vehicles, setVehicles] = useState<string[]>([]);

  useEffect(() => {
    // Load cached profile data immediately
    const cachedProfile = getCachedProfile();
    if (cachedProfile) {
      setUserProfile(cachedProfile);
      setVehicleNumber(cachedProfile.vehicle_number || "");
    }
    
    // Load cached fuel logs immediately
    if (userData?.email) {
      const cachedLogs = getCachedFuelLogs(userData.email);
      if (cachedLogs) {
        setFuelLogs(cachedLogs);
      }
      
      // Fetch fresh data in background
      fetchFuelLogs(true);
    }
    
    // Fetch vehicles for dropdown
    fetchVehicles();
    
    // Detect mobile/desktop
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [userData?.email]);

  const fetchVehicles = async () => {
    try {
      // Fetch from vehicle_master collection
      const vehicleMasterQuery = query(collection(db, "vehicle_master"));
      const vehicleMasterSnapshot = await getDocs(vehicleMasterQuery);
      const vehicleList: string[] = [];
      
      vehicleMasterSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.vehicle_number) {
          vehicleList.push(data.vehicle_number);
        }
      });
      
      // If vehicle_master is empty, fetch unique vehicles from fuel logs
      if (vehicleList.length === 0) {
        const fuelLogsQuery = query(collection(db, "fuel log"));
        const fuelLogsSnapshot = await getDocs(fuelLogsQuery);
        const uniqueVehicles = new Set<string>();
        
        fuelLogsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.vehicle_number) {
            uniqueVehicles.add(data.vehicle_number);
          }
        });
        
        vehicleList.push(...Array.from(uniqueVehicles));
      }
      
      // Sort alphabetically
      setVehicles(vehicleList.sort());
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  const fetchFuelLogs = async (silent = false) => {
    if (!userData?.email) return;
    
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      
      const logs = await fetchAndCacheFuelLogs(userData.email);
      setFuelLogs(logs);
      
      if (silent) {
        setRefreshCompleted(true);
        setTimeout(() => {
          setRefreshCompleted(false);
        }, 1000);
      }
    } catch (error) {
      console.error("Error fetching fuel logs:", error);
      if (!silent) toast.error("Failed to load fuel logs");
    } finally {
      if (!silent) setLoading(false);
      else setRefreshing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vehicleNumber || !odometerReading || !amountSpent) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!userProfile) {
      toast.error("User profile not found");
      return;
    }

    try {
      setSubmitting(true);

      const fuelLogData = {
        date: date,
        odometer_reading: parseFloat(odometerReading),
        amount_spent: parseFloat(amountSpent),
        email: userData?.email || "",
        employee_name: userProfile.name || "",
        vehicle_number: vehicleNumber,
        employee_code: userProfile.employeeCode || "",
        created_at: new Date(),
      };

      await addDoc(collection(db, "fuel log"), fuelLogData);

      toast.success("Fuel log submitted successfully!");
      
      // Reset form
      setDate(moment().format("YYYY-MM-DD"));
      setVehicleNumber(userProfile?.vehicle_number || "");
      setOdometerReading("");
      setAmountSpent("");
      setDrawerOpen(false);
      
      // Refresh logs
      fetchFuelLogs();
    } catch (error) {
      console.error("Error submitting fuel log:", error);
      toast.error("Failed to submit fuel log");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
        <div style={{ padding: "1.25rem", paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}>
          <Back
            title="Fuel Log"
            subtitle={fuelLogs.length}
            extra={
              <RefreshButton
                onClick={() => fetchFuelLogs(false)}
                refreshCompleted={refreshCompleted}
                fetchingData={refreshing}
              />
            }
            // icon={<Fuel color="orange" width="1.75rem" />}
          />

          <div style={{ height: "2rem" }} />

          {/* Fuel Logs List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingBottom: "5rem" }}>
                      
            {loading ? 
            (
  
              <div style={{ 
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "70vh",
                opacity: 0.5
              }}>
                <Loader2 className="animate-spin"/>
              </div>
            ) : fuelLogs.length === 0 ? (
              <div style={{ 
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "70vh",
                gap: "0.5rem",
                opacity: 0.6
              }}>
                <Fuel width="3rem" height="3rem"  />
                <p>No fuel logs yet</p>
                <p style={{ fontSize: "0.85rem" }}>Click the + button to add your first log</p>
              </div>
            ) : (
              fuelLogs.map((log) => (
                <Directive 
                  subtext={"Vehicle - "+log.vehicle_number} 
                  noArrow 
                  id_subtitle={"ODO - "+String(log.odometer_reading)} 
                  tag={log.amount_spent+".000"} 
                  key={log.id} 
                  icon={<Fuel/>} 
                  title={moment(log.date).format("DD MMM YYYY")}
                  onClick={() => {
                    setSelectedLog(log);
                    setDrawerDetailOpen(true);
                  }}
                />
                // <div
                //   key={log.id}
                //   style={{
                //     background: "rgba(100, 100, 100, 0.1)",
                //     padding: "1rem",
                //     borderRadius: "0.75rem",
                //     border: "1px solid rgba(100, 100, 100, 0.2)",
                //   }}
                // >
                //   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                //     <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                //       <Fuel width="1.25rem" color="orange" />
                //       <span style={{ fontWeight: "600", fontSize: "1rem" }}>
                //         {moment(log.date).format("DD MMM YYYY")}
                //       </span>
                //     </div>
                //     <span style={{ 
                //       fontSize: "1rem", 
                //       fontWeight: "700",
                //       color: "orange"
                //     }}>
                //       {log.amount_spent.toFixed(3)} OMR
                //     </span>
                //   </div>
                  
                //   <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.9rem" }}>
                //     <div>
                //       <span style={{ opacity: 0.6 }}>Odometer: </span>
                //       <span style={{ fontWeight: "600" }}>{log.odometer_reading.toLocaleString()} km</span>
                //     </div>
                //     <div>
                //       <span style={{ opacity: 0.6 }}>Vehicle: </span>
                //       <span style={{ fontWeight: "600" }}>{log.vehicle_number}</span>
                //     </div>
                //   </div>
                // </div>
              ))
            )}
          </div>
        </div>

        {/* Floating Action Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setDrawerOpen(true)}
          style={{
            position: "fixed",
            bottom: "calc(2rem + env(safe-area-inset-bottom, 0px))",
            right: "1.5rem",
            width: "3.5rem",
            height: "3.5rem",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #ff8c00, #ff6b00)",
            color: "white",
            border: "none",
            boxShadow: "0 4px 12px rgba(255, 140, 0, 0.4)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <Plus width="1.75rem" height="1.75rem" strokeWidth={2.5} />
        </motion.button>
      </motion.div>

      {/* Drawer for Mobile / Dialog for Desktop */}
      {isMobile ? (
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTitle></DrawerTitle>
          <DrawerDescription></DrawerDescription>
          <DrawerContent className="pb-safe" style={{ width: "100%" }}>
            <div style={{ 
              padding: "1.25rem", 
              paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))",
              width: "100%",
              boxSizing: "border-box"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                <Fuel color="orange" width="1.5rem" />
                <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>Log Fuel</h2>
              </div>

              <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%" }}>
                  {/* Date Input */}
                  <div>
                    <label
                      htmlFor="date"
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        marginBottom: "0.5rem",
                        opacity: 0.8,
                      }}
                    >
                      Date
                    </label>
                    <input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      max={moment().format("YYYY-MM-DD")}
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        borderRadius: "0.5rem",
                        fontSize: "1rem",
                        background: "rgba(100, 100, 100, 0.1)",
                        border: "1px solid rgba(100, 100, 100, 0.2)",
                      }}
                    />
                  </div>

                  {/* Vehicle Number Input with Dropdown */}
                  <div>
                    <label
                      htmlFor="vehicle"
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        marginBottom: "0.5rem",
                        opacity: 0.8,
                      }}
                    >
                      Vehicle Number
                    </label>
                    <input
                      id="vehicle"
                      type="text"
                      list="vehicle-list"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      placeholder="Search or enter vehicle number"
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        borderRadius: "0.5rem",
                        fontSize: "1rem",
                        background: "rgba(100, 100, 100, 0.1)",
                        border: "1px solid rgba(100, 100, 100, 0.2)",
                      }}
                    />
                    <datalist id="vehicle-list">
                      {vehicles.map((vehicle, index) => (
                        <option key={index} value={vehicle} />
                      ))}
                    </datalist>
                  </div>

                  {/* Odometer Reading Input */}
                  <div>
                    <label
                      htmlFor="odometer"
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        marginBottom: "0.5rem",
                        opacity: 0.8,
                      }}
                    >
                      Odometer Reading (km)
                    </label>
                    <input
                      id="odometer"
                      type="number"
                      step="0.1"
                      value={odometerReading}
                      onChange={(e) => setOdometerReading(e.target.value)}
                      placeholder="Enter odometer reading"
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        borderRadius: "0.5rem",
                        fontSize: "1rem",
                        background: "rgba(100, 100, 100, 0.1)",
                        border: "1px solid rgba(100, 100, 100, 0.2)",
                      }}
                    />
                  </div>

                  {/* Amount Spent Input */}
                  <div>
                    <label
                      htmlFor="amount"
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        marginBottom: "0.5rem",
                        opacity: 0.8,
                      }}
                    >
                      Amount Spent (OMR)
                    </label>
                    <input
                      id="amount"
                      type="number"
                      step="0.001"
                      value={amountSpent}
                      onChange={(e) => setAmountSpent(e.target.value)}
                      placeholder="Enter amount spent"
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        borderRadius: "0.5rem",
                        fontSize: "1rem",
                        background: "rgba(100, 100, 100, 0.1)",
                        border: "1px solid rgba(100, 100, 100, 0.2)",
                      }}
                    />
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={submitting || !userProfile}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: "1rem",
                      borderRadius: "0.75rem",
                      background: submitting || !userProfile 
                        ? "rgba(100, 100, 100, 0.3)" 
                        : "linear-gradient(135deg, #ff8c00, #ff6b00)",
                      color: "white",
                      fontSize: "1rem",
                      fontWeight: "600",
                      border: "none",
                      cursor: submitting || !userProfile ? "not-allowed" : "pointer",
                      marginTop: "0.5rem",
                    }}
                  >
                    {submitting ? <Loader2 className="animate-spin"/> : "Submit"}
                  </motion.button>
                </div>
              </form>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DialogContent style={{ maxWidth: "500px" }}>
            <DialogHeader>
              <DialogTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Fuel color="orange" width="1.5rem" />
                <span>Log Fuel</span>
              </DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Date Input */}
                <div>
                  <label
                    htmlFor="date-desktop"
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                      opacity: 0.8,
                    }}
                  >
                    Date
                  </label>
                  <input
                    id="date-desktop"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    max={moment().format("YYYY-MM-DD")}
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.5rem",
                      fontSize: "1rem",
                      background: "rgba(100, 100, 100, 0.1)",
                      border: "1px solid rgba(100, 100, 100, 0.2)",
                    }}
                  />
                </div>

                {/* Vehicle Number Input with Dropdown */}
                <div>
                  <label
                    htmlFor="vehicle-desktop"
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                      opacity: 0.8,
                    }}
                  >
                    Vehicle Number
                  </label>
                  <input
                    id="vehicle-desktop"
                    type="text"
                    list="vehicle-list-desktop"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="Search or enter vehicle number"
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.5rem",
                      fontSize: "1rem",
                      background: "rgba(100, 100, 100, 0.1)",
                      border: "1px solid rgba(100, 100, 100, 0.2)",
                    }}
                  />
                  <datalist id="vehicle-list-desktop">
                    {vehicles.map((vehicle, index) => (
                      <option key={index} value={vehicle} />
                    ))}
                  </datalist>
                </div>

                {/* Odometer Reading Input */}
                <div>
                  <label
                    htmlFor="odometer-desktop"
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                      opacity: 0.8,
                    }}
                  >
                    Odometer Reading (km)
                  </label>
                  <input
                    id="odometer-desktop"
                    type="number"
                    step="0.1"
                    value={odometerReading}
                    onChange={(e) => setOdometerReading(e.target.value)}
                    placeholder="Enter odometer reading"
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.5rem",
                      fontSize: "1rem",
                      background: "rgba(100, 100, 100, 0.1)",
                      border: "1px solid rgba(100, 100, 100, 0.2)",
                    }}
                  />
                </div>

                {/* Amount Spent Input */}
                <div>
                  <label
                    htmlFor="amount-desktop"
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                      opacity: 0.8,
                    }}
                  >
                    Amount Spent (OMR)
                  </label>
                  <input
                    id="amount-desktop"
                    type="number"
                    step="0.001"
                    value={amountSpent}
                    onChange={(e) => setAmountSpent(e.target.value)}
                    placeholder="Enter amount spent"
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.5rem",
                      fontSize: "1rem",
                      background: "rgba(100, 100, 100, 0.1)",
                      border: "1px solid rgba(100, 100, 100, 0.2)",
                    }}
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={submitting || !userProfile}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    background: submitting || !userProfile 
                      ? "rgba(100, 100, 100, 0.3)" 
                      : "linear-gradient(135deg, #ff8c00, #ff6b00)",
                    color: "white",
                    fontSize: "1rem",
                    fontWeight: "600",
                    border: "none",
                    cursor: submitting || !userProfile ? "not-allowed" : "pointer",
                    marginTop: "0.5rem",
                  }}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </motion.button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Detail View - Drawer for Mobile / Dialog for Desktop */}
      {selectedLog && (
        isMobile ? (
          <Drawer open={drawerDetailOpen} onOpenChange={setDrawerDetailOpen}>
            <DrawerTitle></DrawerTitle>
            <DrawerDescription></DrawerDescription>
            <DrawerContent className="pb-safe" style={{ width: "100%" }}>
              <div style={{ 
                padding: "1.25rem", 
                paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))",
                width: "100%",
                boxSizing: "border-box"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  <Book color="orange" width="1.5rem" />
                  <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>Log Details</h2>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {/* Date */}
                  <div>
                    
                    <div style={{
                      padding: "0.75rem 1rem",
                      borderRadius: "0.5rem",
                      background: "rgba(100, 100, 100, 0.1)",
                      display:"flex",
                      gap:"0.5rem",
                      fontSize: "1rem",
                    
                    }}>
                        <p>Date</p>
                      <b>{moment(selectedLog.date).format("DD MMMM YYYY")}</b>
                    </div>
                  </div>

                  {/* Employee Name */}
                  <div>
                    
                    <div style={{
                      padding: "0.75rem 1rem",
                      borderRadius: "0.5rem",
                      background: "rgba(100, 100, 100, 0.1)",
                      display:"flex",
                      gap:"0.5rem",
                      fontSize: "1rem",
                   
                    }}>
                      <p>User</p>
                      <b>{selectedLog.employee_name}</b>
                    </div>
                  </div>

                  {/* Vehicle Number */}
                  <div>
                    
                    <div style={{
                      padding: "0.75rem 1rem",
                      borderRadius: "0.5rem",
                      background: "rgba(100, 100, 100, 0.1)",
                      display:"flex",
                      gap:"0.5rem",
                      fontSize: "1rem",
                    
                    }}>
                      <p>Vehicle</p>
                      <b>{selectedLog.vehicle_number}</b>
                    </div>
                  </div>

                  {/* Odometer Reading */}
                  <div>
                    
                    <div style={{
                      padding: "0.75rem 1rem",
                      borderRadius: "0.5rem",
                      background: "rgba(100, 100, 100, 0.1)",
                     display:"flex",
                     gap:"0.5rem",
                      fontSize: "1rem",
                      
                    }}>
                      <p>ODO</p>
                      <b>{selectedLog.odometer_reading.toLocaleString()} km</b>
                    </div>
                  </div>

                  {/* Amount Spent */}
                  <div>
                    
                    <div style={{
                      padding: "0.75rem 1rem",
                      borderRadius: "0.5rem",
                      background: "rgba(100, 100, 100, 0.1)",
                      display:"flex",
                      gap:"0.5rem",
                      
                    
            
                    }}>
                      <p>Amount</p>
                      <b>{selectedLog.amount_spent.toFixed(3)} OMR</b>
                    </div>
                  </div>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog open={drawerDetailOpen} onOpenChange={setDrawerDetailOpen}>
            <DialogContent style={{ maxWidth: "500px" }}>
              <DialogHeader>
                <DialogTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Book color="orange" width="1.5rem" />
                  <span>Log Details</span>
                </DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Date */}
                <div>
                  <div style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "0.5rem",
                    background: "rgba(100, 100, 100, 0.1)",
                    display: "flex",
                    gap: "0.5rem",
                    fontSize: "1rem",
                  }}>
                    <p>Date</p>
                    <b>{moment(selectedLog.date).format("DD MMMM YYYY")}</b>
                  </div>
                </div>

                {/* Employee Name */}
                <div>
                  <div style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "0.5rem",
                    background: "rgba(100, 100, 100, 0.1)",
                    display: "flex",
                    gap: "0.5rem",
                    fontSize: "1rem",
                  }}>
                    <p>User</p>
                    <b>{selectedLog.employee_name}</b>
                  </div>
                </div>

                {/* Vehicle Number */}
                <div>
                  <div style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "0.5rem",
                    background: "rgba(100, 100, 100, 0.1)",
                    display: "flex",
                    gap: "0.5rem",
                    fontSize: "1rem",
                  }}>
                    <p>Vehicle</p>
                    <b>{selectedLog.vehicle_number}</b>
                  </div>
                </div>

                {/* Odometer Reading */}
                <div>
                  <div style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "0.5rem",
                    background: "rgba(100, 100, 100, 0.1)",
                    display: "flex",
                    gap: "0.5rem",
                    fontSize: "1rem",
                  }}>
                    <p>ODO</p>
                    <b>{selectedLog.odometer_reading.toLocaleString()} km</b>
                  </div>
                </div>

                {/* Amount Spent */}
                <div>
                  <div style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "0.5rem",
                    background: "rgba(100, 100, 100, 0.1)",
                    display: "flex",
                    gap: "0.5rem",
                  }}>
                    <p>Amount</p>
                    <b>{selectedLog.amount_spent.toFixed(3)} OMR</b>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )
      )}
    </>
  );
}
