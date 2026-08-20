import { useAuth } from "@/components/AuthProvider";
import Back from "@/components/back";
import { DatePicker } from "@/components/date-picker";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import {
  ChevronDown,
  CloudDownload,
  Fingerprint,
  HelpCircle,
  Keyboard,
  Laptop2,
  Layers,
  Loader2,
  MinusCircle,
  Monitor,
  Plus,
  Printer,
  RotateCw,
  Search,
  Server,
  Smartphone,
  Trash2,
  Wifi,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// Types matching the user's Supabase columns + potential ID
interface Asset {
  id?: number | string;
  created_at?: string;
  device_id: string;
  category: string;
  make: string;
  spec: string;
  previous_posession?: string | null;
  current_posession?: string | null;
  allocation_date?: string | null;
  remarks?: string | null;
  condition?: string | null;
}

interface EmployeeOption {
  id: string | number;
  name: string;
  emp_id?: string;
}

const CATEGORIES = [
  { value: "Laptop", label: "Laptop", icon: Laptop2 },
  { value: "Monitor", label: "Monitor", icon: Monitor },
  { value: "Biometric Reader", label: "Biometric Reader", icon: Fingerprint },
  { value: "Printer", label: "Printer", icon: Printer },
  { value: "Router", label: "Router", icon: Wifi },
  { value: "Peripheral", label: "Peripheral", icon: Keyboard },
  { value: "Mobile Phone", label: "Mobile Phone", icon: Smartphone },
  { value: "Server", label: "Server", icon: Server },
  { value: "Other", label: "Other", icon: HelpCircle },
];

const CATEGORY_PREFIXES: Record<string, string> = {
  "Laptop": "SSU-LPTPH-",
  "Monitor": "SSU-MON-",
  "Biometric Reader": "SSU-BIO-",
  "Printer": "SSU-PRN-",
  "Router": "SSU-RTR-",
  "Peripheral": "SSU-PER-",
  "Mobile Phone": "SSU-MOB-",
  "Server": "SSU-SRV-",
  "Other": "SSU-AST-",
};

function getNextDeviceId(category: string, assets: Asset[]): string {
  // 1. Find all assets belonging to this category (case-insensitive)
  const categoryAssets = assets.filter(
    (asset) => asset.category && asset.category.toLowerCase() === category.toLowerCase()
  );

  // 2. If there are existing assets in this category, extract prefix/format and increment the highest one
  if (categoryAssets.length > 0) {
    let maxNum = -1;
    let bestPrefix = "";
    let bestDigitsLength = 3;

    categoryAssets.forEach((asset) => {
      if (!asset.device_id) return;
      // Match text prefix at start followed by digits at the end
      const match = asset.device_id.match(/^(.*?)(\d+)$/);
      if (match) {
        const prefix = match[1];
        const numStr = match[2];
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
          bestPrefix = prefix;
          bestDigitsLength = numStr.length;
        }
      }
    });

    if (maxNum !== -1) {
      const nextNum = maxNum + 1;
      const paddedNum = String(nextNum).padStart(bestDigitsLength, "0");
      return `${bestPrefix}${paddedNum}`;
    }
  }

  // 3. Fallback to default prefixes if no assets exist in the category yet
  const defaultPrefix = CATEGORY_PREFIXES[category] || "SSU-AST-";
  return `${defaultPrefix}001`;
}

const EMPTY_FORM: Asset = {
  device_id: "",
  category: "Laptop",
  make: "",
  spec: "",
  previous_posession: "",
  current_posession: "",
  allocation_date: new Date().toISOString().split("T")[0],
  remarks: "",
  condition: "Working",
};

const getAssetConditionRowStyle = (condition?: string | null) => {
  switch (condition) {
    case "Repair":
      return {
        base: "rgba(250, 204, 21, 0.18)",
        hover: "rgba(250, 204, 21, 0.28)",
      };
    case "Written Off":
      return {
        base: "rgba(239, 68, 68, 0.08)",
        hover: "rgba(239, 68, 68, 0.14)",
      };
    default:
      return {
        base: "transparent",
        hover: "rgba(100, 100, 100, 0.02)",
      };
  }
};

