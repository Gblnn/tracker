import Back from "@/components/back";
import { Checkbox } from "@/components/ui/checkbox";
import DefaultDialog from "@/components/ui/default-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Drawer, Input, message, Modal } from "antd";
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
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Bug,
  ChevronDown,
  Database,
  Dot,
  FilePlus2,
  FileText,
  FileX,
  Loader2,
  LoaderCircle,
  Menu,
  MinusCircle,
  MoreVertical,
  Plus,
  RefreshCcw,
  Save,
  Sparkles,
  TextCursor,
  Trash2,
} from "lucide-react";
import moment from "moment";
import { useEffect, useRef, useState } from "react";

// Add styles at the top of the file
const styles = {
  mobileMenuButton: {
    display: "none",
  },
  inputForm: {
    width: "30%",
    // background: "rgba(255 255 255/ 5%)",
    borderRadius: "0.5rem",
  },
  preview: {
    flex: 1,
    // background: "rgba(255 255 255/ 5%)",
    borderRadius: "0.5rem",
  },
};

// Input style for all fields
const inputStyle = {
  fontSize: "1rem",
};

// Table cell style for preview
const tableCellStyle = {
  border: "1px solid rgba(100 100 100/ 50%)",
  padding: "8px 12px",
  fontSize: "0.75rem",
  verticalAlign: "top",
  fontFamily: "",
  background: "#fff",
};

type FormData = {
  date: string;
  refNo: string;
  candidateName: string;
  position: string;
  workLocation: string;
  salary: string;
  allowance: string;
  grossSalary: string;
  attendance: string;
  probation: string;
  reportingDate: string;
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
  jobSummary: string;
  responsibilities: string;
  roles: Array<{ title: string; description: string }>;
  allowances: Array<{ title: string; description: string }>;
};

type Preset = {
  id: string;
  name: string;
  data: FormData;
  created_at: any;
};

