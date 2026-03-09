import { useAuth } from "@/components/AuthProvider";
import Back from "@/components/back";
import Directive from "@/components/directive";
import DropDown from "@/components/dropdown";
import NumberPlate from "@/components/number-plate";
import RefreshButton from "@/components/refresh-button";
import DefaultDialog from "@/components/ui/default-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useBackgroundProcess } from "@/context/BackgroundProcessContext";
import { db } from "@/firebase";
import { fetchAndCacheFuelLogs, getCachedFuelLogs, type FuelLog as FuelLogType } from "@/utils/fuelLogsCache";
import { addPendingFuelLog, getPendingFuelLogs, getPendingFuelLogsCount, syncAllPendingFuelLogs } from "@/utils/offlineFuelLogs";
import { getCachedProfile } from "@/utils/profileCache";
import { getCachedVehicle, fetchAndCacheVehicle } from "@/utils/vehicleCache";
import { addDoc, collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { Calendar, Car, ChevronLeft, ChevronRight, DollarSign, EllipsisVertical, Fuel, Gauge, Loader2, Plus, WifiOff, Camera, X, ScanLine } from "lucide-react";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Tesseract, { PSM } from "tesseract.js";

// Shared Fuel Log Form Component
interface FuelLogFormContentProps {
  date: string;
  vehicleNumber: string | undefined;
  isPrivateVehicle: boolean;
  odometerReading: string;
  setOdometerReading: (reading: string) => void;
  amountSpent: string;
  setAmountSpent: (amount: string) => void;
  litres: string;
  setLitres: (litres: string) => void;
  setShowDatePicker: (show: boolean) => void;
  dateSectionRef: React.RefObject<HTMLDivElement>;
  editingLog: FuelLogType | null;
  submitting: boolean;
  userProfile: any;
  handleSubmit: (e: React.FormEvent) => void;
  onScanBill: () => void;
}

const FuelLogFormContent: React.FC<FuelLogFormContentProps> = ({
  date,
  vehicleNumber,
  isPrivateVehicle,
  odometerReading,
  setOdometerReading,
  amountSpent,
  setAmountSpent,
  litres,
  setLitres,
  setShowDatePicker,
  dateSectionRef,
  editingLog,
  submitting,
  userProfile,
  handleSubmit,
  onScanBill,
}) => {
  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", maxHeight: "75vh", width: "100%" }}>
      {/* Fixed Header */}
      <div style={{
        border:"",
        display:"flex",
        justifyContent:"space-between",
        padding: "1.5rem",
        paddingBottom: "1rem",
        borderBottom: "1px solid rgba(100, 100, 100, 0.1)",
        background: "var(--background)",
        boxSizing: "border-box",
        alignItems:"center"
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
          <h2 style={{ fontSize: "1.5rem", letterSpacing: "-0.02em" }}>{editingLog ? "Edit Log" : "Log Fuel"}</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          
          {vehicleNumber && <NumberPlate private={isPrivateVehicle} number={vehicleNumber} />}
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

            {!editingLog && (
            <motion.button
              type="button"
              onClick={onScanBill}
              whileTap={{ scale: 0.95 }}
              style={{
                background: "goldenrod",
                padding: "0.75rem 0.75rem",
                borderRadius: "0.5rem",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                cursor: "pointer",
                color: "white",
                fontSize: "1rem",
                fontWeight: "500"
              }}
            >
              <ScanLine width="1rem" />
              Scan Bill
            </motion.button>
          )}
            <motion.div
              ref={dateSectionRef}
              whileTap={{ scale: 0.99 }}
              style={{
                background: "rgba(100, 100, 100, 0.05)",
                padding: "1rem",
                borderRadius: "1rem",
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
              
              <div onClick={() => setShowDatePicker(true)} style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.75rem",
                padding: "0.875rem 1rem",
                borderRadius: "0.75rem",
                background: "rgba(100, 100, 100, 0.08)",
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
                  Change
                </motion.div>
              </div>
            </motion.div>

            {/* Odometer Reading Input */}
            <motion.div
              whileTap={{ scale: 0.99 }}
              style={{
                background: "rgba(100, 100, 100, 0.05)",
                padding: "1rem",
                borderRadius: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <Gauge width="1.125rem" height="1.125rem" style={{ opacity: 0.7 }}  />
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
                  placeholder="Enter reading (optional)"
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
                    paddingRight: "3rem",
                    borderRadius: "0.75rem",
                    fontSize: "1.0625rem",
                    fontWeight: "500",
                    background: "rgba(100, 100, 100, 0.08)",
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
                background: "rgba(100, 100, 100, 0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <DollarSign width="1.125rem" height="1.125rem" style={{ opacity: 0.7 }}  />
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

            {/* Litres Input */}
            <motion.div
              whileTap={{ scale: 0.99 }}
              style={{
                padding: "1rem",
                borderRadius: "1rem",
                background: "rgba(100, 100, 100, 0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <Fuel width="1.125rem" height="1.125rem" style={{ opacity: 0.7 }}  />
                <label
                  htmlFor="litres"
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    opacity: 0.9,
                  }}
                >
                  Litres Filled
                </label>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  id="litres"
                  type="number"
                  step="0.01"
                  value={litres}
                  onChange={(e) => setLitres(e.target.value)}
                  placeholder="Enter litres"
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
                    paddingRight: "3.5rem",
                    borderRadius: "0.75rem",
                    fontSize: "1.0625rem",
                    fontWeight: "500",
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
                  L
                </span>
              </div>
            </motion.div>


          </div>
        </motion.div>
      </div>
      
      {/* Fixed Submit Button */}
      <div style={{
        padding: "1rem",
        paddingBottom: "2rem",
        background: "var(--background)",
        boxSizing: "border-box"
      }}>
        <motion.button
          type="submit"
          disabled={submitting || !userProfile || !date || !amountSpent || !vehicleNumber || !litres}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          style={{
            width: "100%",
            padding: "1rem",
            borderRadius: "1rem",
            marginBottom:"0.5rem",
            background: submitting || !userProfile || !date || !amountSpent || !vehicleNumber || !litres
              ? "rgba(100, 100, 100, 1)" 
              : "black",
            color: "white",
            fontSize: "1.0625rem",
            border: "none",
            cursor: submitting || !userProfile || !date || !amountSpent || !vehicleNumber || !litres ? "not-allowed" : "pointer",
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
            <span>{editingLog ? "Update" : "Add"}</span>
          )}
        </motion.button>
      </div>
    </form>
  );
};

// Shared Fuel Log Detail Component
interface FuelLogDetailContentProps {
  selectedLog: FuelLogType;
  handleEdit: () => void;
  handleDelete: () => void;
}

const FuelLogDetailContent: React.FC<FuelLogDetailContentProps> = ({
  selectedLog,
  handleEdit,
  handleDelete,
}) => {
  return (
    <>
      {/* Fixed Header */}
      <div style={{
        width: "100%",
        padding: "1rem",
        paddingTop:"0rem",
        paddingBottom: "0.75rem",
        borderBottom: "1px solid rgba(100, 100, 100, 0.1)",
        background: "var(--background)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "600", letterSpacing: "-0.02em", marginLeft:"0.5rem" }}>Summary</h1>
          <DropDown
            trigger={<EllipsisVertical width="1.1rem" />}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
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
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}
        >
          {/* Date */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            style={{
              padding: "0.75rem",
              borderRadius: "0.75rem",
              background: "rgba(100, 100, 100, 0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
              <Calendar color="orange" width="1rem" height="1rem" style={{ opacity: 0.7 }} />
              <span style={{ fontSize: "0.6875rem", fontWeight: "600", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</span>
            </div>
            <div style={{ fontSize: "1rem", fontWeight: "600", paddingLeft: "" }}>
              {moment(selectedLog.date).format("DD MMM YYYY")}
            </div>
          </motion.div>
          
          {/* Vehicle Number */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            style={{
              padding: "0.75rem",
              borderRadius: "0.75rem",
              background: "rgba(100, 100, 100, 0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
              <Car color="orange" width="1rem" height="1rem" style={{ opacity: 0.7 }}  />
              <span style={{ fontSize: "0.6875rem", fontWeight: "600", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Vehicle Number</span>
            </div>
            <div style={{ fontSize: "1rem", fontWeight: "600", paddingLeft: "" }}>
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
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
              <Gauge color="orange" width="1rem" height="1rem" style={{ opacity: 0.7 }}  />
              <span style={{ fontSize: "0.6875rem", fontWeight: "600", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Odometer </span>
            </div>
            <div style={{ fontSize: "1rem", fontWeight: "600", paddingLeft: "" }}>
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
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
              <DollarSign color="orange" width="1rem" height="1rem" style={{ opacity: 0.9 }}  />
              <span style={{ fontSize: "0.6875rem", fontWeight: "600", opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount Spent</span>
            </div>
            <div style={{ fontSize: "1rem", fontWeight: "600", paddingLeft: ""}}>
              OMR {selectedLog.amount_spent.toFixed(3)} 
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

// Bill Scanner Component
interface BillScannerProps {
  open: boolean;
  onClose: () => void;
  onDataExtracted: (data: { amount: string; litres: string; odometer?: string }) => void;
}

const BillScanner: React.FC<BillScannerProps> = ({ open, onClose, onDataExtracted }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [ocrReady, setOcrReady] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<any>(null);

  const initializeOcrWorker = async () => {
    if (workerRef.current) {
      setOcrReady(true);
      return;
    }

    setOcrReady(false);
    const worker = await Tesseract.createWorker("eng", 1);

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: "0",
    });

    workerRef.current = worker;
    setOcrReady(true);
  };

  useEffect(() => {
    if (open) {
      void initializeOcrWorker();
      if (!capturedImage) {
        startCamera();
      }
    }
    return () => {
      stopCamera();
    };
  }, [open, capturedImage]);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        void workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const handleClose = () => {
    setCapturedImage(null);
    setProcessing(false);
    setExtractedText("");
    stopCamera();
    onClose();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Could not access camera");
      onClose();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Keep enough detail for OCR, but avoid huge images that slow recognition.
      const maxWidth = 1600;
      const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
      const targetWidth = Math.floor(video.videoWidth * scale);
      const targetHeight = Math.floor(video.videoHeight * scale);

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const processImage = async (imageData: string) => {
    setProcessing(true);
    try {
      if (!workerRef.current) {
        await initializeOcrWorker();
      }

      const result = await workerRef.current.recognize(imageData);

      const text = result.data.text;
      console.log("Extracted text:", text);
      setExtractedText(text);

      // Parse the text to extract fuel bill information
      const extractedData = parseFuelBillText(text);
      
      if (extractedData.amount || extractedData.litres) {
        onDataExtracted(extractedData);
        const amountText = extractedData.amount ? `OMR ${extractedData.amount}` : 'Not found';
        const litresText = extractedData.litres ? `${extractedData.litres} L` : 'Not found';
        toast.success(`Amount: ${amountText} • Volume: ${litresText}`);
        setCapturedImage(null);
        setExtractedText("");
        onClose();
      } else {
        toast.error("No data extracted. Check the text below and adjust the bill angle/lighting, then retake.");
        // Keep the image and text so user can see what was extracted
      }
    } catch (error) {
      console.error("OCR Error:", error);
      toast.error("Failed to process image");
      setCapturedImage(null);
      setExtractedText("");
    } finally {
      setProcessing(false);
    }
  };

  const parseFuelBillText = (text: string): { amount: string; litres: string; odometer?: string } => {
    let amount = '';
    let litres = '';
    let odometer = '';

    // Clean the text - remove extra spaces and normalize
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    console.log("==================== OCR TEXT PARSING ====================");
    console.log("Total lines:", lines.length);
    console.log("Full text:", cleanedText);
    console.log("Lines:", lines);
    
    // Log all lines containing "amount" for debugging
    const amountLines = lines.filter(line => /amount/i.test(line));
    if (amountLines.length > 0) {
      console.log("📋 Lines containing 'amount':", amountLines);
    }
    
    // Try to find amount and volume in adjacent lines or same line
    for (let i = 0; i < lines.length; i++) {
      const currentLine = lines[i].toLowerCase().replace(/\s+/g, ' ').trim();
      const nextLine = i < lines.length - 1 ? lines[i + 1].toLowerCase().replace(/\s+/g, ' ').trim() : '';
      
      // Check for AMOUNT label (with value on same or next line)
      // IMPORTANT: Exclude "VAT Amount", "Actual Amount" - match only standalone "Amount"
      if (!amount) {
        // Same line patterns: "Amount: 10.500", "Amount 10.500 OMR", "Amt: 10.500"
        // Use negative lookbehind to exclude "VAT Amount", "Actual Amount", etc.
        const amountSameLinePatterns = [
          /(?<!vat\s)(?<!actual\s)(?<!net\s)(?<!gross\s)(?<!sub\s)(?<!\w)amount[:\s]*(?:omr|rial|rials?)?\s*(\d+\.?\d*)/i,
          /^amount[:\s]*(?:omr|rial|rials?)?\s*(\d+\.?\d*)/i, // Amount at start of line
          /(?:total|payable|pay)[:\s]*(?:omr|rial|rials?)?\s*(\d+\.?\d*)/i,
          /(?:omr|rial|rials?)[:\s]*(\d+\.?\d*)/i
        ];
        
        for (const pattern of amountSameLinePatterns) {
          const match = currentLine.match(pattern);
          if (match) {
            // Double-check: ensure we're not matching "vat amount" or "actual amount"
            const lineHasVat = /vat\s+amount/i.test(currentLine);
            const lineHasActual = /actual\s+amount/i.test(currentLine);
            const lineHasNet = /net\s+amount/i.test(currentLine);
            const lineHasGross = /gross\s+amount/i.test(currentLine);
            
            if (!lineHasVat && !lineHasActual && !lineHasNet && !lineHasGross) {
              amount = match[1];
              console.log("✓ AMOUNT found (same line):", amount, "from:", currentLine);
              break;
            } else {
              if (lineHasVat) console.log("⚠️ SKIPPED VAT Amount:", currentLine);
              if (lineHasActual) console.log("⚠️ SKIPPED Actual Amount:", currentLine);
              if (lineHasNet) console.log("⚠️ SKIPPED Net Amount:", currentLine);
              if (lineHasGross) console.log("⚠️ SKIPPED Gross Amount:", currentLine);
            }
          }
        }
        
        // Check if current line has the label "amount" (not vat/actual amount) and next line has the value
        if (!amount) {
          const hasAmountLabel = /(?<!vat\s)(?<!actual\s)(?<!net\s)(?<!gross\s)(?<!\w)amount/i.test(currentLine);
          const hasVatAmount = /vat\s+amount/i.test(currentLine);
          const hasActualAmount = /actual\s+amount/i.test(currentLine);
          const hasNetAmount = /net\s+amount/i.test(currentLine);
          const hasGrossAmount = /gross\s+amount/i.test(currentLine);
          
          if (hasAmountLabel && !hasVatAmount && !hasActualAmount && !hasNetAmount && !hasGrossAmount) {
            const numberMatch = nextLine.match(/(\d+\.?\d+)/);
            if (numberMatch) {
              amount = numberMatch[1];
              console.log("✓ AMOUNT found (next line):", amount, "from label:", currentLine, "value:", nextLine);
            }
          } else if (hasVatAmount || hasActualAmount || hasNetAmount || hasGrossAmount) {
            if (hasVatAmount) console.log("⚠️ SKIPPED VAT Amount (label on separate line):", currentLine);
            if (hasActualAmount) console.log("⚠️ SKIPPED Actual Amount (label on separate line):", currentLine);
            if (hasNetAmount) console.log("⚠️ SKIPPED Net Amount (label on separate line):", currentLine);
            if (hasGrossAmount) console.log("⚠️ SKIPPED Gross Amount (label on separate line):", currentLine);
          }
        }
      }

      // Check for VOLUME/LITRES label (with value on same or next line)
      if (!litres) {
        // Same line patterns: "Volume: 25.5", "Vol: 25.5 L", "Qty: 25.5"
        const litresSameLinePatterns = [
          /(?:volume|vol|quantity|qty|litres?|liters?)[:\s]*(\d+\.?\d*)/i,
          /(\d+\.?\d*)\s*(?:l\b|ltr|ltrs)/i
        ];
        
        for (const pattern of litresSameLinePatterns) {
          const match = currentLine.match(pattern);
          if (match) {
            litres = match[1];
            console.log("✓ VOLUME/LITRES found (same line):", litres, "from:", currentLine);
            break;
          }
        }
        
        // Check if current line has the label and next line has the value
        if (!litres && /(?:volume|vol|quantity|qty|litres?|liters?)/.test(currentLine)) {
          const numberMatch = nextLine.match(/(\d+\.?\d+)/);
          if (numberMatch) {
            litres = numberMatch[1];
            console.log("✓ VOLUME/LITRES found (next line):", litres, "from label:", currentLine, "value:", nextLine);
          }
        }
      }

      // Check for ODOMETER
      if (!odometer) {
        const odometerPatterns = [
          /(?:odo|odometer|mileage|km)[:\s]*(\d{3,})/i,
          /(\d{4,})\s*(?:km|kms)/i
        ];
        
        for (const pattern of odometerPatterns) {
          const match = currentLine.match(pattern);
          if (match) {
            odometer = match[1];
            console.log("✓ ODOMETER found:", odometer, "from:", currentLine);
            break;
          }
        }
      }
    }

    // Fallback: If still not found, use broader patterns across entire text
    if (!amount) {
      console.log("⚠️ Attempting fallback for AMOUNT...");
      
      // Try to find "Amount" but exclude lines with "VAT Amount" or "Actual Amount"
      const amountMatches = cleanedText.match(/(?<!vat\s)(?<!actual\s)(?<!net\s)(?<!gross\s)(?<!sub\s)(?<!\w)amount[:\s]*(?:omr|rial)?\s*(\d+\.?\d*)/i);
      
      if (amountMatches && !(/vat\s+amount/i.test(cleanedText.substring(Math.max(0, amountMatches.index! - 20), amountMatches.index!)))) {
        amount = amountMatches[1];
        console.log("✓ AMOUNT found (fallback - negative lookbehind):", amount);
      } else {
        // Try other fallback patterns
        const fallbackPatterns = [
          /total[:\s]*(?:omr|rial)?\s*(\d+\.?\d*)/i,
          /payable[:\s]*(\d+\.?\d*)/i
        ];
        
        for (const pattern of fallbackPatterns) {
          const match = cleanedText.match(pattern);
          if (match) {
            amount = match[1];
            console.log("✓ AMOUNT found (fallback - alternative):", amount);
            break;
          }
        }
      }
    }

    if (!litres) {
      console.log("⚠️ Attempting fallback for LITRES...");
      const fallbackPatterns = [
        /volume[:\s]*(\d+\.?\d*)/i,
        /(?:qty|quantity)[:\s]*(\d+\.?\d*)\s*(?:l\b|ltr)/i,
        /(\d+\.?\d*)\s*(?:litres?|liters?)/i,
        /(\d+\.?\d*)\s*l\b/i
      ];
      
      for (const pattern of fallbackPatterns) {
        const match = cleanedText.match(pattern);
        if (match) {
          litres = match[1];
          console.log("✓ LITRES found (fallback):", litres);
          break;
        }
      }
    }

    // Last resort: Extract all decimal numbers and make educated guesses
    if (!amount || !litres) {
      console.log("⚠️ Last resort: Looking for decimal numbers...");
      const decimalNumbers = cleanedText.match(/\d+\.\d{1,3}/g);
      if (decimalNumbers && decimalNumbers.length > 0) {
        console.log("Found decimal numbers:", decimalNumbers);
        
        // Amount usually has 3 decimals in OMR (e.g., 10.500)
        if (!amount) {
          const threeDecimal = decimalNumbers.find(n => n.split('.')[1]?.length === 3);
          if (threeDecimal) {
            amount = threeDecimal;
            console.log("✓ AMOUNT guessed (3 decimals):", amount);
          }
        }
        
        // Litres usually has 1-2 decimals and is a reasonable volume (5-100)
        if (!litres) {
          const reasonableLitres = decimalNumbers.find(n => {
            const num = parseFloat(n);
            const decimals = n.split('.')[1]?.length || 0;
            return num >= 5 && num <= 100 && decimals <= 2 && n !== amount;
          });
          if (reasonableLitres) {
            litres = reasonableLitres;
            console.log("✓ LITRES guessed (reasonable volume):", litres);
          }
        }
      }
    }

    console.log("==================== FINAL RESULT ====================");
    console.log("Amount:", amount || "NOT FOUND");
    console.log("Litres:", litres || "NOT FOUND");
    console.log("Odometer:", odometer || "NOT FOUND");
    console.log("========================================================");
    
    return { amount, litres, odometer };
  };

  const retake = () => {
    setCapturedImage(null);
    setProcessing(false);
    setExtractedText("");
    startCamera();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        style={{ 
          maxWidth: "95vw", 
    
          width: "500px",
          padding: 0,
          overflow: "hidden"
        }}
      >
        <div style={{ 
          position: "relative", 
          width: "100%",
          background: "black"
        }}>
          {/* Header */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            padding: "1rem",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <h3 style={{ color: "white", fontSize: "1.125rem", fontWeight: "600" }}>
              {processing ? "Processing..." : capturedImage ? "Review Image" : "Scan Fuel Bill"}
            </h3>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "50%",
                width: "2rem",
                height: "2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <X color="white" width="1.25rem" />
            </motion.button>
          </div>

          {/* Camera/Image View */}
          <div style={{ 
            position: "relative",
            width: "100%",
            aspectRatio: "4/3",
            background: "black"
          }}>
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
                
                {/* Camera Guide Overlay */}
                <div style={{
                  position: "absolute",
                  bottom: "1rem",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(0,0,0,0.7)",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  maxWidth: "90%"
                }}>
                  <p style={{ 
                    color: "white", 
                    fontSize: "0.75rem", 
                    textAlign: "center",
                    margin: 0,
                    lineHeight: 1.4
                  }}>
                      {ocrReady
                        ? "💡 Position bill flat • Ensure good lighting • Focus on \"Amount\" and \"Volume\" fields"
                        : "Preparing scanner..."}
                  </p>
                </div>
              </>
            ) : (
              <img
                src={capturedImage}
                alt="Captured bill"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain"
                }}
              />
            )}

            {processing && (
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.7)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "1rem"
              }}>
                <Loader2 className="animate-spin" color="white" width="2.5rem" />
                <p style={{ color: "white", fontSize: "1rem" }}>Extracting bill information...</p>
              </div>
            )}
          </div>

          {/* Controls */}
          {!processing && (
            <div style={{
              padding: "1.5rem",
              display: "flex",
              gap: "1rem",
              justifyContent: "center"
            }}>
              {!capturedImage ? (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={capturePhoto}
                  disabled={!ocrReady}
                  style={{
                    background: ocrReady ? "white" : "rgba(255,255,255,0.5)",
                    color: "black",
                    border: "none",
                    padding: "1rem 2rem",
                    borderRadius: "2rem",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: ocrReady ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    boxShadow: "0 4px 12px rgba(30, 144, 255, 0.4)"
                  }}
                >
                  <Camera width="1.25rem" />
                  Capture Bill
                </motion.button>
              ) : (
                <>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={retake}
                    style={{
                      background: "rgba(100,100,100,0.2)",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.3)",
                      padding: "0.75rem 1.5rem",
                      borderRadius: "1rem",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    Retake
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => processImage(capturedImage)}
                    disabled={!ocrReady}
                    style={{
                      background: ocrReady ? "dodgerblue" : "rgba(30, 144, 255, 0.5)",
                      color: "white",
                      border: "none",
                      padding: "0.75rem 1.5rem",
                      borderRadius: "1rem",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      cursor: ocrReady ? "pointer" : "not-allowed"
                    }}
                  >
                    Process Image
                  </motion.button>
                </>
              )}
            </div>
          )}

          {/* Extracted Text Display (for debugging) */}
          {extractedText && !processing && (
            <div style={{
              padding: "1rem 1.5rem",
              paddingBottom: "1.5rem",
              maxHeight: "200px",
              overflowY: "auto",
              background: "rgba(30,30,30,0.95)",
              borderTop: "1px solid rgba(255,255,255,0.1)"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.625rem"
              }}>
                <p style={{ 
                  color: "white", 
                  fontSize: "0.75rem", 
                  fontWeight: "600", 
                  margin: 0,
                  opacity: 0.8
                }}>
                  📄 Detected Text
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(extractedText);
                    toast.success("Text copied to clipboard");
                  }}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "white",
                    padding: "0.25rem 0.625rem",
                    borderRadius: "0.375rem",
                    fontSize: "0.65rem",
                    cursor: "pointer"
                  }}
                >
                  Copy
                </button>
              </div>
              <pre style={{ 
                color: "rgba(255,255,255,0.85)", 
                fontSize: "0.7rem", 
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "monospace",
                margin: 0,
                lineHeight: 1.5,
                background: "rgba(0,0,0,0.3)",
                padding: "0.625rem",
                borderRadius: "0.375rem",
                border: "1px solid rgba(255,255,255,0.1)"
              }}>
                {extractedText}
              </pre>
              <p style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.65rem",
                marginTop: "0.5rem",
                marginBottom: 0,
                fontStyle: "italic"
              }}>
                💡 Check console logs for detailed parsing results
              </p>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function FuelLog() {
  const { userData } = useAuth();
  const [date, setDate] = useState(moment().format("YYYY-MM-DD"));
  const [odometerReading, setOdometerReading] = useState("");
  const [amountSpent, setAmountSpent] = useState("");
  const [litres, setLitres] = useState("");
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewingMonth, setViewingMonth] = useState(moment());
  const dateSectionRef = useRef<HTMLDivElement>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingLog, setEditingLog] = useState<FuelLogType | null>(null);
  const [vehicleRegistrationType, setVehicleRegistrationType] = useState<string>("Private");
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [scannerOpen, setScannerOpen] = useState(false);
  const { addProcess, updateProcess } = useBackgroundProcess();

  useEffect(() => {
    // Load cached profile data immediately
    const cachedProfile = getCachedProfile();
    if (cachedProfile) {
      setUserProfile(cachedProfile);
    }
    
    // Load cached vehicle data to get registration type
    const loadVehicleData = async () => {
      const vehicleNumber = cachedProfile?.allocated_vehicle || userData?.allocated_vehicle;
      if (vehicleNumber) {
        // Try to get cached vehicle first
        const cachedVehicle = getCachedVehicle();
        if (cachedVehicle?.registration_type) {
          setVehicleRegistrationType(cachedVehicle.registration_type);
        }
        // Fetch fresh vehicle data to ensure we have latest registration type
        const vehicleData = await fetchAndCacheVehicle(vehicleNumber);
        if (vehicleData?.registration_type) {
          setVehicleRegistrationType(vehicleData.registration_type);
        }
      }
    };
    loadVehicleData();
    
    // Load cached fuel logs immediately
    if (userData?.email) {
      const cachedLogs = getCachedFuelLogs(userData.email);
      if (cachedLogs) {
        setFuelLogs(cachedLogs);
        // Fetch fresh data in background (silent refresh)
        fetchFuelLogs(true);
      } else {
        // No cached data, show loader while fetching
        fetchFuelLogs(false);
      }
    }
    
    // Detect mobile/desktop
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingLogs();
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check for pending logs
    updatePendingCount();
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userData?.email]);

  const fetchFuelLogs = async (silent = false) => {
    if (!userData?.email) return;
    
    // Don't fetch when offline, just use cached/pending data
    if (!navigator.onLine) {
      console.log("📴 Offline: Using local data only");
      const cachedLogs = getCachedFuelLogs(userData.email) || [];
      const pendingLogs = getPendingFuelLogs();
      const pendingAsFuelLogs: FuelLogType[] = pendingLogs.map(log => ({
        id: log.id,
        date: log.data.date,
        odometer_reading: log.data.odometer_reading,
        amount_spent: log.data.amount_spent,
        employee_name: log.data.employee_name,
        vehicle_number: log.data.vehicle_number,
        created_at: new Date(log.createdAt),
        isPending: true,
      }));
      
      const allLogs = [...pendingAsFuelLogs, ...cachedLogs].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      setFuelLogs(allLogs);
      return;
    }
    
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      
      const logs = await fetchAndCacheFuelLogs(userData.email);
      
      // Merge with pending logs
      const pendingLogs = getPendingFuelLogs();
      const pendingAsFuelLogs: FuelLogType[] = pendingLogs.map(log => ({
        id: log.id,
        date: log.data.date,
        odometer_reading: log.data.odometer_reading,
        amount_spent: log.data.amount_spent,
        employee_name: log.data.employee_name,
        vehicle_number: log.data.vehicle_number,
        created_at: new Date(log.createdAt),
        isPending: true,
      }));
      
      // Combine and sort by date (newest first)
      const allLogs = [...pendingAsFuelLogs, ...logs].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      setFuelLogs(allLogs);
      
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

  const updatePendingCount = () => {
    // Removed - pending count now shown in background process dropdown
  };

  const syncPendingLogs = async () => {
    const count = getPendingFuelLogsCount();
    if (count === 0) return;

    const processId = `sync_fuel_logs_${Date.now()}`;
    addProcess(processId, `Syncing ${count} fuel log${count > 1 ? 's' : ''}`);
    updateProcess(processId, { status: "in-progress", message: "Uploading to cloud..." });

    try {
      const result = await syncAllPendingFuelLogs((current, total) => {
        const progress = Math.round((current / total) * 100);
        updateProcess(processId, { 
          progress, 
          message: `Uploaded ${current} of ${total}...` 
        });
      });

      // If sync was skipped (already in progress), don't show notifications
      if (result.skipped) {
        updateProcess(processId, { 
          status: "completed", 
          message: "Sync already in progress" 
        });
        return;
      }

      if (result.success > 0) {
        updateProcess(processId, { 
          status: "completed", 
          message: `${result.success} fuel log${result.success > 1 ? 's' : ''} synced successfully` 
        });
        fetchFuelLogs(true); // Refresh the list
      }

      if (result.failed > 0) {
        updateProcess(processId, { 
          status: "error", 
          message: `${result.failed} fuel log${result.failed > 1 ? 's' : ''} failed to sync` 
        });
      }

      updatePendingCount();
    } catch (error) {
      console.error("Error syncing fuel logs:", error);
      updateProcess(processId, { status: "error", message: "Sync failed" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const vehicleNumber = userProfile?.allocated_vehicle || userData?.allocated_vehicle;
    
    if (!vehicleNumber || !amountSpent) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!userProfile) {
      toast.error("User profile not found");
      return;
    }

    try {
      setSubmitting(true);

      if (editingLog) {
        // Update existing log (requires online connection)
        if (!isOnline) {
          toast.error("You need to be online to edit existing logs");
          return;
        }

        const fuelLogData = {
          date: date,
          odometer_reading: odometerReading ? parseFloat(odometerReading) : 0,
          amount_spent: parseFloat(amountSpent),
          litres: litres ? parseFloat(litres) : undefined,
          vehicle_number: vehicleNumber,
          updated_at: new Date(),
        };

        await updateDoc(doc(db, "fuel log", editingLog.id), fuelLogData);
        toast.success("Fuel log updated successfully!");
      } else {
        // Create new log
        const fuelLogData = {
          date: date,
          odometer_reading: odometerReading ? parseFloat(odometerReading) : 0,
          amount_spent: parseFloat(amountSpent),
          litres: litres ? parseFloat(litres) : undefined,
          email: userData?.email || "",
          employee_name: userProfile.name || "",
          employee_code: userProfile.employeeCode || "",
          vehicle_number: vehicleNumber,
          timestamp: Date.now(),
        };

        if (isOnline) {
          // Save directly to Firestore
          await addDoc(collection(db, "fuel log"), {
            ...fuelLogData,
            created_at: new Date(),
          });
          toast.success("Fuel log submitted successfully!");
          
          // Refresh logs from Firestore
          fetchFuelLogs();
        } else {
          // Save to localStorage for later sync
          const pendingId = addPendingFuelLog(fuelLogData);
          toast.success("Fuel log saved offline. Will sync when online.", {
            icon: <WifiOff width="1rem" />,
          });
          updatePendingCount();
          
          // Add to local state immediately without refetching
          const newLog: FuelLogType = {
            id: pendingId,
            date: date,
            odometer_reading: odometerReading ? parseFloat(odometerReading) : 0,
            amount_spent: parseFloat(amountSpent),
            employee_name: userProfile.name || "",
            vehicle_number: vehicleNumber,
            created_at: new Date(),
            isPending: true,
          };
          
          setFuelLogs(prevLogs => [newLog, ...prevLogs]);
        }
      }
      
      // Reset form
      setDate(moment().format("YYYY-MM-DD"));
      setOdometerReading("");
      setAmountSpent("");
      setLitres("");
      setDrawerOpen(false);
      setEditingLog(null);
    } catch (error) {
      console.error("Error submitting fuel log:", error);
      toast.error(editingLog ? "Failed to update fuel log" : "Failed to submit fuel log");
    } finally {
      setSubmitting(false);
    }
  };

  const showDeleteConfirmation = () => {
    setDeleteConfirmDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedLog || deleting) return;

    try {
      setDeleting(true);
      await deleteDoc(doc(db, "fuel log", selectedLog.id));
      toast.success("Fuel log deleted successfully!");
      setDeleteConfirmDialog(false);
      setDrawerDetailOpen(false);
      setSelectedLog(null);
      fetchFuelLogs();
    } catch (error) {
      console.error("Error deleting fuel log:", error);
      toast.error("Failed to delete fuel log");
    } finally {
      setDeleting(false);
      setDeleteConfirmDialog(false);
    }
  };

  const handleEdit = () => {
    if (!selectedLog) return;
    
    // Populate form with selected log data
    setDate(selectedLog.date);
    setOdometerReading(selectedLog.odometer_reading ? String(selectedLog.odometer_reading) : "");
    setAmountSpent(String(selectedLog.amount_spent));
    setLitres(selectedLog.litres ? String(selectedLog.litres) : "");
    setEditingLog(selectedLog);
    
    // Close detail drawer and open edit drawer
    setDrawerDetailOpen(false);
    setDrawerOpen(true);
  };

  const handleScanBill = () => {
    setScannerOpen(true);
  };

  const handleDataExtracted = (data: { amount: string; litres: string; odometer?: string }) => {
    if (data.amount) {
      setAmountSpent(data.amount);
    }
    if (data.litres) {
      setLitres(data.litres);
    }
    if (data.odometer) {
      setOdometerReading(data.odometer);
    }
    setScannerOpen(false);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
        <Back
          fixed
          blurBG
            title="Fuel Log"
            subtitle={fuelLogs.length}
            extra={
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {/* {!isOnline && (
                  <div style={{
                    padding: "0.5rem 1rem",
                   
                    borderRadius: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.8rem",
                    fontWeight: "500",
                    color: "crimson"
                  }}>
                    <RadioTower width={"1rem"} />
                    Offline
                  </div>
                )} */}
                <RefreshButton
                  onClick={() => fetchFuelLogs(true)}
                  refreshCompleted={refreshCompleted}
                  fetchingData={refreshing}
                />
              </div>
            }
            // icon={<Fuel color="orange" width="1.75rem" />}
          />
        <div style={{ padding: "1.25rem", paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}>
          

          <div style={{ height: "2rem" }} />

          {/* Fuel Logs List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingBottom: "5.5rem", paddingTop:"2rem" }}>
                      
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
              <Empty style={{ minHeight: "70vh" }}>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Fuel />
                  </EmptyMedia>
                  <EmptyTitle>No fuel logs yet</EmptyTitle>
                  <EmptyDescription>
                    Click the + button to add your first fuel log
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              fuelLogs.map((log) => (
                <Directive 
                  subtext={"Vehicle - "+log.vehicle_number} 
                  noArrow 
                  tag={log.amount_spent.toFixed(3)} 
                  key={log.id} 
                  icon={<Fuel color={log.isPending ? "gray" : "orange"}/>} 
                  title={moment(log.date).format("DD MMM YYYY")}
                  onClick={() => {
                    if (!log.isPending) {
                      setSelectedLog(log);
                      setDrawerDetailOpen(true);
                    }
                    else{
                      toast.info("Log will be updated when online")
                    }
                  }}
                  className={log.isPending ? "pending-log" : ""}
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

        {/* Add Button - Full width on mobile, floating on desktop */}
        {/* Add Button - Full width on mobile, floating on desktop */}
        <motion.button
          initial={{ opacity: 0, y: isMobile ? 20 : 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.2 }}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: isMobile ? 1 : 1.05 }}
          onClick={() => {
            setEditingLog(null);
            setDate(moment().format("YYYY-MM-DD"));
            setOdometerReading("");
            setAmountSpent("");
            setDrawerOpen(true);
          }}
          style={{
            transition:"none",
            position: "fixed",
            bottom: isMobile ? "calc(1rem + env(safe-area-inset-bottom, 0px))" : "calc(2rem + env(safe-area-inset-bottom, 0px))",
            right: isMobile ? "1rem" : "1.5rem",
            left: isMobile ? "1rem" : "auto",
            width: isMobile ? "calc(100% - 2rem)" : "3.5rem",
            height: isMobile ? "auto" : "3.5rem",
            padding: isMobile ? "1rem" : "0",
            borderRadius: isMobile ? "0.5rem" : "0.75rem",
            background: "black",
            color: "white",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            fontSize: isMobile ? "1rem" : "inherit",
            fontWeight: isMobile ? "500" : "normal",
            zIndex: 50,
            boxShadow: isMobile ? "0 4px 12px rgba(0, 0, 0, 0.15)" : "none",
            marginBottom:"1rem"
          }}
        >
          <Plus width="1.25rem" height="1.75rem" strokeWidth={2.5} />
          {isMobile && <span>Log Fuel</span>}
        </motion.button>
        
      </motion.div>

      {/* Fuel Log Form - Responsive Modal */}
      <ResponsiveModal
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title=""
        description=""
      >
        <FuelLogFormContent
          date={date}
          vehicleNumber={userProfile?.allocated_vehicle || userData?.allocated_vehicle}
          odometerReading={odometerReading}
          setOdometerReading={setOdometerReading}
          amountSpent={amountSpent}
          setAmountSpent={setAmountSpent}
          litres={litres}
          setLitres={setLitres}
          setShowDatePicker={setShowDatePicker}
          dateSectionRef={dateSectionRef}
          editingLog={editingLog}
          submitting={submitting}
          userProfile={userProfile}
          handleSubmit={handleSubmit}
          isPrivateVehicle={vehicleRegistrationType === "Private"}
          onScanBill={handleScanBill}
        />
      </ResponsiveModal>

      {/* Bill Scanner */}
      <BillScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDataExtracted={handleDataExtracted}
      />

      {/* Detail View - Responsive Modal */}
      {selectedLog && (
        <ResponsiveModal
          open={drawerDetailOpen}
          onOpenChange={setDrawerDetailOpen}
          title=""
          description=""
        >
          <FuelLogDetailContent
            selectedLog={selectedLog}
            handleEdit={handleEdit}
            handleDelete={showDeleteConfirmation}
          />
        </ResponsiveModal>
      )}

      {/* Date Picker Dialog */}
      <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
        <DialogContent style={{ maxWidth: "400px", padding: "1.5rem" }}>
          <DialogHeader>
            <DialogTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Calendar/>
              Select Date
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>

          <div style={{ marginTop: "" }}>
            {/* Quick Actions */}
            {/* <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setDate(moment().format("YYYY-MM-DD"));
                  setShowDatePicker(false);
                }}
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
                onClick={() => {
                  setDate(moment().subtract(1, 'day').format("YYYY-MM-DD"));
                  setShowDatePicker(false);
                }}
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
            </div> */}

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
              <span style={{ fontWeight: "600", fontSize: "1rem" }}>
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
                          ? "orange"
                          : isToday
                          ? "rgba(255, 140, 0, 0.15)"
                          : "rgba(100, 100, 100, 0.05)",
                        color: isSelected ? "white" : isFuture ? "rgba(100, 100, 100, 0.3)" : "inherit",
                        // border: isToday && !isSelected ? "1px solid rgba(255, 140, 0, 0.5)" : "1px solid transparent",
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
          </div>
        </DialogContent>
      </Dialog>

      <DefaultDialog
        open={deleteConfirmDialog}
        onCancel={() => setDeleteConfirmDialog(false)}
        title="Delete Fuel Log"
        desc="Are you sure you want to delete this fuel log entry? This action cannot be undone."
        OkButtonText="Delete"
        CancelButtonText="Cancel"
        onOk={handleDelete}
        updating={deleting}
        disabled={deleting}
      />
    </>
  );
}
