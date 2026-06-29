import { useAuth } from "@/components/AuthProvider";
import Back from "@/components/back";
import { RichTextEditor } from "@/components/rich-text-editor";
import DefaultDialog from "@/components/ui/default-dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth, db } from "@/firebase";
import InvoiceTemplate from "@/invoice-templates/template-1";
import QuotationTemplate from "@/quotation-templates/template-1";
import { LoadingOutlined } from "@ant-design/icons";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Drawer as AntDrawer, message, Modal } from "antd";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bug,
  ChevronDown,
  Database,
  Dot,
  Eye,
  File,
  FilePlus,
  FilePlus2,
  FileText,
  FileX,
  GripVertical,
  LoaderCircle,
  Menu,
  MinusCircle,
  Pencil,
  Plus,
  Save,
  Sidebar,
  Zap
} from "lucide-react";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { usePDF } from "react-to-pdf";

interface DocumentItem {
  description: string;
  unit: string;
  quantity: number;
  amount: number;
}

const parseQuantity = (unit: string | number | undefined | null): number => {
  if (unit === undefined || unit === null) return 0;
  if (typeof unit === 'number') return unit;
  const cleaned = String(unit).trim();
  if (!cleaned) return 0;
  const num = parseFloat(cleaned);
  return isNaN(num) ? 1 : num;
};

type DocumentType = "invoice" | "quotation";

interface ClientDetails {
  id?: string;
  name: string;
  address: string;
  contactNo: string;
  vatinNo?: string;
}

interface InvoiceDetails {
  id?: string;
  refNo: string;
  invoiceNo: string;
  unitTitle: string;
}

interface QuotationDetails {
  id?: string;
  refNo: string;
  quotationNo: string;
  unitTitle: string;
  validityPeriod: string;
  subject: string;
}

const styles = {
  mobileMenuButton: {
    display: "none",
  },
  inputForm: {
    width: "30%",
    borderRadius: "0.5rem",
  },
  preview: {
    flex: 1,
    borderRadius: "0.5rem",
  },
};

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

const PREVIEW_BASE_WIDTH = 800;
const PREVIEW_MOBILE_GUTTER = 32;
const FORM_PANEL_BREAKPOINT = 1300;

// Sortable term item for drag-and-drop reordering
interface SortableTermItemProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  onRemove: () => void;
}

const SortableTermItem = ({ id, value, onChange, onRemove }: SortableTermItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: "flex",
        gap: "0.3rem",
        alignItems: "flex-start",
      }}
    >
      <div
        {...attributes}
        {...listeners}
        style={{
          cursor: "grab",
          display: "flex",
          alignItems: "center",
          padding: "0.5rem 0.15rem",
          color: "rgba(0 0 139/ 55%)",
          flexShrink: 0,
          marginTop: "0.2rem",
        }}
        title="Drag to reorder"
      >
        <GripVertical size={14} />
      </div>
      <div style={{ flex: 1 }}>
        <RichTextEditor
          value={value}
          onChange={onChange}
          placeholder="Enter term..."
          minHeight="80px"
          hideToolbar={true}
        />
      </div>
      <button
        onClick={onRemove}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(220 38 38/ 8%)",
          border: "none",
          color: "#dc2626",
          cursor: "pointer",
          padding: "0.45rem",
          borderRadius: "0.35rem",
          flexShrink: 0,
          height: "2rem"
        }}
      >
        <MinusCircle width="0.85rem" />
      </button>
    </div>
  );
};

