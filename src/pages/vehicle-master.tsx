import AddRecordButton from "@/components/add-record-button";
import Back from "@/components/back";
import ChevronSelect from "@/components/chevron-select";
import NumberPlate from "@/components/number-plate";
import RefreshButton from "@/components/refresh-button";
import DefaultDialog from "@/components/ui/default-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { db } from "@/firebase";
import { clearVehicleCache, getCachedVehicle } from "@/utils/vehicleCache";
import { message } from "antd";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { motion } from "framer-motion";
import {
  Car,
  ChevronRight,
  Loader2,
  MinusCircle,
  Plus,
  Search,
  Truck,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

const VEHICLE_TYPES = [
  { value: 'Truck', label: 'Truck' },
  { value: 'Van', label: 'Van' },
  { value: 'Car', label: 'Car' },
  { value: 'SUV', label: 'SUV' },
  { value: 'Pickup', label: 'Pickup' },
  { value: 'Other', label: 'Other' }
];

const VEHICLE_STATUS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Maintenance', label: 'Maintenance' },
  { value: 'Retired', label: 'Retired' }
];

const REGISTRATION_TYPES = [
  { value: 'Private', label: 'Private' },
  { value: 'Commercial', label: 'Commercial' }
];

// Shared Vehicle Details Content Component
interface VehicleDetailsContentProps {
  vehicle_number: string;
  setVehicleNumber: (value: string) => void;
  vehicle_char: string;
  setVehicleChar: (value: string) => void;
  make: string;
  setMake: (value: string) => void;
  model: string;
  setModel: (value: string) => void;
  year: string;
  setYear: (value: string) => void;
  type: string;
  setType: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  registration_type: string;
  setRegistrationType: (value: string) => void;
  allocated_user: string;
  allocated_user_name: string;
  onOpenUserDialog: () => void;
  loading: boolean;
  onSave: () => void;
  onDelete?: () => void;
  isEditMode: boolean;
}