export default function OfferLetters() {
  //   const usenavigate = useNavigate();
const [searchTerm, setSearchTerm] = useState("");
  const [bugDialog, setBugDialog] = useState(false);
  const [issue, setIssue] = useState("");
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const getNextReferenceNumber = (existingLetters: Array<{refNo?: string}>) => {
    // Extract existing reference numbers and find the highest one
    const numbers = existingLetters
      .map((letter: {refNo?: string}) => {
        const match = letter.refNo?.match(/SSU\/HO\/(\d+)\/\d+/);
        return match ? parseInt(match[1]) : 316;  // Start from 316 if no matches found
      })
      .filter((num: number) => !isNaN(num));

    const highestNumber = Math.max(316, ...numbers);
    // Format: SSU/HO/XXX/YY where XXX is sequential and YY is last two digits of year
    const year = new Date().getFullYear().toString().slice(-2);
    const nextNumber = (highestNumber + 1).toString();
    return `SSU/HO/${nextNumber}/${year}`;
  };

  const [formData, setFormData] = useState<FormData>({
    date: Date(),
    refNo: "",
    candidateName: "",
    position: "",
    workLocation: "",
    salary: "",
    allowance: "",
    grossSalary: "",
    attendance: "",
    probation: "",
    reportingDate: "",
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
    jobSummary: "",
    responsibilities: "",
    roles: [],
    allowances: [],
  });

  useEffect(() => {
    // Fetch letters and set initial reference number when component mounts
    fetchOfferLetters();
  }, []);

  const tableRef = useRef<HTMLDivElement>(null);
  const rolesRef = useRef<HTMLDivElement>(null);
  const restRef = useRef<HTMLDivElement>(null);
  const signatureRef = useRef<HTMLDivElement>(null);
  const lastRoleRef = useRef<HTMLDivElement>(null);
  const lastAllowanceRef = useRef<HTMLDivElement>(null);
  const lastSubsectionRef = useRef<HTMLDivElement>(null);

  const serviceId = "service_fixajl8";
  const templateId = "template_0f3zy3e";

  const [offerLettersDrawerVisible, setOfferLettersDrawerVisible] =
    useState(false);
  const [offerLetters, setOfferLetters] = useState<any[]>([]);
  const [offerLettersLoading, setOfferLettersLoading] = useState(false);
  const [editingLetter, setEditingLetter] = useState<any>(null);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedLetterId, setLoadedLetterId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<any>(null);
  const [air_passage, setAirPassage] = useState(true);
  const [comm, setComm] = useState(true);
  const [visaS, setVisaS] = useState(true);
  const [offerLettersCache, setOfferLettersCache] = useState<any[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [presetName, setPresetName] = useState("");
  const [presetDialogVisible, setPresetDialogVisible] = useState(false);
  const [renameDialogVisible, setRenameDialogVisible] = useState(false);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [originalPresetData, setOriginalPresetData] = useState<FormData | null>(
    null
  );
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [joiningDate, setJoiningDate] = useState(true);

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

  const fetchPresets = async () => {
    try {
      setPresetsLoading(true);
      const q = query(
        collection(db, "offer_letter_presets"),
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
        created_at: Timestamp.now(),
      };

      await addDoc(collection(db, "offer_letter_presets"), newPreset);
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

  const handleLoadPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      // Merge the preset data with the current date
      setFormData({
        ...preset.data,
        date: formData.date, // Keep the current date
      });
      setSelectedPreset(presetId);
      setOriginalPresetData(preset.data);
      setHasChanges(false);
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, "offer_letter_presets", presetId));
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

  const handleUpdatePreset = async () => {
    if (!selectedPreset || !hasChanges) return;

    try {
      setLoading(true);
      // Create a copy of formData without the date field
      const { date, ...presetData } = formData;

      await updateDoc(doc(db, "offer_letter_presets", selectedPreset), {
        data: presetData,
      });
      message.success("Preset updated successfully");
      setHasChanges(false);
      // Add the current date back to the preset data for state management
      setOriginalPresetData({ ...presetData, date: formData.date });
      fetchPresets();
    } catch (err) {
      message.error("Failed to update preset");
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

  const handleAddNoticePeriodSubsection = () => {
    setFormData((prev) => ({
      ...prev,
      noticePeriodSubsections: [...prev.noticePeriodSubsections, ""],
    }));
    // Scroll after a small delay to ensure the new input is rendered
    setTimeout(() => {
      lastSubsectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  const handleRemoveNoticePeriodSubsection = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      noticePeriodSubsections: prev.noticePeriodSubsections.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const handleNoticePeriodSubsectionChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      noticePeriodSubsections: prev.noticePeriodSubsections.map(
        (subsection, i) => (i === index ? value : subsection)
      ),
    }));
  };

  const handleAllowanceChange = (
    index: number,
    field: "title" | "description",
    value: string
  ) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        allowances: prev.allowances.map((role, i) =>
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

  const handleAddAllowance = () => {
    setFormData((prev) => ({
      ...prev,
      allowances: [...prev.allowances, { title: "", description: "" }],
    }));
    // Scroll after a small delay to ensure the new input is rendered
    setTimeout(() => {
      lastAllowanceRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  const handleRemoveAllowance = (index: number) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        allowances: prev.allowances.filter((_, i) => i !== index),
      };
      if (originalFormData) {
        const hasChanges =
          JSON.stringify(newData) !== JSON.stringify(originalFormData);
        setHasChanges(hasChanges);
      }
      return newData;
    });
  };

  const handleAddRole = () => {
    setFormData((prev) => ({
      ...prev,
      roles: [...prev.roles, { title: "", description: "" }],
    }));
    // Scroll after a small delay to ensure the new input is rendered
    setTimeout(() => {
      lastRoleRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  const handleRemoveRole = (index: number) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        roles: prev.roles.filter((_, i) => i !== index),
      };
      if (originalFormData) {
        const hasChanges =
          JSON.stringify(newData) !== JSON.stringify(originalFormData);
        setHasChanges(hasChanges);
      }
      return newData;
    });
  };

  const fetchOfferLetters = async () => {
    // Immediately show cached letters if available
    if (offerLettersCache.length > 0) {
      setOfferLetters(offerLettersCache);
      // Set next reference number if form is empty
      if (!formData.refNo) {
        const nextRef = getNextReferenceNumber(offerLettersCache);
        setFormData(prev => ({...prev, refNo: nextRef}));
      }
    }

    setOfferLettersLoading(true);
    try {
      const q = query(
        collection(db, "offer_letters"),
        orderBy("generated_at", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      // Set next reference number if form is empty
      if (!formData.refNo) {
        const nextRef = getNextReferenceNumber(
          data.map((letter: any) => ({ refNo: letter.refNo }))
        );
        setFormData(prev => ({...prev, refNo: nextRef}));
      }

      // Merge new letters with cached ones, avoiding duplicates
      const mergedLetters = [...data];
      offerLettersCache.forEach((cachedLetter) => {
        if (!mergedLetters.some((letter) => letter.id === cachedLetter.id)) {
          mergedLetters.push(cachedLetter);
        }
      });

      // Sort by generated_at
      // mergedLetters.sort((a, b) => {
      //   const dateA = a.generated_at?.toDate?.() || new Date(0);
      //   const dateB = b.generated_at?.toDate?.() || new Date(0);
      //   return dateB.getTime() - dateA.getTime();
      // });

      setOfferLetters(mergedLetters);
      setOfferLettersCache(mergedLetters);
    } catch (err) {
      message.error("Failed to fetch offer letters");
    } finally {
      setOfferLettersLoading(false);
    }
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
      
      const newLetter = {
        ...formData,
        refNo: nextRef,  // Use the new reference number
        air_passage: air_passage,
        comm: comm,
        visaS: visaS,
        joiningDate: joiningDate,
        generated_at: Timestamp.now(),
        generated_by: auth.currentUser?.email || null,
      };

      console.log("Attempting to save letter:", newLetter);

      // Always create a new document, regardless of loadedLetterId
      const docRef = await addDoc(collection(db, "offer_letters"), newLetter);
      console.log("Document saved with ID:", docRef.id);

      const savedLetter = { id: docRef.id, ...newLetter };

      // Update cache with new letter
      const updatedCache = [savedLetter, ...offerLettersCache];
      setOfferLettersCache(updatedCache);
      setOfferLetters(updatedCache);

      message.success(`Offer letter saved successfully with reference number: ${nextRef}`);

      // Reset form state after saving
      setLoadedLetterId(docRef.id);
      setHasChanges(false);
      setOriginalFormData(null);
    } catch (error) {
      console.error("Error saving offer letter:", error);
      message.error(
        error instanceof Error ? error.message : "Failed to save offer letter"
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePrintPDF = async () => {
    setPdfLoading(true);
    try {
      const tableNode = tableRef.current;
      const rolesNode = rolesRef.current;
      const restNode = restRef.current;
      const signatureNode = signatureRef.current;
      if (!tableNode || !restNode || !signatureNode) {
        message.error("Failed to generate PDF: missing sections");
        setPdfLoading(false);
        return;
      }

      // Render table (page 1)
      const tableCanvas = await html2canvas(tableNode, { scale: 2 });
      const tableImgData = tableCanvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "px", format: "a4", userUnit:1000 });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const tableProps = pdf.getImageProperties(tableImgData);
      const tableHeight = (tableProps.height * pageWidth) / tableProps.width;
      pdf.addImage(tableImgData, "PNG", 0, 0, pageWidth, tableHeight);

      // Render roles (page 2) if present
      if (rolesNode) {
        const rolesCanvas = await html2canvas(rolesNode, { scale: 2 });
        const rolesImgData = rolesCanvas.toDataURL("image/png");
        pdf.addPage();
        const rolesProps = pdf.getImageProperties(rolesImgData);
        const rolesHeight = (rolesProps.height * pageWidth) / rolesProps.width;
        pdf.addImage(rolesImgData, "PNG", 0, 0, pageWidth, rolesHeight);
      }

      // Render rest (page 3)
      const restCanvas = await html2canvas(restNode, { scale: 2 });
      const restImgData = restCanvas.toDataURL("image/png");
      pdf.addPage();
      const restProps = pdf.getImageProperties(restImgData);
      const restHeight = (restProps.height * pageWidth) / restProps.width;
      pdf.addImage(restImgData, "PNG", 0, 0, pageWidth, restHeight);

      // Render signatures (page 4)
      if (signatureNode) {
        const signatureCanvas = await html2canvas(signatureNode, { scale: 2 });
        const signatureImgData = signatureCanvas.toDataURL("image/png");
        pdf.addPage();
        const signatureProps = pdf.getImageProperties(signatureImgData);
        const signatureHeight =
          (signatureProps.height * pageWidth) / signatureProps.width;
        pdf.addImage(signatureImgData, "PNG", 0, 0, pageWidth, signatureHeight);
      }

      pdf.save(`Offer_Letter_${formData.candidateName || "Candidate"}.pdf`);
    } catch (err) {
      message.error("Failed to generate PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleEditLetter = async () => {
    if (!editingLetter?.id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "offer_letters", editingLetter.id), {
        ...editingLetter,
        updated_at: Timestamp.now(),
      });
      message.success("Offer letter updated");
      setEditDialogVisible(false);
      fetchOfferLetters();
    } catch (err) {
      message.error("Failed to update offer letter");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLetter = async (id: string) => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "offer_letters", id));

      // Update cache by removing deleted letter
      const updatedCache = offerLettersCache.filter(
        (letter) => letter.id !== id
      );
      setOfferLettersCache(updatedCache);
      setOfferLetters(updatedCache);

      message.success("Offer letter deleted");
    } catch (err) {
      message.error("Failed to delete offer letter");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!loadedLetterId) return;

    try {
      setSaving(true);
      const letterRef = doc(db, "offer_letters", loadedLetterId);

      // Create a copy of formData without the date field for the preset
      const { date, ...presetData } = formData;

      await updateDoc(letterRef, {
        ...presetData,
        air_passage: air_passage,
        comm: comm,
        visaS: visaS,
        joiningDate: joiningDate,
        generated_at: Timestamp.now(),
        generated_by: auth.currentUser?.email || null,
      });

      // Update the original form data to match the new state
      setOriginalFormData({
        ...formData,
        air_passage: air_passage,
        comm: comm,
        visaS: visaS,
        joiningDate: joiningDate,
      });

      setHasChanges(false);
      message.success("Offer letter updated successfully");

      // Refresh the offer letters list
      fetchOfferLetters();
    } catch (error) {
      console.error("Error updating offer letter:", error);
      message.error("Failed to update offer letter");
    } finally {
      setSaving(false);
    }
  };

  const handleLetterClick = (ol: any) => {
    setFormData({
      date: ol.date,
      refNo: ol.refNo,
      candidateName: ol.candidateName,
      position: ol.position,
      workLocation: ol.workLocation,
      salary: ol.salary,
      allowance: ol.allowance,
      grossSalary: ol.grossSalary,
      attendance: ol.attendance,
      probation: ol.probation,
      reportingDate: ol.reportingDate,
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
      jobSummary: ol.jobSummary,
      responsibilities: ol.responsibilities,
      roles: ol.roles,
      allowances: ol.allowances,
    });
    setAirPassage(ol.air_passage);
    setComm(ol.comm);
    setVisaS(ol.visaS);
    setJoiningDate(ol.joiningDate);
    setOriginalFormData(ol);
    setLoadedLetterId(ol.id);
    // Reset preset related states
    setSelectedPreset("");
    setOriginalPresetData(null);
    setHasChanges(false);
    setOfferLettersDrawerVisible(false);
  };

  const handleClearForm = () => {
    const currentDate = new Date().toLocaleDateString();
    // Get the next reference number
    const nextRef = getNextReferenceNumber(offerLetters);
    setFormData({
      date: currentDate,
      refNo: nextRef,
      candidateName: "",
      position: "",
      workLocation: "",
      salary: "",
      allowance: "",
      grossSalary: "",
      attendance: "",
      probation: "",
      reportingDate: "",
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
      jobSummary: "",
      responsibilities: "",
      roles: [{ title: "", description: "" }],
      allowances: [{ title: "", description: "" }],
    });
    setSelectedPreset("");
    setOriginalPresetData(null);
    setHasChanges(false);
    setLoadedLetterId(null);
    setOriginalFormData(null);
  };

  const renderInputForm = () => (
    <div
      style={{
        position: "fixed",
        border: "",
        padding: "",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        height: "100%",
        overflowY: "auto",
        fontSize: "0.8rem",
        maxHeight: "72%",
      }}
    >
      <div
        style={{
          width: "",
          display: "flex",
          padding: "1.25rem",
          border: "",
          backdropFilter: "blur(16px)",
          borderTopLeftRadius: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* <File /> */}
          <h2>Offer Letter </h2>
        </div>
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
          }}
        >
          <FileX color="indianred" width="0.9rem" />
          Clear Form
        </button>
      </div>

      <div
        style={{
          padding: "1.5rem",
          display: "flex",
          flexFlow: "column",
          gap: "0.75rem",
          paddingTop: "",
        }}
      >
        {/* Add Presets section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            marginBottom: "1.5rem",
            padding: "0.75rem",
            background: "rgba(100 100 100/ 5%)",
            borderRadius: "0.75rem",
            // border: "1px solid rgba(100 100 100/ 10%)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.9rem",
                fontWeight: "500",
                color: "",
              }}
            >
              <FileText width="1rem" color="mediumslateblue" />
              <span>Presets</span>
              <div style={{ width: "7rem" }}></div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => setPresetDialogVisible(true)}
                style={{
                  background: "rgba(100 100 100/ 10%)",
                  color: "mediumslateblue",
                  border: "none",
                  padding: "0.15rem 0.75rem",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "all 0.2s ease",
                }}
                
              >
                <Plus width={"0.8rem"} />
                Add New
              </button>
              {/* <button
                onClick={handleClearForm}
                style={{ padding: "0.15rem 0.75rem", fontSize: "0.75rem" }}
              >
                Clear
              </button> */}
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Select value={selectedPreset} onValueChange={handleLoadPreset}>
              <SelectTrigger
                disabled={presetsLoading}
                className="w-full h-[38px]"
                style={{ display: "flex", alignItems: "center" }}
              >
                {presetsLoading && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Fetching</span>
                  </div>
                )}
                {!presetsLoading && (
                  <SelectValue placeholder="Select a preset" />
                )}
              </SelectTrigger>
              <SelectContent
                position="popper"
                className=""
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  border: "",
                }}
              >
                {presets.map((preset) => (
                  <SelectItem
                    style={{ display: "flex", justifyContent: "flex-start" }}
                    key={preset.id}
                    value={preset.id}
                  >
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPreset && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "none",
                      fontSize: "0.75rem",
                      border: "1px solid rgba(100 100 100/ 40%)",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      height: "2.45rem",
                      willChange: "transform",
                    }}
                  >
                    <MoreVertical color="mediumslateblue" width={"0.8rem"} />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    className="hover:bg-slate-800"
                    style={{
                      borderRadius: "0.25rem",
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                      fontSize: "",
                      padding: "0.45rem",
                    }}
                    // onClick={() => setRenameDialogVisible(true)}
                  >
                    <TextCursor className="w-4" />
                    <span>Rename</span>
                    <p></p>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    style={{ display: "flex", justifyContent: "space-between" }}
                    onClick={handleUpdatePreset}
                    disabled={!hasChanges}
                    className={
                      !hasChanges ? "opacity-50 cursor-not-allowed" : ""
                    }
                  >
                    <RefreshCcw color="mediumslateblue" className="w-4" />
                    <span>Update</span>
                    <p></p>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    style={{ display: "flex", justifyContent: "space-between" }}
                    onClick={() => {
                      setDeleteId(selectedPreset);
                      setDeleteDialogVisible(true);
                    }}
                    className="text-red-500"
                  >
                    <Trash2 className="w-4" />
                    <span>Delete</span>
                    <p></p>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginTop: "0.5rem",
              fontSize: "0.6rem",
              flexFlow: "",
            }}
          >
            <button
              onClick={handleUpdatePreset}
              disabled={!selectedPreset || !hasChanges}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(100 100 100/ 40%)",
                color: "",
                border: "none",
                padding: "0.45rem 1rem",
                borderRadius: "0.5rem",
                cursor:
                  selectedPreset && hasChanges ? "pointer" : "not-allowed",
                opacity: selectedPreset && hasChanges ? 1 : 0.5,
                transition: "all 0.2s ease",
                flex: 1,
                justifyContent: "center",
                fontSize: "0.8rem",
              }}
              onMouseOver={(e) => {
                if (selectedPreset && hasChanges) {
                  e.currentTarget.style.background = "rgba(100 100 100/ 60%)";
                }
              }}
              onMouseOut={(e) => {
                if (selectedPreset && hasChanges) {
                  e.currentTarget.style.background = "rgba(100 100 100/ 40%)";
                }
              }}
            >
              <RefreshCcw color="mediumslateblue" width={"0.8rem"} />
              Update
            </button>
            <button
              onClick={() => {
                if (selectedPreset) {
                  setDeleteDialogVisible(true);
                  setDeleteId(selectedPreset);
                }
              }}
              disabled={!selectedPreset}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(100 100 100/ 40%)",
                color: "",
                border: "none",
                padding: "0.25rem 1rem",
                borderRadius: "0.5rem",
                cursor: selectedPreset ? "pointer" : "not-allowed",
                opacity: selectedPreset ? 1 : 0.5,
                transition: "all 0.2s ease",
                flex: 1,
                justifyContent: "center",
                fontSize: "0.8rem",
              }}
              onMouseOver={(e) => {
                if (selectedPreset) {
                  e.currentTarget.style.background = "rgba(100 100 100/ 60%)";
                }
              }}
              onMouseOut={(e) => {
                if (selectedPreset) {
                  e.currentTarget.style.background = "rgba(100 100 100/ 40%)";
                }
              }}
            >
              <X color="indianred" width={"0.8rem"} />
              Delete Preset
            </button>
          </div> */}
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Reference Number</label>
          <input
            type="text"
            name="refNo"
            value={formData.refNo}
            onChange={handleInputChange}
            placeholder="Enter Reference Number"
            style={inputStyle}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <label>Candidate Name</label>
          <input
            type="text"
            name="candidateName"
            value={formData.candidateName}
            onChange={handleInputChange}
            placeholder="Enter candidate name"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Job Title</label>
          <input
            type="text"
            name="position"
            value={formData.position}
            onChange={handleInputChange}
            placeholder="Enter Job Title"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Location</label>
          <input
            type="text"
            name="workLocation"
            value={formData.workLocation}
            onChange={handleInputChange}
            placeholder="Enter work location"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Basic Salary (OMR)</label>
          <input
            type="number"
            name="salary"
            value={formData.salary}
            onChange={handleInputChange}
            placeholder="Enter salary"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Allowance (OMR)</label>
          <input
            type="number"
            name="allowance"
            value={formData.allowance}
            onChange={handleInputChange}
            placeholder="Enter Allowance"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "",
              marginTop: "0.5rem",
            }}
          >
            <h3 style={{ fontSize: "0.8rem" }}>Additional Allowances</h3>
          </div>
          <AnimatePresence mode="sync">
            {formData.allowances.map((role, index) => (
              <motion.div
                key={index}
                ref={
                  index === formData.allowances.length - 1
                    ? lastAllowanceRef
                    : null
                }
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  duration: 0.15,
                  ease: [0.4, 0, 0.2, 1],
                }}
                style={{
                  display: "flex",
                  flexFlow: "column",
                  border: "1px solid rgba(100 100 100/ 20%)",
                  borderRadius: "0.5rem",
                  padding: "0.45rem",
                  marginBottom: "0.5rem",
                  background: "rgba(100 100 100/ 5%)",
                  willChange: "transform, opacity",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <input
                    type="text"
                    name={`role-title-${index}`}
                    value={role.title}
                    onChange={(e) =>
                      handleAllowanceChange(index, "title", e.target.value)
                    }
                    placeholder="Enter Allowance type"
                    style={{ fontSize: "0.95rem", background: "" }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRemoveAllowance(index)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(100 100 100/ 10%)",
                      color: "indianred",
                      border: "none",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.45rem",
                      cursor: "pointer",
                      fontSize: "0.95rem",
                      marginLeft: "",
                      willChange: "transform",
                    }}
                  >
                    <MinusCircle width={"1rem"} />
                  </motion.button>
                </div>
                <input
                  name={`role-description-${index}`}
                  value={role.description}
                  onChange={(e) =>
                    handleAllowanceChange(index, "description", e.target.value)
                  }
                  placeholder="Enter Allowance Amount"
                  style={{
                    width: "100%",
                    fontSize: "0.95rem",
                    background: "",
                    borderRadius: "0.5rem",
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddAllowance}
            style={{
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              background: "rgba(100 100 100/ 10%)",
              color: "mediumslateblue",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              cursor: "pointer",
              width: "100%",
              marginTop: "0.5rem",
              willChange: "transform",
            }}
          >
            <Plus width={"0.8rem"} />
            Add Allowance
          </motion.button>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Attendance</label>
          <textarea
            rows={4}
            name="attendance"
            value={formData.attendance}
            onChange={handleInputChange}
            placeholder="Enter Attendance Terms"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Probation</label>
          <textarea
            rows={4}
            name="probation"
            value={formData.probation}
            onChange={handleInputChange}
            placeholder="Enter Probation Terms"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <div style={{ display: "flex", justifyContent: "", gap: "0.5rem" }}>
            <Checkbox
              checked={joiningDate}
              onClick={() => {
                setJoiningDate(!joiningDate);
                setHasChanges(true);
              }}
            />
            <label>Joining Date</label>
          </div>

          <input
            type="date"
            name="reportingDate"
            value={formData.reportingDate}
            onChange={handleInputChange}
            placeholder="Enter Reporting Date"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Contract Period</label>
          <textarea
            rows={4}
            name="contractPeriod"
            value={formData.contractPeriod}
            onChange={handleInputChange}
            placeholder="Enter Contract Period"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Notice Period</label>
          <textarea
            rows={4}
            name="noticePeriod"
            value={formData.noticePeriod}
            onChange={handleInputChange}
            placeholder="Enter Notice Period"
            style={inputStyle}
          />
          <div style={{ marginTop: "0.5rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              <label
                style={{ fontSize: "0.7rem", fontWeight: 500, opacity: 0.8 }}
              >
                Sub-sections
              </label>
            </div>
            <AnimatePresence mode="sync">
              {formData.noticePeriodSubsections.map((subsection, index) => (
                <motion.div
                  key={index}
                  ref={
                    index === formData.noticePeriodSubsections.length - 1
                      ? lastSubsectionRef
                      : null
                  }
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{
                    duration: 0.15,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    border: "1px solid rgba(100 100 100/ 20%)",
                    borderRadius: "0.75rem",
                    padding: "0.35rem",
                    marginBottom: "0.75rem",
                    background: "rgba(100 100 100/ 5%)",
                    willChange: "transform, opacity",
                  }}
                >
                  <input
                    value={subsection}
                    onChange={(e) =>
                      handleNoticePeriodSubsectionChange(index, e.target.value)
                    }
                    placeholder="Enter sub-section content"
                    style={{
                      fontSize: "1rem",
                      background: "none",
                    }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRemoveNoticePeriodSubsection(index)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(100 100 100/ 10%)",
                      color: "indianred",
                      border: "none",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.45rem",
                      cursor: "pointer",
                      fontSize: "0.95rem",
                      willChange: "transform",
                    }}
                  >
                    <MinusCircle width={"1rem"} />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddNoticePeriodSubsection}
              style={{
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                background: "rgba(100 100 100/ 10%)",
                color: "mediumslateblue",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                cursor: "pointer",
                width: "100%",
                marginTop: "0.5rem",
                willChange: "transform",
              }}
            >
              <Plus width={"0.8rem"} />
              Add Sub-section
            </motion.button>
          </div>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Accomodation</label>
          <textarea
            rows={4}
            name="accomodation"
            value={formData.accomodation}
            onChange={handleInputChange}
            placeholder="Enter Accomodation Terms"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Food</label>
          <textarea
            rows={4}
            name="food"
            value={formData.food}
            onChange={handleInputChange}
            placeholder="Enter Food Terms"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Transport</label>
          <textarea
            rows={4}
            name="transport"
            value={formData.transport}
            onChange={handleInputChange}
            placeholder="Enter Transport Terms"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <div style={{ display: "flex", justifyContent: "", gap: "0.5rem" }}>
            <Checkbox
              checked={comm}
              onClick={() => {
                setComm(!comm);
                setHasChanges(true);
              }}
            />
            <label>Communications</label>
          </div>

          <textarea
            rows={4}
            name="communication"
            value={formData.communication}
            onChange={handleInputChange}
            placeholder="Enter Communication Terms"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Insurance</label>
          <textarea
            rows={4}
            name="insurance"
            value={formData.insurance}
            onChange={handleInputChange}
            placeholder="Enter Insurance Terms"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Annual Leave</label>
          <input
            type="text"
            name="annualLeave"
            value={formData.annualLeave}
            onChange={handleInputChange}
            placeholder="Enter Annual Leave Terms"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Gratuity</label>
          <input
            type="text"
            name="gratuity"
            value={formData.gratuity}
            onChange={handleInputChange}
            placeholder="Enter Gratuity"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Leave Encashment</label>
          <input
            type="text"
            name="leaveEncashment"
            value={formData.leaveEncashment}
            onChange={handleInputChange}
            placeholder="Enter Leave Encashment Terms"
            style={inputStyle}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label>Working Hours</label>
          <input
            type="text"
            name="workingHours"
            value={formData.workingHours}
            onChange={handleInputChange}
            placeholder="Enter Working Terms"
            style={inputStyle}
          />
        </div>
        <br />

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <h3 style={{ fontSize: "1rem" }}>Roles & Responsibilities</h3>
          </div>
          <AnimatePresence mode="sync">
            {formData.roles.map((role, index) => (
              <motion.div
                key={index}
                ref={index === formData.roles.length - 1 ? lastRoleRef : null}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  duration: 0.15,
                  ease: [0.4, 0, 0.2, 1],
                }}
                style={{
                  display: "flex",
                  flexFlow: "column",
                  border: "1px solid rgba(100 100 100/ 20%)",
                  borderRadius: "0.5rem",
                  padding: "0.45rem",
                  marginBottom: "0.5rem",
                  background: "rgba(100 100 100/ 5%)",
                  willChange: "transform, opacity",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <input
                    type="text"
                    name={`role-title-${index}`}
                    value={role.title}
                    onChange={(e) =>
                      handleRoleChange(index, "title", e.target.value)
                    }
                    placeholder="Enter role title"
                    style={{ fontSize: "0.95rem", background: "" }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRemoveRole(index)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(100 100 100/ 10%)",
                      color: "indianred",
                      border: "none",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.45rem",
                      cursor: "pointer",
                      fontSize: "0.95rem",
                      marginLeft: "",
                      willChange: "transform",
                    }}
                  >
                    <MinusCircle width={"1rem"} />
                  </motion.button>
                </div>
                <textarea
                  name={`role-description-${index}`}
                  value={role.description}
                  onChange={(e) =>
                    handleRoleChange(index, "description", e.target.value)
                  }
                  placeholder="Enter role description"
                  style={{
                    width: "100%",
                    fontSize: "0.95rem",
                    background: "none",
                    borderRadius: "0.5rem",
                  }}
                  rows={5}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddRole}
            style={{
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              background: "rgba(100 100 100/ 10%)",
              color: "mediumslateblue",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              cursor: "pointer",
              width: "100%",
              marginTop: "0.5rem",
              willChange: "transform",
            }}
          >
            <Plus width={"0.8rem"} />
            Add Role
          </motion.button>
        </div>
        <br />

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <div style={{ display: "flex", justifyContent: "", gap: "0.5rem" }}>
            <Checkbox
              checked={air_passage}
              onClick={() => {
                setAirPassage(!air_passage);
                setHasChanges(true);
              }}
            />
            <label>Air Passage</label>
          </div>

          <textarea
            rows={4}
            name="airPassage"
            value={formData.airPassage}
            onChange={handleInputChange}
            placeholder="Enter Air Passage Terms"
            style={inputStyle}
          />
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <div style={{ display: "flex", justifyContent: "", gap: "0.5rem" }}>
            <Checkbox
              checked={visaS}
              onClick={() => {
                setVisaS(!visaS);
                setHasChanges(true);
              }}
            />
            <label>Visa Status</label>
          </div>
          <textarea
            rows={4}
            name="visaStatus"
            value={formData.visaStatus}
            onChange={handleInputChange}
            placeholder="Enter Visa Terms"
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );

  const renderPreview = () => (
    <ScrollArea>
      {/* Page 1: Table only */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          alignItems: "center",
          marginBottom: "1rem",
          marginLeft: "1rem",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* <Eye />
          <h2>Preview</h2> */}
          {/* {loadedLetterId && (
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              {saving ? (
                <LoaderCircle className="animate-spin" width={"1rem"} />
              ) : (
                <Database width={"1rem"} color="mediumslateblue" />
              )}
              <p
                style={{ textTransform: "uppercase", letterSpacing: "0.05rem" }}
              >
                {formData.candidateName}
              </p>
            </div>
          )} */}
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            style={{ width: "fit-content" }}
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            placeholder="Enter Date"
          ></input>
          {
            // <button
            //   onClick={handleSave}
            //   style={{
            //     background: "rgba(100 100 100/ 40%)",
            //     fontSize: "0.8rem",
            //     padding: "0.5rem 1rem ",
            //   }}
            // >
            //   {saving ? (
            //     <LoaderCircle width={"1rem"} className="animate-spin" />
            //   ) : !loadedLetterId ? (
            //     <Plus width={"1rem"} color="mediumslateblue" />
            //   ) : (
            //     <Plus width={"1rem"} color="mediumslateblue" />
            //   )}
            //   {saving
            //     ? "Saving"
            //     : !loadedLetterId
            //     ? "Add to Database"
            //     : "Save as New"}
            // </button>
          }
        </div>
      </div>

      <div
        ref={tableRef}
        style={{
                border: "",
          width: "100%",
          maxWidth: 800,
          boxSizing: "border-box",
          padding: "4rem",
          background: "url(/letter-head.png)",
          backgroundSize: "contain",
          backgroundPosition:"center",
          color: "black",
          borderRadius: "0.5rem",
          // boxShadow: "0 0 10px rgba(0 0 0/ 10%)",
          minHeight: "1100px",
          fontFamily: "Aptos",
          fontSize: "0.8rem",
          margin: "1 auto",
          overflowX: "auto",
        }}
      >
        {/* <div
          style={{
            position: "absolute",
            border: "",
            width: "100%",
            top: 0,
            left: 0,
            display: "flex",
            justifyContent: "center",
            marginTop: "2.5rem",
          }}
        >
          <img
            src="/sohar_star_logo.png"
            style={{
              width: "4rem",
              // position: "absolute",
              // top: 0,
              // left: 0,
              // margin: "2rem",
            }}
          />
        </div> */}

        <br />
        <br />
        <br />
        <br />
        <br/>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {
            <p style={{ fontWeight: 600, textTransform: "uppercase" }}>
              {formData.refNo && "REF: " + formData.refNo}
            </p>
          }

          <p style={{ fontWeight: 600 }}>
            {moment(new Date(formData.date)).format("DD/MM/YYYY")}
          </p>
        </div>
        {/* Title */}
        <h2
          style={{
            textAlign: "center",
            fontWeight: "",
            fontSize: "1rem",
            marginBottom: "1rem",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          JOB OFFER LETTER
        </h2>
        {/* Intro Paragraph */}
        <p
          style={{
            marginBottom: "1.25rem",
            textAlign: "justify",
            fontSize: "0.8rem",
          }}
        >
          We at <b>Sohar Star United LLC</b>, Sohar, Sultanate of Oman, are
          delighted to offer you the position of{" "}
          <b style={{ textTransform: "uppercase" }}>
            {formData.position || "[Position]"}
          </b>{" "}
          in the organization, subject to the following terms and conditions:
        </p>
        {/* Details Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "2rem",
            fontSize: "0.9rem",
            border: "1px solid",
            textTransform: "uppercase",
        
          }}
        >
          <tbody style={{}}>
            <tr style={{ fontSize: "0.8rem" }}>
              <td style={tableCellStyle}>Name</td>
              <td style={tableCellStyle}>
                {formData.candidateName || "[Candidate Name]"}
              </td>
            </tr>
            <tr>
              <td style={tableCellStyle}>Job Title</td>
              <td style={tableCellStyle}>
                {formData.position || "[Position]"}
              </td>
            </tr>

            <tr>
              <td style={tableCellStyle}>Place of Work</td>
              <td style={tableCellStyle}>
                {formData.workLocation || "Anywhere in Oman"}
              </td>
            </tr>
            <tr>
              <td style={tableCellStyle}>Basic Salary</td>
              <td style={tableCellStyle}>
                OMR {formData.salary || "[Basic Salary]"}
              </td>
            </tr>
            {formData.allowance && (
              <tr>
                <td style={tableCellStyle}>Allowance</td>
                <td style={tableCellStyle}>{formData.allowance || "N/A"}</td>
              </tr>
            )}

            {formData.allowances.length > 0 &&
              formData.allowances.map((role, index) => (
                <tr key={index}>
                  <td style={tableCellStyle}>
                    {role.title || "[ALLOWANCE TYPE]"}
                  </td>
                  <td style={tableCellStyle}>
                    {role.description || "[ALLOWANCE AMOUNT]"}
                  </td>
                </tr>
              ))}
            <tr>
              <td style={tableCellStyle}>Gross Salary</td>
              <td style={tableCellStyle}>
                OMR{" "}
                {(formData.allowances?.reduce(
                  (sum: number, a: any) => sum + Number(a.description),
                  0
                ) || 0) +
                  Number(formData.salary) +
                  Number(
                    formData.allowances.length > 0 ? 0 : formData.allowance
                  ) +
                  " (Monthly)" || "[Gross Salary]"}
              </td>
            </tr>
            <tr>
              <td style={tableCellStyle}>
                Site/ Office Attendance, including overtime
              </td>
              <td style={tableCellStyle}>{formData.attendance || "N/A"}</td>
            </tr>
            <tr>
              <td style={tableCellStyle}>Probation Period</td>
              <td style={tableCellStyle}>{formData.probation || "N/A"}</td>
            </tr>
            {joiningDate && (
              <tr>
                <td style={tableCellStyle}>Joining Date</td>
                <td style={tableCellStyle}>
                  {formData.reportingDate
                    ? `On or before ${moment(formData.reportingDate).format(
                        "DD MMMM YYYY"
                      )}`
                    : "[joining Date]"}
                </td>
              </tr>
            )}

            <tr>
              <td style={tableCellStyle}>Contract Period</td>
              <td style={tableCellStyle}>{formData.contractPeriod || "N/A"}</td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "8px 12px",
                  fontSize: "0.75rem",
                  verticalAlign: "top",
                  border: "none",
                }}
              >
                Notice Period
              </td>
              <td style={tableCellStyle}>
                {formData.noticePeriod ||
                  "No notice period shall be accepted until the end of the project"}
              </td>
            </tr>
            {formData.noticePeriodSubsections.map((subsection, index) => (
              <tr key={index}>
                <td
                  style={{
                    ...tableCellStyle,
                    borderTop: "none",
                    borderBottom: "none",
                    borderRight: "none",
                    background: "transparent",
                  }}
                ></td>
                <td style={{ ...tableCellStyle, borderTop: "none" }}>
                  {subsection}
                </td>
              </tr>
            ))}
            {
              formData.accomodation && 
              <tr>
              <td style={tableCellStyle}>Accommodation</td>
              <td style={tableCellStyle}>
                {formData.accomodation ||
                  "Single Room Bachelors Accommodation shall be provided by the Company"}
              </td>
            </tr>
            }
            {
              formData.food &&
              <tr>
              <td style={tableCellStyle}>Food</td>
              <td style={tableCellStyle}>
                {formData.food ||
                  "Shall be provided by the Company in Site Office and at Camp"}
              </td>
            </tr>
            }
            
            <tr>
              <td style={tableCellStyle}>Transport</td>
              <td style={tableCellStyle}>
                {formData.transport ||
                  "A Car shall be provided by the Company for official use only"}
              </td>
            </tr>
            

            {comm && (
              <tr>
                <td style={tableCellStyle}>Communications</td>
                <td style={tableCellStyle}>
                  {formData.communication ||
                    "A postpaid Company SIM shall be provided for official use only"}
                </td>
              </tr>
            )}

            
            {formData.insurance && (
              <tr>
                <td style={tableCellStyle}>Insurance</td>
                <td style={tableCellStyle}>
                  {formData.insurance ||
                    "WC, Medical & Group Life Insurance, under the Company account"}
                </td>
              </tr>
            )}

            <tr>
              <td style={tableCellStyle}>Annual Leave</td>
              <td style={tableCellStyle}>
                {formData.annualLeave ||
                  "No leave shall be granted throughout the project unless there is an extreme emergency."}
              </td>
            </tr>
            {formData.gratuity && (
              <tr>
                <td style={tableCellStyle}>Gratuity</td>
                <td style={tableCellStyle}>{formData.gratuity || "N/A"}</td>
              </tr>
            )}
            {formData.leaveEncashment && (
              <tr>
                <td style={tableCellStyle}>Leave Encashment</td>
                <td style={tableCellStyle}>
                  {formData.leaveEncashment || "N/A"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <img style={{ width:"7.5rem", marginLeft:"30rem", position:"absolute"}} src={"/ssu_stamp.png"}/>
      </div>
      {/* Page break for preview */}
      <div style={{ height: 40 }} />
      {/* Conditionally render Page 2: Roles and Responsibilities */}
      {formData.roles &&
        formData.roles.length > 0 &&
        formData.roles.some(
          (role) => role.title.trim() || role.description.trim()
        ) && (
          <>
            <div
              style={{
                width: "100%",
                textAlign: "center",
                color: "#aaa",
                fontSize: "0.9rem",
                marginBottom: "2rem",
              }}
            >
              --- Page 2 ---
            </div>
            <div
              ref={rolesRef}
              style={{
                border: "",
                width: "100%",
                maxWidth: 800,
                boxSizing: "border-box",
                padding: "4rem",
                background: "white",
                color: "black",
                borderRadius: "0.5rem",
                boxShadow: "0 0 10px rgba(0 0 0/ 10%)",
                minHeight: "1100px",
                fontFamily: "Aptos",
                fontSize: "0.8rem",
                margin: "1 auto",
                overflowX: "auto",
                marginBottom: "4rem",
              }}
            >
              <br />

              <h2
                style={{
                  fontWeight: "600",
                  marginBottom: "1rem",
                  fontSize: "1rem",
                  textTransform: "uppercase",
                }}
              >
                Roles & Responsibilities
              </h2>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                {formData.roles.map((role, index) =>
                  role.title.trim() || role.description.trim() ? (
                    <div key={index}>
                      <h3
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: "600",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {role.title || "[ROLE TITLE]"}
                      </h3>
                      <p style={{ fontSize: "0.8rem", color: "#444" }}>
                        {role.description || "[ROLE DESCRIPTION]"}
                      </p>
                    </div>
                  ) : null
                )}
              </div>
            </div>
            {/* Page break for preview */}
            <div style={{ height: 40 }} />
          </>
        )}
      {/* Page 3: Rest of content */}
      <div
        ref={restRef}
        style={{
          border: "",
          width: "100%",
          maxWidth: 800,
          boxSizing: "border-box",
          padding: "4rem",
          background: "white",
          color: "black",
          borderRadius: "0.5rem",
          boxShadow: "0 0 10px rgba(0 0 0/ 10%)",
          minHeight: "1100px",
          fontFamily: "Aptos",
          fontSize: "0.8rem",
          margin: "1 auto",
          overflowX: "auto",
          marginBottom: "4rem",
        }}
      >
        <br />
        <img style={{position:"absolute", width:"7.5rem", marginLeft:"20rem", marginTop:"55rem"}} src={"/ssu_stamp.png"}/>

        {/* Numbered main clauses */}
        {(() => {
          // Collect all main clause data in an array for numbering
          const clauses = [];
          if (air_passage)
            clauses.push({
              title: "Air Passage",
              content: (
                <>
                  <p>
                    {formData.airPassage ||
                      "While going on sanctioned leave, to and fro air ticket on a direct flight from Oman to the nearest international airport to your hometown, once on completion of 12 months."}
                  </p>
                  <br />
                  <p>
                    <b>Sector of Travel : </b>MUSCAT - (Nearest Hometown
                    International Airport )
                  </p>
                  <p>
                    <b>Class of Travel : </b>Economy Class by any Airline
                  </p>
                </>
              ),
            });
          if (visaS)
            clauses.push({
              title: "Visa Status",
              content: (
                <p>
                  {formData.visaStatus ||
                    "Work VISA shall be provided by the Company. Employee agrees that he shall not join any competing business until the end of the Contract Project"}
                </p>
              ),
            });
          clauses.push(
            {
              title: "Medical",
              content: (
                <p>
                  During the service period the company will bear all medical
                  expenses for self - excluding dependents, dental, optical,
                  gynecology and congenital.
                </p>
              ),
            },
            {
              title: "Increment Terms",
              content: (
                <p>
                  Based on the performance of the individual and the company, at
                  the discretion of management.
                </p>
              ),
            },
            {
              title: "Working Hours",
              content: (
                <p>
                  {formData.workingHours ||
                    "As laid down by the company from time to time. Your post being a senior level executive in nature you are not eligible for any overtime; though you shall be available during 24 hours of the day on call basis."}
                </p>
              ),
            },
            {
              title: "Medical Fitness",
              content: (
                <p>
                  Your employment with us shall be subject to your medical
                  fitness, which will be ascertained after a medical examination
                  by the Ministry of Health, Sultanate of Oman, as soon as you
                  arrive and periodically thereafter, on being found medically
                  unfit, your services are liable to be terminated.
                </p>
              ),
            },
            {
              title: "Code of Conduct",
              content: (
                <p>
                  The Company maintains a strict non-alcoholic environment.
                  Unlawful possession of or being under the influence of alcohol
                  or any mind-altering substances will result in immediate
                  termination without prior notice. You are expected to act
                  professionally, ethically, and in a manner that upholds the
                  Company's image and welfare. Any misconduct or inappropriate
                  behavior will be formally communicated in writing, and you
                  will be given a chance to respond. However, the Company
                  reserves the right to terminate employment without notice or
                  pay if misconduct is confirmed. Your services may also be
                  terminated for breach of employment terms, unsatisfactory
                  performance, or if continued employment is deemed not in the
                  Company's interest.
                </p>
              ),
            },
            {
              title: "Documentary Evidence",
              content: (
                <p>
                  Your date of birth as recorded by the Company on the basis of
                  documentary evidence produced by you at the time of your
                  appointment is considered as the authenticated date of birth
                  for all purposes throughout your service with the Company and
                  will not be changed under any circumstances.
                </p>
              ),
            },
            {
              title: "Confidentiality",
              content: (
                <p>
                  During your contract, you may access confidential business
                  information. You must maintain strict confidentiality and not
                  disclose any such information without Company authorization,
                  both during your contract and for five years after. Any breach
                  of this obligation, during or after employment, may result in
                  the Company taking appropriate action to protect its
                  interests.
                </p>
              ),
            }
          );
          return clauses.map((clause, idx) => (
            <>
            <div
              key={clause.title}
              style={{ marginBottom: "1rem", fontSize: "0.8rem" }}
            >
              <h3
                style={{
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                }}
              >
                ({idx + 1}) {clause.title}
              </h3>
              {clause.content}
              
            </div>
            
            </>
          ));
          
        })()}
        
      </div>

      {/* Page break for preview */}
      <div style={{ height: 40 }} />
      {/* Page 3: Acknowledgment and Signatures */}
      <div
        ref={signatureRef}
        style={{
          border: "",
          width: "100%",
          maxWidth: 800,
          boxSizing: "border-box",
          padding: "4rem",
          background: "white",
          color: "black",
          borderRadius: "0.5rem",
          boxShadow: "0 0 10px rgba(0 0 0/ 10%)",
          minHeight: "1100px",
          fontFamily: "Aptos",
          fontSize: "0.8rem",
          margin: "1 auto",
          overflowX: "auto",
          marginBottom: "4rem",
        }}
      >
        <br />
        <br />
        <br />
        {/* Acknowledgment */}

        <div
          style={{
            marginBottom: "1.5rem",
            fontSize: "0.8rem",
            display: "flex",
            flexFlow: "column",
            gap: "0.5rem",
          }}
        >
          <h3
            style={{
              fontWeight: "600",
              marginBottom: "0.5rem",
              fontSize: "0.9rem",
            }}
          >
            General Terms
          </h3>
          <p>
            In the event of your resignation within two years from your date of
            joining the Company, the costs incurred by the Company towards your
            initial mobilization like recruitment fee, processing charges for
            visa and resident card and other related expenses, and/(or) subject
            to "Employment Bond" if any, will be recovered from you.
          </p>
          <p>
            You shall communicate to the Company any change in your address as
            well as details of next of kin. All communications sent to you in
            the normal course on the address given by you shall be deemed to
            have been received at your end.
          </p>
          <p>
            You are expected to give your whole time of service to us and not
            directly or indirectly enter into any other employment or business
            without our specific consent in writing during the tenure of this
            contract. However, you will be free to seek alternative employment
            after expiry of the period of employment of this contract. You also
            agree to work and reside where we require and to abide by all
            applicable regulations, practices and instructions in operation for
            the guidance and conduct of our staff and the business.
          </p>
        </div>

        {/* Other Terms & Conditions */}
        <h3
          style={{
            fontWeight: "600",
            marginBottom: "0.5rem",
            fontSize: "0.9rem",
          }}
        >
          Other Terms & Conditions
        </h3>
        <ul
          style={{
            marginBottom: "2rem",
            paddingLeft: 24,
            display: "flex",
            flexFlow: "column",
            gap: "0.75rem",
            fontSize: "0.8rem",
          }}
        >
          <li>
            Company Assets, if any in possession are to be returned at the end
            of services, else the cost shall be deducted from the final dues.
          </li>
          <li>
            VISA expenses will be borne by the Company even in case of
            termination during contract period, but not in case the employee
            resigns during the contract period.
          </li>
          <li>
            If you damage any company assets, furniture or vehicles, the company
            will have all rights to recover its compensation from your dues.
          </li>
          <li>
            If the employee does not sign this agreement within the seven days,
            the agreement shall be deemed null and void.
          </li>
          <li>
            In case of failure to report to duty in Oman, the offer letter shall
            become null and void after seven days from the date of the signed
            agreement.
          </li>
        </ul>
        <h3
          style={{
            fontWeight: "600",
            marginBottom: "0.5rem",
            fontSize: "0.9rem",
          }}
        >
          Acknowledgment:
        </h3>
        <p
          style={{
            marginBottom: "2rem",
            textAlign: "justify",
            fontSize: "0.8rem",
          }}
        >
          You hereby confirm and undertake that you shall not, at any time,
          either during the continuance of your employment or after the
          completion of your employment, divulge or use any information acquired
          in the course of your employment, about or relating to the Company, in
          any manner which may directly or indirectly be detrimental to the
          interest of Company.
        </p>
        {/* Signature Lines */}
        <div
          style={{
            marginTop: "4rem",
            display: "flex",
            flexFlow: "column",
            justifyContent: "flex-start",
          }}
        >
          <div style={{}}>
            <img style={{position:"absolute", width:"7.5rem", marginLeft:"15rem"}} src={"/ssu_stamp.png"}/>
            <img style={{position:"absolute", width:"6rem", marginLeft:"6rem", marginTop:"1rem"}} src={"/sunil_sign.png"}/>
            <div style={{ marginBottom: "2rem" }}>
              Employee Signature _____________________________________
            </div>
          </div>
          <div style={{}}>
            <div style={{ marginBottom: "2rem" }}>
              HR Manager _____________________________________________
            </div>
          </div>
          <div style={{}}>
            <div style={{ marginBottom: "2rem" }}>
              Managing Director ______________________________________
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );

  const handleRenamePreset = async (newName: string) => {
    if (!selectedPreset) return;

    try {
      setPresetsLoading(true);
      await updateDoc(doc(db, "offer_letter_presets", selectedPreset), {
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

  return (
    <>
      {/* <div style={{border:"", display:"flex", alignItems:"center", justifyContent:'center'}}>
        <ConfettiExplosion/>
        </div> */}
      <div
        style={{
          padding: "",
          background:"rgba(100 100 100/ 8%)",
          // background:
          //   "linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%))",
          height: "100svh",
          overflowY: "scroll",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(100 100 100/ 40%) transparent",
        }}
      >
        <motion.div>
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
            //         <Database width={"1rem"} color="mediumslateblue" />
            //       )}
            //       <p>{loadedLetterId}</p>
            //     </div>
            //   )
            // }
            // title="Doc"
            // icon={<File color="dodgerblue" />}
            subtitle={
              formData.position && (
                <p style={{ textTransform: "uppercase" }}>
                  {formData.position}
                </p>
              )
            }
            title={
              <p
                style={{
                  fontSize: "1rem",
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "center",
                  textTransform: "uppercase",
                }}
              >
                {saving ? (
                  <LoaderCircle className="animate-spin" width={"1rem"} />
                ) : (
                  loadedLetterId && (
                    <Database color="mediumslateblue" width={"1rem"} />
                  )
                )}

                {formData.candidateName}
              </p>
            }
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
                    background: "indigo",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: pdfLoading ? "not-allowed" : "pointer",
                    opacity: pdfLoading ? 0.7 : 1,
                    boxShadow: "1px 1px 10px rgba(0 0 0/ 30%)",
                  }}
                  disabled={pdfLoading}
                >
                  <Sparkles color="white" width={"1rem"} />
                  {pdfLoading ? "Generating..." : "Generate PDF"}
                </button>

                {/* <button
                  onClick={!loadedLetterId ? handleSave : handleSaveChanges}
                >
                  {saving ? (
                    <LoaderCircle className="animate-spin" />
                  ) : !loadedLetterId ? (
                    <Save color="mediumslateblue" />
                  ) : (
                    <CloudUpload color="mediumslateblue" />
                  )}
                </button> */}

                {!loadedLetterId ? (
                  <motion.button
                    onClick={!loadedLetterId ? handleSave : handleSaveChanges}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(100 100 100/ 10%)",
                      fontSize: "0.75rem",
                      // border: "1px solid rgba(100 100 100/ 40%)",
                      padding: "0.5rem 1rem",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      height: "",
                      willChange: "transform",
                    }}
                  >
                    {saving ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <Save width={"1.25rem"} color="mediumslateblue" />
                    )}
                  </motion.button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(100 100 100/ 10%)",
                          fontSize: "0.75rem",
                          // border: "1px solid rgba(100 100 100/ 40%)",
                          padding: "0.65rem 1rem",
                          borderRadius: "0.5rem",
                          cursor: "pointer",
                          height: "",
                          willChange: "transform",
                        }}
                      >
                        {saving ? (
                          <LoaderCircle className="animate-spin" />
                        ) : !loadedLetterId ? (
                          <Save color="mediumslateblue" width={"1.25rem"} />
                        ) : (
                          <Save color="mediumslateblue" width={"1.25rem"} />
                        )}

                        <ChevronDown width={"1rem"} />
                      </motion.button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        style={{
                          display: "flex",
                          justifyContent: "flex-start",
                        }}
                        onClick={handleSaveChanges}
                      >
                        <Save color="royalblue" className="w-4" />
                        <span>Save Changes</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        style={{
                          display: "flex",
                          justifyContent: "flex-start",
                        }}
                        onClick={handleSave}
                      >
                        <FilePlus2 className="w-4" />
                        <span>Save as New</span>
                        <p></p>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    // border: "1px solid rgba(100 100 100/ 30%)",
                    background: "rgba(100 100 100/ 10%)",
                    padding: "0.5rem 0.75rem",
                  }}
                  onClick={() => {
                    // Show cached letters immediately
                    if (offerLettersCache.length > 0) {
                      setOfferLetters(offerLettersCache);
                    }
                    setOfferLettersDrawerVisible(true);
                    // Fetch new letters in background
                    fetchOfferLetters();
                  }}
                >
                  <Database width={"1.25rem"} />
                </motion.button>
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
              <LoadingOutlined style={{ color: "dodgerblue", scale: "2" }} />
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
              {/* Input Form - Hidden on mobile */}
              <div className="input-form" style={styles.inputForm}>
                {renderInputForm()}
              </div>

              {/* Preview - Full width on mobile */}
              <div className="" style={{}}>
                {renderPreview()}
              </div>
            </div>
          )}
        </motion.div>

        {/* Mobile Drawer */}
        <Drawer
          style={{ background: "black", color: "white" }}
          title="Offer Letter Details"
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width="100%"
        >
          {renderInputForm()}
        </Drawer>

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

        {/* Offer Letters Drawer */}
        <Drawer
      title="Offer Letters"
      placement="right"
      onClose={() => setOfferLettersDrawerVisible(false)}
      open={offerLettersDrawerVisible}
      width={window.innerWidth <= 768 ? "100%" : 500}
    >
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        style={{
          display: "flex",
          color: "black",
          fontSize: "0.8rem",
          gap: "0.5rem",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: "1rem",
          height: "1rem",
        }}
      >
        {
        offerLettersLoading ? (
          <>
            <LoaderCircle
              width={"0.8rem"}
              color="mediumslateblue"
              className="animate-spin"
            />
            <p>Fetching</p>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            style={{ display: "flex", alignItems: "center" }}
          >
            <Dot color="mediumslateblue" />
            {"Fetched " + offerLetters.length + " "}
            {offerLetters.length > 1 ? "Items" : "Item"}
          </motion.div>
        )}
      </motion.div>

      {offerLetters.length === 0 ? (
        <div style={{ textAlign: "center", color: "#888" }}></div>
      ) : (
        <div style={{ maxHeight: "70vh", overflowY: "auto", paddingBottom: "4rem" }}>
          {offerLetters
          .filter((ol) =>
    (ol.candidateName + " " + ol.position)
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )
          .map((ol:any) => (
            <div
              key={ol.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
                background: "#fafbfc",
                cursor: "pointer",
                transition: "box-shadow 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }} onClick={() => handleLetterClick(ol)}>
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: 14,
                      color: "black",
                      textTransform: "capitalize",
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center",
                    }}
                  >
                    {ol.candidateName || "[No Name]"}
                  </div>
                  <div
                    style={{
                      color:"black",
                      opacity:"0.45",
                      fontWeight: 600,
                      fontSize: 11,
                      textTransform: "uppercase",
                    }}
                  >
                    {ol.refNo || "[No Reference Number]"}
                  </div>
                  {/* <div
                    style={{
                      color: "royalblue",
                      fontWeight: 500,
                      fontSize: 11,
                      textTransform: "uppercase",
                    }}
                  >
                    {ol.position || "[No Position]"}
                  </div> */}
                  

                  <div style={{ color: "#888", fontSize: 10 }}>
                    {ol.generated_at && ol.generated_at.toDate
                      ? "Last Modified : " +
                        moment(ol.generated_at.toDate()).format(
                          "DD MMM YYYY, h:mm A"
                        )
                      : ""}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginLeft: "1rem",
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      Modal.confirm({
                        title: "Delete Offer Letter",
                        content:
                          "Are you sure you want to delete this offer letter?",
                        okText: "Yes",
                        okType: "danger",
                        cancelText: "No",
                        onOk: () => handleDeleteLetter(ol.id),
                      });
                    }}
                    style={{
                      background: "rgba(150 150 150/ 10%)",
                      border: "none",
                      cursor: "pointer",
                      padding: "0.15rem 0.5rem",
                      color: "indianred",
                      fontSize: "0.7rem",
                    }}
                  >
                    {deleting ? <LoadingOutlined /> : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div
            style={{
              position: "fixed",
              bottom: 0,
              width: "100%",
              paddingRight: "1rem",
              display: "flex",
              alignItems: "center",
              paddingBottom: "1rem",
              background: "white",
            }}
          >
            <input
              style={{
                background: "rgba(100 100 100/0.1)",
                color: "black",
                width: "49ch",
                padding: "0.3rem 0.6rem",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}
    </Drawer>
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
      `}</style>

      <Modal
        title="Edit Offer Letter"
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
                  e.currentTarget.style.borderColor = "skyblue";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 2px rgba(135, 206, 235, 0.2)";
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
        titleIcon={<FileText color="mediumslateblue" />}
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
    </>
  );
}
