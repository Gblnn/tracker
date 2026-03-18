import AddRecordButton from "@/components/add-record-button";
import { useAuth } from "@/components/AuthProvider";
import Back from "@/components/back";
import ChevronSelect from "@/components/chevron-select";
import Directive from "@/components/directive";
import RefreshButton from "@/components/refresh-button";
import { ResponsiveModal } from "@/components/responsive-modal";
import DefaultDialog from "@/components/ui/default-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { db } from "@/firebase";
import * as XLSX from "@e965/xlsx";
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  Car,
  ChevronRight,
  Cog,
  DownloadCloud,
  EllipsisVerticalIcon,
  FileDown,
  Info,
  Laptop2,
  Loader2,
  MinusCircle,
  Package,
  Plus,
  Search,
  Smartphone,
  UploadCloud,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  onReuseExisting?: () => void;
}

type ImportedAssetRow = {
  name: string;
  category: string;
  assetId: string;
  brand: string;
  model: string;
  year: string;
  serialNumber: string;
  purchaseDate: string;
  purchasePrice: string;
  condition: string;
  location: string;
  assignedTo: string;
  notes: string;
};
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
  onReuseExisting,
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
              color: "white",
              padding: "0.75rem",
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {getCategoryIcon(assetCategory)}
            </div>
            <div style={{ letterSpacing: "-0.02em", display: "flex", flexDirection: "column", lineHeight: 1 }}>
              {isEditMode ? (
                <>
                  <p style={{ fontSize: "1.5rem", fontWeight: 600 }}>{assetId || "Asset"}</p>
                  <p style={{ fontSize: "0.875rem", opacity: 0.6, marginTop: "0.25rem" }}>{assetName || "No ID"}</p>
                </>
              ) : (
                <div>
                  <p style={{ fontSize: "1.5rem", fontWeight: 600 }}>Add Asset</p>
                  {onReuseExisting && (
                    <button
                      type="button"
                      onClick={onReuseExisting}
                      style={{
                        marginTop: "0.25rem",
                        fontSize: "0.75rem",
                        color: "mediumslateblue",
                        background: "rgba(123, 104, 238, 0.1)",
                        border: "none",
                        borderRadius: "0.5rem",
                        padding: "0.2rem 0.6rem",
                        cursor: "pointer",
                      }}
                    >
                      Copy from existing
                    </button>
                  )}
                </div>
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

            {/* Category Select */}
            <ChevronSelect
              title="Category *"
              icon={getCategoryIcon(assetCategory)}
              options={assetCategories.map(cat => ({ value: cat.id, label: cat.label }))}
              value={assetCategory}
              onChange={setAssetCategory}
              placeholder="Select category"
            />

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
  const ASSIGNEE_RESULT_LIMIT = 180;
    const [loading, setLoading] = useState(true);
    const [assets, setAssets] = useState<any[]>([]);
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

    const recordNameMap = useMemo(() => {
      const mapped = new Map<string, string>();
      for (const record of records) {
        mapped.set(record.id, record.name || "Unknown");
      }
      return mapped;
    }, [records]);

    const getAssignedName = (assignedToId: string | null | undefined) => {
      if (!assignedToId) return "Unassigned";
      return recordNameMap.get(assignedToId) || "Unknown";
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const filteredAssets = useMemo(() => {
      let filtered = assets;

      if (selectedCategory !== "all") {
        filtered = filtered.filter((asset) => asset.category === selectedCategory);
      }

      const query = searchQuery.trim().toLowerCase();
      if (!query) return filtered;

      return filtered.filter((asset) =>
        asset.name?.toLowerCase().includes(query) ||
        asset.assetId?.toLowerCase().includes(query) ||
        asset.brand?.toLowerCase().includes(query) ||
        asset.model?.toLowerCase().includes(query) ||
        asset.year?.toLowerCase().includes(query) ||
        asset.serialNumber?.toLowerCase().includes(query) ||
        asset.location?.toLowerCase().includes(query)
      );
    }, [assets, selectedCategory, searchQuery]);

    const categoryCounts = useMemo(() => {
      const counts: Record<string, number> = {};
      for (const asset of assets) {
        const key = asset.category || "other";
        counts[key] = (counts[key] || 0) + 1;
      }
      return counts;
    }, [assets]);

    const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
    const [refreshCompleted, setRefreshCompleted] = useState(false);
    const [assigneeDialog, setAssigneeDialog] = useState(false);
    const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
    const [reuseDialog, setReuseDialog] = useState(false);
    const [reuseSearchQuery, setReuseSearchQuery] = useState("");
    const [importDialog, setImportDialog] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importRows, setImportRows] = useState<ImportedAssetRow[]>([]);
    const [duplicateImportRows, setDuplicateImportRows] = useState<ImportedAssetRow[]>([]);
    const [importing, setImporting] = useState(false);
    const [importProgressItem, setImportProgressItem] = useState("");

    const normalizeCategory = (value: string): string => {
      const raw = (value || "").toString().trim().toLowerCase();
      if (!raw) return "other";
      if (["vehicle", "car", "truck"].includes(raw)) return "vehicle";
      if (["laptop", "computer", "pc"].includes(raw)) return "laptop";
      if (["phone", "mobile", "smartphone"].includes(raw)) return "phone";
      if (["tool", "tools"].includes(raw)) return "tool";
      if (["machinery", "machine"].includes(raw)) return "machinery";
      if (["other", "misc", "miscellaneous"].includes(raw)) return "other";
      return "other";
    };

    const getImportValue = (row: Record<string, any>, keys: string[]): string => {
      for (const key of keys) {
        const value = row[key];
        if (value !== undefined && value !== null && `${value}`.trim() !== "") {
          return `${value}`.trim();
        }
      }
      return "";
    };

    const parseImportRow = (row: Record<string, any>): ImportedAssetRow | null => {
      const name = getImportValue(row, ["name", "assetName", "asset_name", "asset"]);
      const category = normalizeCategory(getImportValue(row, ["category", "assetCategory", "asset_category", "type"]));
      const assetId = getImportValue(row, ["assetId", "asset_id", "vehicle_number", "vehicleNumber", "id"]);

      if (!name) return null;

      return {
        name,
        category,
        assetId,
        brand: getImportValue(row, ["brand", "make", "assetBrand", "asset_brand"]),
        model: getImportValue(row, ["model", "assetModel", "asset_model"]),
        year: getImportValue(row, ["year", "assetYear", "asset_year"]),
        serialNumber: getImportValue(row, ["serialNumber", "serial_number", "assetSerialNumber"]),
        purchaseDate: getImportValue(row, ["purchaseDate", "purchase_date", "assetPurchaseDate"]),
        purchasePrice: getImportValue(row, ["purchasePrice", "purchase_price", "assetPurchasePrice"]),
        condition: getImportValue(row, ["condition", "assetCondition"]) || "Good",
        location: getImportValue(row, ["location", "assetLocation", "asset_location"]),
        assignedTo: getImportValue(row, ["assignedTo", "assigned_to", "assetAssignedTo"]),
        notes: getImportValue(row, ["notes", "assetNotes", "asset_notes"]),
      };
    };

    const handleImportPreview = () => {
      if (!importFile) {
        toast.error("Please choose an Excel file first");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const data = e.target?.result;
          if (!data) throw new Error("Unable to read selected file");

          const workbook = XLSX.read(data, { type: "array", cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const parsedJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });
          const parsedRows = parsedJson.map(parseImportRow).filter((r): r is ImportedAssetRow => r !== null);

          setImportRows(parsedRows);

          const existingKeys = new Set(
            assets
              .filter((a) => a.assetId)
              .map((a) => `${(a.assetId || "").trim().toLowerCase()}::${a.isVehicle ? "vehicle" : "asset"}`)
          );

          const duplicates = parsedRows.filter((row) => {
            if (!row.assetId) return false;
            const key = `${row.assetId.trim().toLowerCase()}::${row.category === "vehicle" ? "vehicle" : "asset"}`;
            return existingKeys.has(key);
          });
          setDuplicateImportRows(duplicates);
        } catch (error) {
          console.error("Error reading import file:", error);
          toast.error("Error reading file");
        }
      };

      reader.readAsArrayBuffer(importFile);
    };

    const downloadImportTemplate = () => {
      const sample = [
        {
          name: "Toyota Hilux",
          category: "vehicle",
          assetId: "V-001",
          brand: "Toyota",
          model: "Hilux",
          year: "2022",
          serialNumber: "",
          purchaseDate: "2024-01-10",
          purchasePrice: "12000",
          condition: "Good",
          location: "Yard A",
          assignedTo: "",
          notes: "",
        },
        {
          name: "Dell Latitude",
          category: "laptop",
          assetId: "LAPTOP-001",
          brand: "Dell",
          model: "Latitude 5420",
          year: "",
          serialNumber: "SN-ABC-001",
          purchaseDate: "2024-02-15",
          purchasePrice: "650",
          condition: "Excellent",
          location: "Site Office",
          assignedTo: "",
          notes: "",
        },
      ];

      const worksheet = XLSX.utils.json_to_sheet(sample);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "assets");
      XLSX.writeFile(workbook, "asset-import-template.xlsx");
    };

    const uploadImportRows = async () => {
      if (!importRows.length) {
        toast.error("No parsed rows to upload");
        return;
      }

      setImporting(true);
      setImportProgressItem("Preparing import...");

      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      try {
        for (let i = 0; i < importRows.length; i++) {
          const row = importRows[i];
          setImportProgressItem(`Processing ${i + 1}/${importRows.length}`);

          try {
            const normalizedId = (row.assetId || "").trim().toLowerCase();
            const existing = normalizedId
              ? assets.find((a) => {
                const sameId = (a.assetId || "").trim().toLowerCase() === normalizedId;
                const sameCollectionType = row.category === "vehicle" ? a.isVehicle : !a.isVehicle;
                return sameId && sameCollectionType;
              })
              : undefined;

            if (row.category === "vehicle") {
              const payload = {
                vehicle_number: row.assetId,
                make: row.brand,
                model: row.model,
                year: row.year,
                type: row.model,
                status: row.condition || "Good",
                registration_type: "Private",
                assigned_to: row.assignedTo || null,
                notes: row.notes,
                updatedAt: new Date().toISOString(),
              };

              if (existing?.isVehicle) {
                await updateDoc(doc(db, "vehicle_master", existing.id), payload);
                updatedCount++;
              } else {
                await addDoc(collection(db, "vehicle_master"), {
                  ...payload,
                  createdAt: new Date().toISOString(),
                });
                createdCount++;
              }
            } else {
              const payload = {
                name: row.name,
                category: row.category || "other",
                assetId: row.assetId,
                brand: row.brand,
                model: row.model,
                serialNumber: row.serialNumber,
                purchaseDate: row.purchaseDate,
                purchasePrice: row.purchasePrice,
                condition: row.condition || "Good",
                location: row.location,
                assignedTo: row.assignedTo || null,
                notes: row.notes,
                updated_at: new Date(),
              };

              if (existing && !existing.isVehicle) {
                await updateDoc(doc(db, "assets", existing.id), payload);
                updatedCount++;
              } else {
                await addDoc(collection(db, "assets"), {
                  ...payload,
                  created_by: userData?.email || "unknown",
                  created_at: new Date(),
                });
                createdCount++;
              }
            }
          } catch (rowError) {
            skippedCount++;
            console.error("Skipping row due to import error:", rowError);
          }
        }

        toast.success(`Import complete: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped`);
        setImportDialog(false);
        setImportFile(null);
        setImportRows([]);
        setDuplicateImportRows([]);
        setImportProgressItem("");
        await fetchAssets();
      } catch (error) {
        console.error("Error uploading import rows:", error);
        toast.error("Import failed");
      } finally {
        setImporting(false);
      }
    };

    const handleDeleteAsset = () => {
        if (selectedAsset) {
            deleteAsset(selectedAsset.id);
        }
    };

    const openAssigneeDialog = () => {
      setAssigneeSearchQuery("");
      setAssigneeDialog(true);
    };

    const openAddAssetDialog = () => {
      resetForm();
      setEditAssetDrawer(false);
      setAddAssetDrawer(true);
    };

    const openReuseDialog = () => {
      if (!assetCategory) {
        toast.info("Select an asset category first");
        return;
      }
      setReuseSearchQuery("");
      setReuseDialog(true);
    };

    const getNextMatchingAssetId = (source: any, targetCategory: string): string => {
      const sourceId = `${source?.assetId || ""}`.trim();
      const sourceCategory = `${targetCategory || source?.category || ""}`.trim();
      if (!sourceCategory) return sourceId;

      const sameCategoryIds = assets
        .filter((asset) => asset.category === sourceCategory && asset.assetId)
        .map((asset) => `${asset.assetId}`.trim())
        .filter(Boolean);

      if (sameCategoryIds.length === 0) return sourceId;

      const sourcePrefixMatch = sourceId.match(/^(.*?)(\d+)$/);
      const prefix = sourcePrefixMatch ? sourcePrefixMatch[1] : "";

      const candidateIds = prefix
        ? sameCategoryIds.filter((id) => id.startsWith(prefix))
        : sameCategoryIds;

      let bestId = sourceId || candidateIds[0] || "";
      let bestNumber = -1;
      let bestWidth = 0;

      for (const id of candidateIds) {
        const numericMatch = id.match(/(\d+)(?!.*\d)/);
        if (!numericMatch) continue;
        const numeric = Number(numericMatch[1]);
        if (Number.isFinite(numeric) && numeric > bestNumber) {
          bestNumber = numeric;
          bestId = id;
          bestWidth = numericMatch[1].length;
        }
      }

      if (bestNumber < 0) return bestId;

      const nextNumber = String(bestNumber + 1).padStart(bestWidth, "0");
      return bestId.replace(/\d+(?!.*\d)/, nextNumber);
    };

    const copyFromAsset = (source: any) => {
      const nextAssetId = getNextMatchingAssetId(source, assetCategory);
      setAssetName(source.name || "");
      setAssetCategory(source.category || "");
      setAssetId(nextAssetId);
      setAssetBrand(source.brand || "");
      setAssetModel(source.model || "");
      setAssetYear(source.year || "");
      setAssetSerialNumber(source.serialNumber || "");
      setAssetPurchaseDate(source.purchaseDate || "");
      setAssetPurchasePrice(source.purchasePrice || "");
      setAssetCondition(source.condition || "Good");
      setAssetLocation(source.location || "");
      setAssetAssignedTo(null); // clear — will be assigned to someone else
      setAssetNotes(source.notes || "");
      setReuseDialog(false);
    };

    const filteredAssetsForReuse = useMemo(() => {
      if (!reuseDialog) return [];

      return assets.filter((asset) => {
        if (assetCategory && asset.category !== assetCategory) return false;
        const q = reuseSearchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
          asset.name?.toLowerCase().includes(q) ||
          asset.assetId?.toLowerCase().includes(q) ||
          asset.brand?.toLowerCase().includes(q) ||
          asset.model?.toLowerCase().includes(q)
        );
      });
    }, [assets, assetCategory, reuseSearchQuery, reuseDialog]);

    const distinctAssetsForReuse = useMemo(() => {
      const grouped = new Map<string, any>();

      for (const asset of filteredAssetsForReuse) {
        const key = [
          asset.category || "",
          asset.name || "",
          asset.brand || "",
          asset.model || "",
        ]
          .map((v: string) => `${v}`.trim().toLowerCase())
          .join("|");

        const existing = grouped.get(key);
        if (!existing) {
          grouped.set(key, asset);
          continue;
        }

        const existingNumber = Number((`${existing.assetId || ""}`.match(/(\d+)(?!.*\d)/)?.[1]) || -1);
        const currentNumber = Number((`${asset.assetId || ""}`.match(/(\d+)(?!.*\d)/)?.[1]) || -1);
        if (currentNumber > existingNumber) {
          grouped.set(key, asset);
        }
      }

      return Array.from(grouped.values());
    }, [filteredAssetsForReuse]);

    const filteredRecordsForAssignee = useMemo(() => {
      if (!assigneeDialog) return [];

      const query = assigneeSearchQuery.trim().toLowerCase();
      const base = !query
        ? records
        : records.filter((record) => {
            const name = (record.name || "").toLowerCase();
            const id = (record.id || "").toLowerCase();
            return name.includes(query) || id.includes(query);
          });

      return base.slice(0, ASSIGNEE_RESULT_LIMIT);
    }, [assigneeDialog, assigneeSearchQuery, records]);

    const exportAssetsToExcel = () => {
      try {
        if (!assets.length) {
          toast.info("No assets to export");
          return;
        }

        const rows = assets.map((asset) => ({
          name: asset.name || "",
          category: asset.category || "",
          assetId: asset.assetId || "",
          brand: asset.brand || "",
          model: asset.model || "",
          year: asset.year || "",
          serialNumber: asset.serialNumber || "",
          purchaseDate: asset.purchaseDate || "",
          purchasePrice: asset.purchasePrice || "",
          condition: asset.condition || "",
          location: asset.location || "",
          assignedTo: getAssignedName(asset.assignedTo),
          notes: asset.notes || "",
          sourceCollection: asset.isVehicle ? "vehicle_master" : "assets",
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "asset_master");

        const dateTag = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `asset-master-${dateTag}.xlsx`);
        toast.success("Asset master exported");
      } catch (error) {
        console.error("Error exporting asset master:", error);
        toast.error("Failed to export asset master");
      }
    };

    return (
      <div
        style={{
        height: "100svh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        }}
      >
        <div style={{ padding: "", position: "fixed", zIndex: 20, left: 0, right: 0 }}>
          <Back 
            fixed
            blurBG
            title="Asset Master" 
            extra={
              <div style={{ display: "flex", gap: "0.5rem", height: "2.75rem" }}>
                <RefreshButton
                  fetchingData={loading}
                  onClick={fetchAssets}
                  refreshCompleted={refreshCompleted}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      style={{ width: "2.75rem" }}
                      title="Actions"
                    >
                      <EllipsisVerticalIcon width={"1rem"} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent style={{ margin: "0.25rem", marginRight: "1.25rem" }}>
                    <DropdownMenuItem onClick={exportAssetsToExcel} style={{ width: "100%" }}>
                      <DownloadCloud className="mr-2" color="lightgreen" />
                      <span style={{ width: "100%" }}>Export xlsx</span>
                    </DropdownMenuItem>
                    {userData?.role === "admin" && (
                      <DropdownMenuItem onClick={() => setImportDialog(true)} style={{ width: "100%" }}>
                        <UploadCloud className="mr-2" color="salmon" />
                        <span style={{ width: "100%" }}>Upload xlsx</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            } 
          />
        </div>

        {assets.length > 0 && (
          <div
            style={{
              
              position: "fixed",
              top: "4.5rem",
              left: 0,
              right: 0,
              padding: "0.75rem 1.25rem",
              background: "rgba(250, 250, 250)",
              zIndex: 15,
              borderBottom: "1px solid rgba(100, 100, 100, 0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                overflowX: "auto",
                marginBottom: "0.65rem",
                paddingBottom: "0.1rem",
              }}
            >
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
                  cursor: "pointer",
                }}
              >
                All ({assets.length})
              </button>
              {assetCategories.map((cat) => {
                const count = categoryCounts[cat.id] || 0;
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
                      cursor: "pointer",
                    }}
                  >
                    {cat.icon}
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>

            <div style={{ position: "relative" }}>
              <Search
                width={18}
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  opacity: 0.5,
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
                  background: "rgba(150, 150, 150, 0.15)",
                  fontSize: "1rem",
                  border: "none",
                }}
              />
            </div>
          </div>
        )}

        <div
          style={{
          flex: 1,
          minHeight: 0,
          position: "relative",
          zIndex: 0,
          isolation: "isolate",
          overflowY: "auto",
          padding: "1.25rem",
          paddingTop: assets.length > 0 ? "10rem" : "4.75rem",
          paddingBottom: "6rem",
          }}
        >
        <div>

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
                            <button
                              onClick={openAddAssetDialog}
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
                                </button>
                        </EmptyContent>
                    </Empty>
                ) : (
                    <>
                        {/* Assets List */}
                        <div
                            style={{
                              border:"",
                              paddingTop:"3rem",
                                display: "flex",
                                flexFlow: "column",
                                gap: "0.5rem",
                            position: "relative",
                            zIndex: 1,
                            mask: "none",
                            WebkitMask: "none",
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
                                        id_subtitle={`${getAssignedName(asset.assignedTo)}`.trim()}
                                        onClick={() => openEditDrawer(asset)}
                                    />
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
              </div>

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
                    onOpenUserDialog={openAssigneeDialog}
                    onReuseExisting={openReuseDialog}
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
                    onOpenUserDialog={openAssigneeDialog}
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

            <ResponsiveModal
              open={assigneeDialog}
              onOpenChange={setAssigneeDialog}
              title=""
              description=""
            >
              <div style={{
                padding: "1rem",
                maxHeight: "min(75vh, 680px)",
                width: "min(720px, 100%)",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}>
                <p style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.75rem" }}>Assign To</p>

                <div style={{ position: "relative", marginBottom: "0.75rem" }}>
                  <Search
                    width={16}
                    style={{
                      position: "absolute",
                      left: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      opacity: 0.5,
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={assigneeSearchQuery}
                    onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem 0.75rem 2.25rem",
                      borderRadius: "0.75rem",
                      background: "rgba(150, 150, 150, 0.1)",
                      border: "none",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <button
                    onClick={() => {
                      setAssetAssignedTo(null);
                      setAssigneeDialog(false);
                    }}
                    style={{
                      width: "100%",
                      border: "none",
                      borderRadius: "0.75rem",
                      padding: "0.625rem 0.75rem",
                      background: "rgba(150, 150, 150, 0.15)",
                      cursor: "pointer",
                    }}
                  >
                    Clear Assignment
                  </button>
                </div>

                <div style={{
                  overflowY: "auto",
                  overflowX: "hidden",
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  paddingBottom: "0.25rem"
                }}>
                  {filteredRecordsForAssignee.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "1.25rem", opacity: 0.6 }}>
                      No records found
                    </div>
                  ) : (
                    filteredRecordsForAssignee.map((record) => (
                      <button
                        key={record.id}
                        onClick={() => {
                          setAssetAssignedTo(record.id);
                          setAssigneeDialog(false);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          border: "1px solid rgba(100, 100, 100, 0.12)",
                          background: assetAssignedTo === record.id ? "rgba(123, 104, 238, 0.12)" : "rgba(100, 100, 100, 0.05)",
                          borderRadius: "0.75rem",
                          padding: "0.75rem 0.875rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.75rem"
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "0.9rem", fontWeight: 600, textTransform: "capitalize", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {record.name || "Unnamed"}
                          </div>
                          <div style={{ fontSize: "0.75rem", opacity: 0.6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {record.id}
                          </div>
                        </div>
                        <div style={{ fontSize: "0.75rem", opacity: 0.75 }}>
                          {assetAssignedTo === record.id ? "Selected" : "Assign"}
                        </div>
                      </button>
                    ))
                  )}
                  {records.length > ASSIGNEE_RESULT_LIMIT && (
                    <div style={{ textAlign: "center", fontSize: "0.75rem", opacity: 0.6, paddingTop: "0.35rem" }}>
                      Showing first {ASSIGNEE_RESULT_LIMIT} records. Search to narrow down.
                    </div>
                  )}
                </div>
              </div>
            </ResponsiveModal>

            {/* Reuse Existing Asset Picker */}
            <ResponsiveModal
                open={reuseDialog}
                onOpenChange={setReuseDialog}
                title=""
                description=""
            >
                <div style={{ padding: "1rem", maxHeight: "75vh", display: "flex", flexDirection: "column" }}>
                    <p style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.75rem" }}>Copy from Existing Asset</p>
                    <p style={{ fontSize: "0.8rem", opacity: 0.6, marginBottom: "0.75rem" }}>
                  Showing distinct {assetCategory || "selected"} assets only. On select, next asset ID is generated (latest + 1). Assignee is cleared.
                    </p>

                    <div style={{ position: "relative", marginBottom: "0.75rem" }}>
                        <Search
                            width={16}
                            style={{
                                position: "absolute",
                                left: "0.75rem",
                                top: "50%",
                                transform: "translateY(-50%)",
                                opacity: 0.5,
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search by name, ID, brand, model..."
                            value={reuseSearchQuery}
                            onChange={(e) => setReuseSearchQuery(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "0.75rem 1rem 0.75rem 2.25rem",
                                borderRadius: "0.75rem",
                                background: "rgba(150, 150, 150, 0.1)",
                                border: "none",
                                fontSize: "0.95rem",
                            }}
                        />
                    </div>

                    <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", paddingBottom: "0.25rem" }}>
                      {distinctAssetsForReuse.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "1.25rem", opacity: 0.6 }}>
                                No assets found
                            </div>
                        ) : (
                        distinctAssetsForReuse.map((asset) => (
                                <Directive
                                    key={asset.id}
                                    status
                                    icon={getCategoryIcon(asset.category)}
                                    title={asset.name}
                                    subtext={asset.assetId || "No ID"}
                                    id_subtitle={`${asset.brand || ""}${asset.model ? " · " + asset.model : ""}`}
                                    onClick={() => copyFromAsset(asset)}
                                />
                            ))
                        )}
                    </div>
                </div>
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

            <DefaultDialog
              open={importDialog}
              title="Upload XLSX"
              titleIcon={<UploadCloud color="salmon" />}
              OkButtonText="Upload"
              created_on={importRows.length === 0 ? "" : importRows.length.toString()}
              updating={importing}
              disabled={!importRows.length}
              progressItem={importProgressItem}
              onCancel={() => {
                setImportDialog(false);
                setImportFile(null);
                setImportRows([]);
                setDuplicateImportRows([]);
                setImportProgressItem("");
              }}
              onOk={uploadImportRows}
              title_extra={
                <button
                  onClick={downloadImportTemplate}
                  style={{
                    fontSize: "0.8rem",
                    height: "2rem",
                    paddingLeft: "1rem",
                    paddingRight: "1rem",
                  }}
                >
                  <FileDown color="lightgreen" width="1rem" />
                  Template
                </button>
              }
              extra={
                <>
                  {importRows.length === 0 ? (
                    <div
                      style={{
                        width: "100%",
                        border: "3px dashed rgba(100 100 100 / 50%)",
                        height: "2.5rem",
                        borderRadius: "0.5rem",
                        marginBottom: "0.5rem",
                      }}
                    />
                  ) : (
                    <div
                      className="recipients"
                      style={{
                        width: "100%",
                        display: "flex",
                        flexFlow: "column",
                        gap: "0.35rem",
                        maxHeight: "11.25rem",
                        overflowY: "auto",
                        paddingRight: "0.5rem",
                        minHeight: "2.25rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {importRows.map((row, index) => (
                        <div key={`${row.assetId || row.name}-${index}`}>
                          <Directive
                            status
                            noArrow
                            onClick={() => {}}
                            title={row.name}
                            subtext={row.assetId || "No ID"}
                            id_subtitle={`${row.category} • ${row.brand || row.model || "No details"}`}
                            titleSize="0.75rem"
                            icon={getCategoryIcon(row.category)}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {importRows.length > 0 && duplicateImportRows.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexFlow: "column",
                        gap: "0.5rem",
                        padding: "0.75rem",
                        background: "rgba(255, 165, 0, 0.1)",
                        borderRadius: "0.5rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <p style={{ fontSize: "0.8rem", textAlign: "center", color: "orange" }}>
                        At least {duplicateImportRows.length} existing asset(s) detected and will be updated
                      </p>
                    </div>
                  )}

                  <p
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.75rem",
                      fontWeight: 400,
                      marginBottom: "0.5rem",
                    }}
                  >
                    <Info width="1rem" />
                    Rows with existing Asset ID will be updated. New Asset IDs will be inserted.
                  </p>

                  <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
                    <input
                      style={{ fontSize: "0.8rem" }}
                      type="file"
                      accept=".xls, .xlsx"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (e.target.files?.[0]) {
                          setImportFile(e.target.files[0]);
                          setImportRows([]);
                          setDuplicateImportRows([]);
                        }
                      }}
                    />
                    <button
                      className={importFile ? "" : "disabled"}
                      onClick={() => {
                        if (importRows.length > 0) {
                          setImportRows([]);
                          setDuplicateImportRows([]);
                        } else {
                          handleImportPreview();
                        }
                      }}
                      style={{
                        fontSize: "0.8rem",
                        paddingRight: "1rem",
                        paddingLeft: "1rem",
                      }}
                    >
                      {importRows.length > 0 ? "Clear" : "Add"}
                    </button>
                  </div>
                </>
              }
            />

            {/* Floating Add Button */}
            {userData?.role === "admin" && (
                <AddRecordButton
                    icon={<Plus color="white" />}
                onClick={openAddAssetDialog}
                    style="black"
                />
            )}
        </div>
    );
}