export default function AssetMaster() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMakes, setSelectedMakes] = useState<string[]>([]);

  // Modal Controls
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [formState, setFormState] = useState<Asset>({ ...EMPTY_FORM });

  // Autocomplete suggestions
  const [prevSuggestionsOpen, setPrevSuggestionsOpen] = useState(false);
  const [currSuggestionsOpen, setCurrSuggestionsOpen] = useState(false);
  const [brandSuggestionsOpen, setBrandSuggestionsOpen] = useState(false);
  const [specSuggestionsOpen, setSpecSuggestionsOpen] = useState(false);

  // Deletion Confirm Control
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  const { userData } = useAuth();

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetsResponse, employeesResponse] = await Promise.all([
        supabase.from("assets").select("*").order("created_at", { ascending: false }),
        supabase.from("employees").select("id, name, emp_id").order("name", { ascending: true }),
      ]);

      if (assetsResponse.error) throw assetsResponse.error;
      setAssets(assetsResponse.data || []);

      if (employeesResponse.data) {
        setEmployees(employeesResponse.data);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error(error.message || "Failed to load assets data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Check user editing permissions
  const canEdit = useMemo(() => {
    return !!userData;
  }, [userData]);

  // Unique Lists for filtering
  const uniqueCategoriesList = useMemo(() => {
    const cats = new Set<string>();
    assets.forEach((a) => {
      if (a.category) cats.add(a.category);
    });
    return Array.from(cats).sort();
  }, [assets]);

  const uniqueMakesList = useMemo(() => {
    const makes = new Set<string>();
    assets.forEach((a) => {
      if (a.make) makes.add(a.make);
    });
    return Array.from(makes).sort();
  }, [assets]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Category Filter
      if (selectedCategories.length > 0) {
        if (!asset.category || !selectedCategories.includes(asset.category)) {
          return false;
        }
      }

      // Make/Brand Filter
      if (selectedMakes.length > 0) {
        if (!asset.make || !selectedMakes.includes(asset.make)) {
          return false;
        }
      }

      // Search Query filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const deviceIdMatch = asset.device_id?.toLowerCase().includes(query);
        const categoryMatch = asset.category?.toLowerCase().includes(query);
        const makeMatch = asset.make?.toLowerCase().includes(query);
        const specMatch = asset.spec?.toLowerCase().includes(query);
        const prevPossMatch = asset.previous_posession?.toLowerCase().includes(query);
        const currPossMatch = asset.current_posession?.toLowerCase().includes(query);
        const remarksMatch = asset.remarks?.toLowerCase().includes(query);

        return (
          deviceIdMatch ||
          categoryMatch ||
          makeMatch ||
          specMatch ||
          prevPossMatch ||
          currPossMatch ||
          remarksMatch
        );
      }

      return true;
    });
  }, [assets, searchQuery, selectedCategories, selectedMakes]);

  // Suggestion filtering
  const filteredPrevSuggestions = useMemo(() => {
    const query = (formState.previous_posession || "").toLowerCase();
    if (!query) return employees.slice(0, 10);
    return employees.filter((e) => e.name.toLowerCase().includes(query));
  }, [employees, formState.previous_posession]);

  const filteredCurrSuggestions = useMemo(() => {
    const query = (formState.current_posession || "").toLowerCase();
    if (!query) return employees.slice(0, 10);
    return employees.filter((e) => e.name.toLowerCase().includes(query));
  }, [employees, formState.current_posession]);

  // Unique historical options parsed from existing assets
  const brandHistory = useMemo(() => {
    const unique = new Set(
      assets
        .map((a) => a.make?.trim())
        .filter((m): m is string => !!m)
    );
    return Array.from(unique).sort();
  }, [assets]);

  const specHistory = useMemo(() => {
    const unique = new Set(
      assets
        .map((a) => a.spec?.trim())
        .filter((s): s is string => !!s)
    );
    return Array.from(unique).sort();
  }, [assets]);

  // Brand and Specifications input filters
  const filteredBrandSuggestions = useMemo(() => {
    const query = (formState.make || "").toLowerCase().trim();
    if (!query) return brandHistory.slice(0, 10);
    return brandHistory.filter((brand) => brand.toLowerCase().includes(query));
  }, [brandHistory, formState.make]);

  const filteredSpecSuggestions = useMemo(() => {
    const query = (formState.spec || "").toLowerCase().trim();
    if (!query) return specHistory.slice(0, 10);
    return specHistory.filter((spec) => spec.toLowerCase().includes(query));
  }, [specHistory, formState.spec]);

  // Save (Create / Update) Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.device_id.trim()) {
      toast.error("Device ID is required.");
      return;
    }
    if (!formState.make.trim()) {
      toast.error("Make / Manufacturer is required.");
      return;
    }
    if (!formState.spec.trim()) {
      toast.error("Specification is required.");
      return;
    }

    setActionLoading(true);

    try {
      const payload: Partial<Asset> = {
        device_id: formState.device_id.trim(),
        category: formState.category,
        make: formState.make.trim(),
        spec: formState.spec.trim(),
        previous_posession: (formState.previous_posession || "").trim(),
        current_posession: (formState.current_posession || "").trim(),
        allocation_date: formState.allocation_date || null,
        remarks: (formState.remarks || "").trim(),
        condition: formState.condition || "Working",
      };

      if (modalMode === "edit" && selectedAsset) {
        // Update asset
        let query = supabase.from("assets").update(payload);
        if (selectedAsset.id !== undefined) {
          query = query.eq("id", selectedAsset.id);
        } else {
          query = query.eq("device_id", selectedAsset.device_id);
        }

        const { error } = await query;
        if (error) throw error;
        toast.success("Asset updated successfully.");
      } else {
        // Create asset
        // Check if device_id already exists to prevent duplicate key errors
        const { data: existing } = await supabase
          .from("assets")
          .select("device_id")
          .eq("device_id", payload.device_id)
          .maybeSingle();

        if (existing) {
          throw new Error(`Asset with Device ID "${payload.device_id}" already exists.`);
        }

        const { error } = await supabase.from("assets").insert([payload]);
        if (error) throw error;
        toast.success("Asset created successfully.");
      }

      setModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error saving asset:", error);
      toast.error(error.message || "Failed to save asset.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!assetToDelete) return;
    setActionLoading(true);
    try {
      let query = supabase.from("assets").delete();
      if (assetToDelete.id !== undefined) {
        query = query.eq("id", assetToDelete.id);
      } else {
        query = query.eq("device_id", assetToDelete.device_id);
      }

      const { error } = await query;
      if (error) throw error;

      toast.success(`Asset "${assetToDelete.device_id}" deleted successfully.`);
      setDeleteConfirmOpen(false);
      setAssetToDelete(null);
      fetchData();
    } catch (error: any) {
      console.error("Error deleting asset:", error);
      toast.error(error.message || "Failed to delete asset.");
    } finally {
      setActionLoading(false);
    }
  };

  // Export to CSV Function
  const exportToCSV = () => {
    if (filteredAssets.length === 0) {
      toast.error("No data available to export.");
      return;
    }

    const headers = [
      "Device ID",
      "Category",
      "Make",
      "Specification",
      "Previous Possession",
      "Current Possession",
      "Allocation Date",
      "Remarks",
      "Created At",
    ];

    const rows = filteredAssets.map((a) => [
      a.device_id || "",
      a.category || "",
      a.make || "",
      `"${(a.spec || "").replace(/"/g, '""')}"`,
      a.previous_posession || "",
      a.current_posession || "",
      a.allocation_date || "",
      `"${(a.remarks || "").replace(/"/g, '""')}"`,
      a.created_at || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `assets_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file downloaded successfully.");
  };



  return (
    <>
      <div style={{ height: "100svh", display: "flex", flexDirection: "column" }}>
        {/* Header navigation bar */}
        <Back
          blurBG
          fixed
          title={"Devices"}
          // subtitle={assets.length ? `${assets.length} items` : undefined}
          extra={
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {canEdit && (
                <button
                  onClick={() => {
                    const defaultCategory = "Laptop";
                    const nextId = getNextDeviceId(defaultCategory, assets);
                    setFormState({
                      ...EMPTY_FORM,
                      category: defaultCategory,
                      device_id: nextId
                    });
                    setModalMode("add");
                    setModalOpen(true);
                  }}
                  style={{
                    background: "#0f172a",
                    color: "white",
                    borderRadius: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0 1rem",
                    height: "2.5rem",
                    fontWeight: 500,
                    fontSize: "0.85rem",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Asset</span>
                </button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={fetchData}
                disabled={loading}
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(100,100,100,0.18)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} style={{ opacity: 0.7 }} />
              </Button>
            </div>
          }
        />

        {/* Scrollable Page Body Container (FLEXES FULL WIDTH) */}
        <div
          style={{
            flex: 1,
            overflowY: "hidden",
            paddingTop: "5.5rem",
            paddingLeft: "1.25rem",
            paddingRight: "1.25rem",
            paddingBottom: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Search bar + Download button Row */}
          <div style={{ display: "flex", gap: "0.5rem", width: "100%", alignItems: "center" }}>

            {/* Search Input Container */}
            <div
              style={{
                position: "relative",
                flex: 1,
                boxSizing: "border-box",
              }}
            >
              <Search
                className="text-slate-400"
                style={{
                  position: "absolute",
                  left: "0.85rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "0.9rem",
                  height: "0.9rem",
                }}
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search serial ID, brand, specifications..."
                style={{
                  paddingLeft: "2.2rem",
                  paddingRight: searchQuery ? "2.2rem" : "0.75rem",
                  height: "2.5rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(100, 100, 100, 0.2)",
                  background: "transparent",
                  fontSize: "1rem",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "rgba(100, 100, 100, 0.5)",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Download Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={exportToCSV}
              disabled={loading || assets.length === 0}
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "0.5rem",
                border: "1px solid rgba(100,100,100,0.18)",
                background: "transparent",
                color: "#334155",
                cursor: "pointer",
                flexShrink: 0,
              }}
              title="Export Filtered Assets to CSV"
            >
              <CloudDownload className="w-4 h-4" />
            </Button>

          </div>

          {/* Content Loading State */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "0.75rem", width: "100%" }}>
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" style={{ margin: "0 auto" }} />
              <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.5, textAlign: "center" }}>Loading assets data inventory...</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            /* Empty State */
            <div
              style={{
                background: "transparent",
                border: "1px dashed rgba(100, 100, 100, 0.25)",
                borderRadius: "1rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                width: "100%",
                boxSizing: "border-box",
                padding: "2rem",
              }}
            >
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <Layers className="text-slate-400 w-10 h-10" style={{ opacity: 0.5 }} />
                  </EmptyMedia>
                  <EmptyTitle>No Assets Found</EmptyTitle>
                  <EmptyDescription>
                    {assets.length === 0
                      ? "No assets are registered in the inventory yet."
                      : "Try tweaking your search keywords or filters to locate items."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <div
              style={{
                border: "1px solid rgba(100, 100, 100, 0.12)",
                borderRadius: "0.5rem",
                background: "rgba(100, 100, 100, 0.01)",
                overflowX: "auto",
                overflowY: "auto",
                flex: 1,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <table style={{ width: "100%", minWidth: "900px", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: "#f9fafb", boxShadow: "0 1px 0 rgba(100, 100, 100, 0.12)" }}>
                  <tr style={{ background: "#f9fafb" }}>
                    <th style={{ textAlign: "left", padding: "0.5rem 0.6rem", fontWeight: 600, color: "#334155", width: "150px" }}>Device ID</th>

                    {/* Category Filter Header */}
                    <th style={{ textAlign: "left", padding: "0.25rem 0.6rem", fontWeight: 600, color: "#334155", width: "110px" }}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: "0.25rem 0.35rem",
                            borderRadius: "0.375rem",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: "#334155",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            justifyContent: "space-between",
                            width: "100%",
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                          className="hover:bg-slate-100 dark:hover:bg-slate-900"
                        >
                          <span className="truncate">
                            {selectedCategories.length === 0
                              ? "Category"
                              : selectedCategories.length === 1
                                ? selectedCategories[0]
                                : `Cat (${selectedCategories.length})`}
                          </span>
                          <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[150px] max-h-[300px] overflow-y-auto p-0 z-50 bg-white border border-slate-200 rounded-md shadow-lg">
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: "sticky",
                              top: 0,
                              zIndex: 10,
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "0.35rem 0.5rem",
                              borderBottom: "1px solid #f1f5f9",
                              backgroundColor: "#f8fafc",
                            }}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedCategories(uniqueCategoriesList);
                              }}
                              style={{ background: "none", border: "none", fontSize: "10px", fontWeight: 600, color: "#64748b", cursor: "pointer" }}
                              className="hover:text-slate-800"
                            >
                              All
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedCategories([]);
                              }}
                              style={{ background: "none", border: "none", fontSize: "10px", fontWeight: 600, color: "#64748b", cursor: "pointer" }}
                              className="hover:text-slate-800"
                            >
                              Clear
                            </button>
                          </div>
                          <div style={{ padding: "0.25rem 0" }}>
                            {uniqueCategoriesList.map((cat) => {
                              const isChecked = selectedCategories.includes(cat);
                              return (
                                <DropdownMenuCheckboxItem
                                  key={cat}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedCategories([...selectedCategories, cat]);
                                    } else {
                                      setSelectedCategories(selectedCategories.filter((item) => item !== cat));
                                    }
                                  }}
                                  onSelect={(e) => e.preventDefault()}
                                  className="rounded-md focus:bg-slate-50 cursor-pointer text-xs py-1.5 px-2 flex items-center gap-2"
                                >
                                  {cat}
                                </DropdownMenuCheckboxItem>
                              );
                            })}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </th>

                    {/* Make Filter Header */}
                    <th style={{ textAlign: "left", padding: "0.25rem 0.6rem", fontWeight: 600, color: "#334155", width: "190px" }}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: "0.25rem 0.35rem",
                            borderRadius: "0.375rem",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: "#334155",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            justifyContent: "space-between",
                            width: "100%",
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                          className="hover:bg-slate-100 dark:hover:bg-slate-900"
                        >
                          <span className="truncate">
                            {selectedMakes.length === 0
                              ? "Make"
                              : selectedMakes.length === 1
                                ? selectedMakes[0]
                                : `Make (${selectedMakes.length})`}
                          </span>
                          <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[150px] max-h-[300px] overflow-y-auto p-0 z-50 bg-white border border-slate-200 rounded-md shadow-lg">
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: "sticky",
                              top: 0,
                              zIndex: 10,
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "0.35rem 0.5rem",
                              borderBottom: "1px solid #f1f5f9",
                              backgroundColor: "#f8fafc",
                            }}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedMakes(uniqueMakesList);
                              }}
                              style={{ background: "none", border: "none", fontSize: "10px", fontWeight: 600, color: "#64748b", cursor: "pointer" }}
                              className="hover:text-slate-800"
                            >
                              All
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedMakes([]);
                              }}
                              style={{ background: "none", border: "none", fontSize: "10px", fontWeight: 600, color: "#64748b", cursor: "pointer" }}
                              className="hover:text-slate-800"
                            >
                              Clear
                            </button>
                          </div>
                          <div style={{ padding: "0.25rem 0" }}>
                            {uniqueMakesList.map((make) => {
                              const isChecked = selectedMakes.includes(make);
                              return (
                                <DropdownMenuCheckboxItem
                                  key={make}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedMakes([...selectedMakes, make]);
                                    } else {
                                      setSelectedMakes(selectedMakes.filter((item) => item !== make));
                                    }
                                  }}
                                  onSelect={(e) => e.preventDefault()}
                                  className="rounded-md focus:bg-slate-50 cursor-pointer text-xs py-1.5 px-2 flex items-center gap-2"
                                >
                                  {make}
                                </DropdownMenuCheckboxItem>
                              );
                            })}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </th>

                    <th style={{ textAlign: "left", padding: "0.5rem 0.6rem", fontWeight: 600, color: "#334155", maxWidth: "250px" }}>Specifications</th>
                    <th style={{ textAlign: "left", padding: "0.5rem 0.6rem", fontWeight: 600, color: "#334155" }}>Posession</th>
                    <th style={{ textAlign: "left", padding: "0.5rem 0.6rem", fontWeight: 600, color: "#334155" }}>Allocated On</th>
                    <th style={{ textAlign: "left", padding: "0.5rem 0.6rem", fontWeight: 600, color: "#334155", maxWidth: "200px" }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => {
                    const isAllocated = asset.current_posession && asset.current_posession.trim() !== "";
                    const rowStyle = getAssetConditionRowStyle(asset.condition);
                    return (
                      <tr
                        key={asset.id || asset.device_id}
                        style={{
                          borderBottom: "1px solid rgba(100, 100, 100, 0.08)",
                          cursor: canEdit ? "pointer" : "default",
                          backgroundColor: rowStyle.base,
                        }}
                        onClick={() => {
                          if (canEdit) {
                            setSelectedAsset(asset);
                            setFormState({ ...asset });
                            setModalMode("edit");
                            setModalOpen(true);
                          }
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = rowStyle.hover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = rowStyle.base;
                        }}
                      >
                        {/* Device ID */}
                        <td style={{ padding: "0.5rem 0.6rem", fontWeight: 600, verticalAlign: "middle", color: "#0f172a" }}>
                          {asset.device_id}
                        </td>

                        {/* Category */}
                        <td style={{ padding: "0.5rem 0.6rem", verticalAlign: "middle" }}>
                          <span style={{
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            padding: "0.15rem 0.45rem",
                            borderRadius: "4px",
                            background: "rgba(100, 100, 100, 0.08)",
                            color: "rgba(50, 50, 50, 0.8)",
                            border: "1px solid rgba(100, 100, 100, 0.12)",
                            textTransform: "uppercase",
                            letterSpacing: "0.025em"
                          }}>
                            {asset.category}
                          </span>
                        </td>

                        {/* Make */}
                        <td style={{ padding: "0.5rem 0.6rem", verticalAlign: "middle", color: "#334155", fontWeight: 500 }}>
                          {asset.make}
                        </td>

                        {/* Specs */}
                        <td style={{ padding: "0.5rem 0.6rem", verticalAlign: "middle", color: "rgba(50, 50, 50, 0.95)", maxWidth: "250px", wordBreak: "break-word", fontWeight: 500 }}>
                          {asset.spec}
                        </td>

                        {/* Custody Flow */}
                        <td style={{ padding: "0.5rem 0.6rem", verticalAlign: "middle" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: isAllocated ? 500 : 600, color: isAllocated ? "#0f172a" : "teal", textTransform: "capitalize" }}>
                            {isAllocated ? asset.current_posession?.toLowerCase() : "Available"}
                          </span>
                        </td>

                        {/* Allocation Date */}
                        <td style={{ padding: "0.5rem 0.6rem", verticalAlign: "middle", color: "rgba(100, 100, 100, 0.8)" }}>
                          {asset.allocation_date || <span style={{ opacity: 0.35 }}>—</span>}
                        </td>

                        {/* Remarks */}
                        <td style={{ padding: "0.5rem 0.6rem", verticalAlign: "middle", color: "rgba(100, 100, 100, 0.85)", maxWidth: "200px", wordBreak: "break-word" }}>
                          {asset.remarks || <span style={{ opacity: 0.35 }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE & EDIT ASSET MODAL */}
      <ResponsiveModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setFormState({ ...EMPTY_FORM });
            setSelectedAsset(null);
          }
        }}
        title=""
        description=""
        hideHeader={true}
      >
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", maxHeight: "85vh", overflow: "hidden" }}>
          {/* Custom Modal Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", padding: "1rem 1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Laptop2 className="w-5 h-5 text-indigo-900" />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#111827", margin: 0 }}>
                {modalMode === "edit" ? "Edit IT Asset" : "Register New IT Asset"}
              </h3>
            </div>
            {modalMode === "edit" && (
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setAssetToDelete(selectedAsset);
                  setDeleteConfirmOpen(true);
                }}
                disabled={actionLoading}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "crimson",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.375rem",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(220, 50, 50, 0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <MinusCircle className="w-4 h-4" />
                <span>Delete Asset</span>
              </button>
            )}
          </div>

          {/* Scrollable Form Body Container */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Device ID and Condition side-by-side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {/* Device ID */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Device ID / Serial *</label>
                <input
                  value={formState.device_id || ""}
                  onChange={(e) => setFormState({ ...formState, device_id: e.target.value })}
                  placeholder="e.g. SSU-LPTPH-000"
                  disabled={modalMode === "edit" || actionLoading}
                  required
                  style={{
                    height: "2.25rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #e5e7eb",
                    padding: "0 0.75rem",
                    fontSize: "1rem",
                    backgroundColor: "white",
                    outline: "none",
                    boxSizing: "border-box",
                    width: "100%",
                  }}
                />
              </div>

              {/* Condition */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Condition *</label>
                <Select
                  value={formState.condition || "Working"}
                  onValueChange={(val) => setFormState({ ...formState, condition: val })}
                  disabled={actionLoading}
                >
                  <SelectTrigger
                    style={{
                      height: "2.25rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #e5e7eb",
                      padding: "0 0.75rem",
                      fontSize: "1rem",
                      backgroundColor: "white",
                      outline: "none",
                      boxSizing: "border-box",
                      width: "100%",
                      textAlign: "left",
                    }}
                  >
                    <SelectValue placeholder="Select Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Working">Working</SelectItem>
                    <SelectItem value="Repair">Repair</SelectItem>
                    <SelectItem value="Written Off">Written Off</SelectItem>
                    <SelectItem value="Damaged">Damaged</SelectItem>
                    <SelectItem value="Scrapped">Scrapped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {modalMode !== "edit" && (
                <p style={{ margin: 0, fontSize: "0.62rem", color: "#6b7280" }}>
                  Must be a unique identification string.
                </p>
              )}

            {/* Category & Brand side-by-side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {/* Category Selector */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Device Category *</label>
                <Select
                  value={formState.category}
                  onValueChange={(val) => {
                    const updates: Partial<Asset> = { category: val };
                    if (modalMode === "add") {
                      updates.device_id = getNextDeviceId(val, assets);
                    }
                    setFormState({ ...formState, ...updates });
                  }}
                  disabled={actionLoading}
                >
                  <SelectTrigger
                    style={{
                      height: "2.25rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #e5e7eb",
                      padding: "0 0.75rem",
                      fontSize: "1rem",
                      backgroundColor: "white",
                      outline: "none",
                      boxSizing: "border-box",
                      width: "100%",
                      textAlign: "left",
                    }}
                  >
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Brand/Make */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", position: "relative" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Brand / Manufacturer *</label>
                <div style={{ position: "relative" }}>
                  <input
                    value={formState.make || ""}
                    onChange={(e) => {
                      setFormState({ ...formState, make: e.target.value });
                      setBrandSuggestionsOpen(true);
                    }}
                    onFocus={() => setBrandSuggestionsOpen(true)}
                    onBlur={() => {
                      setTimeout(() => setBrandSuggestionsOpen(false), 200);
                    }}
                    placeholder="e.g. HP, Lenovo, Dell"
                    disabled={actionLoading}
                    required
                    style={{
                      height: "2.25rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #e5e7eb",
                      padding: "0 0.75rem",
                      fontSize: "1rem",
                      backgroundColor: "white",
                      outline: "none",
                      boxSizing: "border-box",
                      width: "100%",
                    }}
                  />
                  <ChevronDown
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "0.9rem",
                      height: "0.9rem",
                      opacity: 0.5,
                      pointerEvents: "none",
                    }}
                  />
                </div>
                {brandSuggestionsOpen && filteredBrandSuggestions.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      zIndex: 999,
                      marginTop: "0.25rem",
                      maxHeight: "12rem",
                      overflowY: "auto",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(100, 100, 100, 0.15)",
                      background: "white",
                      padding: "0.25rem",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    {filteredBrandSuggestions.map((brand, i) => (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={() => {
                          setFormState({ ...formState, make: brand });
                          setBrandSuggestionsOpen(false);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "0.5rem 0.75rem",
                          background: "transparent",
                          border: "none",
                          borderRadius: "0.35rem",
                          fontSize: "1rem",
                          cursor: "pointer",
                          display: "block",
                          color: "inherit",
                        }}
                        className="hover:bg-slate-100 dark:hover:bg-slate-900"
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Specs */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", position: "relative" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Specifications *</label>
              <div style={{ position: "relative" }}>
                <textarea
                  value={formState.spec || ""}
                  onChange={(e) => {
                    setFormState({ ...formState, spec: e.target.value });
                    setSpecSuggestionsOpen(true);
                  }}
                  onFocus={() => setSpecSuggestionsOpen(true)}
                  onBlur={() => {
                    setTimeout(() => setSpecSuggestionsOpen(false), 200);
                  }}
                  placeholder="e.g. Core i7, 16GB RAM, 512GB SSD"
                  disabled={actionLoading}
                  required
                  rows={2}
                  style={{
                    borderRadius: "0.375rem",
                    border: "1px solid #e5e7eb",
                    padding: "0.5rem 2.25rem 0.5rem 0.75rem",
                    fontSize: "1rem",
                    backgroundColor: "white",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    width: "100%",
                  }}
                />
                <ChevronDown
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "1.1rem",
                    width: "0.9rem",
                    height: "0.9rem",
                    opacity: 0.5,
                    pointerEvents: "none",
                  }}
                />
              </div>
              {specSuggestionsOpen && filteredSpecSuggestions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 999,
                    marginTop: "0.25rem",
                    maxHeight: "12rem",
                    overflowY: "auto",
                    borderRadius: "0.5rem",
                    border: "1px solid rgba(100, 100, 100, 0.15)",
                    background: "white",
                    padding: "0.25rem",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                >
                  {filteredSpecSuggestions.map((spec, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => {
                        setFormState({ ...formState, spec: spec });
                        setSpecSuggestionsOpen(false);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "0.5rem 0.75rem",
                        background: "transparent",
                        border: "none",
                        borderRadius: "0.35rem",
                        fontSize: "1rem",
                        cursor: "pointer",
                        display: "block",
                        color: "inherit",
                      }}
                      className="hover:bg-slate-100 dark:hover:bg-slate-900"
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Previous & Current Possession side-by-side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {/* Autocomplete previous possession */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", position: "relative" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Previous Possession</label>
                <div style={{ position: "relative" }}>
                  <input
                    value={formState.previous_posession || ""}
                    onChange={(e) => {
                      setFormState({ ...formState, previous_posession: e.target.value });
                      setPrevSuggestionsOpen(true);
                    }}
                    onFocus={() => setPrevSuggestionsOpen(true)}
                    onBlur={() => {
                      setTimeout(() => setPrevSuggestionsOpen(false), 200);
                    }}
                    placeholder="Type previous user"
                    disabled={actionLoading}
                    style={{
                      height: "2.25rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #e5e7eb",
                      padding: "0 0.75rem",
                      fontSize: "1rem",
                      backgroundColor: "white",
                      outline: "none",
                      boxSizing: "border-box",
                      width: "100%",
                    }}
                  />
                  <ChevronDown
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "0.9rem",
                      height: "0.9rem",
                      opacity: 0.5,
                      pointerEvents: "none",
                    }}
                  />
                </div>
                {prevSuggestionsOpen && filteredPrevSuggestions.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      zIndex: 999,
                      marginTop: "0.25rem",
                      maxHeight: "12rem",
                      overflowY: "auto",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(100, 100, 100, 0.15)",
                      background: "white",
                      padding: "0.25rem",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    {filteredPrevSuggestions.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onMouseDown={() => {
                          setFormState({ ...formState, previous_posession: emp.name });
                          setPrevSuggestionsOpen(false);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "0.5rem 0.75rem",
                          background: "transparent",
                          border: "none",
                          borderRadius: "0.35rem",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          display: "block",
                          color: "inherit",
                        }}
                        className="hover:bg-slate-100 dark:hover:bg-slate-900"
                      >
                        {emp.name} {emp.emp_id ? `(${emp.emp_id})` : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Autocomplete current possession */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", position: "relative" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Current Possession</label>
                <div style={{ position: "relative" }}>
                  <input
                    value={formState.current_posession || ""}
                    onChange={(e) => {
                      setFormState({ ...formState, current_posession: e.target.value });
                      setCurrSuggestionsOpen(true);
                    }}
                    onFocus={() => setCurrSuggestionsOpen(true)}
                    onBlur={() => {
                      setTimeout(() => setCurrSuggestionsOpen(false), 200);
                    }}
                    placeholder="Type current user"
                    disabled={actionLoading}
                    style={{
                      height: "2.25rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #e5e7eb",
                      padding: "0 0.75rem",
                      fontSize: "1rem",
                      backgroundColor: "white",
                      outline: "none",
                      boxSizing: "border-box",
                      width: "100%",
                    }}
                  />
                  <ChevronDown
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "0.9rem",
                      height: "0.9rem",
                      opacity: 0.5,
                      pointerEvents: "none",
                    }}
                  />
                </div>
                {currSuggestionsOpen && filteredCurrSuggestions.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      zIndex: 999,
                      marginTop: "0.25rem",
                      maxHeight: "12rem",
                      overflowY: "auto",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(100, 100, 100, 0.15)",
                      background: "white",
                      padding: "0.25rem",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    <button
                      type="button"
                      onMouseDown={() => {
                        setFormState({ ...formState, current_posession: "" });
                        setCurrSuggestionsOpen(false);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "0.5rem 0.75rem",
                        background: "transparent",
                        border: "none",
                        borderRadius: "0.35rem",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        display: "block",
                        color: "crimson",
                        fontWeight: "bold",
                      }}
                      className="hover:bg-slate-100 dark:hover:bg-slate-900"
                    >
                      Unassigned / Keep in IT Store
                    </button>
                    {filteredCurrSuggestions.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onMouseDown={() => {
                          setFormState({ ...formState, current_posession: emp.name });
                          setCurrSuggestionsOpen(false);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "0.5rem 0.75rem",
                          background: "transparent",
                          border: "none",
                          borderRadius: "0.35rem",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          display: "block",
                          color: "inherit",
                        }}
                        className="hover:bg-slate-100 dark:hover:bg-slate-900"
                      >
                        {emp.name} {emp.emp_id ? `(${emp.emp_id})` : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Allocation Date */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Allocation Date</label>
              <DatePicker
                value={formState.allocation_date || ""}
                onChange={(val) => {
                  const resolvedVal = typeof val === "function" ? (val as Function)(formState.allocation_date) : val;
                  setFormState({ ...formState, allocation_date: resolvedVal });
                }}
                disabled={actionLoading}
                style={{
                  height: "2.25rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #e5e7eb",
                  padding: "0 0.75rem",
                  fontSize: "1rem",
                  backgroundColor: "white",
                  outline: "none",
                  boxSizing: "border-box",
                  width: "100%",
                  textAlign: "left",
                  justifyContent: "flex-start",
                }}
              />
            </div>

            {/* Remarks */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Remarks</label>
              <textarea
                value={formState.remarks || ""}
                onChange={(e) => setFormState({ ...formState, remarks: e.target.value })}
                placeholder="Optional notes"
                disabled={actionLoading}
                rows={2}
                style={{
                  borderRadius: "0.375rem",
                  border: "1px solid #e5e7eb",
                  padding: "0.5rem 0.75rem",
                  fontSize: "1rem",
                  backgroundColor: "white",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  width: "100%",
                }}
              />
            </div>
          </div>

          {/* Fixed Footer Buttons (equal flexed siblings side-by-side) */}
          <div style={{ display: "flex", gap: "0.5rem", padding: "1rem 1.5rem", borderTop: "1px solid #f3f4f6", background: "#ffffff" }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              style={{ flex: 1, height: "2.25rem", fontSize: "0.85rem" }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={actionLoading}
              style={{
                flex: 1,
                height: "2.25rem",
                fontSize: "0.85rem",
                backgroundColor: "#0f172a",
                color: "white"
              }}
            >
              {actionLoading ? "Saving..." : modalMode === "edit" ? "Save Changes" : "Register Asset"}
            </Button>
          </div>
        </form>
      </ResponsiveModal>

      {/* DELETION CONFIRMATION DIALOG */}
      <ResponsiveModal
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) setAssetToDelete(null);
        }}
        title=""
        description=""
        hideHeader={true}
      >
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Custom Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid #f3f4f6", padding: "1rem 1.5rem" }}>
            <Trash2 className="w-5 h-5 text-rose-600" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#111827", margin: 0 }}>
              Confirm Asset Deletion
            </h3>
          </div>

          {/* Body */}
          <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ fontSize: "0.88rem", color: "#4b5563", margin: 0, lineHeight: "1.5" }}>
              Are you absolutely sure you want to remove asset <strong>{assetToDelete?.device_id}</strong> ({assetToDelete?.make} {assetToDelete?.category})? This action will permanently delete it from the tracker database and cannot be undone.
            </p>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", padding: "1rem 1.5rem", borderTop: "1px solid #f3f4f6", background: "#f9fafb" }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setAssetToDelete(null);
              }}
              style={{ height: "2.25rem", fontSize: "0.85rem" }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={actionLoading}
              style={{
                height: "2.25rem",
                fontSize: "0.85rem",
                backgroundColor: "crimson",
                color: "white"
              }}
            >
              {actionLoading ? "Deleting..." : "Delete Asset"}
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </>
  );
}
