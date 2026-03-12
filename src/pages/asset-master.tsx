import AddRecordButton from "@/components/add-record-button";
import { useAuth } from "@/components/AuthProvider";
import Back from "@/components/back";
import Directive from "@/components/directive";
import RefreshButton from "@/components/refresh-button";
import ChevronSelect from "@/components/chevron-select";
import DefaultDialog from "@/components/ui/default-dialog";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { db } from "@/firebase";
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { 
    Car, 
    Laptop2, 
    Smartphone, 
    Wrench, 
    Cog, 
    Plus,
    Package,
    Search,
    Loader2,
    MinusCircle,
    ChevronRight
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Shared Asset Details Content Component
interface AssetDetailsContentProps {
  assetName: string;
  setAssetName: (value: string) => void;
  assetCategory: string;
  setAssetCategory: (value: string) => void;
  assetId: string;
  setAssetId: (value: string) => void;
  assetBrand: string;
  setAssetBrand: (value: string) => void;
  assetModel: string;
  setAssetModel: (value: string) => void;
  assetYear: string;
  setAssetYear: (value: string) => void;
  assetSerialNumber: string;
  setAssetSerialNumber: (value: string) => void;
  assetPurchaseDate: string;
  setAssetPurchaseDate: (value: string) => void;
  assetPurchasePrice: string;
  setAssetPurchasePrice: (value: string) => void;
  assetCondition: string;
  setAssetCondition: (value: string) => void;
  assetLocation: string;
  setAssetLocation: (value: string) => void;
  assetAssignedTo: string | null;
  assetAssignedToName: string;
  onOpenUserDialog: () => void;
  assetNotes: string;
  setAssetNotes: (value: string) => void;
  loading: boolean;
  onSave: () => void;
  onDelete?: () => void;
  isEditMode: boolean;
  assetCategories: Array<{ id: string; label: string; icon: React.ReactNode }>;
  conditionOptions: string[];
}

const AssetDetailsContent: React.FC<AssetDetailsContentProps> = ({
  assetName,
  setAssetName,
  assetCategory,
  setAssetCategory,
  assetId,
  setAssetId,
  assetBrand,
  setAssetBrand,
  assetModel,
  setAssetModel,
  assetYear,
  setAssetYear,
  assetSerialNumber,
  setAssetSerialNumber,
  assetPurchaseDate,
  setAssetPurchaseDate,
  assetPurchasePrice,
  setAssetPurchasePrice,
  assetCondition,
  setAssetCondition,
  assetLocation,
  setAssetLocation,
  assetAssignedTo,
  assetAssignedToName,
  onOpenUserDialog,
  assetNotes,
  setAssetNotes,
  loading,
  onSave,
  onDelete,
  isEditMode,
  assetCategories,
  conditionOptions,
}) => {
  const getCategoryIcon = (categoryId: string) => {
    const category = assetCategories.find(c => c.id === categoryId);
    return category?.icon || <Package width={20} />;
  };

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
            <div style={{
              background: "black",
              padding: "0.75rem",
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {getCategoryIcon(assetCategory)}
            </div>
            <div style={{ letterSpacing: "-0.02em" }}>
              {isEditMode ? (
                <>
                  <p style={{ fontSize: "1.5rem", fontWeight: 600 }}>{assetName || "Asset"}</p>
                  <p style={{ fontSize: "0.875rem", opacity: 0.6, marginTop: "0.25rem" }}>{assetId || "No ID"}</p>
                </>
              ) : (
                <p style={{ fontSize: "1.5rem", fontWeight: 600 }}>Add Asset</p>
              )}
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

            {/* Asset Name */}
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
                Asset Name *
              </label>
              <input
                placeholder="e.g., Dell Laptop, iPhone 14"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                required
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

            {/* Category Select */}
            <ChevronSelect
              title="Category *"
              icon={getCategoryIcon(assetCategory)}
              options={assetCategories.map(cat => ({ value: cat.id, label: cat.label }))}
              value={assetCategory}
              onChange={setAssetCategory}
              placeholder="Select category"
            />

            {/* Asset ID */}
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
                {assetCategory === "vehicle" ? "Vehicle Number" : "Asset ID"}
              </label>
              <input
                placeholder={assetCategory === "vehicle" ? "e.g., V-001" : "e.g., LAPTOP-001"}
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
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

            {/* Brand/Make */}
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
                {assetCategory === "vehicle" ? "Make" : "Brand"}
              </label>
              <input
                placeholder={assetCategory === "vehicle" ? "e.g., Toyota" : "e.g., Dell, Apple"}
                value={assetBrand}
                onChange={(e) => setAssetBrand(e.target.value)}
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

            {/* Model */}
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
                placeholder="e.g., Latitude 5420, Camry"
                value={assetModel}
                onChange={(e) => setAssetModel(e.target.value)}
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

            {/* Year (for vehicles) or Serial Number (for others) */}
            {assetCategory === "vehicle" ? (
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
                  placeholder="e.g., 2023"
                  value={assetYear}
                  onChange={(e) => setAssetYear(e.target.value)}
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
            ) : (
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
                  Serial Number
                </label>
                <input
                  placeholder="e.g., SN123456789"
                  value={assetSerialNumber}
                  onChange={(e) => setAssetSerialNumber(e.target.value)}
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
            )}

            {/* Purchase Date & Price (only for non-vehicles) */}
            {assetCategory !== "vehicle" && (
              <>
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
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={assetPurchaseDate}
                    onChange={(e) => setAssetPurchaseDate(e.target.value)}
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
                    Purchase Price
                  </label>
                  <input
                    placeholder="e.g., $1000"
                    value={assetPurchasePrice}
                    onChange={(e) => setAssetPurchasePrice(e.target.value)}
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
              </>
            )}

            {/* Condition */}
            <ChevronSelect
              title="Condition"
              icon={<Package color="mediumslateblue" width="1.125rem" />}
              options={conditionOptions.map(opt => ({ value: opt, label: opt }))}
              value={assetCondition}
              onChange={setAssetCondition}
              placeholder="Select condition"
            />

            {/* Location (only for non-vehicles) */}
            {assetCategory !== "vehicle" && (
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
                  Location
                </label>
                <input
                  placeholder="e.g., Office - IT Department"
                  value={assetLocation}
                  onChange={(e) => setAssetLocation(e.target.value)}
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
            )}

            {/* Assigned To */}
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
                <Package color="mediumslateblue" width="1.125rem" />
                Assigned To
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
                  color: assetAssignedTo ? "inherit" : "rgba(100, 100, 100, 0.6)",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textAlign: "left"
                }}
              >
                <span>{assetAssignedTo ? assetAssignedToName : "Unassigned"}</span>
                <ChevronRight width="1.125rem" opacity={0.5} />
              </button>
            </div>

            {/* Notes */}
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
                Notes
              </label>
              <textarea
                placeholder="Additional notes..."
                value={assetNotes}
                onChange={(e) => setAssetNotes(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  borderRadius: "0.75rem",
                  backgroundColor: "rgba(100, 100, 100, 0.08)",
                  border: "none",
                  padding: "0.875rem 1rem",
                  color: "inherit",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                  resize: "vertical"
                }}
              />
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
          disabled={loading || !assetName.trim() || !assetCategory}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          onClick={onSave}
          style={{
            width: "100%",
            padding: "1rem",
            borderRadius: "1rem",
            background: loading || !assetName.trim() || !assetCategory ? "rgba(100, 100, 100, 0.3)" : "black",
            color: "white",
            fontSize: "1.0625rem",
            border: "none",
            cursor: loading || !assetName.trim() || !assetCategory ? "not-allowed" : "pointer",
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
            <span>{isEditMode ? "Update Asset" : "Add Asset"}</span>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default function AssetMaster() {
    const [loading, setLoading] = useState(true);
    const [assets, setAssets] = useState<any[]>([]);
    const [filteredAssets, setFilteredAssets] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [addAssetDrawer, setAddAssetDrawer] = useState(false);
    const [editAssetDrawer, setEditAssetDrawer] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [records, setRecords] = useState<{ id: string; name: string }[]>([]);
    const { userData } = useAuth();

    // Form fields
    const [assetName, setAssetName] = useState("");
    const [assetCategory, setAssetCategory] = useState<string>("");
    const [assetId, setAssetId] = useState("");
    const [assetBrand, setAssetBrand] = useState("");
    const [assetModel, setAssetModel] = useState("");
    const [assetYear, setAssetYear] = useState(""); // For vehicles
    const [assetSerialNumber, setAssetSerialNumber] = useState("");
    const [assetPurchaseDate, setAssetPurchaseDate] = useState("");
    const [assetPurchasePrice, setAssetPurchasePrice] = useState("");
    const [assetCondition, setAssetCondition] = useState("Good");
    const [assetLocation, setAssetLocation] = useState("");
    const [assetAssignedTo, setAssetAssignedTo] = useState<string | null>(null);
    const [assetNotes, setAssetNotes] = useState("");

    interface Asset {
        id: string;
        name: string;
        category: string;
        assetId: string;
        brand?: string;
        model?: string;
        serialNumber?: string;
        purchaseDate?: string;
        purchasePrice?: string;
        condition: string;
        location?: string;
        assignedTo?: string | null;
        notes?: string;
        created_at: Date;
        updated_at?: Date;
        created_by?: string;
        isVehicle?: boolean; // Flag to identify vehicle_master items
        // Vehicle-specific fields
        year?: string;
        type?: string;
        registration_type?: string;
    }

    const assetCategories = [
        { id: "vehicle", label: "Vehicle", icon: <Car width={20} /> },
        { id: "laptop", label: "Laptop", icon: <Laptop2 width={20} /> },
        { id: "phone", label: "Phone", icon: <Smartphone width={20} /> },
        { id: "tool", label: "Tool", icon: <Wrench width={20} /> },
        { id: "machinery", label: "Machinery", icon: <Cog width={20} /> },
        { id: "other", label: "Other", icon: <Package width={20} /> },
    ];

    const conditionOptions = ["Excellent", "Good", "Fair", "Poor", "Needs Repair"];

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const [vehiclesSnapshot, assetsSnapshot, recordsSnapshot] = await Promise.all([
                getDocs(collection(db, "vehicle_master")),
                getDocs(collection(db, "assets")),
                getDocs(collection(db, "records"))
            ]);

            // Map vehicles from vehicle_master with category "vehicle"
            const vehiclesData = vehiclesSnapshot.docs.map((doc) => ({
                id: doc.id,
                name: `${doc.data().make || ''} ${doc.data().model || ''}`.trim() || doc.data().vehicle_number,
                category: "vehicle",
                assetId: doc.data().vehicle_number,
                brand: doc.data().make,
                model: doc.data().model,
                year: doc.data().year,
                type: doc.data().type,
                condition: doc.data().status || "Good",
                registration_type: doc.data().registration_type,
                assignedTo: doc.data().assigned_to,
                notes: doc.data().notes,
                created_at: doc.data().createdAt ? new Date(doc.data().createdAt) : new Date(),
                updated_at: doc.data().updatedAt ? new Date(doc.data().updatedAt) : undefined,
                isVehicle: true // Flag to identify vehicle_master items
            }));

            // Map other assets from assets collection
            const otherAssetsData = assetsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                created_at: doc.data().created_at?.toDate() || new Date(),
                updated_at: doc.data().updated_at?.toDate(),
                isVehicle: false
            } as Asset));

            // Combine both datasets
            const allAssets = [...vehiclesData, ...otherAssetsData];
            setAssets(allAssets);
            setFilteredAssets(allAssets);

            const recordsData = recordsSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name || doc.data().full_name || 'Unknown'
            }));
            setRecords(recordsData);

            setLoading(false);
            setRefreshCompleted(true);
            setTimeout(() => setRefreshCompleted(false), 1000);
        } catch (error) {
            console.error("Error fetching assets:", error);
            toast.error("Failed to fetch assets");
            setLoading(false);
        }
    };

    const addAsset = async () => {
        if (!assetName || !assetCategory) {
            toast.error("Please fill in required fields");
            return;
        }

        try {
            setLoading(true);
            
            // If category is vehicle, add to vehicle_master collection
            if (assetCategory === "vehicle") {
                await addDoc(collection(db, "vehicle_master"), {
                    vehicle_number: assetId,
                    make: assetBrand,
                    model: assetModel,
                    year: assetYear,
                    type: assetModel, // or create a separate field for vehicle type
                    status: assetCondition,
                    registration_type: "Private", // default value
                    assigned_to: assetAssignedTo,
                    notes: assetNotes,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            } else {
                // For other categories, add to assets collection
                await addDoc(collection(db, "assets"), {
                    name: assetName,
                    category: assetCategory,
                    assetId: assetId,
                    brand: assetBrand,
                    model: assetModel,
                    serialNumber: assetSerialNumber,
                    purchaseDate: assetPurchaseDate,
                    purchasePrice: assetPurchasePrice,
                    condition: assetCondition,
                    location: assetLocation,
                    assignedTo: assetAssignedTo,
                    notes: assetNotes,
                    created_by: userData?.email || "unknown",
                    created_at: new Date()
                });
            }
            
            toast.success("Asset added successfully");
            setAddAssetDrawer(false);
            resetForm();
            await fetchAssets();
        } catch (error) {
            console.error("Error adding asset:", error);
            toast.error("Failed to add asset");
        } finally {
            setLoading(false);
        }
    };

    const updateAsset = async () => {
        if (!selectedAsset) return;

        try {
            setLoading(true);
            
            // If this is a vehicle (from vehicle_master), update that collection
            if (selectedAsset.isVehicle) {
                await updateDoc(doc(db, "vehicle_master", selectedAsset.id), {
                    vehicle_number: assetId || selectedAsset.assetId,
                    make: assetBrand || selectedAsset.brand,
                    model: assetModel || selectedAsset.model,
                    year: assetYear || selectedAsset.year,
                    type: assetModel || selectedAsset.type,
                    status: assetCondition || selectedAsset.condition,
                    assigned_to: assetAssignedTo !== null ? assetAssignedTo : selectedAsset.assignedTo,
                    notes: assetNotes || selectedAsset.notes,
                    updatedAt: new Date().toISOString()
                });
            } else {
                // For other assets, update the assets collection
                await updateDoc(doc(db, "assets", selectedAsset.id), {
                    name: assetName || selectedAsset.name,
                    category: assetCategory || selectedAsset.category,
                    assetId: assetId || selectedAsset.assetId,
                    brand: assetBrand || selectedAsset.brand,
                    model: assetModel || selectedAsset.model,
                    serialNumber: assetSerialNumber || selectedAsset.serialNumber,
                    purchaseDate: assetPurchaseDate || selectedAsset.purchaseDate,
                    purchasePrice: assetPurchasePrice || selectedAsset.purchasePrice,
                    condition: assetCondition || selectedAsset.condition,
                    location: assetLocation || selectedAsset.location,
                    assignedTo: assetAssignedTo !== null ? assetAssignedTo : selectedAsset.assignedTo,
                    notes: assetNotes || selectedAsset.notes,
                    updated_at: new Date()
                });
            }
            
            toast.success("Asset updated successfully");
            setEditAssetDrawer(false);
            resetForm();
            await fetchAssets();
        } catch (error) {
            console.error("Error updating asset:", error);
            toast.error("Failed to update asset");
        } finally {
            setLoading(false);
        }
    };

    const deleteAsset = async (assetId: string) => {
        if (!window.confirm("Are you sure you want to delete this asset?")) return;
        if (!selectedAsset) return;

        try {
            setLoading(true);
            
            // Delete from the appropriate collection
            const collectionName = selectedAsset.isVehicle ? "vehicle_master" : "assets";
            await deleteDoc(doc(db, collectionName, assetId));
            
            toast.success("Asset deleted successfully");
            await fetchAssets();
        } catch (error) {
            console.error("Error deleting asset:", error);
            toast.error("Failed to delete asset");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setAssetName("");
        setAssetCategory("");
        setAssetId("");
        setAssetBrand("");
        setAssetModel("");
        setAssetYear("");
        setAssetSerialNumber("");
        setAssetPurchaseDate("");
        setAssetPurchasePrice("");
        setAssetCondition("Good");
        setAssetLocation("");
        setAssetAssignedTo(null);
        setAssetNotes("");
        setSelectedAsset(null);
    };

    const openEditDrawer = (asset: Asset) => {
        setSelectedAsset(asset);
        setAssetName(asset.name);
        setAssetCategory(asset.category);
        setAssetId(asset.assetId);
        setAssetBrand(asset.brand || "");
        setAssetModel(asset.model || "");
        setAssetYear(asset.year || "");
        setAssetSerialNumber(asset.serialNumber || "");
        setAssetPurchaseDate(asset.purchaseDate || "");
        setAssetPurchasePrice(asset.purchasePrice || "");
        setAssetCondition(asset.condition);
        setAssetLocation(asset.location || "");
        setAssetAssignedTo(asset.assignedTo || null);
        setAssetNotes(asset.notes || "");
        setEditAssetDrawer(true);
    };

    const getCategoryIcon = (category: string) => {
        const cat = assetCategories.find(c => c.id === category);
        return cat?.icon || <Package width={20} />;
    };

    const getAssignedName = (assignedToId: string | null | undefined) => {
        if (!assignedToId) return "Unassigned";
        const record = records.find(r => r.id === assignedToId);
        return record?.name || "Unknown";
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    useEffect(() => {
        let filtered = assets;

        // Filter by category
        if (selectedCategory !== "all") {
            filtered = filtered.filter(asset => asset.category === selectedCategory);
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(asset =>
                asset.name?.toLowerCase().includes(query) ||
                asset.assetId?.toLowerCase().includes(query) ||
                asset.brand?.toLowerCase().includes(query) ||
                asset.model?.toLowerCase().includes(query) ||
                asset.year?.toLowerCase().includes(query) ||
                asset.serialNumber?.toLowerCase().includes(query) ||
                asset.location?.toLowerCase().includes(query)
            );
        }

        setFilteredAssets(filtered);
    }, [searchQuery, selectedCategory, assets]);

    const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
    const [refreshCompleted, setRefreshCompleted] = useState(false);

    const handleDeleteAsset = () => {
        if (selectedAsset) {
            deleteAsset(selectedAsset.id);
        }
    };

    return (
        <div style={{ padding: "1.25rem", height: "100svh" }}>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
                <Back 
                    title="Asset Master" 
                    extra={
                        <RefreshButton 
                            fetchingData={loading} 
                            onClick={fetchAssets}
                            refreshCompleted={refreshCompleted}
                        />
                    } 
                />

                <br />

                {filteredAssets.length < 1 && loading ? (
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "75svh",
                    }}>
                        <Loader2 className="animate-spin" style={{ color: "mediumslateblue", scale: "2" }} />
                    </div>
                ) : assets.length === 0 ? (
                    <Empty style={{ height: "75svh" }}>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <Package />
                            </EmptyMedia>
                            <EmptyTitle>No assets added yet</EmptyTitle>
                        </EmptyHeader>
                        <EmptyContent>
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setAddAssetDrawer(true)}
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
                                Add First Asset
                            </motion.button>
                        </EmptyContent>
                    </Empty>
                ) : (
                    <>
                        {/* Category Filter */}
                        <div style={{ 
                            display: "flex", 
                            gap: "0.5rem", 
                            overflowX: "auto",
                            paddingBottom: "0.75rem",
                            marginBottom: "0.75rem"
                        }}>
                            <button
                                onClick={() => setSelectedCategory("all")}
                                style={{
                                    padding: "0.5rem 1rem",
                                    borderRadius: "1rem",
                                    background: selectedCategory === "all" ? "black" : "rgba(150, 150, 150, 0.15)",
                                    color: selectedCategory === "all" ? "white" : "inherit",
                                    border: "none",
                                    fontSize: "0.875rem",
                                    whiteSpace: "nowrap",
                                    cursor: "pointer"
                                }}
                            >
                                All ({assets.length})
                            </button>
                            {assetCategories.map(cat => {
                                const count = assets.filter(a => a.category === cat.id).length;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        style={{
                                            padding: "0.5rem 1rem",
                                            borderRadius: "1rem",
                                            background: selectedCategory === cat.id ? "black" : "rgba(150, 150, 150, 0.15)",
                                            color: selectedCategory === cat.id ? "white" : "inherit",
                                            border: "none",
                                            fontSize: "0.875rem",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.25rem",
                                            whiteSpace: "nowrap",
                                            cursor: "pointer"
                                        }}
                                    >
                                        {cat.icon}
                                        {cat.label} ({count})
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search Bar */}
                        <div style={{ position: "relative", marginBottom: "1rem" }}>
                            <Search 
                                width={18} 
                                style={{ 
                                    position: "absolute", 
                                    left: "0.75rem", 
                                    top: "50%", 
                                    transform: "translateY(-50%)",
                                    opacity: 0.5
                                }} 
                            />
                            <input
                                type="text"
                                placeholder="Search assets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "0.75rem 1rem 0.75rem 2.5rem",
                                    borderRadius: "0.75rem",
                                    background: "rgba(150, 150, 150, 0.1)",
                                    fontSize: "1rem",
                                    border: "none",
                                }}
                            />
                        </div>

                        {/* Assets List */}
                        <div
                            className="record-list"
                            style={{
                                display: "flex",
                                flexFlow: "column",
                                gap: "0.5rem",
                                
                                overflowY: "auto",
                            }}
                        >
                            {filteredAssets.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "2rem", opacity: 0.5 }}>
                                    No assets found
                                </div>
                            ) : (
                                filteredAssets.map((asset) => (
                                    <Directive
                                    height="4rem"
                                        key={asset.id}
                                        icon={getCategoryIcon(asset.category)}
                                        title={asset.name}
                                        subtext={asset.assetId || "No ID"}
                                        id_subtitle={`${asset.brand || ''} ${asset.model || ''} • ${getAssignedName(asset.assignedTo)}`.trim()}
                                        onClick={() => openEditDrawer(asset)}
                                    />
                                ))
                            )}
                        </div>
                    </>
                )}
            </motion.div>

            {/* Add Asset Dialog */}
            <ResponsiveModal
                open={addAssetDrawer}
                onOpenChange={setAddAssetDrawer}
                title=""
                description=""
            >
                <AssetDetailsContent
                    assetName={assetName}
                    setAssetName={setAssetName}
                    assetCategory={assetCategory}
                    setAssetCategory={setAssetCategory}
                    assetId={assetId}
                    setAssetId={setAssetId}
                    assetBrand={assetBrand}
                    setAssetBrand={setAssetBrand}
                    assetModel={assetModel}
                    setAssetModel={setAssetModel}
                    assetYear={assetYear}
                    setAssetYear={setAssetYear}
                    assetSerialNumber={assetSerialNumber}
                    setAssetSerialNumber={setAssetSerialNumber}
                    assetPurchaseDate={assetPurchaseDate}
                    setAssetPurchaseDate={setAssetPurchaseDate}
                    assetPurchasePrice={assetPurchasePrice}
                    setAssetPurchasePrice={setAssetPurchasePrice}
                    assetCondition={assetCondition}
                    setAssetCondition={setAssetCondition}
                    assetLocation={assetLocation}
                    setAssetLocation={setAssetLocation}
                    assetAssignedTo={assetAssignedTo}
                    assetAssignedToName={getAssignedName(assetAssignedTo)}
                    onOpenUserDialog={() => toast.info("User selection coming soon")}
                    assetNotes={assetNotes}
                    setAssetNotes={setAssetNotes}
                    loading={loading}
                    onSave={addAsset}
                    isEditMode={false}
                    assetCategories={assetCategories}
                    conditionOptions={conditionOptions}
                />
            </ResponsiveModal>

            {/* Edit Asset Dialog */}
            <ResponsiveModal
                open={editAssetDrawer}
                onOpenChange={setEditAssetDrawer}
                title=""
                description=""
            >
                <AssetDetailsContent
                    assetName={assetName}
                    setAssetName={setAssetName}
                    assetCategory={assetCategory}
                    setAssetCategory={setAssetCategory}
                    assetId={assetId}
                    setAssetId={setAssetId}
                    assetBrand={assetBrand}
                    setAssetBrand={setAssetBrand}
                    assetModel={assetModel}
                    setAssetModel={setAssetModel}
                    assetYear={assetYear}
                    setAssetYear={setAssetYear}
                    assetSerialNumber={assetSerialNumber}
                    setAssetSerialNumber={setAssetSerialNumber}
                    assetPurchaseDate={assetPurchaseDate}
                    setAssetPurchaseDate={setAssetPurchaseDate}
                    assetPurchasePrice={assetPurchasePrice}
                    setAssetPurchasePrice={setAssetPurchasePrice}
                    assetCondition={assetCondition}
                    setAssetCondition={setAssetCondition}
                    assetLocation={assetLocation}
                    setAssetLocation={setAssetLocation}
                    assetAssignedTo={assetAssignedTo}
                    assetAssignedToName={getAssignedName(assetAssignedTo)}
                    onOpenUserDialog={() => toast.info("User selection coming soon")}
                    assetNotes={assetNotes}
                    setAssetNotes={setAssetNotes}
                    loading={loading}
                    onSave={updateAsset}
                    onDelete={() => setDeleteConfirmDialog(true)}
                    isEditMode={true}
                    assetCategories={assetCategories}
                    conditionOptions={conditionOptions}
                />
            </ResponsiveModal>

            {/* Delete Confirmation Dialog */}
            <DefaultDialog
                destructive
                open={deleteConfirmDialog}
                onCancel={() => setDeleteConfirmDialog(false)}
                title="Delete Asset?"
                OkButtonText="Delete"
                onOk={handleDeleteAsset}
            />

            {/* Floating Add Button */}
            {userData?.role === "admin" && (
                <AddRecordButton
                    icon={<Plus color="white" />}
                    onClick={() => setAddAssetDrawer(true)}
                    style="black"
                />
            )}
        </div>
    );
}