export default function DocumentEditor() {
  const { userData } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [bugDialog, setBugDialog] = useState(false);
  const [issue, setIssue] = useState("");
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [hideDesktopInputSection, setHideDesktopInputSection] = useState(false);
  const [responsiveFormDrawerOpen, setResponsiveFormDrawerOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);

  const [previewContentHeight, setPreviewContentHeight] = useState(1);
  const previewContentRef = useRef<HTMLDivElement>(null);

  const canEditDocumentEditor = (() => {
    try {
      const permissions = JSON.parse(userData?.clearance || "{}") as Record<string, boolean>;
      const hasDocEditorModule = permissions.document_editor === true;
      const hasExplicitEditBlock = permissions.document_editor_edit === false;

      if (hasDocEditorModule) {
        return !hasExplicitEditBlock;
      }

      if (permissions.document_editor === false || hasExplicitEditBlock) {
        return false;
      }

      if (userData?.role === "admin" || userData?.role === "site_admin") {
        return true;
      }

      return false;
    } catch {
      return userData?.role === "admin" || userData?.role === "site_admin";
    }
  })();

  const previewScale =
    screenWidth < FORM_PANEL_BREAKPOINT
      ? Math.min(
        1,
        Math.max(
          0.32,
          (screenWidth - PREVIEW_MOBILE_GUTTER) / PREVIEW_BASE_WIDTH
        )
      )
      : 1;

  // PDF Export setup
  const { toPDF, targetRef } = usePDF({
    filename: "document - " + moment().format("DD_MM_YYYY") + ".pdf",
  });

  // State Variables matching arc.txt
  const [documentType, setDocumentType] = useState<DocumentType>("invoice");
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [refNo, setRefNo] = useState("");
  const [date, setDate] = useState(moment().format("DD.MM.YYYY"));
  const [contactNo, setContactNo] = useState("");
  const [items, setItems] = useState<DocumentItem[]>([
    { description: "", unit: "0", quantity: 0, amount: 0 },
  ]);

  // Invoice-specific state
  const [invoiceNo, setInvoiceNo] = useState("");
  const [isTaxInvoice, setIsTaxInvoice] = useState(false);
  const [vatinNo, setVatinNo] = useState("");
  const [bankDetails, setBankDetails] = useState<string>(
    "<p>Bank Name: BANK MUSCAT </p><p>Branch: SOHAR</p><p>Account Number: 0423 0614 8250 0019</p><p>Swift Code: BMUSOMRX</p>"
  );

  // Quotation-specific state
  const [quotationNo, setQuotationNo] = useState("");
  const [validityPeriod, setValidityPeriod] = useState(
    moment().add(10, "days").format("DD.MM.YYYY")
  );
  const [terms, setTerms] = useState<string[]>([
    "Diesel under scope of M/s ",
    "Timesheet to be given to drivers by ",
    "Maintenance of any machinery under scope of M/s Arc Engineering LLC",
    "Food, Accomodation of drivers under scope of M/s Arc Engineering LLC",
    "Minimum of 10 Working Hours per day",
    "Valid driver's license with third party certificate and valid Wheel Loader third party certification.",
  ]);

  // Document settings states
  const [unitTitle, setUnitTitle] = useState("Duration");
  const [letterhead, setLetterhead] = useState("Sohar Star United");
  const [subject, setSubject] = useState("");
  const [hideTotal, setHideTotal] = useState(false);

  // Autofill lists loaded from Firestore
  const [clients, setClients] = useState<ClientDetails[]>([]);
  const [openClientSelect, setOpenClientSelect] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails[]>([]);
  const [quotationDetails, setQuotationDetails] = useState<QuotationDetails[]>([]);
  const [openDocumentSelect, setOpenDocumentSelect] = useState(false);

  // Saved complete documents list from Firestore
  const [savedDocuments, setSavedDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsDrawerVisible, setDocumentsDrawerVisible] = useState(false);
  const [loadedDocId, setLoadedDocId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalDocState, setOriginalDocState] = useState<any>(null);

  // Presets State
  const [presets, setPresets] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [presetName, setPresetName] = useState("");
  const [presetDialogVisible, setPresetDialogVisible] = useState(false);
  const [presetsLoading, setPresetsLoading] = useState(false);

  // Scroll element ref
  const inputFormScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = previewContentRef.current;
    if (!node) return;

    const updateHeight = () => {
      setPreviewContentHeight(node.scrollHeight || 1);
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [documentType]);

  useEffect(() => {
    // Resize handler
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync state changes with hasChanges
  useEffect(() => {
    if (originalDocState) {
      const currentState = {
        documentType,
        clientName,
        clientAddress,
        refNo,
        date,
        contactNo,
        items,
        invoiceNo,
        isTaxInvoice,
        vatinNo,
        quotationNo,
        validityPeriod,
        terms,
        unitTitle,
        letterhead,
        subject,
        bankDetails,
        hideTotal,
      };
      setHasChanges(JSON.stringify(currentState) !== JSON.stringify(originalDocState));
    } else {
      setHasChanges(false);
    }
  }, [
    documentType,
    clientName,
    clientAddress,
    refNo,
    date,
    contactNo,
    items,
    invoiceNo,
    isTaxInvoice,
    vatinNo,
    quotationNo,
    validityPeriod,
    terms,
    unitTitle,
    letterhead,
    subject,
    bankDetails,
    hideTotal,
    originalDocState,
  ]);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchClients();
      await fetchInvoiceDetails();
      await fetchQuotationDetails();
      await fetchPresets();
      await fetchSavedDocuments();
    };
    loadInitialData();
  }, []);

  const fetchClients = async () => {
    try {
      const snap = await getDocs(collection(db, "client-details"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ClientDetails[];
      setClients(list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const saveClientDetails = async () => {
    if (!clientName.trim()) return;
    try {
      // Check if client name already exists in database before writing duplicate
      if (clients.some((c) => c.name.toLowerCase() === clientName.toLowerCase())) return;

      const clientData: ClientDetails = {
        name: clientName,
        address: clientAddress,
        contactNo: contactNo,
        ...(documentType === "invoice" && isTaxInvoice ? { vatinNo } : {}),
      };
      await addDoc(collection(db, "client-details"), clientData);
      await fetchClients();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInvoiceDetails = async () => {
    try {
      const snap = await getDocs(collection(db, "invoice-details"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as InvoiceDetails[];
      setInvoiceDetails(list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchQuotationDetails = async () => {
    try {
      const snap = await getDocs(collection(db, "quotation-details"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as QuotationDetails[];
      setQuotationDetails(list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const saveDocumentDetails = async () => {
    if (!refNo.trim()) return;
    try {
      if (documentType === "invoice") {
        if (invoiceDetails.some((d) => d.invoiceNo === invoiceNo && d.refNo === refNo)) return;
        const data: InvoiceDetails = { refNo, invoiceNo, unitTitle };
        await addDoc(collection(db, "invoice-details"), data);
        await fetchInvoiceDetails();
      } else {
        if (quotationDetails.some((d) => d.quotationNo === quotationNo && d.refNo === refNo)) return;
        const data: QuotationDetails = { refNo, quotationNo, unitTitle, validityPeriod, subject };
        await addDoc(collection(db, "quotation-details"), data);
        await fetchQuotationDetails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPresets = async () => {
    try {
      setPresetsLoading(true);
      const q = query(collection(db, "document_editor_presets"), orderBy("created_at", "desc"));
      const snap = await getDocs(q);
      setPresets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
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
      const newPreset = {
        name: presetName,
        documentType,
        clientName,
        clientAddress,
        contactNo,
        vatinNo,
        unitTitle,
        letterhead,
        subject,
        items,
        terms,
        bankDetails,
        hideTotal,
        created_at: Timestamp.now(),
      };
      await addDoc(collection(db, "document_editor_presets"), newPreset);
      message.success("Preset saved successfully");
      setPresetDialogVisible(false);
      setPresetName("");
      await fetchPresets();
    } catch (e) {
      message.error("Failed to save preset");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      setDocumentType(preset.documentType || "invoice");
      setClientName(preset.clientName || "");
      setClientAddress(preset.clientAddress || "");
      setContactNo(preset.contactNo || "");
      setVatinNo(preset.vatinNo || "");
      setUnitTitle(preset.unitTitle || "Duration");
      setLetterhead(preset.letterhead || "ARC");
      setSubject(preset.subject || "");
      setItems(preset.items || [{ description: "", unit: "0", quantity: 0, amount: 0 }]);
      setTerms(preset.terms || []);
      setBankDetails(preset.bankDetails || "");
      setHideTotal(preset.hideTotal ?? false);
      setSelectedPreset(presetId);
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, "document_editor_presets", presetId));
      message.success("Preset deleted successfully");
      setSelectedPreset("");
      await fetchPresets();
    } catch (e) {
      message.error("Failed to delete preset");
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedDocuments = async () => {
    setDocumentsLoading(true);
    try {
      const q = query(collection(db, "document_editor_docs"), orderBy("generated_at", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSavedDocuments(list);
    } catch (e) {
      message.error("Failed to fetch saved documents");
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!canEditDocumentEditor) {
      message.error("Editing privileges are disabled");
      return;
    }
    if (!clientName.trim()) {
      message.error("Please fill in Client Name");
      return;
    }
    setSaving(true);
    try {
      const docPayload = {
        documentType,
        clientName,
        clientAddress,
        refNo,
        date,
        contactNo,
        items,
        invoiceNo,
        isTaxInvoice,
        vatinNo,
        quotationNo,
        validityPeriod,
        terms,
        unitTitle,
        letterhead,
        subject,
        bankDetails,
        hideTotal,
        generated_at: Timestamp.now(),
        generated_by: auth.currentUser?.email || null,
      };

      const docRef = await addDoc(collection(db, "document_editor_docs"), docPayload);
      setLoadedDocId(docRef.id);
      setOriginalDocState(JSON.parse(JSON.stringify(docPayload)));
      await saveClientDetails();
      await saveDocumentDetails();
      await fetchSavedDocuments();
      message.success("Document saved successfully");
    } catch (e) {
      message.error("Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!loadedDocId) return;
    setSaving(true);
    try {
      const docPayload = {
        documentType,
        clientName,
        clientAddress,
        refNo,
        date,
        contactNo,
        items,
        invoiceNo,
        isTaxInvoice,
        vatinNo,
        quotationNo,
        validityPeriod,
        terms,
        unitTitle,
        letterhead,
        subject,
        bankDetails,
        hideTotal,
        updated_at: Timestamp.now(),
      };
      await updateDoc(doc(db, "document_editor_docs", loadedDocId), docPayload);
      setOriginalDocState(JSON.parse(JSON.stringify(docPayload)));
      await saveClientDetails();
      await saveDocumentDetails();
      await fetchSavedDocuments();
      message.success("Document updated successfully");
    } catch (e) {
      message.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "document_editor_docs", id));
      message.success("Document deleted");
      if (loadedDocId === id) {
        handleClearForm();
      }
      await fetchSavedDocuments();
    } catch (e) {
      message.error("Failed to delete document");
    } finally {
      setDeleting(false);
    }
  };

  const handleLoadDoc = (id: string) => {
    const documentObj = savedDocuments.find((d) => d.id === id);
    if (documentObj) {
      setLoadedDocId(id);
      setDocumentType(documentObj.documentType || "invoice");
      setClientName(documentObj.clientName || "");
      setClientAddress(documentObj.clientAddress || "");
      setRefNo(documentObj.refNo || "");
      setDate(documentObj.date || moment().format("DD.MM.YYYY"));
      setContactNo(documentObj.contactNo || "");
      setItems(documentObj.items || [{ description: "", unit: "0", quantity: 0, amount: 0 }]);
      setInvoiceNo(documentObj.invoiceNo || "");
      setIsTaxInvoice(documentObj.isTaxInvoice ?? true);
      setVatinNo(documentObj.vatinNo || "");
      setQuotationNo(documentObj.quotationNo || "");
      setValidityPeriod(documentObj.validityPeriod || "");
      setTerms(documentObj.terms || []);
      setUnitTitle(documentObj.unitTitle || "Duration");
      setLetterhead(documentObj.letterhead || "ARC");
      setSubject(documentObj.subject || "");
      setBankDetails(documentObj.bankDetails || "");
      setHideTotal(documentObj.hideTotal ?? false);

      const compareState = {
        documentType: documentObj.documentType || "invoice",
        clientName: documentObj.clientName || "",
        clientAddress: documentObj.clientAddress || "",
        refNo: documentObj.refNo || "",
        date: documentObj.date || moment().format("DD.MM.YYYY"),
        contactNo: documentObj.contactNo || "",
        items: documentObj.items || [{ description: "", unit: "0", quantity: 0, amount: 0 }],
        invoiceNo: documentObj.invoiceNo || "",
        isTaxInvoice: documentObj.isTaxInvoice ?? true,
        vatinNo: documentObj.vatinNo || "",
        quotationNo: documentObj.quotationNo || "",
        validityPeriod: documentObj.validityPeriod || "",
        terms: documentObj.terms || [],
        unitTitle: documentObj.unitTitle || "Qty",
        letterhead: documentObj.letterhead || "ARC",
        subject: documentObj.subject || "",
        bankDetails: documentObj.bankDetails || "",
        hideTotal: documentObj.hideTotal ?? false,
      };
      setOriginalDocState(compareState);
      setDocumentsDrawerVisible(false);
    }
  };

  const handleClearForm = () => {
    setLoadedDocId(null);
    setOriginalDocState(null);
    setClientName("");
    setClientAddress("");
    setRefNo("");
    setDate(moment().format("DD.MM.YYYY"));
    setContactNo("");
    setItems([{ description: "", unit: "0", quantity: 0, amount: 0 }]);
    setInvoiceNo("");
    setIsTaxInvoice(true);
    setVatinNo("");
    setQuotationNo("");
    setValidityPeriod(moment().add(10, "days").format("DD.MM.YYYY"));
    setTerms([
      "Diesel under scope of M/s ",
      "Timesheet to be given to drivers by ",
      "Maintenance of any machinery under scope of M/s Arc Engineering LLC",
      "Food, Accomodation of drivers under scope of M/s Arc Engineering LLC",
      "Minimum of 10 Working Hours per day",
      "Valid driver's license with third party certificate and valid Wheel Loader third party certification.",
    ]);
    setUnitTitle("Duration");
    setLetterhead("ARC");
    setSubject("");
    setHideTotal(false);
    setBankDetails(
      "<p>Bank Name: BANK MUSCAT </p><p>Account Number: 0423 0614 8250 0019</p><p>Swift Code: BMUSOMRX</p>"
    );
  };

  const handlePrintPDF = async () => {
    setPdfLoading(true);
    setPdfProgress(20);
    try {
      await saveClientDetails();
      setPdfProgress(50);
      await saveDocumentDetails();
      setPdfProgress(80);
      toPDF();
      setPdfProgress(100);
      message.success("PDF Download Started");
    } catch (e) {
      message.error("Failed to generate PDF");
    } finally {
      setTimeout(() => {
        setPdfLoading(false);
        setPdfProgress(0);
      }, 500);
    }
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setClientName(client.name);
      setClientAddress(client.address);
      setContactNo(client.contactNo || "");
      if (client.vatinNo) {
        setVatinNo(client.vatinNo);
        setIsTaxInvoice(true);
      }
    }
    setOpenClientSelect(false);
  };

  const handleDocumentSelect = (documentId: string) => {
    if (documentType === "invoice") {
      const invoice = invoiceDetails.find((d) => d.id === documentId);
      if (invoice) {
        setRefNo(invoice.refNo);
        setInvoiceNo(invoice.invoiceNo);
        setUnitTitle(invoice.unitTitle || "Duration");
      }
    } else {
      const quotation = quotationDetails.find((d) => d.id === documentId);
      if (quotation) {
        setRefNo(quotation.refNo);
        setQuotationNo(quotation.quotationNo);
        setUnitTitle(quotation.unitTitle || "Duration");
        setValidityPeriod(quotation.validityPeriod);
        setSubject(quotation.subject || "");
      }
    }
    setOpenDocumentSelect(false);
  };

  const addItem = () => {
    setItems((prev) => [...prev, { description: "", unit: "0", quantity: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateItem = (index: number, field: keyof DocumentItem, value: any) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === "unit") {
          updated.quantity = Number(value) || 0;
        }
        return updated;
      })
    );
  };

  const addTerm = () => {
    setTerms((prev) => [...prev, ""]);
  };

  const removeTerm = (index: number) => {
    setTerms((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateTerm = (index: number, value: string) => {
    setTerms((prev) => prev.map((term, idx) => (idx === index ? value : term)));
  };

  // Drag-and-drop sensors for terms reordering
  const termsSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleTermsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTerms((prev) => {
        const oldIndex = prev.findIndex((_, i) => `term-${i}` === active.id);
        const newIndex = prev.findIndex((_, i) => `term-${i}` === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleInputSectionScroll = () => {
    // Scroll tracking placeholder (previously updated headerVisible)
  };

  const sendBugReport = async () => {
    message.success("Bug Report Submitted");
    setBugDialog(false);
    setIssue("");
  };

  const renderInputForm = (isDrawer = false) => {
    return (
      <div
        ref={inputFormScrollRef}
        onScroll={handleInputSectionScroll}
        style={{
          position: isDrawer ? "relative" : "fixed",
          display: "flex",
          flexDirection: "column",
          height: isDrawer ? "auto" : "100%",
          fontSize: "0.8rem",
          maxHeight: isDrawer ? "none" : "72%",
          width: isDrawer ? "100%" : "30%",
          border: isDrawer ? "none" : "1px solid rgba(100 116 139/ 22%)",
          borderRadius: isDrawer ? "0" : "1rem",
          background: isDrawer ? "transparent" : "linear-gradient(180deg, rgba(248 250 252/ 95%), rgba(241 245 249/ 90%))",
          boxShadow: isDrawer ? "none" : "0 16px 35px rgba(15 23 42/ 10%)",
          overflowY: "auto",
          padding: "1.25rem",
          gap: "1.25rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "600", color: "black" }}>Editor Options</h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={handleClearForm}
              style={{
                background: "rgba(100 100 100/ 10%)",
                padding: "0.25rem 0.6rem",
                border: "none",
                borderRadius: "0.35rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                fontSize: "0.75rem",
              }}
            >
              <FileX color="indianred" width="0.85rem" />
              Clear Form
            </button>
            {!isDrawer && screenWidth >= FORM_PANEL_BREAKPOINT && (
              <button
                onClick={() => setHideDesktopInputSection(true)}
                style={{
                  background: "rgba(100 100 100/ 10%)",
                  padding: "0.25rem 0.6rem",
                  border: "none",
                  borderRadius: "0.35rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.75rem",
                }}
              >
                <Sidebar color="darkblue" width="0.85rem" />
                Hide
              </button>
            )}
          </div>
        </div>

        {/* Presets Manager */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            padding: "0.75rem",
            background: "rgba(100 100 100/ 5%)",
            borderRadius: "0.75rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: "500", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <FileText width="0.95rem" color="darkblue" />
              Document Presets
            </span>
            <button
              onClick={() => setPresetDialogVisible(true)}
              style={{
                background: "transparent",
                color: "darkblue",
                border: "none",
                cursor: "pointer",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                gap: "0.2rem",
              }}
            >
              <Plus width="0.75rem" /> New
            </button>
          </div>
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <Select value={selectedPreset} onValueChange={handleLoadPreset}>
              <SelectTrigger disabled={presetsLoading} className="w-full h-[36px]">
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPreset && (
              <button
                onClick={() => handleDeletePreset(selectedPreset)}
                style={{
                  background: "rgba(220 38 38/ 10%)",
                  border: "none",
                  padding: "0.5rem",
                  borderRadius: "0.35rem",
                  cursor: "pointer",
                  color: "#dc2626",
                }}
              >
                <MinusCircle width="1rem" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs for Document Type Selection */}
        <Tabs
          defaultValue="invoice"
          value={documentType}
          onValueChange={(val: string) => {
            setDocumentType(val as DocumentType);
            if (val === "invoice") {
              setUnitTitle("Duration");
            } else {
              setUnitTitle("Duration");
            }
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invoice">Invoice</TabsTrigger>
            <TabsTrigger value="quotation">Quotation</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Common Details */}
        <div>
          <label style={{ fontSize: "0.75rem", opacity: 0.7, marginBottom: "0.35rem", display: "block" }}>Letterhead</label>
          <Select value={letterhead} onValueChange={setLetterhead}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Letterhead" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="Sohar Star United">Sohar Star United</SelectItem>
              <SelectItem value="ARC">ARC Engineering</SelectItem>
              <SelectItem value="Unique">Unique Solutions</SelectItem>

            </SelectContent>
          </Select>
        </div>

        {documentType === "invoice" && (
          <div>
            <label style={{ fontSize: "0.75rem", opacity: 0.7, marginBottom: "0.35rem", display: "block" }}>Invoice Type</label>
            <Select value={isTaxInvoice ? "tax" : "cash"} onValueChange={(val) => setIsTaxInvoice(val === "tax")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Invoice Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tax">Tax Invoice</SelectItem>
                <SelectItem value="cash">Cash Invoice</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Client Details Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "0.8rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: "600" }}>Client Details</span>
            <Popover open={openClientSelect} onOpenChange={setOpenClientSelect}>
              <PopoverTrigger asChild>
                <button
                  style={{
                    background: "rgba(100 100 100/ 10%)",
                    border: "none",
                    borderRadius: "0.3rem",
                    padding: "0.2rem 0.5rem",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.2rem",
                  }}
                >
                  Autofill <Zap width="0.75rem" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-2 bg-white border border-gray-200 shadow-md rounded-md z-[100]" style={{ marginRight: "1rem" }}>
                <input
                  type="text"
                  placeholder="Search clients..."
                  className="w-full p-1.5 mb-2 border border-gray-300 rounded text-sm bg-transparent"
                  onChange={(e) => {
                    const search = e.target.value.toLowerCase();
                    document.querySelectorAll(".client-autofill-btn").forEach((btn) => {
                      const text = btn.textContent?.toLowerCase() || "";
                      (btn as HTMLElement).style.display = text.includes(search) ? "block" : "none";
                    });
                  }}
                />
                <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                  {clients.map((c) => (
                    <button
                      key={c.id}
                      className="client-autofill-btn w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-xs bg-transparent"
                      onClick={() => handleClientSelect(c.id!)}
                    >
                      {c.name}
                    </button>
                  ))}
                  {clients.length === 0 && <p className="text-center text-xs text-gray-400 py-1">No clients found</p>}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <input
            type="text"
            style={inputStyle}
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Client Name"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "rgba(17, 24, 39, 0.7)", marginLeft: "0.1rem" }}>Client Address</label>
            <RichTextEditor
              value={clientAddress}
              onChange={setClientAddress}
              placeholder="Client Address"
              minHeight="100px"
              hideToolbar
            />
          </div>
          {documentType === "invoice" && isTaxInvoice && (
            <input
              type="text"
              style={inputStyle}
              value={vatinNo}
              onChange={(e) => setVatinNo(e.target.value)}
              placeholder="VATIN Number"
            />
          )}
          <input
            type="text"
            style={inputStyle}
            value={contactNo}
            onChange={(e) => setContactNo(e.target.value)}
            placeholder="Contact Number"
          />
        </div>

        {/* Document Metadata Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "0.8rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: "600" }}>Document Settings</span>
            <Popover open={openDocumentSelect} onOpenChange={setOpenDocumentSelect}>
              <PopoverTrigger asChild>
                <button
                  style={{
                    background: "rgba(100 100 100/ 10%)",
                    border: "none",
                    borderRadius: "0.3rem",
                    padding: "0.2rem 0.5rem",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.2rem",
                  }}
                >
                  Autofill <Zap width="0.75rem" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-2 bg-white border border-gray-200 shadow-md rounded-md z-[100]" style={{ marginRight: "1rem" }}>
                <input
                  type="text"
                  placeholder="Search settings..."
                  className="w-full p-1.5 mb-2 border border-gray-300 rounded text-sm bg-transparent"
                  onChange={(e) => {
                    const search = e.target.value.toLowerCase();
                    document.querySelectorAll(".doc-autofill-btn").forEach((btn) => {
                      const text = btn.textContent?.toLowerCase() || "";
                      (btn as HTMLElement).style.display = text.includes(search) ? "block" : "none";
                    });
                  }}
                />
                <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                  {documentType === "invoice"
                    ? invoiceDetails.map((d) => (
                      <button
                        key={d.id}
                        className="doc-autofill-btn w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-xs bg-transparent"
                        onClick={() => handleDocumentSelect(d.id!)}
                      >
                        {d.invoiceNo} ({d.refNo})
                      </button>
                    ))
                    : quotationDetails.map((d) => (
                      <button
                        key={d.id}
                        className="doc-autofill-btn w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-xs bg-transparent"
                        onClick={() => handleDocumentSelect(d.id!)}
                      >
                        {d.quotationNo} ({d.refNo})
                      </button>
                    ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <input
            type="text"
            style={inputStyle}
            value={refNo}
            onChange={(e) => setRefNo(e.target.value)}
            placeholder="Reference Number"
          />
          <input
            type="text"
            style={inputStyle}
            value={documentType === "invoice" ? invoiceNo : quotationNo}
            onChange={(e) => (documentType === "invoice" ? setInvoiceNo(e.target.value) : setQuotationNo(e.target.value))}
            placeholder={documentType === "invoice" ? "Invoice Number" : "Quotation Number"}
          />
          <input
            type="text"
            style={inputStyle}
            value={unitTitle}
            onChange={(e) => setUnitTitle(e.target.value)}
            placeholder="Quantity Unit (e.g., Qty, Pcs, Hrs)"
          />
          <input
            type="date"
            style={inputStyle}
            value={moment(date, "DD.MM.YYYY").isValid() ? moment(date, "DD.MM.YYYY").format("YYYY-MM-DD") : ""}
            onChange={(e) => setDate(moment(e.target.value).format("DD.MM.YYYY"))}
          />
          {documentType === "quotation" && (
            <>
              <input
                type="text"
                style={inputStyle}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
              />
              <input
                type="date"
                style={inputStyle}
                value={moment(validityPeriod, "DD.MM.YYYY").isValid() ? moment(validityPeriod, "DD.MM.YYYY").format("YYYY-MM-DD") : ""}
                onChange={(e) => setValidityPeriod(moment(e.target.value).format("DD.MM.YYYY"))}
                placeholder="Valid Until"
              />
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.2rem 0.1rem" }}>
                <input
                  type="checkbox"
                  id="hideTotal"
                  checked={hideTotal}
                  onChange={(e) => setHideTotal(e.target.checked)}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                <label htmlFor="hideTotal" style={{ fontSize: "0.85rem", color: "rgba(17, 24, 39, 0.8)", cursor: "pointer", userSelect: "none" }}>
                  Hide total section in quotation template
                </label>
              </div>
            </>
          )}
        </div>

        {/* Document Items List */}
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "0.8rem" }}>
          <label style={{ fontWeight: "600", marginBottom: "0.5rem", display: "block" }}>
            {documentType === "invoice" ? "Invoice Items" : "Quotation Items"}
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                  background: "rgba(40, 40, 50, 0.04)",
                  padding: "0.6rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>Item {idx + 1}</span>
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(idx)}
                      style={{
                        background: "rgba(220 38 38/ 8%)",
                        border: "none",
                        color: "#dc2626",
                        cursor: "pointer",
                        padding: "0.2rem",
                        borderRadius: "0.25rem",
                        width: "1.75rem"
                      }}
                    >
                      <MinusCircle width="0.8rem" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  style={inputStyle}
                  value={item.description}
                  onChange={(e) => updateItem(idx, "description", e.target.value)}
                  placeholder="Item Description"
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                  <input
                    type="text"
                    style={inputStyle}
                    value={item.unit}
                    onChange={(e) => updateItem(idx, "unit", e.target.value)}
                    placeholder={unitTitle || "Duration"}
                  />
                  <input
                    type="number"
                    style={inputStyle}
                    value={item.amount}
                    onChange={(e) => updateItem(idx, "amount", Number(e.target.value))}
                    placeholder="Rate"
                  />
                </div>
              </div>
            ))}
            <button
              onClick={addItem}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.3rem",
                padding: "0.55rem",
                background: "rgba(100, 100, 100, 0.08)",
                border: "1px dashed rgba(0,0,0,0.15)",
                borderRadius: "0.4rem",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              <Plus width="0.85rem" /> Add Item
            </button>
          </div>
        </div>

        {/* Quotation Terms and Conditions */}
        {documentType === "quotation" && (
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "0.8rem" }}>
            <label style={{ fontWeight: "600", marginBottom: "0.5rem", display: "block" }}>Terms & Conditions</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <DndContext
                sensors={termsSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleTermsDragEnd}
              >
                <SortableContext
                  items={terms.map((_, i) => `term-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  {terms.map((term, idx) => (
                    <SortableTermItem
                      key={`term-${idx}`}
                      id={`term-${idx}`}
                      value={term}
                      onChange={(val) => updateTerm(idx, val)}
                      onRemove={() => removeTerm(idx)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              <button
                onClick={addTerm}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.3rem",
                  padding: "0.55rem",
                  background: "rgba(100, 100, 100, 0.08)",
                  border: "1px dashed rgba(0,0,0,0.15)",
                  borderRadius: "0.4rem",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                <Plus width="0.85rem" /> Add Term
              </button>
            </div>
          </div>
        )}
        {documentType === "invoice" && (
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "0.8rem" }}>
            <label style={{ fontWeight: "600", marginBottom: "0.5rem", display: "block" }}>Bank Details</label>
            <RichTextEditor
              value={bankDetails}
              onChange={setBankDetails}
              minHeight="120px"
              hideToolbar
            />
          </div>
        )}
      </div>
    );
  };

  const renderPreview = () => {
    return (
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: screenWidth < FORM_PANEL_BREAKPOINT ? "100%" : "auto",
            maxWidth: `${PREVIEW_BASE_WIDTH * previewScale}px`,
            minWidth: 0,
          }}
        >
          {/* Info bar — document ID + status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.25rem",
              paddingRight: "0.6rem",
              marginBottom: "0.5rem",
              background: "rgba(248 250 252 / 0.92)",
              backdropFilter: "blur(8px)",
              borderRadius: "0.8rem",
              border: "1px solid rgba(100 116 139 / 18%)",
              width: "fit-content",
              justifyContent: "flex-start",
            }}
          >
            {loadedDocId ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "rgba(0 0 0/ 70%)", paddingLeft: "0.75rem" }}>
                <File width="1rem" color="darkblue" />
                <span style={{ fontWeight: 500 }}>{loadedDocId}</span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "rgba(0 0 0/ 45%)", paddingLeft: "0.75rem" }}>
                <Eye width="1rem" />
                Preview
              </div>
            )}

            {hasChanges && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.72rem", color: "rgba(180 100 0 / 90%)", padding: "0.2rem 0.5rem", borderRadius: "0.4rem" }}>
                <span className="animate-ping" style={{ width: "0.45rem", height: "0.45rem", borderRadius: "50%", background: "currentColor", flexShrink: 0, display: "inline-block" }} />
                Unsaved changes
              </div>
            )}

            <div style={{ flex: 1 }} />
          </div>

          <div
            style={{
              position: "relative",
              width: `${PREVIEW_BASE_WIDTH * previewScale}px`,
              height: `${previewContentHeight * previewScale}px`,
            }}
          >
            <div
              ref={(el) => {
                // @ts-ignore
                previewContentRef.current = el;
                // @ts-ignore
                targetRef.current = el;
              }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: `${PREVIEW_BASE_WIDTH}px`,
                transform: `scale(${previewScale})`,
                transformOrigin: "top left",
                transition: "transform 0.2s ease",
              }}
              className="document-generator-preview"
            >
              {documentType === "invoice" ? (
                <InvoiceTemplate
                  clientName={clientName}
                  clientAddress={clientAddress}
                  refNo={refNo}
                  invoiceNo={invoiceNo}
                  date={date}
                  items={items}
                  amount={items.reduce((sum, item) => sum + parseQuantity(item.unit) * item.amount, 0)}
                  isTaxInvoice={isTaxInvoice}
                  vatinNo={vatinNo}
                  contactNo={contactNo}
                  unitTitle={unitTitle}
                  letterhead={letterhead}
                  bankDetails={bankDetails}
                />
              ) : (
                <QuotationTemplate
                  clientName={clientName}
                  clientAddress={clientAddress}
                  refNo={refNo}
                  quotationNo={quotationNo}
                  date={date}
                  validityPeriod={validityPeriod}
                  items={items}
                  terms={terms}
                  contactNo={contactNo}
                  unitTitle={unitTitle}
                  letterhead={letterhead}
                  subject={subject}
                  hideTotal={hideTotal}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <>
      <div className="desktop-only" style={{ display: "block" }}>
        <div
          style={{
            padding: "",
            background: "rgba(100 100 100/ 8%)",
            height: "100svh",
            overflowY: "scroll",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(100 100 100/ 40%) transparent",
          }}
        >
          <motion.div>
            {canEditDocumentEditor && (
              <button
                style={{
                  position: "fixed",
                  bottom: 0,
                  right: 0,
                  zIndex: 10,
                  margin: "2rem",
                }}
                onClick={() => setDrawerVisible(true)}
                className="mobile-menu-button"
              >
                <Menu color="black" width="1.5rem" />
              </button>
            )}

            <Back
              blurBG
              fixed

              extra={
                <div style={{ display: "flex", gap: "0.5rem", height: "2.75rem" }}>
                  <button
                    onClick={handlePrintPDF}
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      padding: "0.55rem 1.3rem",
                      background: pdfLoading
                        ? "linear-gradient(145deg, rgba(21, 12, 112, 0.94), rgba(24, 12, 125, 0.9))"
                        : "linear-gradient(145deg, rgba(15, 5, 130, 0.96), rgba(25, 12, 170, 0.94))",
                      color: "white",
                      borderRadius: "0.8rem",
                      cursor: pdfLoading ? "not-allowed" : "pointer",
                      opacity: pdfLoading ? 0.7 : 1,
                      boxShadow: "0 10px 22px rgba(4,16,60,0.15)",
                      position: "relative",
                      overflow: "hidden",
                      border: "none",
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
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {pdfLoading ? (
                        <>
                          <LoaderCircle className="animate-spin" width="1rem" />
                          <span>({pdfProgress}%)</span>
                        </>
                      ) : (
                        <>
                          <FilePlus color="white" width={"1rem"} />
                          Download PDF
                        </>
                      )}
                    </div>
                  </button>

                  {canEditDocumentEditor &&
                    (!loadedDocId ? (
                      <motion.button
                        onClick={handleSave}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(100 100 100/ 10%)",
                          padding: "0.5rem 1rem",
                          borderRadius: "0.5rem",
                          cursor: "pointer",
                          border: "none",
                        }}
                      >
                        {saving ? <LoaderCircle className="animate-spin" /> : <Save width={"1.25rem"} color="darkblue" />}
                      </motion.button>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "rgba(100 100 100/ 10%)",
                              padding: "0.65rem 1rem",
                              borderRadius: "0.5rem",
                              cursor: "pointer",
                              border: "none",
                            }}
                          >
                            <Save color="darkblue" width={"1.25rem"} />
                            <ChevronDown width={"1rem"} color="darkblue" />
                          </motion.button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={handleSaveChanges}>
                            <Save color="royalblue" className="w-4 mr-2" />
                            <span>Save Changes</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleSave}>
                            <FilePlus2 className="w-4 mr-2" />
                            <span>Save as New</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ))}

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background: "rgba(100 100 100/ 10%)",
                      padding: "0.5rem 0.75rem",
                      border: "none",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setDocumentsDrawerVisible(true);
                      fetchSavedDocuments();
                    }}
                  >
                    <Database color="darkblue" width={"1.25rem"} />
                  </motion.button>
                </div>
              }
            />
            <br />

            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "75svh" }}>
                <LoadingOutlined style={{ color: "darkblue", scale: "2" }} />
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  height: "calc(100vh - 8rem)",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  paddingTop: "5rem",
                  position: "relative",
                }}
              >
                {/* Input Form Section (desktop) */}
                <AnimatePresence>
                  {canEditDocumentEditor && screenWidth >= FORM_PANEL_BREAKPOINT && !hideDesktopInputSection && (
                    <motion.div
                      key="desktop-input-section"
                      initial={{ opacity: 0, x: -28, width: 0 }}
                      animate={{ opacity: 1, x: 0, width: "30%" }}
                      exit={{ opacity: 0, x: -22, width: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: "hidden", flexShrink: 0 }}
                    >
                      <div className="input-form" style={{ ...styles.inputForm, width: "100%", overflow: "auto", maxHeight: "calc(100vh - 8rem - 5rem)" }}>
                        {renderInputForm(false)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Preview Section */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    flex: screenWidth < FORM_PANEL_BREAKPOINT ? "0 1 90%" : "0 1 auto",
                    maxWidth: screenWidth < FORM_PANEL_BREAKPOINT ? "800px" : "100%",
                  }}
                >
                  {renderPreview()}
                </motion.div>

                {/* Floating Pencil Edit Button */}
                {canEditDocumentEditor && (screenWidth < FORM_PANEL_BREAKPOINT || hideDesktopInputSection) && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (screenWidth >= FORM_PANEL_BREAKPOINT && hideDesktopInputSection) {
                        setHideDesktopInputSection(false);
                      } else {
                        setResponsiveFormDrawerOpen(true);
                      }
                    }}
                    style={{
                      position: "fixed",
                      bottom: "2rem",
                      right: "2rem",
                      width: "3.5rem",
                      height: "3.5rem",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, rgba(15, 5, 130, 0.96), rgba(25, 12, 170, 0.94))",
                      border: "1.5px solid rgba(186, 218, 255, 0.5)",
                      color: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 40,
                      boxShadow: "0 8px 24px rgba(37, 99, 235, 0.3)",
                    }}
                  >
                    <Pencil width="1.2rem" />
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>

          {/* AntDrawer left for Drawer form on mobile */}
          {canEditDocumentEditor && (
            <AntDrawer
              style={{ background: "white", color: "black" }}
              title="Document Editor Form"
              placement="left"
              onClose={() => setDrawerVisible(false)}
              open={drawerVisible}
              width="100%"
            >
              {renderInputForm(true)}
            </AntDrawer>
          )}

          {/* Radix Drawer for narrow screen settings form */}
          {canEditDocumentEditor && (
            <Drawer open={responsiveFormDrawerOpen} onOpenChange={setResponsiveFormDrawerOpen}>
              <DrawerContent
                style={{
                  padding: "0.75rem",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  height: "85vh",
                  maxHeight: "85vh",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    width: "100%",
                    overflowY: "auto",
                  }}
                >
                  {renderInputForm(true)}
                </div>
              </DrawerContent>
            </Drawer>
          )}

          {/* Save Preset Dialog */}
          <DefaultDialog
            title={"Save Preset"}
            titleIcon={<Save color="darkblue" />}
            extra={
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Preset Name (e.g. standard loader)"
                  style={inputStyle}
                />
              </div>
            }
            open={presetDialogVisible}
            onCancel={() => setPresetDialogVisible(false)}
            OkButtonText="Save Preset"
            disabled={!presetName.trim()}
            onOk={handleSavePreset}
            updating={loading}
          />

          {/* Bug Report Dialog */}
          <DefaultDialog
            title={"Report a Bug"}
            titleIcon={<Bug color="lightgreen" />}
            extra={
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
                <textarea
                  onChange={(e) => setIssue(e.target.value)}
                  rows={5}
                  value={issue}
                  placeholder="Describe your issue..."
                  style={inputStyle}
                />
              </div>
            }
            open={bugDialog}
            onCancel={() => setBugDialog(false)}
            OkButtonText="Report"
            disabled={!issue.trim()}
            onOk={sendBugReport}
            updating={loading}
          />

          {/* Saved Documents Drawer */}
          <AntDrawer
            title="Saved Documents"
            placement="right"
            onClose={() => setDocumentsDrawerVisible(false)}
            open={documentsDrawerVisible}
            width={window.innerWidth <= 768 ? "100%" : 450}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input
                style={{
                  background: "rgba(100 100 100/0.08)",
                  color: "black",
                  width: "100%",
                  padding: "0.6rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(100 100 100/ 15%)",
                  fontSize: "1rem",
                  outline: "none",
                }}
                placeholder="Search documents by client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div style={{ display: "flex", fontSize: "0.8rem", color: "black", justifyContent: "center", alignItems: "center", gap: "0.3rem" }}>
                {documentsLoading ? (
                  <>
                    <LoaderCircle width={"0.8rem"} color="darkblue" className="animate-spin" />
                    <span>Loading saved docs</span>
                  </>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Dot color="darkblue" /> Loaded {savedDocuments.length} Documents
                  </span>
                )}
              </div>

              {savedDocuments.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FileText />
                    </EmptyMedia>
                    <EmptyTitle>No saved documents yet</EmptyTitle>
                    <EmptyDescription>Save your first invoice or quotation to see it here</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div style={{ maxHeight: "70vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {savedDocuments
                    .filter((d) => (d.clientName || "").toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((d: any) => (
                      <div
                        key={d.id}
                        onClick={() => handleLoadDoc(d.id)}
                        style={{
                          border: "1px solid #eee",
                          borderRadius: 8,
                          padding: 12,
                          cursor: "pointer",
                          background: loadedDocId === d.id ? "rgba(0 0 139/ 4%)" : "white",
                          borderColor: loadedDocId === d.id ? "darkblue" : "#eee",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                          <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>{d.clientName}</span>
                          <span style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.5)" }}>
                            {d.documentType.toUpperCase()} | Ref: {d.refNo}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            Modal.confirm({
                              title: "Delete Document",
                              content: "Are you sure you want to delete this document?",
                              okText: "Yes",
                              okType: "danger",
                              cancelText: "No",
                              onOk: () => handleDeleteDoc(d.id),
                            });
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "red",
                          }}
                        >
                          {deleting ? <LoaderCircle className="animate-spin" width="1rem" /> : <MinusCircle width="1rem" />}
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </AntDrawer>
        </div>
      </div>

      {/* Page styling elements */}
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
      `}</style>
    </>
  );
}
