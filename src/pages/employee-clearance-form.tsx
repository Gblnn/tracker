import Back from "@/components/back";
import { ResponsiveModal } from "@/components/responsive-modal";
import { RichTextEditor } from "@/components/rich-text-editor";
import DefaultDialog from "@/components/ui/default-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { auth, db } from "@/firebase";
import { LoadingOutlined } from "@ant-design/icons";
import emailjs from "@emailjs/browser";
import { Input, message, Modal } from "antd";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc
} from "firebase/firestore";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Bug,
  Check,
  ChevronDown,
  ChevronRight,
  Database,
  Eye,
  EyeOff,
  FilePlus,
  FileText,
  FileX,
  GripVertical,
  LoaderCircle,
  Pencil,
  Plus,
  Save,
  Trash2,
  X
} from "lucide-react";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";

// Input style for all fields
const inputStyle = {
  width: "100%",
  fontSize: "0.92rem",
  lineHeight: 1.4,
  padding: "0.65rem 0.75rem",
  borderRadius: "0.6rem",
  border: "1px solid rgba(15 23 42/ 18%)",
  background: "rgba(255 255 255/ 96%)",
  color: "rgba(17 24 39/ 92%)",
  outline: "none",
  boxShadow: "0 1px 2px rgba(15 23 42/ 6%)",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
};

// Table cell style for preview
const tableCellStyle = {
  border: "1.5px solid rgba(0 0 0/ 85%)",
  padding: "4px 8px 8px 8px",
  verticalAlign: "top",
  fontFamily: "",
  background: "none",
  textTransform: "uppercase",
};



const clearanceDepartmentRows: string[] = [
  "Site Store",
  "Site Admin",
  "Project / HOD",
  "General Store",
  "IT Department",
  "Corporate admin",
  "Finance department",
  "Director ( Operations )",
  "HR Department",
];

type FieldType = "text" | "textarea" | "number" | "date";

type FieldConfig = {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  rows?: number;
  enabled: boolean;
  isCustom?: boolean;
  section?: "table" | "paragraph";
};

type FormData = {
  date: string;
  refNo: string;
  candidateName: string;
  passportNumber: string;
  position: string;
  workLocation: string;
  salary: string;
  allowance: string;
  grossSalary: string;
  attendance: string;
  probation: string;
  reportingDate: string;
  resignationDate: string;
  relievingDate: string;
  employeeRemarks: string;
  contractPeriod: string;
  noticePeriod: string;
  noticePeriodSubsections: string[];
  accomodation: string;
  food: string;
  transport: string;
  visaStatus: string;
  communication: string;
  medical: string;
  insurance: string;
  annualLeave: string;
  gratuity: string;
  leaveEncashment: string;
  workingHours: string;
  airPassage: string;
  sectorOfTravel: string;
  classOfTravel: string;
  medicalTerms: string;
  incrementTerms: string;
  roles: Array<{ title: string; description: string }>;
  allowances: Array<{ title: string; description: string }>;
  customFields?: { [key: string]: string };
};

type Preset = {
  id: string;
  name: string;
  data: FormData;
  created_at: any;
  fieldConfig?: FieldConfig[];
};

type FormTemplateId = "employee_clearance" | "leave_application" | "salary_advance";

const PREVIEW_BASE_WIDTH = 800;
const PREVIEW_MOBILE_GUTTER = 24;

const FORM_TEMPLATE_OPTIONS: Array<{ id: FormTemplateId; label: string; fileName: string }> = [
  { id: "employee_clearance", label: "Employee Clearance Form", fileName: "Employee_Clearance_Form" },
  { id: "leave_application", label: "Leave Application Form", fileName: "Leave_Application_Form" },
  { id: "salary_advance", label: "Salary Advance Form", fileName: "Salary_Advance_Form" },
];

