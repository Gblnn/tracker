import Back from "@/components/back";
import { useAuth } from "@/components/AuthProvider";
import RefreshButton from "@/components/refresh-button";
import { db } from "@/firebase";
import { getCachedProfile } from "@/utils/profileCache";
import { getCachedFuelLogs, fetchAndCacheFuelLogs, type FuelLog as FuelLogType } from "@/utils/fuelLogsCache";
import { addDoc, collection, getDocs, query } from "firebase/firestore";
import { Book, Calendar, Car, ChevronLeft, ChevronRight, DollarSign, Fuel, Gauge, Loader2, Plus, Truck, User } from "lucide-react";
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewingMonth, setViewingMonth] = useState(moment());

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
                  tag={log.amount_spent.toFixed(3)} 
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
            background: "black",
            color: "white",
            border: "none",
            
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
          <DrawerContent className="pb-safe" style={{ width: "100%", maxHeight: "90vh" }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", maxHeight: "90vh", width: "100%" }}>
              {/* Fixed Header */}
              <div style={{
                padding: "1.5rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid rgba(100, 100, 100, 0.1)",
                background: "var(--background)",
                boxSizing: "border-box"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    background: "black",
                    padding: "0.75rem",
                    borderRadius: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Fuel color="white" width="1.5rem" />
                  </div>
                  <h2 style={{ fontSize: "1.5rem", letterSpacing: "-0.02em" }}>Log Fuel</h2>
                </div>
              </div>

              {/* Scrollable Content */}
              <div style={{ 
                flex: 1,
                padding: "1.5rem",
                paddingTop: "1.5rem",
                paddingBottom: "0",
                width: "100%",
                boxSizing: "border-box",
                overflowY: "auto",
                minHeight: 0
              }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%", paddingBottom: "1.5rem" }}>
                    {/* Date Input with Quick Actions */}
                    <motion.div
                      whileTap={{ scale: 0.99 }}
                      style={{
                        background: "rgba(100, 100, 100, 0.05)",
                        padding: "1rem",
                        borderRadius: "1rem",
                        border: "2px solid rgba(100, 100, 100, 0.1)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        <Calendar width="1.125rem" height="1.125rem" style={{ opacity: 0.7 }}  />
                        <label
                          htmlFor="date"
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            opacity: 0.9,
                          }}
                        >
                          Date
                        </label>
                      </div>
                      
                      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setDate(moment().format("YYYY-MM-DD"))}
                          style={{
                            flex: 1,
                            padding: "0.625rem",
                            borderRadius: "0.5rem",
                            background: date === moment().format("YYYY-MM-DD") 
                              ? "orange"
                              : "rgba(100, 100, 100, 0.1)",
                            color: date === moment().format("YYYY-MM-DD") ? "white" : "inherit",
                            border: "none",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          Today
                        </motion.button>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setDate(moment().subtract(1, 'day').format("YYYY-MM-DD"))}
                          style={{
                            flex: 1,
                            padding: "0.625rem",
                            borderRadius: "0.5rem",
                            background: date === moment().subtract(1, 'day').format("YYYY-MM-DD")
                              ? "orange"
                              : "rgba(100, 100, 100, 0.1)",
                            color: date === moment().subtract(1, 'day').format("YYYY-MM-DD") ? "white" : "inherit",
                            border: "none",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          Yesterday
                        </motion.button>
                      </div>
                      
                      <div onClick={() => setShowDatePicker(!showDatePicker)} style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "0.75rem",
                        padding: "0.875rem 1rem",
                        borderRadius: "0.75rem",
                        background: "rgba(100, 100, 100, 0.08)",
                        border: "1px solid rgba(100, 100, 100, 0.15)",
                        cursor: "pointer"
                      }}>
                        <span style={{ fontSize: "1.125rem", fontWeight: "600", flex: 1 }}>
                          {moment(date).format("DD MMM YYYY")}
                        </span>
                        <motion.div
                          whileTap={{ scale: 0.95 }}
                          style={{
                            padding: "0.375rem 0.75rem",
                            borderRadius: "0.5rem",
                            background: "rgba(100, 100, 100, 0.1)",
                           
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            
                          }}
                        >
                          {showDatePicker ? "Close" : "Change"}
                        </motion.div>
                      </div>
                      
                      {/* Custom Date Picker */}
                      {showDatePicker && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{
                            marginTop: "0.75rem",
                            background: "rgba(100, 100, 100, 0.05)",
                            borderRadius: "0.75rem",
                            padding: "1rem",
                            border: "1px solid rgba(100, 100, 100, 0.15)",
                          }}
                        >
                          {/* Month Navigation */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setViewingMonth(viewingMonth.clone().subtract(1, 'month'))}
                              style={{
                                padding: "0.5rem",
                                borderRadius: "0.5rem",
                                background: "rgba(100, 100, 100, 0.1)",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                            >
                              <ChevronLeft width="1.25rem" height="1.25rem" />
                            </motion.button>
                            <span style={{ fontWeight: "700", fontSize: "1rem" }}>
                              {viewingMonth.format("MMMM YYYY")}
                            </span>
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setViewingMonth(viewingMonth.clone().add(1, 'month'))}
                              disabled={viewingMonth.clone().add(1, 'month').isAfter(moment(), 'month')}
                              style={{
                                padding: "0.5rem",
                                borderRadius: "0.5rem",
                                background: viewingMonth.clone().add(1, 'month').isAfter(moment(), 'month') ? "rgba(100, 100, 100, 0.05)" : "rgba(100, 100, 100, 0.1)",
                                border: "none",
                                cursor: viewingMonth.clone().add(1, 'month').isAfter(moment(), 'month') ? "not-allowed" : "pointer",
                                opacity: viewingMonth.clone().add(1, 'month').isAfter(moment(), 'month') ? 0.3 : 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                            >
                              <ChevronRight width="1.25rem" height="1.25rem" />
                            </motion.button>
                          </div>
                          
                          {/* Weekday Headers */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.25rem", marginBottom: "0.5rem" }}>
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                              <div key={i} style={{ textAlign: "center", fontSize: "0.75rem", fontWeight: "600", opacity: 0.6, padding: "0.25rem" }}>
                                {day}
                              </div>
                            ))}
                          </div>
                          
                          {/* Calendar Days */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.25rem" }}>
                            {(() => {
                              const startOfMonth = viewingMonth.clone().startOf('month');
                              const endOfMonth = viewingMonth.clone().endOf('month');
                              const startDay = startOfMonth.day();
                              const daysInMonth = endOfMonth.date();
                              const days = [];
                              
                              // Empty cells before month starts
                              for (let i = 0; i < startDay; i++) {
                                days.push(<div key={`empty-${i}`} />);
                              }
                              
                              // Days of the month
                              for (let day = 1; day <= daysInMonth; day++) {
                                const currentDate = viewingMonth.clone().date(day);
                                const dateString = currentDate.format("YYYY-MM-DD");
                                const isSelected = dateString === date;
                                const isToday = currentDate.isSame(moment(), 'day');
                                const isFuture = currentDate.isAfter(moment(), 'day');
                                
                                days.push(
                                  <motion.button
                                    key={day}
                                    type="button"
                                    whileTap={{ scale: isFuture ? 1 : 0.9 }}
                                    onClick={() => {
                                      if (!isFuture) {
                                        setDate(dateString);
                                        setShowDatePicker(false);
                                      }
                                    }}
                                    disabled={isFuture}
                                    style={{
                                      padding: "0.625rem 0.25rem",
                                      borderRadius: "0.5rem",
                                      background: isSelected
                                        ? "linear-gradient(135deg, #ff8c00, #ff6b00)"
                                        : isToday
                                        ? "rgba(255, 140, 0, 0.15)"
                                        : "rgba(100, 100, 100, 0.05)",
                                      color: isSelected ? "white" : isFuture ? "rgba(100, 100, 100, 0.3)" : "inherit",
                                      border: isToday && !isSelected ? "1px solid rgba(255, 140, 0, 0.5)" : "1px solid transparent",
                                      cursor: isFuture ? "not-allowed" : "pointer",
                                      fontSize: "0.875rem",
                                      fontWeight: isSelected || isToday ? "700" : "500",
                                      transition: "all 0.2s"
                                    }}
                                  >
                                    {day}
                                  </motion.button>
                                );
                              }
                              
                              return days;
                            })()}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Vehicle Number Input with Dropdown */}
                    <motion.div
                      whileTap={{ scale: 0.99 }}
                      style={{
                        background: "rgba(100, 100, 100, 0.05)",
                        padding: "1rem",
                        borderRadius: "1rem",
                        border: "2px solid rgba(100, 100, 100, 0.1)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        <Truck width="1.125rem" height="1.125rem" style={{ opacity: 0.7 }} color="dodgerblue" />
                        <label
                          htmlFor="vehicle"
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            opacity: 0.9,
                          }}
                        >
                          Vehicle Number
                        </label>
                      </div>
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
                          padding: "0.875rem 1rem",
                          borderRadius: "0.75rem",
                          fontSize: "1.0625rem",
                          fontWeight: "500",
                          background: "rgba(100, 100, 100, 0.08)",
                          border: "1px solid rgba(100, 100, 100, 0.15)",
                          transition: "all 0.2s",
                        }}
                      />
                      <datalist id="vehicle-list">
                        {vehicles.map((vehicle, index) => (
                          <option key={index} value={vehicle} />
                        ))}
                      </datalist>
                    </motion.div>

                    {/* Odometer Reading Input */}
                    <motion.div
                      whileTap={{ scale: 0.99 }}
                      style={{
                        background: "rgba(100, 100, 100, 0.05)",
                        padding: "1rem",
                        borderRadius: "1rem",
                        border: "2px solid rgba(100, 100, 100, 0.1)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        <Gauge width="1.125rem" height="1.125rem" style={{ opacity: 0.7 }} color="mediumslateblue" />
                        <label
                          htmlFor="odometer"
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            opacity: 0.9,
                          }}
                        >
                          Odometer Reading
                        </label>
                      </div>
                      <div style={{ position: "relative" }}>
                        <input
                          id="odometer"
                          type="number"
                          step="0.1"
                          value={odometerReading}
                          onChange={(e) => setOdometerReading(e.target.value)}
                          placeholder="Enter reading"
                          required
                          style={{
                            width: "100%",
                            padding: "0.875rem 1rem",
                            paddingRight: "3rem",
                            borderRadius: "0.75rem",
                            fontSize: "1.0625rem",
                            fontWeight: "500",
                            background: "rgba(100, 100, 100, 0.08)",
                            border: "1px solid rgba(100, 100, 100, 0.15)",
                            transition: "all 0.2s",
                          }}
                        />
                        <span style={{
                          position: "absolute",
                          right: "1rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          opacity: 0.5,
                        }}>
                          km
                        </span>
                      </div>
                    </motion.div>

                    {/* Amount Spent Input */}
                    <motion.div
                      whileTap={{ scale: 0.99 }}
                      style={{
                       
                        padding: "1rem",
                        borderRadius: "1rem",
                    
                        border: "1px solid rgba(100, 100, 100, 0.3)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        <DollarSign width="1.125rem" height="1.125rem" style={{ opacity: 0.7 }} color="orange" />
                        <label
                          htmlFor="amount"
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            opacity: 0.9,
                          }}
                        >
                          Amount Spent
                        </label>
                      </div>
                      <div style={{ position: "relative" }}>
                        <input
                          id="amount"
                          type="number"
                          step="0.001"
                          value={amountSpent}
                          onChange={(e) => setAmountSpent(e.target.value)}
                          placeholder="Enter amount"
                          required
                          style={{
                            width: "100%",
                            padding: "0.875rem 1rem",
                            paddingRight: "4rem",
                            borderRadius: "0.75rem",
                            fontSize: "1.0625rem",
                            fontWeight: "500",
                            
                            border: "1px solid rgba(100, 100, 100, 0.1)",
                            transition: "all 0.2s",
                            
                          }}
                        />
                        <span style={{
                          position: "absolute",
                          right: "1rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          
                          opacity: 0.7,
                        }}>
                          OMR
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
              
              {/* Fixed Submit Button */}
              <div style={{
                padding: "1rem",
                border:"",
                boxShadow:"1px 1px 20px rgba(0,0,0,0.5)",
                // paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
               
                background: "var(--background)",
                boxSizing: "border-box"
              }}>
                <motion.button
                  type="submit"
                  disabled={submitting || !userProfile || !date || !vehicleNumber.trim() || !odometerReading || !amountSpent}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.01 }}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    borderRadius: "1rem",
                    marginBottom:"0.5rem",
                    background: submitting || !userProfile || !date || !vehicleNumber.trim() || !odometerReading || !amountSpent
                      ? "rgba(100, 100, 100, 1)" 
                      : "black",
                    color: "white",
                    fontSize: "1.0625rem",
                    border: "none",
                    cursor: submitting || !userProfile || !date || !vehicleNumber.trim() || !odometerReading || !amountSpent ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    fontWeight: "600"
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" width="1.25rem" />
                    </>
                  ) : (
                    <span>Add</span>
                  )}
                </motion.button>
              </div>
            </form>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DialogContent style={{ maxWidth: "500px", display: "flex", flexDirection: "column", maxHeight: "90vh", padding: 0 }}>
            <DialogHeader style={{ padding: "1.5rem", paddingBottom: "1rem" }}>
              <DialogTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Fuel color="orange" width="1.5rem" />
                <span>Log Fuel</span>
              </DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
              {/* Scrollable Content */}
              <div style={{ flex: 1, overflowY: "auto", padding: "0 1.5rem", paddingBottom: "1rem", minHeight: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Date Input with Quick Actions */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <Calendar width="1rem" height="1rem" style={{ opacity: 0.7 }} color="orange" />
                    <label
                      htmlFor="date-desktop"
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        opacity: 0.9,
                      }}
                    >
                      Date
                    </label>
                  </div>
                  
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDate(moment().format("YYYY-MM-DD"))}
                      style={{
                        flex: 1,
                        padding: "0.625rem",
                        borderRadius: "0.5rem",
                        background: date === moment().format("YYYY-MM-DD") 
                          ? "black"
                          : "rgba(100, 100, 100, 0.1)",
                        color: date === moment().format("YYYY-MM-DD") ? "white" : "inherit",
                        border: "none",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Today
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDate(moment().subtract(1, 'day').format("YYYY-MM-DD"))}
                      style={{
                        flex: 1,
                        padding: "0.625rem",
                        borderRadius: "0.5rem",
                        background: date === moment().subtract(1, 'day').format("YYYY-MM-DD")
                          ? "black"
                          : "rgba(100, 100, 100, 0.1)",
                        color: date === moment().subtract(1, 'day').format("YYYY-MM-DD") ? "white" : "inherit",
                        border: "none",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Yesterday
                    </motion.button>
                  </div>
                  
                  <div onClick={() => setShowDatePicker(!showDatePicker)} style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.5rem",
                    background: "rgba(100, 100, 100, 0.1)",
                    border: "1px solid rgba(100, 100, 100, 0.2)",
                    cursor: "pointer"
                  }}>
                    <span style={{ fontSize: "1rem", fontWeight: "600", flex: 1 }}>
                      {moment(date).format("DD MMM YYYY")}
                    </span>
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      style={{
                        padding: "0.375rem 0.75rem",
                        borderRadius: "0.375rem",
                        background: "rgba(255, 140, 0, 0.15)",
                        color: "orange",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        border: "1px solid rgba(255, 140, 0, 0.3)",
                      }}
                    >
                      {showDatePicker ? "Close" : "Change"}
                    </motion.div>
                  </div>
                  
                  {/* Custom Date Picker */}
                  {showDatePicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        marginTop: "0.75rem",
                        background: "rgba(100, 100, 100, 0.05)",
                        borderRadius: "0.75rem",
                        padding: "1rem",
                        border: "1px solid rgba(100, 100, 100, 0.15)",
                      }}
                    >
                      {/* Month Navigation */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setViewingMonth(viewingMonth.clone().subtract(1, 'month'))}
                          style={{
                            padding: "0.5rem",
                            borderRadius: "0.5rem",
                            background: "rgba(100, 100, 100, 0.1)",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          <ChevronLeft width="1.25rem" height="1.25rem" />
                        </motion.button>
                        <span style={{ fontWeight: "700", fontSize: "1rem" }}>
                          {viewingMonth.format("MMMM YYYY")}
                        </span>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setViewingMonth(viewingMonth.clone().add(1, 'month'))}
                          disabled={viewingMonth.clone().add(1, 'month').isAfter(moment(), 'month')}
                          style={{
                            padding: "0.5rem",
                            borderRadius: "0.5rem",
                            background: viewingMonth.clone().add(1, 'month').isAfter(moment(), 'month') ? "rgba(100, 100, 100, 0.05)" : "rgba(100, 100, 100, 0.1)",
                            border: "none",
                            cursor: viewingMonth.clone().add(1, 'month').isAfter(moment(), 'month') ? "not-allowed" : "pointer",
                            opacity: viewingMonth.clone().add(1, 'month').isAfter(moment(), 'month') ? 0.3 : 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          <ChevronRight width="1.25rem" height="1.25rem" />
                        </motion.button>
                      </div>
                      
                      {/* Weekday Headers */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.25rem", marginBottom: "0.5rem" }}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                          <div key={i} style={{ textAlign: "center", fontSize: "0.75rem", fontWeight: "600", opacity: 0.6, padding: "0.25rem" }}>
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* Calendar Days */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.25rem" }}>
                        {(() => {
                          const startOfMonth = viewingMonth.clone().startOf('month');
                          const endOfMonth = viewingMonth.clone().endOf('month');
                          const startDay = startOfMonth.day();
                          const daysInMonth = endOfMonth.date();
                          const days = [];
                          
                          // Empty cells before month starts
                          for (let i = 0; i < startDay; i++) {
                            days.push(<div key={`empty-${i}`} />);
                          }
                          
                          // Days of the month
                          for (let day = 1; day <= daysInMonth; day++) {
                            const currentDate = viewingMonth.clone().date(day);
                            const dateString = currentDate.format("YYYY-MM-DD");
                            const isSelected = dateString === date;
                            const isToday = currentDate.isSame(moment(), 'day');
                            const isFuture = currentDate.isAfter(moment(), 'day');
                            
                            days.push(
                              <motion.button
                                key={day}
                                type="button"
                                whileTap={{ scale: isFuture ? 1 : 0.9 }}
                                onClick={() => {
                                  if (!isFuture) {
                                    setDate(dateString);
                                    setShowDatePicker(false);
                                  }
                                }}
                                disabled={isFuture}
                                style={{
                                  padding: "0.625rem 0.25rem",
                                  borderRadius: "0.5rem",
                                  background: isSelected
                                    ? "linear-gradient(135deg, #ff8c00, #ff6b00)"
                                    : isToday
                                    ? "rgba(255, 140, 0, 0.15)"
                                    : "rgba(100, 100, 100, 0.05)",
                                  color: isSelected ? "white" : isFuture ? "rgba(100, 100, 100, 0.3)" : "inherit",
                                  border: isToday && !isSelected ? "1px solid rgba(255, 140, 0, 0.5)" : "1px solid transparent",
                                  cursor: isFuture ? "not-allowed" : "pointer",
                                  fontSize: "0.875rem",
                                  fontWeight: isSelected || isToday ? "700" : "500",
                                  transition: "all 0.2s"
                                }}
                              >
                                {day}
                              </motion.button>
                            );
                          }
                          
                          return days;
                        })()}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Vehicle Number Input with Dropdown */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <Truck width="1rem" height="1rem" style={{ opacity: 0.7 }} color="dodgerblue" />
                    <label
                      htmlFor="vehicle-desktop"
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        opacity: 0.9,
                      }}
                    >
                      Vehicle Number
                    </label>
                  </div>
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
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <Gauge width="1rem" height="1rem" style={{ opacity: 0.7 }} color="mediumslateblue" />
                    <label
                      htmlFor="odometer-desktop"
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        opacity: 0.9,
                      }}
                    >
                      Odometer Reading
                    </label>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      id="odometer-desktop"
                      type="number"
                      step="0.1"
                      value={odometerReading}
                      onChange={(e) => setOdometerReading(e.target.value)}
                      placeholder="Enter reading"
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        paddingRight: "3rem",
                        borderRadius: "0.5rem",
                        fontSize: "1rem",
                        background: "rgba(100, 100, 100, 0.1)",
                        border: "1px solid rgba(100, 100, 100, 0.2)",
                      }}
                    />
                    <span style={{
                      position: "absolute",
                      right: "1rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      opacity: 0.5,
                    }}>
                      km
                    </span>
                  </div>
                </div>

                {/* Amount Spent Input */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <DollarSign width="1rem" height="1rem" style={{ opacity: 0.7 }} color="orange" />
                    <label
                      htmlFor="amount-desktop"
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        opacity: 0.9,
                      }}
                    >
                      Amount Spent
                    </label>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      id="amount-desktop"
                      type="number"
                      step="0.001"
                      value={amountSpent}
                      onChange={(e) => setAmountSpent(e.target.value)}
                      placeholder="Enter amount"
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        paddingRight: "4rem",
                        borderRadius: "0.5rem",
                        fontSize: "1rem",
                        fontWeight: "600",
                        background: "rgba(255, 140, 0, 0.1)",
                        border: "1px solid rgba(255, 140, 0, 0.25)",
                        color: "orange",
                      }}
                    />
                    <span style={{
                      position: "absolute",
                      right: "1rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "0.875rem",
                      fontWeight: "700",
                      
                      opacity: 0.7,
                    }}>
                      OMR
                    </span>
                  </div>
                </div>
                </div>
              </div>

              {/* Fixed Submit Button */}
              <div style={{
                padding: "1rem 1.5rem",
                paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
                borderTop: "1px solid rgba(100, 100, 100, 0.1)",
                background: "var(--background)",
              }}>
                <motion.button
                  type="submit"
                  disabled={submitting || !userProfile || !date || !vehicleNumber.trim() || !odometerReading || !amountSpent}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.01 }}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    background: submitting || !userProfile || !date || !vehicleNumber.trim() || !odometerReading || !amountSpent
                      ? "rgba(100, 100, 100, 0.2)" 
                      : "linear-gradient(135deg, #ff8c00, #ff6b00)",
                    color: "white",
                    fontSize: "1rem",
                    fontWeight: "700",
                    border: "none",
                    cursor: submitting || !userProfile || !date || !vehicleNumber.trim() || !odometerReading || !amountSpent ? "not-allowed" : "pointer",
                    boxShadow: submitting || !userProfile || !date || !vehicleNumber.trim() || !odometerReading || !amountSpent ? "none" : "0 4px 12px rgba(255, 140, 0, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" width="1.125rem" />
                    </>
                  ) : (
                    <span>Add</span>
                  )}
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
            <DrawerContent className="pb-safe" style={{ width: "100%", maxHeight: "85vh" }}>
              {/* Fixed Header */}
              <div style={{
                padding: "1rem",
                paddingBottom: "0.75rem",
                borderBottom: "1px solid rgba(100, 100, 100, 0.1)",
                background: "var(--background)",
                boxSizing: "border-box"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <div style={{
                    background: "linear-gradient(135deg, #ff8c00, #ff6b00)",
                    padding: "0.625rem",
                    borderRadius: "0.625rem",
                    display: "flex",
                    alignItems: "center",
                    
                  }}>
                    <Book color="white" width="1.25rem" />
                  </div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: "600", letterSpacing: "-0.02em" }}>Log Details</h2>
                </div>
              </div>

              {/* Scrollable Content */}
              <div style={{ 
                padding: "1rem",
                paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
                width: "100%",
                boxSizing: "border-box",
                overflowY: "auto"
              }}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
                >
                  {/* Date */}
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "0.75rem",
                      background: "rgba(100, 100, 100, 0.05)",
                      border: "2px solid rgba(100, 100, 100, 0.1)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
                      <Calendar width="1rem" height="1rem" style={{ opacity: 0.7 }} />
                      <span style={{ fontSize: "0.6875rem", fontWeight: "600", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</span>
                    </div>
                    <div style={{ fontSize: "1rem", fontWeight: "600", paddingLeft: "0.5rem" }}>
                      {moment(selectedLog.date).format("DD MMMM YYYY")}
                    </div>
                  </motion.div>

                  {/* Employee Name */}
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "0.75rem",
                      background: "rgba(100, 100, 100, 0.05)",
                      border: "2px solid rgba(100, 100, 100, 0.1)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem", border:"" }}>
                      <User width="1rem" height="1rem" style={{ opacity: 0.7 }}  />
                      <span style={{ fontSize: "0.6875rem", fontWeight: "600", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Logged By</span>
                    </div>
                    <div style={{ fontSize: "1rem", fontWeight: "600", border:"", paddingLeft:"0.5rem" }}>
                      {selectedLog.employee_name}
                    </div>
                  </motion.div>

                  {/* Vehicle Number */}
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "0.75rem",
                      background: "rgba(100, 100, 100, 0.05)",
                      border: "2px solid rgba(100, 100, 100, 0.1)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
                      <Car width="1rem" height="1rem" style={{ opacity: 0.7 }}  />
                      <span style={{ fontSize: "0.6875rem", fontWeight: "600", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Vehicle Number</span>
                    </div>
                    <div style={{ fontSize: "1rem", fontWeight: "600", paddingLeft: "0.5rem" }}>
                      {selectedLog.vehicle_number}
                    </div>
                  </motion.div>

                  {/* Odometer Reading */}
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "0.75rem",
                      background: "rgba(100, 100, 100, 0.05)",
                      border: "2px solid rgba(100, 100, 100, 0.1)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
                      <Gauge width="1rem" height="1rem" style={{ opacity: 0.7 }}  />
                      <span style={{ fontSize: "0.6875rem", fontWeight: "600", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Odometer Reading</span>
                    </div>
                    <div style={{ fontSize: "1rem", fontWeight: "600", paddingLeft: "0.5rem" }}>
                      {selectedLog.odometer_reading.toLocaleString()} km
                    </div>
                  </motion.div>

                  {/* Amount Spent */}
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "0.75rem",
                      background: "rgba(100, 100, 100, 0.05)",
                      border: "2px solid rgba(100, 100, 100, 0.1)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
                      <DollarSign width="1rem" height="1rem" style={{ opacity: 0.9 }}  />
                      <span style={{ fontSize: "0.6875rem", fontWeight: "600", opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount Spent</span>
                    </div>
                    <div style={{ fontSize: "1.25rem", fontWeight: "600", paddingLeft: "0.5rem"}}>
                     OMR {selectedLog.amount_spent.toFixed(3)} 
                    </div>
                  </motion.div>
                </motion.div>
                
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog open={drawerDetailOpen} onOpenChange={setDrawerDetailOpen}>
            <DialogContent style={{ maxWidth: "500px", padding: 0 }}>
              <DialogHeader style={{ padding: "1.25rem", paddingBottom: "0.875rem", borderBottom: "1px solid rgba(100, 100, 100, 0.1)" }}>
                <DialogTitle style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <div style={{
                    background: "linear-gradient(135deg, #ff8c00, #ff6b00)",
                    padding: "0.5rem",
                    borderRadius: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Book color="white" width="1.125rem" />
                  </div>
                  <span style={{ fontSize: "1.125rem", fontWeight: "600" }}>Log Details</span>
                </DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>

              <div style={{ padding: "1.25rem", paddingTop: "1rem" }}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
                >
                  {/* Date */}
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.01 }}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "0.625rem",
                      background: "rgba(100, 100, 100, 0.05)",
                      border: "2px solid rgba(100, 100, 100, 0.1)",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                      <Calendar width="0.9375rem" height="0.9375rem" style={{ opacity: 0.7 }} />
                      <span style={{ fontSize: "0.6875rem", fontWeight: "600", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</span>
                    </div>
                    <div style={{ fontSize: "0.9375rem", fontWeight: "600", paddingLeft: "1.5rem" }}>
                      {moment(selectedLog.date).format("DD MMMM YYYY")}
                    </div>
                  </motion.div>

                  {/* Employee Name */}
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.01 }}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "0.625rem",
                      background: "rgba(100, 100, 100, 0.05)",
                      border: "2px solid rgba(100, 100, 100, 0.1)",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                      <User width="0.9375rem" height="0.9375rem" style={{ opacity: 0.7 }} color="mediumslateblue" />
                      <span style={{ fontSize: "0.6875rem", fontWeight: "600", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Logged By</span>
                    </div>
                    <div style={{ fontSize: "0.9375rem", fontWeight: "600", paddingLeft: "1.5rem" }}>
                      {selectedLog.employee_name}
                    </div>
                  </motion.div>

                  {/* Vehicle Number */}
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.01 }}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "0.625rem",
                      background: "rgba(100, 100, 100, 0.05)",
                      border: "2px solid rgba(100, 100, 100, 0.1)",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                      <Truck width="0.9375rem" height="0.9375rem" style={{ opacity: 0.7 }} color="dodgerblue" />
                      <span style={{ fontSize: "0.6875rem", fontWeight: "600", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Vehicle Number</span>
                    </div>
                    <div style={{ fontSize: "0.9375rem", fontWeight: "600", paddingLeft: "1.5rem" }}>
                      {selectedLog.vehicle_number}
                    </div>
                  </motion.div>

                  {/* Odometer Reading */}
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.01 }}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "0.625rem",
                      background: "rgba(100, 100, 100, 0.05)",
                      border: "2px solid rgba(100, 100, 100, 0.1)",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                      <Gauge width="0.9375rem" height="0.9375rem" style={{ opacity: 0.7 }} color="mediumslateblue" />
                      <span style={{ fontSize: "0.6875rem", fontWeight: "600", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Odometer Reading</span>
                    </div>
                    <div style={{ fontSize: "0.9375rem", fontWeight: "600", paddingLeft: "1.5rem" }}>
                      {selectedLog.odometer_reading.toLocaleString()} km
                    </div>
                  </motion.div>

                  {/* Amount Spent */}
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.01 }}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "0.625rem",
                      background: "linear-gradient(135deg, rgba(255, 140, 0, 0.15), rgba(255, 107, 0, 0.1))",
                      border: "2px solid rgba(255, 140, 0, 0.3)",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                      <DollarSign width="0.9375rem" height="0.9375rem" style={{ opacity: 0.9 }} color="orange" />
                      <span style={{ fontSize: "0.6875rem", fontWeight: "600", opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.05em", color: "orange" }}>Amount Spent</span>
                    </div>
                    <div style={{ fontSize: "1.125rem", fontWeight: "700", paddingLeft: "1.5rem", color: "orange" }}>
                      {selectedLog.amount_spent.toFixed(3)} OMR
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </DialogContent>
          </Dialog>
        )
      )}
    </>
  );
}