const VehicleDetailsContent: React.FC<VehicleDetailsContentProps> = ({
  vehicle_number,
  setVehicleNumber,
  vehicle_char,
  setVehicleChar,
  make,
  setMake,
  model,
  setModel,
  year,
  setYear,
  type,
  setType,
  status,
  setStatus,
  registration_type,
  setRegistrationType,
  allocated_user,
  allocated_user_name,
  onOpenUserDialog,
  loading,
  onSave,
  onDelete,
  isEditMode,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", maxHeight: "75vh", width: "100%" }}>
      {/* Fixed Header */}
      <div style={{
        paddingTop: "0rem",
        padding: "1.5rem",
        paddingBottom: "1rem",
        borderBottom: "1px solid rgba(100, 100, 100, 0.1)",
        background: "var(--background)",
        boxSizing: "border-box",
        width: "100%"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            
            <div style={{ letterSpacing: "-0.02em" }}>
              {isEditMode ? <NumberPlate number={`${vehicle_number}${vehicle_char ? ` ${vehicle_char}` : ""}`} private={registration_type === "Private"} /> : <p style={{fontSize:"1.5rem", fontWeight:600}}>Add Vehicle</p>}
            </div>
          </div>
          {isEditMode && onDelete && (
            <button
              onClick={onDelete}
              style={{
                fontSize: "0.75rem",
                paddingLeft: "1rem",
                paddingRight: "1rem",
                height: "2rem",
                background: "rgba(220, 38, 38, 0.1)",
                borderRadius: "0.5rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "crimson",
                border: "none"
              }}
            >
              <MinusCircle width={"1rem"} color="crimson" />
              Remove
            </button>
          )}
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
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", paddingBottom: "1.5rem" }}>
            {/* Vehicle Number Input */}
          
            {
              
              <div style={{
              background: "rgba(100, 100, 100, 0.05)",
              padding: "1rem",
              borderRadius: "1rem",
            }}>
              <label style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                opacity: 0.9,
                marginBottom: "0.75rem",
                display: "block"
              }}>
                Vehicle Number (Plate)
              </label>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  placeholder="e.g., 1234"
                  type="number"
                  value={vehicle_number}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  disabled={isEditMode}
                  required
                  style={{
                    flex: 1,
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(100, 100, 100, 0.08)",
                    border: "none",
                    padding: "0.875rem 1rem",
                    color: "inherit",
                    fontSize: "1rem",
                    boxSizing: "border-box",
                    opacity: isEditMode ? 0.6 : 1,
                    cursor: isEditMode ? "not-allowed" : "text"
                  }}
                />
                <input
                  placeholder="AB"
                  value={vehicle_char}
                  onChange={(e) => setVehicleChar(e.target.value.toUpperCase())}
                  disabled={isEditMode}
                  required
                  maxLength={2}
                  style={{
                    width: "4rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(100, 100, 100, 0.08)",
                    border: "none",
                    padding: "0.875rem 0.5rem",
                    color: "inherit",
                    fontSize: "1rem",
                    boxSizing: "border-box",
                    textAlign: "center",
                    textTransform: "uppercase",
                    opacity: isEditMode ? 0.6 : 1,
                    cursor: isEditMode ? "not-allowed" : "text"
                  }}
                />
              </div>
            </div>
            }
            

            {/* Make Input */}
            <div style={{
              background: "rgba(100, 100, 100, 0.05)",
              padding: "1rem",
              borderRadius: "1rem",
            }}>
              <label style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                opacity: 0.9,
                marginBottom: "0.75rem",
                display: "block"
              }}>
                Make / Manufacturer
              </label>
              <input
                placeholder="e.g., Toyota, Ford, Mercedes"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                style={{
                  width: "100%",
                  borderRadius: "0.75rem",
                  backgroundColor: "rgba(100, 100, 100, 0.08)",
                  border: "none",
                  padding: "0.875rem 1rem",
                  color: "inherit",
                  fontSize: "1rem",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Model Input */}
            <div style={{
              background: "rgba(100, 100, 100, 0.05)",
              padding: "1rem",
              borderRadius: "1rem",
            }}>
              <label style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                opacity: 0.9,
                marginBottom: "0.75rem",
                display: "block"
              }}>
                Model
              </label>
              <input
                placeholder="e.g., Hilux, F-150, Sprinter"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={{
                  width: "100%",
                  borderRadius: "0.75rem",
                  backgroundColor: "rgba(100, 100, 100, 0.08)",
                  border: "none",
                  padding: "0.875rem 1rem",
                  color: "inherit",
                  fontSize: "1rem",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Year Input */}
            <div style={{
              background: "rgba(100, 100, 100, 0.05)",
              padding: "1rem",
              borderRadius: "1rem",
            }}>
              <label style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                opacity: 0.9,
                marginBottom: "0.75rem",
                display: "block"
              }}>
                Year
              </label>
              <input
                placeholder="e.g., 2024"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                style={{
                  width: "100%",
                  borderRadius: "0.75rem",
                  backgroundColor: "rgba(100, 100, 100, 0.08)",
                  border: "none",
                  padding: "0.875rem 1rem",
                  color: "inherit",
                  fontSize: "1rem",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Vehicle Type */}
            <ChevronSelect
              title="Vehicle Type"
              icon={<Truck color="dodgerblue" width="1.125rem" height="1.125rem" />}
              options={VEHICLE_TYPES}
              value={type}
              onChange={setType}
              placeholder="Select type"
            />

            {/* Status */}
            <ChevronSelect
              title="Status"
              icon={<Car color="dodgerblue" width="1.125rem" height="1.125rem" />}
              options={VEHICLE_STATUS}
              value={status}
              onChange={setStatus}
              placeholder="Select status"
            />

            {/* Registration Type */}
            <ChevronSelect
              title="Registration Type"
              icon={<Car color="orange" width="1.125rem" height="1.125rem" />}
              options={REGISTRATION_TYPES}
              value={registration_type}
              onChange={setRegistrationType}
              placeholder="Select registration type"
            />

            {/* User Allocation */}
            <div style={{
              background: "rgba(100, 100, 100, 0.05)",
              padding: "1rem",
              borderRadius: "1rem",
            }}>
              <label style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                opacity: 0.9,
                marginBottom: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <User color="dodgerblue" width="1.125rem" />
                User
              </label>
              <button
                type="button"
                onClick={onOpenUserDialog}
                style={{
                  width: "100%",
                  borderRadius: "0.75rem",
                  backgroundColor: "rgba(100, 100, 100, 0.08)",
                  border: "none",
                  padding: "0.875rem 1rem",
                  color: allocated_user ? "inherit" : "rgba(100, 100, 100, 0.6)",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textAlign: "left"
                }}
              >
                <span>{allocated_user ? allocated_user_name : "No user allocated"}</span>
                <ChevronRight width="1.125rem" opacity={0.5} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Fixed Footer with Save Button */}
      <div style={{
        padding: "1rem",
        paddingBottom: "2rem",
        background: "var(--background)",
        boxSizing: "border-box",
        borderTop: "1px solid rgba(100, 100, 100, 0.1)",
        width: "100%"
      }}>
        <motion.button
          type="button"
          disabled={loading || !vehicle_number.trim()}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          onClick={onSave}
          style={{
            width: "100%",
            padding: "1rem",
            borderRadius: "1rem",
            background: loading || !vehicle_number.trim() ? "rgba(100, 100, 100, 0.3)" : "black",
            color: "white",
            fontSize: "1.0625rem",
            border: "none",
            cursor: loading || !vehicle_number.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            fontWeight: "500"
          }}
        >
          {loading ? (
            <Loader2 className="animate-spin" width="1.25rem" />
          ) : (
            <span>{isEditMode ? "Update" : "Add Vehicle"}</span>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default function VehicleMaster() {
  const [addVehicleDialog, setAddVehicleDialog] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleDialog, setVehicleDialog] = useState(false);
  const [refreshCompleted, setRefreshCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Add Vehicle Form States
  const [newVehicleNumber, setNewVehicleNumber] = useState("");
  const [newVehicleChar, setNewVehicleChar] = useState("");
  const [newMake, setNewMake] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newType, setNewType] = useState("Car");
  const [newStatus, setNewStatus] = useState("Active");
  const [newRegistrationType, setNewRegistrationType] = useState("Private");
  const [newAllocatedUser, setNewAllocatedUser] = useState("");

  // Edit Vehicle Form States
  const [editVehicleNumber, setEditVehicleNumber] = useState("");
  const [editVehicleChar, setEditVehicleChar] = useState("");
  const [editMake, setEditMake] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editType, setEditType] = useState("Car");
  const [editStatus, setEditStatus] = useState("Active");
  const [editRegistrationType, setEditRegistrationType] = useState("Private");
  const [editAllocatedUser, setEditAllocatedUser] = useState("");
  const [editDocId, setEditDocId] = useState("");

  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [userSelectionDialog, setUserSelectionDialog] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isEditingUser, setIsEditingUser] = useState(false);

  // Detect mobile/desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchVehicles();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const userCollection = collection(db, "users");
      const userQuery = query(userCollection, orderBy("name"));
      const querySnapshot = await getDocs(userQuery);
      const fetchedData: any = [];

      querySnapshot.forEach((doc: any) => {
        fetchedData.push({ id: doc.id, ...doc.data() });
      });

      setAvailableUsers(fetchedData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchVehicles = async () => {
    setFetchingData(true);
    try {
      const vehicleCollection = collection(db, "vehicle_master");
      const vehicleQuery = query(vehicleCollection, orderBy("vehicle_number"));
      const querySnapshot = await getDocs(vehicleQuery);
      const fetchedData: any = [];

      querySnapshot.forEach((doc: any) => {
        fetchedData.push({ id: doc.id, ...doc.data() });
      });

      setVehicles(fetchedData);
      setRefreshCompleted(true);
      setTimeout(() => {
        setRefreshCompleted(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      message.error("Failed to fetch vehicles");
    } finally {
      setFetchingData(false);
    }
  };

  const createVehicle = async () => {
    try {
      setLoading(true);
      
      // Combine number and char for full vehicle number
      const fullVehicleNumber = `${newVehicleNumber.trim()} ${newVehicleChar.trim()}`;
      
      // Check if vehicle number already exists
      const existingVehicle = vehicles.find(
        (v: any) => v.vehicle_number.toLowerCase() === fullVehicleNumber.toLowerCase()
      );
      
      if (existingVehicle) {
        message.error("Vehicle number already exists");
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "vehicle_master"), {
        vehicle_number: fullVehicleNumber,
        make: newMake.trim(),
        model: newModel.trim(),
        year: newYear.trim(),
        type: newType,
        status: newStatus,
        registration_type: newRegistrationType,
        allocated_user: newAllocatedUser || "",
        createdAt: new Date().toISOString(),
      });

      // Update user document if vehicle is allocated
      if (newAllocatedUser) {
        const userQuery = query(collection(db, "users"), where("email", "==", newAllocatedUser));
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          await updateDoc(doc(db, "users", userDoc.id), {
            allocated_vehicle: fullVehicleNumber,
          });
        }
      }

      message.success("Vehicle added successfully");
      setAddVehicleDialog(false);
      
      // Reset form
      setNewVehicleNumber("");
      setNewVehicleChar("");
      setNewMake("");
      setNewModel("");
      setNewYear("");
      setNewType("Truck");
      setNewStatus("Active");
      setNewRegistrationType("Private");
      setNewAllocatedUser("");
      
      fetchVehicles();
    } catch (error) {
      console.error("Error creating vehicle:", error);
      message.error("Failed to add vehicle");
    } finally {
      setLoading(false);
    }
  };

  const updateVehicle = async () => {
    try {
      setLoading(true);

      // Combine number and char for full vehicle number
      const fullVehicleNumber = `${editVehicleNumber.trim()} ${editVehicleChar.trim()}`;

      // Get the previous allocation to clear it if changed
      const currentVehicle = vehicles.find((v: any) => v.id === editDocId) as any;
      const previousAllocatedUser = currentVehicle?.allocated_user;

      await updateDoc(doc(db, "vehicle_master", editDocId), {
        make: editMake.trim(),
        model: editModel.trim(),
        year: editYear.trim(),
        type: editType,
        status: editStatus,
        registration_type: editRegistrationType,
        allocated_user: editAllocatedUser || "",
        updatedAt: new Date().toISOString(),
      });

      // Clear previous user's allocation if changed
      if (previousAllocatedUser && previousAllocatedUser !== editAllocatedUser) {
        const prevUserQuery = query(collection(db, "users"), where("email", "==", previousAllocatedUser));
        const prevUserSnapshot = await getDocs(prevUserQuery);
        if (!prevUserSnapshot.empty) {
          const prevUserDoc = prevUserSnapshot.docs[0];
          await updateDoc(doc(db, "users", prevUserDoc.id), {
            allocated_vehicle: "",
          });
        }
      }

      // Update new user's allocation
      if (editAllocatedUser) {
        const userQuery = query(collection(db, "users"), where("email", "==", editAllocatedUser));
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          await updateDoc(doc(db, "users", userDoc.id), {
            allocated_vehicle: fullVehicleNumber,
          });
        }
      }

      message.success("Vehicle updated successfully");
      setVehicleDialog(false);
      fetchVehicles();
    } catch (error) {
      console.error("Error updating vehicle:", error);
      message.error("Failed to update vehicle");
    } finally {
      setLoading(false);
    }
  };

  const deleteVehicle = async () => {
    try {
      setLoading(true);

      // Get the vehicle to check if it has an allocated user
      const currentVehicle = vehicles.find((v: any) => v.id === editDocId) as any;
      const allocatedUser = currentVehicle?.allocated_user;
      const deletedVehicleNumber = (currentVehicle?.vehicle_number || "").trim();

      const userDocIdsToClear = new Set<string>();

      // Clear allocation by allocated user email if vehicle had one
      if (allocatedUser) {
        const userQuery = query(collection(db, "users"), where("email", "==", allocatedUser));
        const userSnapshot = await getDocs(userQuery);
        userSnapshot.docs.forEach((userDoc) => {
          userDocIdsToClear.add(userDoc.id);
        });
      }

      // Clear allocation for any users that reference this vehicle number
      if (deletedVehicleNumber) {
        const allocatedVehicleQuery = query(
          collection(db, "users"),
          where("allocated_vehicle", "==", deletedVehicleNumber)
        );
        const allocatedVehicleSnapshot = await getDocs(allocatedVehicleQuery);
        allocatedVehicleSnapshot.docs.forEach((userDoc) => {
          userDocIdsToClear.add(userDoc.id);
        });
      }

      if (userDocIdsToClear.size > 0) {
        await Promise.all(
          Array.from(userDocIdsToClear).map((userDocId) =>
            updateDoc(doc(db, "users", userDocId), {
              allocated_vehicle: "",
            })
          )
        );
      }

      // Clear local cached vehicle if it matches the deleted vehicle
      if (deletedVehicleNumber) {
        const cachedVehicle = getCachedVehicle();
        if (cachedVehicle?.vehicle_number === deletedVehicleNumber) {
          clearVehicleCache();
        }
      }

      await deleteDoc(doc(db, "vehicle_master", editDocId));
      message.success("Vehicle deleted successfully");
      setDeleteConfirmDialog(false);
      setVehicleDialog(false);
      fetchVehicles();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      message.error("Failed to delete vehicle");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get user name from email
  const getUserName = (email: string) => {
    if (!email) return "";
    const user = availableUsers.find((u: any) => u.email === email) as any;
    return user ? `${user.name} (${user.email})` : email;
  };

  // Filtered users based on search query
  const filteredUsers = availableUsers.filter((user: any) =>
    user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  // Handle user selection
  const handleUserSelection = (userEmail: string) => {
    if (isEditingUser) {
      setEditAllocatedUser(userEmail);
    } else {
      setNewAllocatedUser(userEmail);
    }
    setUserSelectionDialog(false);
    setUserSearchQuery("");
  };

  // Open user dialog
  const openUserDialog = (isEditing: boolean) => {
    setIsEditingUser(isEditing);
    setUserSelectionDialog(true);
  };

  return (
    <div
      style={{
        padding: "1.25rem",
        height: "100svh",
      }}
    >
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
        <Back
          title="Vehicle Master"
          extra={
            <RefreshButton
              fetchingData={fetchingData}
              onClick={fetchVehicles}
              refreshCompleted={refreshCompleted}
            />
          }
        />

        <br />

        {vehicles.length < 1 && fetchingData ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "75svh",
            }}
          >
            <Loader2 className="animate-spin" style={{ color: "dodgerblue", scale: "2" }} />
          </div>
        ) : vehicles.length === 0 ? (
          <Empty style={{ height: "75svh" }}>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Car />
              </EmptyMedia>
              <EmptyTitle>No vehicles added yet</EmptyTitle>
              
            </EmptyHeader>
            <EmptyContent>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setAddVehicleDialog(true)}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  background: "black",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                }}
              >
                <Plus width="1rem" />
                Add First Vehicle
              </motion.button>
            </EmptyContent>
          </Empty>
        ) : (
          <div
            className="record-list"
            style={{
              display: "flex",
              flexFlow: "column",
              gap: "0.5rem",
              height: "82svh",
              overflowY: "auto",
            }}
          >
            {vehicles.map((vehicle: any) => (
              <motion.div
                key={vehicle.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setEditDocId(vehicle.id);
                  // Split vehicle number into numeric and alphabetic parts
                  const vehicleNum = vehicle.vehicle_number || "";
                  const numericPart = vehicleNum.match(/\d+/g)?.join('') || "";
                  const alphabeticPart = vehicleNum.match(/[A-Za-z]+/g)?.join('') || "";
                  setEditVehicleNumber(numericPart);
                  setEditVehicleChar(alphabeticPart);
                  setEditMake(vehicle.make || "");
                  setEditModel(vehicle.model || "");
                  setEditYear(vehicle.year || "");
                  setEditType(vehicle.type || "Truck");
                  setEditStatus(vehicle.status || "Active");
                  setEditRegistrationType(vehicle.registration_type || "Private");
                  setEditAllocatedUser(vehicle.allocated_user || "");
                  setVehicleDialog(true);
                }}
                style={{
                  background: "rgba(100, 100, 100, 0.05)",
                  padding: "1rem",
                  borderRadius: "1rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <div style={{
                  background: "black",
                  padding: "0.75rem",
                  borderRadius: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Car color="white" width="1.25rem" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "600", fontSize: "1rem" }}>
                    {vehicle.vehicle_number}
                  </div>
                  <div style={{ fontSize: "0.875rem", opacity: 0.7, marginTop: "0.25rem" }}>
                    {vehicle.make && vehicle.model
                      ? `${vehicle.make} ${vehicle.model}`
                      : vehicle.make || vehicle.model || "No details"}
                    {vehicle.year && ` • ${vehicle.year}`}
                  </div>
                </div>
                <div
                  style={{
                    padding: "0.375rem 0.75rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    background:
                      vehicle.status === "Active"
                        ? "rgba(34, 197, 94, 0.1)"
                        : vehicle.status === "Maintenance"
                        ? "rgba(251, 191, 36, 0.1)"
                        : "rgba(100, 100, 100, 0.1)",
                    color:
                      vehicle.status === "Active"
                        ? "rgb(34, 197, 94)"
                        : vehicle.status === "Maintenance"
                        ? "rgb(251, 191, 36)"
                        : "inherit",
                  }}
                >
                  {vehicle.status || "Active"}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add Vehicle Dialog - Drawer for Mobile / Dialog for Desktop */}
      {isMobile ? (
        <Drawer open={addVehicleDialog} onOpenChange={setAddVehicleDialog} shouldScaleBackground={false}>
          <DrawerTitle></DrawerTitle>
          <DrawerDescription></DrawerDescription>
          <DrawerContent
            className="pb-safe"
            style={{
              width: "100%",
              maxHeight: "75vh",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
              padding: 0,
              margin: 0,
            }}
          >
            <VehicleDetailsContent
              vehicle_number={newVehicleNumber}
              setVehicleNumber={setNewVehicleNumber}
              vehicle_char={newVehicleChar}
              setVehicleChar={setNewVehicleChar}
              make={newMake}
              setMake={setNewMake}
              model={newModel}
              setModel={setNewModel}
              year={newYear}
              setYear={setNewYear}
              type={newType}
              setType={setNewType}
              status={newStatus}
              setStatus={setNewStatus}
              registration_type={newRegistrationType}
              setRegistrationType={setNewRegistrationType}
              allocated_user={newAllocatedUser}
              allocated_user_name={getUserName(newAllocatedUser)}
              onOpenUserDialog={() => openUserDialog(false)}
              loading={loading}
              onSave={createVehicle}
              isEditMode={false}
            />
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={addVehicleDialog} onOpenChange={setAddVehicleDialog}>
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
          <DialogContent style={{ maxWidth: "500px", padding: 0 }}>
            <VehicleDetailsContent
              vehicle_number={newVehicleNumber}
              setVehicleNumber={setNewVehicleNumber}
              vehicle_char={newVehicleChar}
              setVehicleChar={setNewVehicleChar}
              make={newMake}
              setMake={setNewMake}
              model={newModel}
              setModel={setNewModel}
              year={newYear}
              setYear={setNewYear}
              type={newType}
              setType={setNewType}
              status={newStatus}
              setStatus={setNewStatus}
              registration_type={newRegistrationType}
              setRegistrationType={setNewRegistrationType}
              allocated_user={newAllocatedUser}
              allocated_user_name={getUserName(newAllocatedUser)}
              onOpenUserDialog={() => openUserDialog(false)}
              loading={loading}
              onSave={createVehicle}
              isEditMode={false}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Vehicle Dialog - Drawer for Mobile / Dialog for Desktop */}
      {isMobile ? (
        <Drawer open={vehicleDialog} onOpenChange={setVehicleDialog} shouldScaleBackground={false}>
          <DrawerTitle></DrawerTitle>
          <DrawerDescription></DrawerDescription>
          <DrawerContent
            className="pb-safe"
            style={{
              width: "100%",
              maxHeight: "75vh",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
              padding: 0,
              margin: 0,
            }}
          >
            <VehicleDetailsContent
              vehicle_number={editVehicleNumber}
              setVehicleNumber={setEditVehicleNumber}
              vehicle_char={editVehicleChar}
              setVehicleChar={setEditVehicleChar}
              make={editMake}
              setMake={setEditMake}
              model={editModel}
              setModel={setEditModel}
              year={editYear}
              setYear={setEditYear}
              type={editType}
              setType={setEditType}
              status={editStatus}
              setStatus={setEditStatus}
              registration_type={editRegistrationType}
              setRegistrationType={setEditRegistrationType}
              allocated_user={editAllocatedUser}
              allocated_user_name={getUserName(editAllocatedUser)}
              onOpenUserDialog={() => openUserDialog(true)}
              loading={loading}
              onSave={updateVehicle}
              onDelete={() => setDeleteConfirmDialog(true)}
              isEditMode={true}
            />
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={vehicleDialog} onOpenChange={setVehicleDialog}>
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
          <DialogContent style={{ maxWidth: "500px", padding: 0 }}>
            <VehicleDetailsContent
              vehicle_number={editVehicleNumber}
              setVehicleNumber={setEditVehicleNumber}
              vehicle_char={editVehicleChar}
              setVehicleChar={setEditVehicleChar}
              make={editMake}
              setMake={setEditMake}
              model={editModel}
              setModel={setEditModel}
              year={editYear}
              setYear={setEditYear}
              type={editType}
              setType={setEditType}
              status={editStatus}
              setStatus={setEditStatus}
              registration_type={editRegistrationType}
              setRegistrationType={setEditRegistrationType}
              allocated_user={editAllocatedUser}
              allocated_user_name={getUserName(editAllocatedUser)}
              onOpenUserDialog={() => openUserDialog(true)}
              loading={loading}
              onSave={updateVehicle}
              onDelete={() => setDeleteConfirmDialog(true)}
              isEditMode={true}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <DefaultDialog
        destructive
        open={deleteConfirmDialog}
        onCancel={() => setDeleteConfirmDialog(false)}
        title="Delete Vehicle?"
        OkButtonText="Delete"
        onOk={deleteVehicle}
      />

      {/* User Selection Drawer */}
      <Drawer open={userSelectionDialog} onOpenChange={setUserSelectionDialog} shouldScaleBackground={false}>
        <DrawerTitle></DrawerTitle>
        <DrawerDescription></DrawerDescription>
        <DrawerContent
          className="pb-safe"
          style={{
            width: "100%",
            maxHeight: "80vh",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            padding: 0,
            margin: 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", height: "100%", maxHeight: "80vh", width: "100%" }}>
            {/* Header */}
            <div style={{
              padding: "1.5rem",
              paddingBottom: "1rem",
              borderBottom: "1px solid rgba(100, 100, 100, 0.1)",
              background: "var(--background)",
              width: "100%",
              boxSizing: "border-box",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>Select User</h2>
                <button
                  onClick={() => {
                    setUserSelectionDialog(false);
                    setUserSearchQuery("");
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "0.5rem",
                  }}
                >
                  <X width="1.25rem" opacity={0.6} />
                </button>
              </div>
              
              {/* Search Bar */}
              <div style={{
                position: "relative",
                width: "100%"
              }}>
                <Search
                  style={{
                    position: "absolute",
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    opacity: 0.5,
                  }}
                  width="1.125rem"
                />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem 0.875rem 3rem",
                    borderRadius: "0.75rem",
                    border: "none",
                    background: "rgba(100, 100, 100, 0.08)",
                    fontSize: "1rem",
                    boxSizing: "border-box",
                    color: "inherit"
                  }}
                />
              </div>
            </div>

            {/* User List */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              width: "100%",
              boxSizing: "border-box",
            }}>
              {/* Clear Selection Option */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => handleUserSelection("")}
                style={{
                  background: "rgba(220, 38, 38, 0.05)",
                
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  textAlign: "left",
                  width: "100%"
                }}
              >
                <div style={{
                  background: "rgba(220, 38, 38, 0.1)",
                  padding: "0.625rem",
                  borderRadius: "0.625rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <MinusCircle color="crimson" width="1.125rem" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "500", color: "crimson" }}>Clear Selection</div>
                  <div style={{ fontSize: "0.875rem", opacity: 0.7, color: "crimson" }}>Remove allocated user</div>
                </div>
              </motion.button>

              {/* User Options */}
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user: any) => (
                  <motion.button
                    key={user.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleUserSelection(user.email)}
                    style={{
                      background: "rgba(100, 100, 100, 0.05)",
                      border: "none",
                      padding: "1rem",
                      borderRadius: "0.75rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      textAlign: "left",
                      width: "100%"
                    }}
                  >
                    <div style={{
                      background: "black",
                      padding: "0.625rem",
                      borderRadius: "0.625rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <User color="white" width="1.125rem" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "500" }}>{user.name}</div>
                      <div style={{ fontSize: "0.875rem", opacity: 0.6 }}>{user.email}</div>
                    </div>
                    {(isEditingUser ? editAllocatedUser : newAllocatedUser) === user.email && (
                      <div style={{
                        width: "1.5rem",
                        height: "1.5rem",
                        borderRadius: "50%",
                        background: "dodgerblue",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M11.6667 3.5L5.25001 9.91667L2.33334 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </motion.button>
                ))
              ) : (
                <div style={{
                  padding: "2rem",
                  textAlign: "center",
                  opacity: 0.6
                }}>
                  <User width="3rem" height="3rem" style={{ margin: "0 auto", marginBottom: "1rem", opacity: 0.3 }} />
                  <div style={{ fontSize: "1rem", fontWeight: "500" }}>No users found</div>
                  <div style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Try a different search term</div>
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Floating Add Button */}
      <AddRecordButton
        icon={<Plus color="white" />}
        onClick={() => setAddVehicleDialog(true)}
        style="black"
      />
    </div>
  );
}