export default function EmployeeClearanceForm() {
  //   const usenavigate = useNavigate();
  const [todayDisplayDate] = useState(moment().format("DD/MM/YYYY"));
  const employeeClearanceDocNo = "SSU/HR/EC";
  const employeeClearanceRevision = 0;
  const [bugDialog, setBugDialog] = useState(false);
  const [issue, setIssue] = useState("");
  const [loading, setLoading] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [selectedFormTemplate, setSelectedFormTemplate] = useState<FormTemplateId>("employee_clearance");
  const [printRefNoOverride, setPrintRefNoOverride] = useState<string | null>(null);
  const getNextReferenceNumber = (existingLetters: Array<{ refNo?: string }>) => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear().toString().slice(-2);

    const numbers = existingLetters
      .map((letter: { refNo?: string }) => {
        const match = letter.refNo?.match(/^SSU\/HR\/(\d{2})\/(\d{2})-(\d+)$/);
        if (!match) return 0;
        const [, refMonth, refYear, runningNumber] = match;
        if (refMonth !== month || refYear !== year) return 0;
        return parseInt(runningNumber, 10);
      })
      .filter((num: number) => !Number.isNaN(num));

    const highestNumber = Math.max(0, ...numbers);
    const nextNumber = highestNumber + 1;
    return `SSU/HR/${month}/${year}-${nextNumber}`;
  };

  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    refNo: "",
    candidateName: "",
    passportNumber: "",
    position: "",
    workLocation: "",
    salary: "",
    allowance: "",
    grossSalary: "",
    attendance: "",
    probation: "",
    reportingDate: "",
    resignationDate: "",
    relievingDate: "",
    employeeRemarks: "",
    contractPeriod: "",
    noticePeriod: "",
    noticePeriodSubsections: [],
    accomodation: "",
    food: "",
    transport: "",
    visaStatus: "",
    communication: "",
    medical: "",
    insurance: "",
    annualLeave: "",
    gratuity: "",
    leaveEncashment: "",
    workingHours: "",
    airPassage: "",
    sectorOfTravel: "",
    classOfTravel: "",
    medicalTerms: "",
    incrementTerms: "",
    roles: [],
    allowances: [],
    customFields: {},
  });

  useEffect(() => {
    // Fetch letters and set initial reference number when component mounts
    fetchOfferLetters();
  }, []);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const tableRef = useRef<HTMLDivElement>(null);

  const serviceId = "service_fixajl8";
  const templateId = "template_0f3zy3e";

  const [offerLetters, setOfferLetters] = useState<any[]>([]);
  const [, setOfferLettersLoading] = useState(false);
  const [editingLetter, setEditingLetter] = useState<any>(null);
  // const [addingToShortlist, setAddingToShortlist] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedLetterId, setLoadedLetterId] = useState<string | null>(null);
  const [, setHasChanges] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<any>(null);
  const [air_passage, setAirPassage] = useState(true);
  const [comm, setComm] = useState(true);
  const [visaS, setVisaS] = useState(true);
  const [offerLettersCache, setOfferLettersCache] = useState<any[]>([]);
  const [, setPresets] = useState<Preset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [presetName, setPresetName] = useState("");
  const [presetDialogVisible, setPresetDialogVisible] = useState(false);
  const [renameDialogVisible, setRenameDialogVisible] = useState(false);
  const [originalPresetData, setOriginalPresetData] = useState<FormData | null>(
    null
  );
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [joiningDate, setJoiningDate] = useState(true);
  const [, setPresetsLoading] = useState(false);

  // Default field configuration
  const defaultFieldConfig: FieldConfig[] = [
    // Table section fields - in order of appearance in the table
    { id: "candidateName", label: "Candidate Name", type: "text", placeholder: "Enter candidate name", enabled: true, section: "table" },
    { id: "passportNumber", label: "Passport Number", type: "text", placeholder: "Enter passport number", enabled: false, section: "table" },
    { id: "position", label: "Job Title", type: "text", placeholder: "Enter Job Title", enabled: true, section: "table" },
    { id: "workLocation", label: "Location", type: "text", placeholder: "Enter work location", enabled: true, section: "table" },
    { id: "salary", label: "Basic Salary (OMR)", type: "number", placeholder: "Enter salary", enabled: true, section: "table" },
    { id: "allowance", label: "Allowance (OMR)", type: "number", placeholder: "Enter Allowance", enabled: true, section: "table" },
    { id: "grossSalary", label: "Gross Salary (OMR)", type: "number", placeholder: "Enter Gross Salary", enabled: true, section: "table" },
    { id: "attendance", label: "Attendance", type: "textarea", placeholder: "Enter Attendance Terms", rows: 4, enabled: true, section: "table" },
    { id: "probation", label: "Probation", type: "textarea", placeholder: "Enter Probation Terms", rows: 4, enabled: true, section: "table" },
    { id: "reportingDate", label: "Joining Date", type: "date", placeholder: "Enter Reporting Date", enabled: false, section: "table" },
    { id: "contractPeriod", label: "Contract Period", type: "textarea", placeholder: "Enter Contract Period", rows: 4, enabled: true, section: "table" },
    { id: "noticePeriod", label: "Notice Period", type: "textarea", placeholder: "Enter Notice Period", rows: 4, enabled: true, section: "table" },
    { id: "accomodation", label: "Accomodation", type: "textarea", placeholder: "Enter Accomodation Terms", rows: 4, enabled: true, section: "table" },
    { id: "food", label: "Food", type: "textarea", placeholder: "Enter Food Terms", rows: 4, enabled: true, section: "table" },
    { id: "transport", label: "Transport", type: "textarea", placeholder: "Enter Transport Terms", rows: 4, enabled: true, section: "table" },
    { id: "communication", label: "Communications", type: "textarea", placeholder: "Enter Communication Terms", rows: 4, enabled: true, section: "table" },
    { id: "insurance", label: "Insurance", type: "textarea", placeholder: "Enter Insurance Terms", rows: 4, enabled: true, section: "table" },
    { id: "annualLeave", label: "Annual Leave", type: "text", placeholder: "Enter Annual Leave Terms", enabled: false, section: "table" },
    { id: "gratuity", label: "Gratuity", type: "text", placeholder: "Enter Gratuity", enabled: false, section: "table" },
    { id: "leaveEncashment", label: "Leave Encashment", type: "text", placeholder: "Enter Leave Encashment Terms", enabled: false, section: "table" },
    // Paragraph section fields - fields that appear outside the table (in order of appearance in preview)
    { id: "airPassage", label: "Air Passage", type: "textarea", placeholder: "Enter Air Passage Terms", rows: 4, enabled: true, section: "paragraph" },
    { id: "sectorOfTravel", label: "Sector of Travel", type: "text", placeholder: "e.g., MUSCAT - DELHI", enabled: true, section: "paragraph" },
    { id: "classOfTravel", label: "Class of Travel", type: "text", placeholder: "e.g., Economy Class by any Airline", enabled: true, section: "paragraph" },
    { id: "visaStatus", label: "Visa Status", type: "textarea", placeholder: "Enter Visa Terms", rows: 4, enabled: true, section: "paragraph" },
    { id: "medicalTerms", label: "Medical Terms", type: "textarea", placeholder: "Enter detailed medical terms", rows: 4, enabled: true, section: "paragraph" },
    { id: "incrementTerms", label: "Increment Terms", type: "textarea", placeholder: "Enter increment terms", rows: 4, enabled: true, section: "paragraph" },
    { id: "workingHours", label: "Working Hours", type: "textarea", placeholder: "Enter Working Terms", enabled: true, section: "paragraph" },
    { id: "medical", label: "Medical", type: "textarea", placeholder: "Enter Medical Terms", rows: 4, enabled: false, section: "paragraph" },
  ];

  // Keep this map for backward compatibility when field IDs are renamed in code.
  const FIELD_ID_ALIASES: Record<string, string> = {
    // Example: oldId: "newId"
  };

  const normalizeLabel = (label?: string) =>
    (label || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const getMergedFieldConfig = (
    savedConfig?: FieldConfig[],
    passportNumberValue?: string
  ): FieldConfig[] => {
    const defaultWithFallback = defaultFieldConfig.map((field) =>
      field.id === "passportNumber" && passportNumberValue
        ? { ...field, enabled: true }
        : field
    );
    if (!savedConfig || savedConfig.length === 0) {
      return defaultWithFallback;
    }

    const defaultMap = new Map(defaultWithFallback.map((field) => [field.id, field]));
    const seenIds = new Set<string>();
    const merged: FieldConfig[] = [];

    const getResolvedId = (field: FieldConfig): string | null => {
      if (defaultMap.has(field.id)) return field.id;

      const aliasedId = FIELD_ID_ALIASES[field.id];
      if (aliasedId && defaultMap.has(aliasedId)) return aliasedId;

      const fieldKey = `${field.section}|${field.type}|${normalizeLabel(field.label)}`;
      const fallbackMatch = defaultWithFallback.find(
        (defaultField) =>
          !seenIds.has(defaultField.id) &&
          `${defaultField.section}|${defaultField.type}|${normalizeLabel(defaultField.label)}` === fieldKey
      );

      return fallbackMatch?.id || null;
    };

    savedConfig.forEach((field) => {
      const resolvedId = getResolvedId(field);

      if (!resolvedId) {
        if (!seenIds.has(field.id)) {
          merged.push(field);
          seenIds.add(field.id);
        }
        return;
      }

      if (seenIds.has(resolvedId)) {
        return;
      }

      merged.push({
        ...defaultMap.get(resolvedId),
        ...field,
        id: resolvedId,
      });
      seenIds.add(resolvedId);
    });

    defaultWithFallback.forEach((field) => {
      if (!seenIds.has(field.id)) {
        merged.push(field);
      }
    });

    return merged;
  };

  const [fieldConfig, setFieldConfig] = useState<FieldConfig[]>(defaultFieldConfig);

  // PDF generation progress
  const [pdfProgress, setPdfProgress] = useState(0);

  const [fieldConfigDialogVisible, setFieldConfigDialogVisible] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingFieldLabel, setEditingFieldLabel] = useState("");
  const [editingFieldType, setEditingFieldType] = useState<FieldType>("text");
  const [newFieldType, setNewFieldType] = useState<FieldType>("text");
  const [newFieldSection, setNewFieldSection] = useState<"table" | "paragraph">("table");
  const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(null);
  const [fieldConfigSectionsCollapsed, setFieldConfigSectionsCollapsed] = useState<{ table: boolean; paragraph: boolean }>({
    table: false,
    paragraph: false,
  });
  const [addCustomFieldDialogVisible, setAddCustomFieldDialogVisible] = useState(false);
  const fieldListScrollRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialFieldConfigLoad = useRef(true);

  // Role editor dialog state
  const [roleEditorDialogVisible, setRoleEditorDialogVisible] = useState(false);
  const [editingRoleIndex, setEditingRoleIndex] = useState<number | null>(null);
  const [editingRoleContent, setEditingRoleContent] = useState("");
  const previewScale =
    screenWidth < 960
      ? Math.min(
        1,
        Math.max(
          0.32,
          (screenWidth - PREVIEW_MOBILE_GUTTER) / PREVIEW_BASE_WIDTH
        )
      )
      : 1;
  const previewRefNo = printRefNoOverride || formData.refNo;
  const selectedTemplateMeta = FORM_TEMPLATE_OPTIONS.find(
    (template) => template.id === selectedFormTemplate
  ) || FORM_TEMPLATE_OPTIONS[0];

  // Add this after other useEffect hooks
  useEffect(() => {
    fetchPresets();
  }, []);

  // Add this new useEffect to track changes
  useEffect(() => {
    if (selectedPreset && originalPresetData) {
      const hasFormChanges =
        JSON.stringify(formData) !== JSON.stringify(originalPresetData);
      setHasChanges(hasFormChanges);
    } else {
      setHasChanges(false);
    }
  }, [formData, selectedPreset, originalPresetData]);

  // Auto-save field visibility state whenever fieldConfig changes
  useEffect(() => {
    // Skip on initial load
    if (isInitialFieldConfigLoad.current) {
      isInitialFieldConfigLoad.current = false;
      return;
    }

    // Only auto-save if we're editing an existing letter
    if (!loadedLetterId) {
      return;
    }

    const autoSaveFieldConfig = async () => {
      try {
        const letterRef = doc(db, "employee_clearance_forms", loadedLetterId);
        await updateDoc(letterRef, {
          fieldConfig: fieldConfig,
        });
        console.log("Field visibility state saved automatically");
      } catch (error) {
        console.error("Error auto-saving field config:", error);
      }
    };

    autoSaveFieldConfig();
  }, [fieldConfig, loadedLetterId]);

  const fetchPresets = async () => {
    try {
      setPresetsLoading(true);
      const q = query(
        collection(db, "employee_clearance_presets"),
        orderBy("created_at", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Preset[];
      setPresets(data);
      setPresetsLoading(false);
    } catch (err) {
      message.error("Failed to fetch presets");
      setPresetsLoading(false);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      message.error("Please enter a preset name");
      return;
    }

    try {
      setLoading(true);
      // Create a copy of formData without the date field
      const { date, ...presetData } = formData;

      const newPreset = {
        name: presetName,
        data: presetData,
        fieldConfig: fieldConfig,
        created_at: Timestamp.now(),
      };

      await addDoc(collection(db, "employee_clearance_presets"), newPreset);
      message.success("Preset saved successfully");
      setPresetDialogVisible(false);
      setPresetName("");
      fetchPresets();
    } catch (err) {
      message.error("Failed to save preset");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, "employee_clearance_presets", presetId));
      message.success("Preset deleted successfully");
      setSelectedPreset("");
      setOriginalPresetData(null);
      setHasChanges(false);
      fetchPresets();
    } catch (err) {
      message.error("Failed to delete preset");
    } finally {
      setLoading(false);
    }
  };

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

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (selectedPreset) {
      setHasChanges(true);
    }
  };

  const handleRoleChange = (
    index: number,
    field: "title" | "description",
    value: string
  ) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        roles: prev.roles.map((role, i) =>
          i === index ? { ...role, [field]: value } : role
        ),
      };
      if (originalFormData) {
        const hasChanges =
          JSON.stringify(newData) !== JSON.stringify(originalFormData);
        setHasChanges(hasChanges);
      }
      return newData;
    });
  };

  // Field configuration handlers
  const handleToggleField = (fieldId: string) => {
    setFieldConfig((prev) =>
      prev.map((field) =>
        field.id === fieldId ? { ...field, enabled: !field.enabled } : field
      )
    );
    setHasChanges(true);
  };

  const handleDragStart = (index: number) => {
    setDraggedFieldIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedFieldIndex === null || draggedFieldIndex === index) return;

    // Auto-scroll logic
    const container = fieldListScrollRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const scrollThreshold = 50; // pixels from edge to trigger scroll
      const scrollSpeed = 10;

      // Clear any existing interval
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }

      // Scroll up if near top
      if (e.clientY - rect.top < scrollThreshold && container.scrollTop > 0) {
        autoScrollIntervalRef.current = setInterval(() => {
          if (container.scrollTop > 0) {
            container.scrollTop -= scrollSpeed;
          } else {
            if (autoScrollIntervalRef.current) clearInterval(autoScrollIntervalRef.current);
          }
        }, 20);
      }
      // Scroll down if near bottom
      else if (rect.bottom - e.clientY < scrollThreshold &&
        container.scrollTop < container.scrollHeight - container.clientHeight) {
        autoScrollIntervalRef.current = setInterval(() => {
          if (container.scrollTop < container.scrollHeight - container.clientHeight) {
            container.scrollTop += scrollSpeed;
          } else {
            if (autoScrollIntervalRef.current) clearInterval(autoScrollIntervalRef.current);
          }
        }, 20);
      }
    }

    setFieldConfig((prev) => {
      const newConfig = [...prev];
      const draggedItem = newConfig[draggedFieldIndex];
      newConfig.splice(draggedFieldIndex, 1);
      newConfig.splice(index, 0, draggedItem);
      return newConfig;
    });
    setDraggedFieldIndex(index);
  };

  const handleDragEnd = () => {
    // Clear auto-scroll interval
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    setDraggedFieldIndex(null);
    setHasChanges(true);
  };

  const handleAddCustomField = () => {
    if (!newFieldName.trim()) {
      message.error("Please enter a field name");
      return;
    }

    const fieldId = newFieldName.toLowerCase().replace(/\s+/g, "_");

    // Check if field already exists
    if (fieldConfig.some((f) => f.id === fieldId)) {
      message.error("A field with this name already exists");
      return;
    }

    const newField: FieldConfig = {
      id: fieldId,
      label: newFieldName,
      type: newFieldType,
      placeholder: `Enter ${newFieldName}`,
      rows: newFieldType === "textarea" ? 4 : undefined,
      enabled: true,
      isCustom: true,
      section: newFieldSection,
    };

    setFieldConfig((prev) => [...prev, newField]);
    setFormData((prev) => ({
      ...prev,
      customFields: { ...prev.customFields, [fieldId]: "" },
    }));

    setNewFieldName("");
    setNewFieldType("text");
    setNewFieldSection("table");
    message.success("Custom field added");
    setHasChanges(true);
  };

  const handleRemoveCustomField = (fieldId: string) => {
    setFieldConfig((prev) => prev.filter((f) => f.id !== fieldId));
    setFormData((prev) => {
      const { [fieldId]: removed, ...rest } = prev.customFields || {};
      return { ...prev, customFields: rest };
    });
    setHasChanges(true);
    message.success("Custom field removed");
  };

  const handleStartEditFieldLabel = (
    fieldId: string,
    currentLabel: string,
    currentType: FieldType
  ) => {
    setEditingFieldId(fieldId);
    setEditingFieldLabel(currentLabel);
    setEditingFieldType(currentType);
  };

  const handleSaveFieldLabel = () => {
    if (!editingFieldId || !editingFieldLabel.trim()) {
      setEditingFieldId(null);
      setEditingFieldLabel("");
      setEditingFieldType("text");
      return;
    }

    setFieldConfig((prev) =>
      prev.map((field) =>
        field.id === editingFieldId
          ? {
            ...field,
            label: editingFieldLabel.trim(),
            type: editingFieldType,
            rows: editingFieldType === "textarea" ? field.rows ?? 4 : undefined,
          }
          : field
      )
    );
    setEditingFieldId(null);
    setEditingFieldLabel("");
    setEditingFieldType("text");
  };

  const handleCancelEditFieldLabel = () => {
    setEditingFieldId(null);
    setEditingFieldLabel("");
    setEditingFieldType("text");
  };

  const fetchOfferLetters = async () => {
    if (offerLettersCache.length > 0) {
      setOfferLetters(offerLettersCache);
      if (!formData.refNo) {
        const nextRef = getNextReferenceNumber(offerLettersCache);
        setFormData(prev => ({ ...prev, refNo: nextRef }));
      }
    }

    setOfferLettersLoading(true);
    try {
      const q = query(
        collection(db, "employee_clearance_forms"),
        orderBy("generated_at", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      if (!formData.refNo) {
        const nextRef = getNextReferenceNumber(
          data.map((letter: any) => ({ refNo: letter.refNo }))
        );
        setFormData(prev => ({ ...prev, refNo: nextRef }));
      }

      const mergedLetters = [...data];
      offerLettersCache.forEach((cachedLetter) => {
        if (!mergedLetters.some((letter) => letter.id === cachedLetter.id)) {
          mergedLetters.push(cachedLetter);
        }
      });

      setOfferLetters(mergedLetters);
      setOfferLettersCache(mergedLetters);
    } catch (err) {
      message.error("Failed to fetch clearance forms");
    } finally {
      setOfferLettersLoading(false);
    }
  };

  // Helper function to clean undefined values from data before saving to Firestore
  const cleanDataForFirestore = (data: any) => {
    const cleaned: any = {};
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        cleaned[key] = data[key];
      }
    });
    return cleaned;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate required fields
      if (!formData.candidateName || !formData.position) {
        message.error(
          "Please fill in the required fields (Candidate Name and Position)"
        );
        setSaving(false);
        return;
      }

      // Get a fresh reference number for the new letter
      const nextRef = getNextReferenceNumber(offerLetters);

      const newLetter = cleanDataForFirestore({
        ...formData,
        refNo: nextRef,  // Use the new reference number
        fieldConfig: fieldConfig,
        air_passage: air_passage,
        comm: comm,
        visaS: visaS,
        joiningDate: joiningDate,
        generated_at: Timestamp.now(),
        generated_by: auth.currentUser?.email || null,
      });

      console.log("Attempting to save letter:", newLetter);

      // Always create a new document, regardless of loadedLetterId
      const docRef = await addDoc(collection(db, "employee_clearance_forms"), newLetter);
      console.log("Document saved with ID:", docRef.id);

      const savedLetter = { id: docRef.id, ...newLetter };

      // Update cache with new letter
      const updatedCache = [savedLetter, ...offerLettersCache];
      setOfferLettersCache(updatedCache);
      setOfferLetters(updatedCache);

      message.success(`Clearance form saved successfully with reference number: ${nextRef}`);

      // Reset form state after saving
      setLoadedLetterId(docRef.id);
      setHasChanges(false);
      setOriginalFormData(null);
    } catch (error) {
      console.error("Error saving clearance form:", error);
      message.error(
        error instanceof Error ? error.message : "Failed to save clearance form"
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePrintPDF = async () => {
    setPdfLoading(true);
    setPdfProgress(0);
    const nextRef = getNextReferenceNumber([
      ...offerLetters.map((letter: any) => ({ refNo: letter.refNo })),
      ...(formData.refNo ? [{ refNo: formData.refNo }] : []),
    ]);
    setPrintRefNoOverride(nextRef);

    const offscreen = document.createElement("div");
    offscreen.style.cssText =
      `position:fixed;top:0;left:-${PREVIEW_BASE_WIDTH + 100}px;` +
      `width:${PREVIEW_BASE_WIDTH}px;opacity:0;pointer-events:none;z-index:-9999;overflow:visible;`;
    document.body.appendChild(offscreen);

    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      const tableNode = tableRef.current;
      if (!tableNode) {
        message.error("Failed to generate PDF: missing preview section");
        return;
      }

      const tableClone = tableNode.cloneNode(true) as HTMLElement;
      tableClone.style.transform = "none";
      tableClone.style.position = "relative";
      tableClone.style.width = `${PREVIEW_BASE_WIDTH}px`;
      tableClone.style.maxWidth = `${PREVIEW_BASE_WIDTH}px`;
      offscreen.appendChild(tableClone);

      setPdfProgress(35);
      const tableCanvas = await html2canvas(tableClone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: null,
        windowWidth: PREVIEW_BASE_WIDTH,
      });

      const tableImgData = tableCanvas.toDataURL("image/jpeg", 0.9);
      const pdf = new jsPDF({ unit: "px", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const tableProps = pdf.getImageProperties(tableImgData);
      const tableHeight = (tableProps.height * pageWidth) / tableProps.width;

      pdf.addImage(tableImgData, "JPEG", 0, 0, pageWidth, tableHeight, undefined, "FAST");
      setPdfProgress(90);

      pdf.save(`${selectedTemplateMeta.fileName}_${nextRef.replace(/[\/]/g, "-")}.pdf`);
      setFormData((prev) => ({ ...prev, refNo: nextRef }));
      setPdfProgress(100);
    } catch (err) {
      message.error("Failed to generate PDF");
    } finally {
      if (offscreen.parentNode) {
        offscreen.parentNode.removeChild(offscreen);
      }
      setPrintRefNoOverride(null);
      setPdfLoading(false);
      setTimeout(() => setPdfProgress(0), 500);
    }
  };

  const handleEditLetter = async () => {
    if (!editingLetter?.id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "employee_clearance_forms", editingLetter.id), cleanDataForFirestore({
        ...editingLetter,
        updated_at: Timestamp.now(),
      }));
      message.success("Clearance form updated");
      setEditDialogVisible(false);
      fetchOfferLetters();
    } catch (err) {
      message.error("Failed to update clearance form");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLetter = async (id: string) => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "employee_clearance_forms", id));

      // Update cache by removing deleted letter
      const updatedCache = offerLettersCache.filter(
        (letter) => letter.id !== id
      );
      setOfferLettersCache(updatedCache);
      setOfferLetters(updatedCache);

      message.success("Clearance form deleted");
    } catch (err) {
      message.error("Failed to delete clearance form");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!loadedLetterId) return;

    try {
      setSaving(true);
      const letterRef = doc(db, "employee_clearance_forms", loadedLetterId);

      // Create a copy of formData without the date field for the preset
      const { date, ...presetData } = formData;

      await updateDoc(letterRef, cleanDataForFirestore({
        ...presetData,
        fieldConfig: fieldConfig,
        air_passage: air_passage,
        comm: comm,
        visaS: visaS,
        joiningDate: joiningDate,
        generated_at: Timestamp.now(),
        generated_by: auth.currentUser?.email || null,
      }));

      // Update the original form data to match the new state
      setOriginalFormData({
        ...formData,
        air_passage: air_passage,
        comm: comm,
        visaS: visaS,
        joiningDate: joiningDate,
      });

      setHasChanges(false);
      message.success("Clearance form updated successfully");

      // Refresh the clearance forms list
      fetchOfferLetters();
    } catch (error) {
      console.error("Error updating clearance form:", error);
      message.error("Failed to update clearance form");
    } finally {
      setSaving(false);
    }
  };

  const handleLetterClick = (ol: any) => {
    setFormData({
      date: ol.date,
      refNo: ol.refNo,
      candidateName: ol.candidateName,
      passportNumber: ol.passportNumber,
      position: ol.position,
      workLocation: ol.workLocation,
      salary: ol.salary,
      allowance: ol.allowance,
      grossSalary: ol.grossSalary,
      attendance: ol.attendance,
      probation: ol.probation,
      reportingDate: ol.reportingDate,
      resignationDate: ol.resignationDate || "",
      relievingDate: ol.relievingDate || "",
      employeeRemarks: ol.employeeRemarks || "",
      contractPeriod: ol.contractPeriod,
      noticePeriod: ol.noticePeriod,
      noticePeriodSubsections: ol.noticePeriodSubsections,
      accomodation: ol.accomodation,
      food: ol.food,
      transport: ol.transport,
      visaStatus: ol.visaStatus,
      communication: ol.communication,
      medical: ol.medical,
      insurance: ol.insurance,
      annualLeave: ol.annualLeave,
      gratuity: ol.gratuity,
      leaveEncashment: ol.leaveEncashment,
      workingHours: ol.workingHours,
      airPassage: ol.airPassage,
      sectorOfTravel: ol.sectorOfTravel || "",
      classOfTravel: ol.classOfTravel || "",
      medicalTerms: ol.medicalTerms || "",
      incrementTerms: ol.incrementTerms || "",
      roles: ol.roles,
      allowances: ol.allowances,
    });
    setAirPassage(ol.air_passage);
    setComm(ol.comm);
    setVisaS(ol.visaS);
    setJoiningDate(ol.joiningDate);
    setFieldConfig(getMergedFieldConfig(ol.fieldConfig, ol.passportNumber));
    isInitialFieldConfigLoad.current = true; // Reset flag so next changes will be auto-saved
    setOriginalFormData(ol);
    setLoadedLetterId(ol.id);
    // Reset preset related states
    setSelectedPreset("");
    setOriginalPresetData(null);
    setHasChanges(false);
  };

  // const handleAddToShortlist = async () => {
  //   if (selectedLetters.length === 0) return;

  //   setAddingToShortlist(true);
  //   try {
  //     const batch = writeBatch(db);

  //     for (const id of selectedLetters) {
  //       const letter = offerLetters.find(ol => ol.id === id);
  //       if (!letter) continue;

  //       batch.set(doc(collection(db, "shortlist")), {
  //         candidateName: letter.candidateName,
  //         position: letter.position,
  //         salary: letter.salary,
  //         created_at: Timestamp.now(),
  //         created_by: auth.currentUser?.email,
  //         source: "Employee Clearance Form",
  //         referenceNo: letter.refNo
  //       });
  //     }

  //     await batch.commit();
  //     message.success("Added to shortlist successfully");
  //     setSelectedLetters([]); // Clear selection
  //     setOfferLettersDrawerVisible(false); // Close drawer
  //   } catch (error) {
  //     console.error("Error adding to shortlist:", error);
  //     message.error("Failed to add to shortlist");
  //   } finally {
  //     setAddingToShortlist(false);
  //   }
  // };

  const handleClearForm = () => {
    const currentDate = new Date().toLocaleDateString();
    // Get the next reference number
    const nextRef = getNextReferenceNumber(offerLetters);
    setFormData({
      date: currentDate,
      refNo: nextRef,
      candidateName: "",
      passportNumber: "",
      position: "",
      workLocation: "",
      salary: "",
      allowance: "",
      grossSalary: "",
      attendance: "",
      probation: "",
      reportingDate: "",
      resignationDate: "",
      relievingDate: "",
      employeeRemarks: "",
      contractPeriod: "",
      noticePeriod: "",
      noticePeriodSubsections: [""],
      accomodation: "",
      food: "",
      transport: "",
      visaStatus: "",
      communication: "",
      medical: "",
      insurance: "",
      annualLeave: "",
      gratuity: "",
      leaveEncashment: "",
      workingHours: "",
      airPassage: "",
      sectorOfTravel: "",
      classOfTravel: "",
      medicalTerms: "",
      incrementTerms: "",
      roles: [{ title: "", description: "" }],
      allowances: [{ title: "", description: "" }],
      customFields: {},
    });
    setSelectedPreset("");
    setOriginalPresetData(null);
    setHasChanges(false);
    setLoadedLetterId(null);
    setOriginalFormData(null);
    setFieldConfig(defaultFieldConfig);
    isInitialFieldConfigLoad.current = true; // Reset flag for new letter
  };

  const renderFieldConfigItem = (field: FieldConfig, index: number) => (
    <motion.div
      key={field.id}
      draggable
      onDragStart={() => handleDragStart(index)}
      onDragOver={(e) => handleDragOver(e, index)}
      onDragEnd={handleDragEnd}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.4rem",
        padding: "0.5rem 0.6rem",
        background: draggedFieldIndex === index
          ? "rgba(0 0 139/ 10%)"
          : field.enabled
            ? "rgba(255 255 255/ 90%)"
            : "rgba(15 23 42/ 3%)",
        borderRadius: "0.5rem",
        border: `1px solid ${draggedFieldIndex === index
          ? "rgba(0 0 139/ 30%)"
          : field.enabled
            ? "rgba(15 23 42/ 12%)"
            : "rgba(15 23 42/ 8%)"
          }`,
        opacity: draggedFieldIndex === index ? 0.6 : field.enabled ? 1 : 0.6,
        cursor: "grab",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: 0 }}>
        <div
          style={{
            cursor: "grab",
            display: "flex",
            alignItems: "center",
            color: "rgba(0 0 139/ 55%)",
            flexShrink: 0,
          }}
          title="Drag to reorder"
        >
          <GripVertical width="0.85rem" />
        </div>

        <button
          onClick={() => handleToggleField(field.id)}
          title={field.enabled ? "Hide this field" : "Show this field"}
          style={{
            width: "2.35rem",
            height: "2.35rem",
            borderRadius: "0.7rem",
            border: "1px solid rgba(15 23 42/ 14%)",
            background: field.enabled ? "rgba(0 0 139/ 8%)" : "rgba(15 23 42/ 4%)",
            color: field.enabled ? "darkblue" : "rgba(15 23 42/ 55%)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginRight: "0.35rem",
          }}
        >
          {field.enabled ? <Eye width="1.35rem" /> : <EyeOff width="1.35rem" />}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          {editingFieldId === field.id ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <input
                type="text"
                value={editingFieldLabel}
                onChange={(e) => setEditingFieldLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveFieldLabel();
                  if (e.key === "Escape") handleCancelEditFieldLabel();
                }}
                autoFocus
                style={{
                  flex: 1,
                  minWidth: "100px",
                  padding: "0.3rem 0.5rem",
                  borderRadius: "0.4rem",
                  border: "1px solid rgba(0 0 139/ 40%)",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                }}
              />
              <select
                value={editingFieldType}
                onChange={(e) => setEditingFieldType(e.target.value as FieldType)}
                style={{
                  width: "6.25rem",
                  padding: "0.3rem 0.35rem",
                  borderRadius: "0.4rem",
                  border: "1px solid rgba(0 0 139/ 28%)",
                  fontSize: "0.72rem",
                  background: "rgba(255 255 255/ 96%)",
                  color: "rgba(15 23 42/ 90%)",
                }}
                title="Field type"
              >
                <option value="text">text</option>
                <option value="textarea">textarea</option>
                <option value="number">number</option>
                <option value="date">date</option>
              </select>
              <button
                onClick={handleSaveFieldLabel}
                style={{
                  background: "rgba(16 185 129/ 12%)",
                  // border: "1px solid rgba(16 185 129/ 35%)",
                  color: "#047857",
                  cursor: "pointer",
                  padding: "0.22rem",
                  borderRadius: "0.35rem",
                  display: "flex",
                  alignItems: "center",
                  flexShrink: 0,
                  width: "2rem",
                }}
                title="Save"
              >
                <Check width="0.75rem" />
              </button>
              <button
                onClick={handleCancelEditFieldLabel}
                style={{
                  background: "rgba(239 68 68/ 10%)",
                  // border: "1px solid rgba(239 68 68/ 35%)",
                  color: "#b91c1c",
                  cursor: "pointer",
                  padding: "0.22rem",
                  borderRadius: "0.35rem",
                  display: "flex",
                  alignItems: "center",
                  flexShrink: 0,
                  width: "2rem",
                }}
                title="Cancel"
              >
                <X width="0.75rem" />
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", overflow: "hidden" }}>
                <div style={{ fontWeight: 500, fontSize: "0.82rem", color: "rgba(15 23 42/ 92%)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {field.label}
                </div>
                {field.isCustom && (
                  <span
                    style={{
                      fontSize: "0.6rem",
                      color: "darkblue",
                      background: "rgba(0 0 139/ 8%)",
                      border: "1px solid rgba(0 0 139/ 20%)",
                      padding: "0.08rem 0.3rem",
                      borderRadius: "999px",
                      flexShrink: 0,
                    }}
                  >
                    Custom
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "rgba(15 23 42/ 55%)",
                  marginTop: "0.1rem",
                }}
              >
                {field.type}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0 }}>
        {editingFieldId !== field.id && !field.isCustom && (
          <button
            onClick={() => handleStartEditFieldLabel(field.id, field.label, field.type)}
            style={{
              background: "rgba(15 23 42/ 4%)",
              border: "1px solid rgba(15 23 42/ 12%)",
              color: "rgba(15 23 42/ 75%)",
              cursor: "pointer",
              width: "2.05rem",
              height: "2.05rem",
              borderRadius: "0.68rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            title="Edit field"
          >
            <Pencil width="1.1rem" />
          </button>
        )}
        {field.isCustom && (
          <button
            onClick={() => handleRemoveCustomField(field.id)}
            style={{
              background: "rgba(220 38 38/ 8%)",
              border: "1px solid rgba(220 38 38/ 20%)",
              color: "#b91c1c",
              cursor: "pointer",
              padding: "0.22rem 0.35rem",
              borderRadius: "0.35rem",
              fontSize: "0.65rem",
              display: "flex",
              alignItems: "center",
              gap: "0.15rem",
              flexShrink: 0,
            }}
          >
            <Trash2 width="0.65rem" />
          </button>
        )}
      </div>
    </motion.div>
  );

  const renderFieldConfigSection = (
    section: "table" | "paragraph",
    title: string,
    icon: React.ReactNode
  ) => {
    const sectionFields = fieldConfig.filter((f) => f.section === section);
    const activeCount = sectionFields.filter((f) => f.enabled).length;
    const isCollapsed = fieldConfigSectionsCollapsed[section];

    return (
      <div
        style={{
          border: "1px solid rgba(15 23 42/ 10%)",
          borderRadius: "0.75rem",
          background: "rgba(255 255 255/ 88%)",
          padding: "0.75rem",
        }}
      >
        <button
          onClick={() =>
            setFieldConfigSectionsCollapsed((prev) => ({
              ...prev,
              [section]: !prev[section],
            }))
          }
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: isCollapsed ? 0 : "0.75rem",
            paddingBottom: "0.5rem",
            borderBottom: "1px solid rgba(15 23 42/ 10%)",
            width: "100%",
            background: "transparent",
            borderLeft: "none",
            borderRight: "none",
            borderTop: "none",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          {icon}
          <h4 style={{ fontSize: "0.9rem", fontWeight: 600, margin: 0, color: "rgba(15 23 42/ 85%)" }}>
            {title}
          </h4>
          <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "rgba(15 23 42/ 55%)" }}>
            {activeCount}/{sectionFields.length} active
          </span>
          <span style={{ display: "flex", alignItems: "center", color: "rgba(15 23 42/ 60%)" }}>
            {isCollapsed ? <ChevronRight width="0.95rem" /> : <ChevronDown width="0.95rem" />}
          </span>
        </button>

        {!isCollapsed && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {sectionFields.map((field) => renderFieldConfigItem(field, fieldConfig.indexOf(field)))}
          </div>
        )}
      </div>
    );
  };

  const handleFieldConfigDialogChange = (open: boolean) => {
    setFieldConfigDialogVisible(open);
  };

  const renderInputForm = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        fontSize: "0.8rem",
        width: "100%",
        border: "1px solid rgba(100 116 139/ 22%)",
        borderRadius: "1rem",
        background: "linear-gradient(180deg, rgba(248 250 252/ 95%), rgba(241 245 249/ 90%))",
        boxShadow: "0 16px 35px rgba(15 23 42/ 10%)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(100 116 139/ 15%)",
        }}
      >
        <h2>Forms</h2>
        <button
          onClick={handleClearForm}
          style={{
            background: "rgba(100 100 100/ 10%)",
            padding: "0.15rem 0.75rem",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.75rem",
            borderRadius: "0.5rem",
          }}
        >
          <FileX color="indianred" width="0.9rem" />
          Clear Form
        </button>
      </div>

      <div
        style={{
          padding: "1.25rem",
          paddingBottom: "1.5rem",
          paddingTop: "1.5rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "0.75rem 1rem",
        }}
      >
        {/* Reference Number */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "rgba(0 0 0/ 75%)" }}>Reference Number</label>
          <input
            type="text"
            name="refNo"
            value={formData.refNo}
            onChange={handleInputChange}
            placeholder="Enter Reference Number"
            style={inputStyle}
          />
        </div>

        {/* Employee Name */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "rgba(0 0 0/ 75%)" }}>Employee Name</label>
          <input
            type="text"
            name="candidateName"
            value={formData.candidateName}
            onChange={handleInputChange}
            placeholder="Enter employee name"
            style={inputStyle}
          />
        </div>

        {/* Designation */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "rgba(0 0 0/ 75%)" }}>Designation</label>
          <input
            type="text"
            name="position"
            value={formData.position}
            onChange={handleInputChange}
            placeholder="Enter designation"
            style={inputStyle}
          />
        </div>

        {/* Joining Date */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "rgba(0 0 0/ 75%)" }}>Joining Date</label>
          <input
            type="date"
            name="reportingDate"
            value={formData.reportingDate}
            onChange={handleInputChange}
            style={{ ...inputStyle, colorScheme: "light" }}
          />
        </div>

        {/* Resignation / Termination Date */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "rgba(0 0 0/ 75%)" }}>Resignation / Termination Date</label>
          <input
            type="date"
            name="resignationDate"
            value={formData.resignationDate}
            onChange={handleInputChange}
            style={{ ...inputStyle, colorScheme: "light" }}
          />
        </div>

        {/* Relieving Date */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "rgba(0 0 0/ 75%)" }}>Relieving Date</label>
          <input
            type="date"
            name="relievingDate"
            value={formData.relievingDate}
            onChange={handleInputChange}
            style={{ ...inputStyle, colorScheme: "light" }}
          />
        </div>

        {/* Employee Remarks */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "rgba(0 0 0/ 75%)" }}>Employee Remarks</label>
          <textarea
            name="employeeRemarks"
            value={formData.employeeRemarks}
            onChange={handleInputChange}
            rows={3}
            placeholder="Any remarks from the employee..."
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
          />
        </div>
      </div>
    </div>
  );

  const renderDocumentMetaTable = () => {
    const metaCellStyle: React.CSSProperties = {
      borderRight: "1.5px solid rgba(0 0 0/ 85%)",
      borderBottom: "1.5px solid rgba(0 0 0/ 85%)",
      padding: "3px 7px 7px 7px",
      paddingBottom: "1rem",
      fontSize: "0.68rem",
      fontWeight: 600,
      textTransform: "uppercase",
      minHeight: "1.9rem",
      display: "flex",
      alignItems: "center",
      gap: "0.35rem",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      justifyContent: "center",
    };

    return (
      <div
        style={{
          width: "100%",
          marginBottom: "0.55rem",

          display: "grid",
          gridTemplateColumns: "1fr 0.4fr 1.2fr 1.4fr 1.2fr",
          borderTop: "1.5px solid rgba(0 0 0/ 85%)",
          borderLeft: "1.5px solid rgba(0 0 0/ 85%)",

        }}
      >
        <div style={metaCellStyle}>DOC NO: {employeeClearanceDocNo}</div>
        <div style={metaCellStyle}>REV: {employeeClearanceRevision}</div>
        <div style={metaCellStyle}>DOC DATE: {todayDisplayDate}</div>
        <div style={metaCellStyle}>REF NO: {previewRefNo || "[REF NO]"}</div>
        <div style={metaCellStyle}>REF DATE: {todayDisplayDate}</div>
      </div>
    );
  };

  const renderEmployeeClearanceBody = () => (
    <>
      {renderDocumentMetaTable()}

      <h2
        style={{
          textAlign: "center",
          fontSize: "0.78rem",
          marginBottom: "1rem",
          textTransform: "uppercase",
          letterSpacing: 1,
          fontWeight: 600,
        }}
      >
        EMPLOYEE CLEARANCE FORM
      </h2>

      {(() => {
        const cellStyle: React.CSSProperties = {
          borderRight: "1.5px solid rgba(0 0 0/ 85%)",
          borderBottom: "1.5px solid rgba(0 0 0/ 85%)",
          padding: "3px 8px 8px 8px",
          fontSize: "0.75rem",
          fontWeight: 500,
        };
        return (
          <div
            style={{
              textTransform: "uppercase",
              width: "100%",
              marginBottom: "0.4rem",
              display: "grid",
              gridTemplateColumns: "35% 1fr",
              borderTop: "1.5px solid rgba(0 0 0/ 85%)",
              fontSize: "0.68rem",
              borderLeft: "1.5px solid rgba(0 0 0/ 85%)",
            }}
          >
            <div style={cellStyle}>Name</div>
            <div style={cellStyle}></div>
            <div style={cellStyle}>Designation & Employee Code</div>
            <div style={cellStyle}></div>
            <div style={cellStyle}>Joining Date</div>
            <div style={cellStyle}></div>
            <div style={cellStyle}>Resignation/Termination Date</div>
            <div style={cellStyle}></div>
            <div style={cellStyle}>Relieving Date</div>
            <div style={cellStyle}></div>
          </div>
        );
      })()}

      <p style={{ marginBottom: "0.8rem", marginTop: "0.4rem", fontSize: "0.73rem", fontWeight: 500 }}>
        The following authorities of each department shall make sure and sign that employee has returned everything that belongs to each department.
      </p>

      {(() => {
        const cellStyle: React.CSSProperties = {
          borderRight: "1.5px solid rgba(0 0 0/ 85%)",
          borderBottom: "1.5px solid rgba(0 0 0/ 85%)",
          padding: "3px 8px 8px 8px",
          fontSize: "0.73rem",
          fontWeight: 500,
        };
        const headerCellStyle: React.CSSProperties = { ...cellStyle, fontWeight: 600, fontSize: "0.68rem" };
        return (
          <div
            style={{
              width: "100%",
              marginBottom: "0.4rem",
              display: "grid",
              gridTemplateColumns: "40% 20% 20% 20%",
              borderTop: "1.5px solid rgba(0 0 0/ 85%)",
              borderLeft: "1.5px solid rgba(0 0 0/ 85%)",
              textTransform: "uppercase",
            }}
          >
            <div style={headerCellStyle}>Department</div>
            <div style={headerCellStyle}>Name</div>
            <div style={headerCellStyle}>Signature & Date</div>
            <div style={headerCellStyle}>Notes</div>
            {clearanceDepartmentRows.map((department) => (
              <React.Fragment key={department}>
                <div style={cellStyle}>{department}</div>
                <div style={cellStyle}></div>
                <div style={cellStyle}></div>
                <div style={cellStyle}></div>
              </React.Fragment>
            ))}
          </div>
        );
      })()}

      <div style={{ marginBottom: "0.9rem" }}>
        <p style={{ fontWeight: 600, marginBottom: "0.35rem" }}>Address of employee for correspondence</p>
        <div style={{ ...tableCellStyle, minHeight: "3rem" }}></div>
      </div>

      <div style={{ marginTop: "0.4rem" }}>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.73rem" }}>Employee acknowledgment</p>
        <div
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderTop: "1.5px solid rgba(0 0 0/ 85%)",
            borderLeft: "1.5px solid rgba(0 0 0/ 85%)",
            fontWeight: 500,
            color: "black",
          }}
        >
          {["Signature of employee", "Date"].map((label) => (
            <div
              key={label}
              style={{
                borderRight: "1.5px solid rgba(0 0 0/ 85%)",
                borderBottom: "1.5px solid rgba(0 0 0/ 85%)",
                padding: "3px 8px 8px 8px",
                fontSize: "0.73rem",
                fontWeight: 500,
                textTransform: "uppercase",
                minHeight: "2.5rem",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "0.4rem" }}>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.73rem" }}>Employee remarks</p>
        <div
          style={{
            width: "100%",
            border: "1.5px solid rgba(0 0 0/ 85%)",
            minHeight: "4rem",
            padding: "5px 8px",
            fontSize: "0.73rem",
            fontWeight: 500,
          }}
        ></div>
      </div>
    </>
  );

  const renderLeaveApplicationBody = () => {
    const cellStyle: React.CSSProperties = {
      borderRight: "1.5px solid rgba(0 0 0/ 85%)",
      borderBottom: "1.5px solid rgba(0 0 0/ 85%)",
      padding: "4px 8px 8px 8px",
      fontSize: "0.73rem",
      fontWeight: 500,
      minHeight: "2.4rem",
      textTransform: "uppercase",
    };

    return (
      <>
        {renderDocumentMetaTable()}
        <h2 style={{ textAlign: "center", fontSize: "0.84rem", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
          Leave Application Form
        </h2>
        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "35% 1fr", borderTop: "1.5px solid rgba(0 0 0/ 85%)", borderLeft: "1.5px solid rgba(0 0 0/ 85%)", marginBottom: "0.9rem" }}>
          {[
            "Employee Name",
            "Employee Code",
            "Department",
            "Leave Type",
            "From Date",
            "To Date",
            "Total Days",
            "Contact During Leave",
          ].map((label) => (
            <React.Fragment key={label}>
              <div style={cellStyle}>{label}</div>
              <div style={cellStyle}></div>
            </React.Fragment>
          ))}
        </div>
        <div style={{ marginBottom: "0.9rem" }}>
          <p style={{ fontWeight: 600, marginBottom: "0.35rem", textTransform: "uppercase" }}>Reason for leave</p>
          <div style={{ border: "1.5px solid rgba(0 0 0/ 85%)", minHeight: "8rem" }}></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem", marginTop: "2rem" }}>
          <div>
            <div style={{ borderTop: "1.5px solid rgba(0 0 0/ 85%)", paddingTop: "0.3rem", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 600 }}>Employee Signature</div>
          </div>
          <div>
            <div style={{ borderTop: "1.5px solid rgba(0 0 0/ 85%)", paddingTop: "0.3rem", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 600 }}>Date</div>
          </div>
          <div>
            <div style={{ borderTop: "1.5px solid rgba(0 0 0/ 85%)", paddingTop: "0.3rem", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 600 }}>Department Head Approval</div>
          </div>
          <div>
            <div style={{ borderTop: "1.5px solid rgba(0 0 0/ 85%)", paddingTop: "0.3rem", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 600 }}>HR Approval</div>
          </div>
        </div>
      </>
    );
  };

  const renderSalaryAdvanceBody = () => {
    const cellStyle: React.CSSProperties = {
      borderRight: "1.5px solid rgba(0 0 0/ 85%)",
      borderBottom: "1.5px solid rgba(0 0 0/ 85%)",
      padding: "4px 8px 8px 8px",
      fontSize: "0.73rem",
      fontWeight: 500,
      minHeight: "2.4rem",
      textTransform: "uppercase",
    };

    return (
      <>
        {renderDocumentMetaTable()}
        <h2 style={{ textAlign: "center", fontSize: "0.84rem", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
          Salary Advance Form
        </h2>
        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "35% 1fr", borderTop: "1.5px solid rgba(0 0 0/ 85%)", borderLeft: "1.5px solid rgba(0 0 0/ 85%)", marginBottom: "0.9rem" }}>
          {[
            "Employee Name",
            "Employee Code",
            "Designation",
            "Department",
            "Requested Amount",
            "Repayment Month",
          ].map((label) => (
            <React.Fragment key={label}>
              <div style={cellStyle}>{label}</div>
              <div style={cellStyle}></div>
            </React.Fragment>
          ))}
        </div>
        <div style={{ marginBottom: "0.9rem" }}>
          <p style={{ fontWeight: 600, marginBottom: "0.35rem", textTransform: "uppercase" }}>Reason for salary advance</p>
          <div style={{ border: "1.5px solid rgba(0 0 0/ 85%)", minHeight: "8rem" }}></div>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ fontWeight: 600, marginBottom: "0.35rem", textTransform: "uppercase" }}>Employee declaration</p>
          <div style={{ border: "1.5px solid rgba(0 0 0/ 85%)", minHeight: "5.5rem", padding: "0.6rem", fontSize: "0.73rem" }}>
            I confirm that the above request is correct and I agree to the approved recovery arrangement.
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.9rem", marginTop: "2rem" }}>
          <div><div style={{ borderTop: "1.5px solid rgba(0 0 0/ 85%)", paddingTop: "0.3rem", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 600 }}>Employee Signature</div></div>
          <div><div style={{ borderTop: "1.5px solid rgba(0 0 0/ 85%)", paddingTop: "0.3rem", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 600 }}>Manager Approval</div></div>
          <div><div style={{ borderTop: "1.5px solid rgba(0 0 0/ 85%)", paddingTop: "0.3rem", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 600 }}>Finance Approval</div></div>
        </div>
      </>
    );
  };

  const renderSelectedFormBody = () => {
    switch (selectedFormTemplate) {
      case "leave_application":
        return renderLeaveApplicationBody();
      case "salary_advance":
        return renderSalaryAdvanceBody();
      default:
        return renderEmployeeClearanceBody();
    }
  };

  const renderPreview = () => (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", justifyContent: "center", flexWrap: "wrap", width: "100%", maxWidth: `${PREVIEW_BASE_WIDTH}px` }}>
        <Select value={selectedFormTemplate} onValueChange={(value: FormTemplateId) => setSelectedFormTemplate(value)}>
          <SelectTrigger style={{ width: "15rem", background: "rgba(255 255 255/ 95%)" }}>
            <SelectValue placeholder="Select form" />
          </SelectTrigger>
          <SelectContent style={{}}>
            {FORM_TEMPLATE_OPTIONS.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        style={{


          width: PREVIEW_BASE_WIDTH * previewScale,
          height: 1100 * previewScale,
          margin: "0 auto 4rem",
        }}
      >
        <div
          ref={tableRef}
          style={{

            width: `${PREVIEW_BASE_WIDTH}px`,
            maxWidth: `${PREVIEW_BASE_WIDTH}px`,
            boxSizing: "border-box",
            padding: "4rem",
            backgroundColor: "white",
            background: "url(/letter-head.png)",
            backgroundSize: "contain",
            backgroundPosition: "center",
            color: "black",
            boxShadow: "0 0 10px rgba(0 0 0/ 10%)",
            fontFamily: "Aptos",
            fontSize: "0.73rem",
            height: "1100px",
            maxHeight: "1100px",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            transform: `scale(${previewScale})`,
            transformOrigin: "top left",
          }}
        >
          <br /><br /><br /><br /><br />
          <div style={{ flex: 1, overflowY: "hidden", overflowX: "hidden" }}>
            {renderSelectedFormBody()}
          </div>

        </div>
      </div>
    </div>
  );

  const handleRenamePreset = async (newName: string) => {
    if (!selectedPreset) return;

    try {
      setPresetsLoading(true);
      await updateDoc(doc(db, "employee_clearance_presets", selectedPreset), {
        name: newName,
      });
      message.success("Preset renamed successfully");
      fetchPresets();
    } catch (err) {
      message.error("Failed to rename preset");
    } finally {
      setPresetsLoading(false);
    }
  };

  void handleSave;
  void handleDeleteLetter;
  void handleSaveChanges;
  void handleLetterClick;
  void renderInputForm;

  return (
    <>
      {/* <div style={{border:"", display:"flex", alignItems:"center", justifyContent:'center'}}>
        <ConfettiExplosion/>
        </div> */}
      <div
        style={{
          padding: "",
          background: "rgba(100 100 100/ 8%)",
          // background:
          //   "linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%))",
          height: "100svh",
          overflowY: "scroll",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(100 100 100/ 40%) transparent",
        }}
      >
        <motion.div>
          <Back
            blurBG
            fixed
            // title={
            //   loadedLetterId && (
            //     <div
            //       style={{
            //         display: "flex",
            //         alignItems: "center",
            //         gap: "0.5rem",
            //         fontSize: "0.9rem",
            //       }}
            //     >
            //       {saving ? (
            //         <LoaderCircle className="animate-spin" width={"1rem"} />
            //       ) : (
            //         <Database width={"1rem"} color="darkblue" />
            //       )}
            //       <p>{loadedLetterId}</p>
            //     </div>
            //   )
            // }
            // title="Doc"
            // icon={<File color="darkblue" />}
            // subtitle={
            //   formData.position && (
            //     <p style={{ textTransform: "uppercase" }}>
            //       {formData.position}
            //     </p>
            //   )
            // }

            extra={
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  border: "",
                  height: "2.75rem",
                }}
              >
                <button
                  onClick={handlePrintPDF}
                  style={{
                    width: "100%",
                    fontSize: "0.9rem",
                    padding: "0.5rem 1rem",
                    background: pdfLoading
                      ? "linear-gradient(145deg, rgba(21, 12, 112, 0.94), rgba(24, 12, 125, 0.9) 45%, rgba(13, 7, 88, 0.95))"
                      : "linear-gradient(145deg, rgba(15, 5, 130, 0.96), rgba(25, 12, 170, 0.94) 45%, rgba(12, 3, 105, 0.98))",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.62), inset 0 -10px 16px rgba(8,30,120,0.5), 0 10px 22px rgba(4,16,60,0.4), 0 0 18px rgba(52,110,255,0.24), 0 0 0 1px rgba(160,204,255,0.18)",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: pdfLoading ? "not-allowed" : "pointer",
                    opacity: pdfLoading ? 0.7 : 1,

                    position: "relative",
                    overflow: "hidden",
                  }}
                  disabled={pdfLoading}
                >
                  {pdfLoading && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        height: "100%",
                        width: `${pdfProgress}%`,
                        background: "rgba(255 255 255/ 20%)",
                        transition: "width 0.3s ease",
                      }}
                    />
                  )}
                  <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                    {pdfLoading ? (
                      <>
                        <LoaderCircle className="animate-spin" width="1rem" />
                        <span>({pdfProgress}%)</span>
                      </>
                    ) : (
                      <>
                        <FilePlus color="white" width={"1rem"} />
                        Generate PDF
                      </>
                    )}
                  </div>
                </button>
              </div>
            }
          />
          <br />

          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "75svh",
              }}
            >
              <LoadingOutlined style={{ color: "darkblue", scale: "2" }} />
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                gap: "1rem",
                height: "calc(100vh - 8rem)",
                border: "",
                justifyContent: "center",
                paddingTop: "5rem",

              }}
            >
              <div className="" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                {renderPreview()}
              </div>
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

        {/* {loadedLetterId && (
          <button
            onClick={handleSaveChanges}
            style={{
              margin: "1.5rem",
              position: "fixed",
              bottom: 0,
              right: 0,
              width: "",
              fontSize: "0.9rem",
              padding: "0.5rem 1rem",
              background: "rgba(100 100 100/ 40%)",
              WebkitBackdropFilter: "blur(16px)",
              backdropFilter: "blur(16px)",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: saving ? "not-allowed" : "pointer",
            }}
            disabled={saving}
          >
            <CloudUpload width={"1.25rem"} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )} */}
      </div>
      {/* <ReleaseNote /> */}

      <style>{`
        .mobile-menu-button {
          display: none;
        }
        .input-form {
          width: 30%;
        }
        .preview {
          flex: 1;
        }
        @media (max-width: 768px) {
          .mobile-menu-button {
            display: block;
          }
          .input-form {
            display: none;
          }
          .preview {
            width: 100%;
          }
        }
        /* Custom scrollbar styles */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(100 100 100/ 40%);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(100 100 100/ 60%);
        }
        /* Styles for rich text formatted content in preview */
        .role-description-content ul {
          list-style-type: disc !important;
          list-style-position: outside !important;
          margin-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          padding-left: 0.5rem;
        }
        .role-description-content ol {
          list-style-type: decimal !important;
          list-style-position: outside !important;
          margin-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          padding-left: 0.5rem;
        }
        .role-description-content li {
          margin-bottom: 0.25rem;
          line-height: 1.6;
          display: list-item !important;
          margin-left: 1rem;
        }
        .preview p {
          margin: 0.5rem 0;
        }
        .preview strong,
        .preview b {
          font-weight: 600;
        }
        .preview em,
        .preview i {
          font-style: italic;
        }
        .preview-date-input {
          border: 1px solid rgba(15 23 42/ 18%);
          border-radius: 0.5rem;
          padding: 0.35rem 0.55rem;
          color: rgba(15 23 42/ 92%);
          background: rgba(255 255 255/ 95%);
        }
        .preview-date-input::-webkit-calendar-picker-indicator {
          cursor: pointer;
          filter: brightness(0) saturate(100%) invert(12%) sepia(97%) saturate(2524%) hue-rotate(236deg) brightness(91%) contrast(115%);
          opacity: 0.95;
        }
        @keyframes fieldFocusPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(0 0 139/ 0%);
            background: rgba(255 255 255/ 82%);
          }
          45% {
            box-shadow: 0 0 0 5px rgba(0 0 139/ 16%);
            background: rgba(237 244 255/ 95%);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0 0 139/ 0%);
            background: rgba(255 255 255/ 82%);
          }
        }
      `}</style>

      <Modal
        title="Edit Clearance Form"
        open={editDialogVisible}
        onCancel={() => setEditDialogVisible(false)}
        onOk={handleEditLetter}
        confirmLoading={saving}
        okText="Save"
        cancelText="Cancel"
      >
        {editingLetter && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label>Candidate Name</label>
              <Input
                value={editingLetter.candidateName}
                onChange={(e) =>
                  setEditingLetter((prev: any) => ({
                    ...prev,
                    candidateName: e.target.value,
                  }))
                }
                placeholder="Enter candidate name"
              />
            </div>
            <div>
              <label>Passport Number</label>
              <Input
                value={editingLetter.passportNumber}
                onChange={(e) =>
                  setEditingLetter((prev: any) => ({
                    ...prev,
                    passportNumber: e.target.value,
                  }))
                }
                placeholder="Enter passport number"
              />
            </div>
            <div>
              <label>Position</label>
              <Input
                value={editingLetter.position}
                onChange={(e) =>
                  setEditingLetter((prev: any) => ({
                    ...prev,
                    position: e.target.value,
                  }))
                }
                placeholder="Enter position"
              />
            </div>
            <div>
              <label>Reference Number</label>
              <Input
                value={editingLetter.refNo}
                onChange={(e) =>
                  setEditingLetter((prev: any) => ({
                    ...prev,
                    refNo: e.target.value,
                  }))
                }
                placeholder="Enter reference number"
              />
            </div>
            <div>
              <label>Work Location</label>
              <Input
                value={editingLetter.workLocation}
                onChange={(e) =>
                  setEditingLetter((prev: any) => ({
                    ...prev,
                    workLocation: e.target.value,
                  }))
                }
                placeholder="Enter work location"
              />
            </div>
            <div>
              <label>Salary (OMR)</label>
              <Input
                type="number"
                value={editingLetter.salary}
                onChange={(e) =>
                  setEditingLetter((prev: any) => ({
                    ...prev,
                    salary: e.target.value,
                  }))
                }
                placeholder="Enter salary"
              />
            </div>
            <div>
              <label>Allowance (OMR)</label>
              <Input
                type="number"
                value={editingLetter.allowance}
                onChange={(e) =>
                  setEditingLetter((prev: any) => ({
                    ...prev,
                    allowance: e.target.value,
                  }))
                }
                placeholder="Enter allowance"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Add Preset Dialog */}
      <DefaultDialog
        titleIcon={<Save />}
        title="Save as Preset"
        updating={loading}
        disabled={loading}
        open={presetDialogVisible}
        onCancel={() => {
          setPresetDialogVisible(false);
          setPresetName("");
        }}
        onOk={handleSavePreset}
        OkButtonText="Save"
        CancelButtonText="Cancel"
        extra={
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              padding: "1rem 0",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <label
                style={{
                  fontSize: "0.9rem",
                  color: "",
                  fontWeight: "500",
                }}
              >
                Preset Name
              </label>
              <input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Enter preset name"
                style={{
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(100 100 100/ 20%)",
                  fontSize: "1rem",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = "rgba(100 100 100/ 40%)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = "rgba(100 100 100/ 20%)";
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = "none";
                  e.currentTarget.style.borderColor = "darkblue";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 2px rgba(0 0 139/ 0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(100 100 100/ 20%)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </div>
        }
      />

      <DefaultDialog
        open={deleteDialogVisible}
        onCancel={() => {
          setDeleteDialogVisible(false);
          setDeleteId("");
        }}
        onOk={() => {
          handleDeletePreset(deleteId);
          setDeleteDialogVisible(false);
          setDeleteId("");
        }}
        title="Delete Preset"
        titleIcon={<Trash2 />}
        extra={
          <p style={{ fontSize: "0.8rem", padding: "0.5rem", opacity: 0.7 }}>
            Are you sure you want to delete this preset? This action cannot be
            undone.
          </p>
        }
        OkButtonText="Delete"
        CancelButtonText="Cancel"
        destructive
      />

      <DefaultDialog
        open={renameDialogVisible}
        onCancel={() => {
          setRenameDialogVisible(false);
          setPresetName("");
        }}
        onOk={() => {
          handleRenamePreset(presetName);
          setRenameDialogVisible(false);
          setPresetName("");
        }}
        title="Rename Preset"
        titleIcon={<FileText color="darkblue" />}
        extra={
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Enter new preset name"
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "0.5rem",
              border: "1px solid rgba(100 100 100/ 20%)",
              fontSize: "1rem",
              background: "none",
            }}
          />
        }
        OkButtonText="Rename"
        CancelButtonText="Cancel"
        disabled={!presetName.trim()}
        updating={loading}
      />

      {/* Role Editor Dialog */}
      <DefaultDialog
        open={roleEditorDialogVisible}
        onCancel={() => {
          setRoleEditorDialogVisible(false);
          setEditingRoleIndex(null);
          setEditingRoleContent("");
        }}
        onOk={() => {
          if (editingRoleIndex !== null) {
            handleRoleChange(editingRoleIndex, "description", editingRoleContent);
          }
          setRoleEditorDialogVisible(false);
          setEditingRoleIndex(null);
          setEditingRoleContent("");
        }}
        title={editingRoleIndex !== null ? `Edit: ${formData.roles[editingRoleIndex]?.title || "Role Description"}` : "Edit Role Description"}
        titleIcon={<FileText color="darkblue" />}
        extra={
          <div style={{ width: "100%", minHeight: "400px" }}>
            <RichTextEditor
              value={editingRoleContent}
              onChange={(value) => setEditingRoleContent(value)}
              placeholder="Enter role description (use toolbar for formatting)"
              minHeight="400px"
            />
          </div>
        }
        OkButtonText="Save"
        CancelButtonText="Cancel"
      />

      {/* Field Configuration Dialog */}
      <ResponsiveModal
        open={fieldConfigDialogVisible}
        onOpenChange={handleFieldConfigDialogChange}
        title="Manage Fields"
        contentStyle={{ maxWidth: "760px" }}

      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "70vh",
            maxHeight: "700px",
            overflow: "hidden",
            background: "rgba(248 250 252/ 75%)",
            gap: "1rem",
          }}
        >
          {/* <div
            style={{
              padding: "0.75rem 1.25rem",
              borderBottom: "1px solid rgba(15 23 42/ 10%)",
              background: "rgba(255 255 255/ 94%)",
              flexShrink: 0,
            }}
          >
            <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(15 23 42/ 60%)" }}>
              Drag rows to reorder and toggle visibility.
            </p>
          </div> */}

          <div
            ref={fieldListScrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              paddingLeft: "0.75rem",
              paddingRight: "0.75rem",
              paddingTop: "0.6rem",
              paddingBottom: "0.6rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {renderFieldConfigSection(
              "table",
              "Table Fields",
              <Database width="1rem" style={{ color: "darkblue" }} />
            )}

            {renderFieldConfigSection(
              "paragraph",
              "Paragraph Fields",
              <FileText width="1rem" style={{ color: "darkblue" }} />
            )}
          </div>

          {/* Bottom button area */}
          <div
            style={{
              paddingLeft: "0.75rem",
              paddingRight: "0.75rem",
              paddingBottom: "0.6rem",
              paddingTop: "0.5rem",
              borderTop: "1px solid rgba(15 23 42/ 10%)",
              background: "rgba(255 255 255/ 94%)",
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setAddCustomFieldDialogVisible(true)}
              style={{
                width: "100%",
                background: "rgba(255 255 255/ 10%)",
                color: "darkblue",
                border: "1px solid rgba(0 0 139/ 20%)",
                padding: "0.5rem",
                borderRadius: "0.45rem",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
              }}
            >
              <Plus width="0.75rem" />
              Add Custom Field
            </button>
          </div>
        </div>
      </ResponsiveModal>

      {/* Add Custom Field Dialog */}
      <ResponsiveModal
        open={addCustomFieldDialogVisible}
        onOpenChange={setAddCustomFieldDialogVisible}
        title="Add Custom Field"
      // description="Create a new field to add to your clearance form"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "rgba(15 23 42/ 80%)", marginBottom: "0.3rem", display: "block" }}>
              Field Name
            </label>
            <input
              type="text"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCustomField();
              }}
              placeholder="Enter field name"
              autoFocus
              style={{
                width: "100%",
                padding: "0.5rem 0.6rem",
                borderRadius: "0.45rem",
                border: "1px solid rgba(15 23 42/ 15%)",
                background: "rgba(255 255 255/ 95%)",
                fontSize: "0.8rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "rgba(15 23 42/ 80%)", marginBottom: "0.3rem", display: "block" }}>
                Field Type
              </label>
              <Select value={newFieldType} onValueChange={(value: FieldType) => setNewFieldType(value)}>
                <SelectTrigger style={{ padding: "0.5rem 0.6rem", fontSize: "0.8rem" }}>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="textarea">Text Area</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "rgba(15 23 42/ 80%)", marginBottom: "0.3rem", display: "block" }}>
                Section
              </label>
              <Select value={newFieldSection} onValueChange={(value: "table" | "paragraph") => setNewFieldSection(value)}>
                <SelectTrigger style={{ padding: "0.5rem 0.6rem", fontSize: "0.8rem" }}>
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="table">Table</SelectItem>
                  <SelectItem value="paragraph">Paragraph</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.2rem" }}>
            <button
              onClick={() => {
                setAddCustomFieldDialogVisible(false);
                setNewFieldName("");
                setNewFieldType("text");
                setNewFieldSection("table");
              }}
              style={{
                flex: 1,
                padding: "0.5rem",
                borderRadius: "0.4rem",
                border: "1px solid rgba(15 23 42/ 15%)",
                background: "rgba(15 23 42/ 4%)",
                color: "rgba(15 23 42/ 80%)",
                cursor: "pointer",
                fontSize: "0.76rem",
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                handleAddCustomField();
                setAddCustomFieldDialogVisible(false);
              }}
              style={{
                flex: 1,
                padding: "0.5rem",
                borderRadius: "0.4rem",
                background: "darkblue",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: "0.76rem",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
              }}
            >
              <Plus width="0.7rem" />
              Add Field
            </motion.button>
          </div>
        </div>
      </ResponsiveModal>

    </>
  );
}




