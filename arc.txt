import Back from "@/components/back";
import CustomDropdown from "@/components/custom-dropdown";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/firebase";
import InvoiceTemplate from "@/invoice-templates/template-1";
import QuotationTemplate from "@/quotation-templates/template-1";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";
import { DownloadCloud, Plus, Trash2, Zap } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import { usePDF } from "react-to-pdf";

interface DocumentItem {
  description: string;
  unit: string;
  quantity: number;
  amount: number;
}

type DocumentType = "invoice" | "quotation";

interface ClientDetails {
  id?: string;
  name: string;
  address: string;
  contactNo: string;
  vatinNo?: string;
}

// Add new interfaces for document details
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

// Add this to your component's style section or to a CSS file
const responsiveStyles = `
  @media (min-width: 1024px) {
    .document-generator-main {
      flex-direction: row !important;
      height: calc(100vh - 100px);
      overflow: hidden;
    }
    .document-generator-controls {
      width: 40%;
      overflow-y: auto;
      max-height: 100%;
      padding-right: 10px;
    }
    .document-generator-preview-container {
      width: 60%;
      display: flex;
      flex-direction: column;
    }
  }
`;

export default function DocumentGenerator() {
  const { toPDF, targetRef } = usePDF({
    filename: "document - " + moment().format("DD_MM_YYYY") + ".pdf",
  });

  // Document type state
  const [documentType, setDocumentType] = useState<DocumentType>("invoice");

  // Common state variables
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [refNo, setRefNo] = useState("");
  const [date, setDate] = useState(moment().format("DD.MM.YYYY"));
  const [contactNo, setContactNo] = useState("");
  const [items, setItems] = useState<DocumentItem[]>([
    { description: "", unit: "", quantity: 0, amount: 0 },
  ]);

  // Invoice-specific state
  const [invoiceNo, setInvoiceNo] = useState("");
  const [isTaxInvoice, setIsTaxInvoice] = useState(true);
  const [vatinNo, setVatinNo] = useState("");

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

  // Add a unit field to the document details section
  const [unitTitle, setUnitTitle] = useState("Qty");

  // Add state for clients
  const [clients, setClients] = useState<ClientDetails[]>([]);
  const [openClientSelect, setOpenClientSelect] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // Add state for document details
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails[]>([]);
  const [quotationDetails, setQuotationDetails] = useState<QuotationDetails[]>(
    []
  );
  const [openDocumentSelect, setOpenDocumentSelect] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  // Add state for letterhead selection
  const [letterhead, setLetterhead] = useState("ARC"); // Default to ARC Engineering

  // Add state for subject
  const [subject, setSubject] = useState("");

  useEffect(() => {
    console.log(selectedClient, selectedDocument);
  }, []);

  // Calculate total amount
  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.amount,
    0
  );

  // Invoice type options
  const invoiceTypeOptions = [
    { value: "tax", label: "Tax Invoice" },
    { value: "cash", label: "Cash Invoice" },
  ];

  // Handlers for terms
  const addTerm = () => {
    setTerms([...terms, ""]);
  };

  const updateTerm = (index: number, value: string) => {
    const newTerms = [...terms];
    newTerms[index] = value;
    setTerms(newTerms);
  };

  const removeTerm = (index: number) => {
    setTerms(terms.filter((_, i) => i !== index));
  };

  // Item handlers
  const addItem = () => {
    setItems([...items, { description: "", unit: "", quantity: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof DocumentItem,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Styles
  // const mainContentStyle = {
  //   display: "grid",
  //   gridTemplateColumns: window.innerWidth >= 768 ? "1fr 1fr" : "1fr",
  //   gap: "2rem",
  //   padding: "1.5rem",
  //   maxWidth: "1400px",
  //   margin: "0 auto",
  // } as const;

  const controlsPanelStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "1.75rem",
    background: "rgba(40, 40, 50, 0.4)",
    padding: "1.75rem",
    borderRadius: "0.75rem",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  } as const;

  const headerStyle = {
    width: "100%",
    padding: "1.25rem",
    position: "sticky" as const,
    top: 0,
    zIndex: 10,
    background: "rgba(30, 30, 40, 0.85)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
  };

  const removeButtonStyle = {
    opacity: 0.7,
    transition: "all 0.2s ease",
    padding: "0.25rem",
    borderRadius: "0.25rem",
    background: "rgba(220, 38, 38, 0.1)",
  } as const;

  const addButtonStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.75rem",
    background: "rgba(60, 60, 70, 0.5)",
    borderRadius: "0.5rem",
    opacity: 0.9,
    transition: "all 0.2s ease",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  } as const;

  // const previewContainerStyle = {
  //   width: "fit-content",
  //   minWidth: "100%",
  //   display: "flex",
  //   justifyContent: "center",
  // } as const;

  // Add zoom controls for the preview
  // const [previewScale, setPreviewScale] = useState(1);

  // Add a function to handle zoom
  // const handleZoom = (zoomIn: boolean) => {
  //   setPreviewScale((prev) => {
  //     const newScale = zoomIn ? prev + 0.1 : prev - 0.1;
  //     return Math.max(0.5, Math.min(1.5, newScale)); // Limit scale between 0.5 and 1.5
  //   });
  // };

  // Add function to fetch clients
  const fetchClients = async () => {
    try {
      const clientsCollection = collection(db, "client-details");
      const clientsSnapshot = await getDocs(clientsCollection);
      const clientsList = clientsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ClientDetails[];
      setClients(clientsList || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClients([]);
    }
  };

  // Add function to save client
  const saveClientDetails = async () => {
    try {
      // Only save if we have a name
      if (!clientName.trim()) return;

      const clientData: ClientDetails = {
        name: clientName,
        address: clientAddress,
        contactNo: contactNo,
        ...(documentType === "invoice" && isTaxInvoice ? { vatinNo } : {}),
      };

      await addDoc(collection(db, "client-details"), clientData);
      await fetchClients();
    } catch (error) {
      console.error("Error saving client:", error);
    }
  };

  // Add functions to fetch document details
  const fetchInvoiceDetails = async () => {
    try {
      const detailsCollection = collection(db, "invoice-details");
      const detailsSnapshot = await getDocs(detailsCollection);
      const detailsList = detailsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as InvoiceDetails[];
      setInvoiceDetails(detailsList || []);
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      setInvoiceDetails([]);
    }
  };

  const fetchQuotationDetails = async () => {
    try {
      const detailsCollection = collection(db, "quotation-details");
      const detailsSnapshot = await getDocs(detailsCollection);
      const detailsList = detailsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as QuotationDetails[];
      setQuotationDetails(detailsList || []);
    } catch (error) {
      console.error("Error fetching quotation details:", error);
      setQuotationDetails([]);
    }
  };

  // Add function to save document details
  const saveDocumentDetails = async () => {
    try {
      if (!refNo.trim()) return;

      if (documentType === "invoice") {
        const data: InvoiceDetails = {
          refNo,
          invoiceNo,
          unitTitle,
        };
        await addDoc(collection(db, "invoice-details"), data);
        await fetchInvoiceDetails();
      } else {
        const data: QuotationDetails = {
          refNo,
          quotationNo,
          unitTitle,
          validityPeriod,
          subject,
        };
        await addDoc(collection(db, "quotation-details"), data);
        await fetchQuotationDetails();
      }
    } catch (error) {
      console.error("Error saving document details:", error);
    }
  };

  // Load clients on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchClients();
        await fetchInvoiceDetails();
        await fetchQuotationDetails();
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Add function to handle client selection
  const handleClientSelect = (clientId: string) => {
    setSelectedClient(clientId);

    // Find the selected client
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      // Populate the form with client details
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

  // Add function to handle document selection
  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocument(documentId);

    // Find the selected document
    if (documentType === "invoice") {
      const invoice = invoiceDetails.find((d) => d.id === documentId);
      if (invoice) {
        // Populate the form with invoice details
        setRefNo(invoice.refNo);
        setInvoiceNo(invoice.invoiceNo);
        setUnitTitle(invoice.unitTitle || "Qty");
      }
    } else {
      const quotation = quotationDetails.find((d) => d.id === documentId);
      if (quotation) {
        // Populate the form with quotation details
        setRefNo(quotation.refNo);
        setQuotationNo(quotation.quotationNo);
        setUnitTitle(quotation.unitTitle || "Qty");
        setValidityPeriod(quotation.validityPeriod);
        setSubject(quotation.subject || "");
      }
    }

    setOpenDocumentSelect(false);
  };

  // Modify the download handler to save all details
  const handleDownload = () => {
    saveClientDetails();
    saveDocumentDetails();
    toPDF();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      style={{ display: "flex", flexFlow: "column", minHeight: "100vh" }}
    >
      {/* Header */}
      <div style={headerStyle}>
        <Back
          title="Document"
          // extra={
          //   <button onClick={handleDownload}>
          //     <DownloadCloud color="dodgerblue" className="animate-pulse" />
          //   </button>
          // }
        />
      </div>

      {/* Main Content */}
      <div style={{ padding: "1rem" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
            maxWidth: "1400px",
            margin: "0 auto",
          }}
          className="document-generator-main"
        >
          {/* Controls Panel */}
          <div
            style={controlsPanelStyle}
            className="document-generator-controls"
          >
            {/* Replace Document Type Selector with Tabs */}
            <Tabs
              defaultValue="invoice"
              value={documentType}
              onValueChange={(value) => setDocumentType(value as DocumentType)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="invoice">Invoice</TabsTrigger>
                <TabsTrigger value="quotation">Quotation</TabsTrigger>
              </TabsList>
            </Tabs>

            <div>
              <label className="text-sm opacity-70 mb-2 block">
                Select Letterhead
              </label>
              <CustomDropdown
                value={letterhead}
                onChange={(value) => setLetterhead(value)}
                options={[
                  { value: "ARC", label: "ARC Engineering" },
                  { value: "Unique", label: "Unique Solutions" },
                ]}
                placeholder="Select Letterhead"
              />
            </div>

            {/* Invoice Type (only for invoice) */}
            {documentType === "invoice" && (
              <div>
                <label className="text-sm opacity-70 mb-2 block">
                  Invoice Type
                </label>
                <CustomDropdown
                  value={isTaxInvoice ? "tax" : "cash"}
                  onChange={(value) => setIsTaxInvoice(value === "tax")}
                  options={invoiceTypeOptions}
                  placeholder="Select Invoice Type"
                />
              </div>
            )}

            {/* Client Details */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.75rem",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  paddingBottom: "0.5rem",
                }}
              >
                <label className="text-sm font-medium text-gray-300">
                  Client Details
                </label>
                <Popover
                  open={openClientSelect}
                  onOpenChange={setOpenClientSelect}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openClientSelect}
                      className="w-[120px] justify-between"
                      size="sm"
                    >
                      Autofill
                      <Zap className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    style={{ marginRight: "1.75rem" }}
                    className="w-[250px] p-0"
                  >
                    <div className="p-2">
                      <input
                        type="text"
                        placeholder="Search clients..."
                        className="w-full p-2 mb-2 bg-transparent border border-gray-700 rounded text-sm"
                        onChange={(e) => {
                          // We'll use local filtering instead of state to keep it simple
                          const searchTerm = e.target.value.toLowerCase();
                          const clientElements =
                            document.querySelectorAll(".client-item");
                          clientElements.forEach((el) => {
                            const clientName =
                              el.textContent?.toLowerCase() || "";
                            if (clientName.includes(searchTerm)) {
                              (el as HTMLElement).style.display = "block";
                            } else {
                              (el as HTMLElement).style.display = "none";
                            }
                          });
                        }}
                      />

                      {clients.length > 0 ? (
                        clients.map((client) => (
                          <button
                            key={client.id}
                            className="client-item w-full text-left px-2 py-1.5 text-sm hover:bg-gray-700 bg-transparent rounded"
                            onClick={() => handleClientSelect(client.id!)}
                          >
                            {client.name}
                          </button>
                        ))
                      ) : (
                        <p className="text-center py-2 text-sm text-gray-400">
                          No clients found
                        </p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client Name"
                  className="invoice-input"
                />
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Client Address"
                  className="invoice-input"
                />
                {documentType === "invoice" && (
                  <input
                    type="text"
                    value={vatinNo}
                    onChange={(e) => setVatinNo(e.target.value)}
                    placeholder="VATIN Number"
                    className="invoice-input"
                  />
                )}
                <input
                  type="text"
                  value={contactNo}
                  onChange={(e) => setContactNo(e.target.value)}
                  placeholder="Contact Number"
                  className="invoice-input"
                />
              </div>
            </div>

            {/* Document Details */}
            <div style={{}}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.75rem",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  paddingBottom: "0.5rem",
                }}
              >
                <label className="text-sm font-medium text-gray-300">
                  {documentType === "invoice"
                    ? "Invoice Details"
                    : "Quotation Details"}
                </label>
                <Popover
                  open={openDocumentSelect}
                  onOpenChange={setOpenDocumentSelect}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openDocumentSelect}
                      className="w-[120px] justify-between"
                      size="sm"
                    >
                      Autofill
                      <Zap className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    style={{ marginRight: "1.75rem" }}
                    className="w-[250px] p-0"
                  >
                    <div className="p-2">
                      <input
                        type="text"
                        placeholder={`Search ${
                          documentType === "invoice" ? "invoices" : "quotations"
                        }...`}
                        className="w-full p-2 mb-2 bg-transparent border border-gray-700 rounded text-sm"
                        onChange={(e) => {
                          const searchTerm = e.target.value.toLowerCase();
                          const docElements =
                            document.querySelectorAll(".document-item");
                          docElements.forEach((el) => {
                            const docText = el.textContent?.toLowerCase() || "";
                            if (docText.includes(searchTerm)) {
                              (el as HTMLElement).style.display = "block";
                            } else {
                              (el as HTMLElement).style.display = "none";
                            }
                          });
                        }}
                      />

                      {documentType === "invoice" ? (
                        invoiceDetails.length > 0 ? (
                          invoiceDetails.map((detail) => (
                            <button
                              key={detail.id}
                              className="document-item w-full text-left px-2 py-1.5 text-sm hover:bg-gray-700 bg-transparent rounded"
                              onClick={() => handleDocumentSelect(detail.id!)}
                            >
                              {`${detail.invoiceNo} (${detail.refNo})`}
                            </button>
                          ))
                        ) : (
                          <p className="text-center py-2 text-sm text-gray-400">
                            No invoice details found
                          </p>
                        )
                      ) : quotationDetails.length > 0 ? (
                        quotationDetails.map((detail) => (
                          <button
                            key={detail.id}
                            className="document-item w-full text-left px-2 py-1.5 text-sm hover:bg-gray-700 bg-transparent rounded"
                            onClick={() => handleDocumentSelect(detail.id!)}
                          >
                            {`${detail.quotationNo} (${detail.refNo})`}
                          </button>
                        ))
                      ) : (
                        <p className="text-center py-2 text-sm text-gray-400">
                          No quotation details found
                        </p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <input
                  type="text"
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value)}
                  placeholder="Reference Number"
                  className="invoice-input"
                />
                <input
                  type="text"
                  value={documentType === "invoice" ? invoiceNo : quotationNo}
                  onChange={(e) =>
                    documentType === "invoice"
                      ? setInvoiceNo(e.target.value)
                      : setQuotationNo(e.target.value)
                  }
                  placeholder={`${
                    documentType === "invoice" ? "Invoice" : "Quotation"
                  } Number`}
                  className="invoice-input"
                />
                <input
                  type="text"
                  value={unitTitle}
                  onChange={(e) => setUnitTitle(e.target.value)}
                  placeholder="Unit Title (e.g., Pcs, Hrs, Days)"
                  className="invoice-input"
                />
                <input
                  type="date"
                  value={moment(date, "DD.MM.YYYY").format("YYYY-MM-DD")}
                  onChange={(e) =>
                    setDate(moment(e.target.value).format("DD.MM.YYYY"))
                  }
                  className="invoice-input"
                />
                {documentType === "quotation" && (
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject"
                    className="invoice-input"
                  />
                )}
                {documentType === "quotation" && (
                  <input
                    type="date"
                    value={moment(validityPeriod, "DD.MM.YYYY").format(
                      "YYYY-MM-DD"
                    )}
                    onChange={(e) =>
                      setValidityPeriod(
                        moment(e.target.value).format("DD.MM.YYYY")
                      )
                    }
                    placeholder="Valid Until"
                    className="invoice-input"
                  />
                )}
              </div>
            </div>

            {/* Items Section */}
            <div>
              <label className="text-sm opacity-70 mb-2 block">
                {documentType === "invoice"
                  ? "Invoice Items"
                  : "Quotation Items"}
              </label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {items.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      background: "rgba(40, 40, 50, 0.3)",
                      padding: "1.25rem",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span className="text-sm opacity-70">
                        Item {index + 1}
                      </span>
                      <button
                        onClick={() => removeItem(index)}
                        style={removeButtonStyle}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(index, "description", e.target.value)
                      }
                      placeholder="Description"
                      className="invoice-input"
                    />
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.5rem",
                      }}
                    >
                      <input
                        type="number"
                        value={item.unit}
                        onChange={(e) =>
                          updateItem(index, "unit", Number(e.target.value))
                        }
                        placeholder={unitTitle || "Qty"}
                        className="invoice-input"
                      />
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) =>
                          updateItem(index, "amount", Number(e.target.value))
                        }
                        placeholder={unitTitle || "Rate"}
                        className="invoice-input"
                      />
                    </div>
                  </div>
                ))}
                <button onClick={addItem} style={addButtonStyle}>
                  <Plus size={16} /> Add Item
                </button>
              </div>
            </div>

            {/* Terms and Conditions (only for quotation) */}
            {documentType === "quotation" && (
              <div>
                <label className="text-sm opacity-70 mb-2 block">
                  Terms and Conditions
                </label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  {terms.map((term, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "flex-start",
                      }}
                    >
                      <input
                        type="text"
                        value={term}
                        onChange={(e) => updateTerm(index, e.target.value)}
                        placeholder="Enter term"
                        className="invoice-input"
                      />
                      <button
                        onClick={() => removeTerm(index)}
                        style={removeButtonStyle}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button onClick={addTerm} style={addButtonStyle}>
                    <Plus size={16} /> Add Term
                  </button>
                </div>
              </div>
            )}

            {/* Download Button - Update to save client details */}
            <button
              onClick={handleDownload}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                marginTop: "2rem",
                padding: "0.875rem",
                background: "linear-gradient(to right, #dc2626, #b91c1c)",
                color: "white",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
                fontWeight: "500",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                transition: "all 0.2s ease",
              }}
              className="hover:opacity-90 active:transform active:scale-95"
            >
              <DownloadCloud size={18} />
              Download PDF
            </button>
          </div>

          {/* Preview Panel */}
          <div className="document-generator-preview-container">
            {/* Zoom controls */}
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="text-sm text-gray-400">Preview</div>
              {/* <div
                style={{
                  border: "",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "",
                }}
                className="flex items-center gap-2"
              >
                <button
                  style={{}}
                  onClick={() => handleZoom(false)}
                  className=""
                  disabled={previewScale <= 0.5}
                >
                  <span className="text-xl font-bold">-</span>
                </button>
                <span className="text-sm text-gray-400">
                  {Math.round(previewScale * 100)}%
                </span>
                <button
                  onClick={() => handleZoom(true)}
                  className=" rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                  disabled={previewScale >= 1.5}
                >
                  <span className="text-xl font-bold">+</span>
                </button>
              </div> */}
            </div>

            {/* ScrollArea remains the same */}
            <ScrollArea
              style={{
                width: "100%",
                overflow: "auto",
                background: "rgba(20, 20, 25, 0.3)",
                borderRadius: "0.75rem",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                padding: "0.5rem",
                height: "min(calc(100vh - 200px), 600px)",
                flex: "1 1 auto",
              }}
              className="touch-auto"
            >
              <div
                ref={targetRef}
                style={{
                  width: "fit-content",
                  minWidth: "100%",
                  display: "flex",
                  justifyContent: "center",
                  padding: "1rem",
                  // transform: `scale(${previewScale})`,
                  transformOrigin: "top center",
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
                    amount={totalAmount}
                    isTaxInvoice={isTaxInvoice}
                    vatinNo={vatinNo}
                    contactNo={contactNo}
                    unitTitle={unitTitle}
                    letterhead={letterhead}
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
                  />
                )}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: responsiveStyles }} />
    </motion.div>
  );
}
