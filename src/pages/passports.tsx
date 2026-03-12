import { useAuth } from "@/components/AuthProvider";
import Back from "@/components/back";
import RefreshButton from "@/components/refresh-button";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { db } from "@/firebase";
import { ensureOcrWorker, getOcrLoadState, subscribeOcrLoadState } from "@/utils/ocrWorker";
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where, orderBy } from "firebase/firestore";
import { motion } from "framer-motion";
import { 
  Calendar, Camera, Globe, Loader2, Plus, ScanLine, Trash, UserCircle, X, 
  FileText, MapPin, BookMarked 
} from "lucide-react";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type PassportRecord = {
  id: string;
  passportNumber: string;
  fullName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  placeOfIssue: string;
  dateOfIssue: string;
  dateOfExpiry: string;
  nationality: string;
  sex?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

// Passport Form Component
interface PassportFormContentProps {
  passportNumber: string;
  setPassportNumber: (value: string) => void;
  fullName: string;
  setFullName: (value: string) => void;
  dateOfBirth: string;
  setDateOfBirth: (value: string) => void;
  placeOfBirth: string;
  setPlaceOfBirth: (value: string) => void;
  placeOfIssue: string;
  setPlaceOfIssue: (value: string) => void;
  dateOfIssue: string;
  setDateOfIssue: (value: string) => void;
  dateOfExpiry: string;
  setDateOfExpiry: (value: string) => void;
  nationality: string;
  setNationality: (value: string) => void;
  sex: string;
  setSex: (value: string) => void;
  editingPassport: PassportRecord | null;
  submitting: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  onScanPassport: () => void;
}

const PassportFormContent: React.FC<PassportFormContentProps> = ({
  passportNumber,
  setPassportNumber,
  fullName,
  setFullName,
  dateOfBirth,
  setDateOfBirth,
  placeOfBirth,
  setPlaceOfBirth,
  placeOfIssue,
  setPlaceOfIssue,
  dateOfIssue,
  setDateOfIssue,
  dateOfExpiry,
  setDateOfExpiry,
  nationality,
  setNationality,
  sex,
  setSex,
  editingPassport,
  submitting,
  handleSubmit,
  onScanPassport,
}) => {
  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", maxHeight: "75vh", width: "100%" }}>
      {/* Fixed Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "1.5rem",
        paddingBottom: "1rem",
        borderBottom: "1px solid rgba(100, 100, 100, 0.1)",
        background: "var(--background)",
        boxSizing: "border-box",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            background: "darkslateblue",
            padding: "0.75rem",
            borderRadius: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <BookMarked color="white" width="1.5rem" />
          </div>
          <h2 style={{ fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
            {editingPassport ? "Edit Passport" : "Add Passport"}
          </h2>
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
            
            {/* Scan Passport Button */}
            {!editingPassport && (
              <motion.button
                type="button"
                onClick={onScanPassport}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: "darkslateblue",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  color: "white",
                  fontSize: "1rem",
                  fontWeight: "500"
                }}
              >
                <ScanLine width="1rem" />
                Scan Passport
              </motion.button>
            )}

            {/* Passport Number */}
            <div style={{ background: "rgba(100, 100, 100, 0.05)", padding: "1rem", borderRadius: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <FileText width="1.125rem" height="1.125rem" style={{ opacity: 0.7 }} />
                <label style={{ fontSize: "0.875rem", fontWeight: "600", opacity: 0.7 }}>
                  Passport Number *
                </label>
              </div>
              <input
                type="text"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                placeholder="e.g., N1234567"
                required
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(100, 100, 100, 0.2)",
                  background: "var(--background)",
                  fontSize: "1rem",
                  fontWeight: "500"
                }}
              />
            </div>

            {/* Full Name */}
            <div style={{ background: "rgba(100, 100, 100, 0.05)", padding: "1rem", borderRadius: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <UserCircle width="1.125rem" height="1.125rem" style={{ opacity: 0.7 }} />
                <label style={{ fontSize: "0.875rem", fontWeight: "600", opacity: 0.7 }}>
                  Full Name *
                </label>
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name as on passport"
                required
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(100, 100, 100, 0.2)",
                  background: "var(--background)",
                  fontSize: "1rem",
                  fontWeight: "500"
                }}
              />
            </div>

            {/* Date of Birth */}
            <div style={{ background: "rgba(100, 100, 100, 0.05)", padding: "1rem", borderRadius: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <Calendar width="1.125rem" height="1.125rem" style={{ opacity: 0.7 }} />
                <label style={{ fontSize: "0.875rem", fontWeight: "600", opacity: 0.7 }}>
                  Date of Birth *
                </label>
              </div>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(100, 100, 100, 0.2)",
                  background: "var(--background)",
                  fontSize: "1rem",
                  fontWeight: "500"
                }}
              />
            </div>

            {/* Sex */}
            <div style={{ background: "rgba(100, 100, 100, 0.05)", padding: "1rem", borderRadius: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <UserCircle width="1.125rem" height="1.125rem" style={{ opacity: 0.7 }} />
                <label style={{ fontSize: "0.875rem", fontWeight: "600", opacity: 0.7 }}>
                  Sex
                </label>
              </div>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(100, 100, 100, 0.2)",
                  background: "var(--background)",
                  fontSize: "1rem",
                  fontWeight: "500"
                }}
              >
                <option value="">Select</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>

            {/* Place of Birth */}
            <div style={{ background: "rgba(100, 100, 100, 0.05)", padding: "1rem", borderRadius: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <MapPin width="1.125rem" height="1.125rem" style={{ opacity: 0.7 }} />
                <label style={{ fontSize: "0.875rem", fontWeight: "600", opacity: 0.7 }}>
                  Place of Birth
                </label>
              </div>
              <input
                type="text"
                value={placeOfBirth}
                onChange={(e) => setPlaceOfBirth(e.target.value)}
                placeholder="City, Country"
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(100, 100, 100, 0.2)",
                  background: "var(--background)",
                  fontSize: "1rem",
                  fontWeight: "500"
                }}
              />
            </div>

            {/* Nationality */}
            <div style={{ background: "rgba(100, 100, 100, 0.05)", padding: "1rem", borderRadius: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <Globe width="1.125rem" height="1.125rem" style={{ opacity: 0.7 }} />
                <label style={{ fontSize: "0.875rem", fontWeight: "600", opacity: 0.7 }}>
                  Nationality *
                </label>
              </div>
              <input
                type="text"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="e.g., Indian, American"
                required
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(100, 100, 100, 0.2)",
                  background: "var(--background)",
                  fontSize: "1rem",
                  fontWeight: "500"
                }}
              />
            </div>

            {/* Place of Issue */}
            <div style={{ background: "rgba(100, 100, 100, 0.05)", padding: "1rem", borderRadius: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <MapPin width="1.125rem" height="1.125rem" style={{ opacity: 0.7 }} />
                <label style={{ fontSize: "0.875rem", fontWeight: "600", opacity: 0.7 }}>
                  Place of Issue
                </label>
              </div>
              <input
                type="text"
                value={placeOfIssue}
                onChange={(e) => setPlaceOfIssue(e.target.value)}
                placeholder="Issuing location"
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(100, 100, 100, 0.2)",
                  background: "var(--background)",
                  fontSize: "1rem",
                  fontWeight: "500"
                }}
              />
            </div>

            {/* Date of Issue */}
            <div style={{ background: "rgba(100, 100, 100, 0.05)", padding: "1rem", borderRadius: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <Calendar width="1.125rem" height="1.125rem" style={{ opacity: 0.7 }} />
                <label style={{ fontSize: "0.875rem", fontWeight: "600", opacity: 0.7 }}>
                  Date of Issue
                </label>
              </div>
              <input
                type="date"
                value={dateOfIssue}
                onChange={(e) => setDateOfIssue(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(100, 100, 100, 0.2)",
                  background: "var(--background)",
                  fontSize: "1rem",
                  fontWeight: "500"
                }}
              />
            </div>

            {/* Date of Expiry */}
            <div style={{ background: "rgba(100, 100, 100, 0.05)", padding: "1rem", borderRadius: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <Calendar width="1.125rem" height="1.125rem" style={{ opacity: 0.7 }} />
                <label style={{ fontSize: "0.875rem", fontWeight: "600", opacity: 0.7 }}>
                  Date of Expiry *
                </label>
              </div>
              <input
                type="date"
                value={dateOfExpiry}
                onChange={(e) => setDateOfExpiry(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(100, 100, 100, 0.2)",
                  background: "var(--background)",
                  fontSize: "1rem",
                  fontWeight: "500"
                }}
              />
            </div>

          </div>
        </motion.div>
      </div>

      {/* Fixed Footer */}
      <div style={{
        padding: "1.5rem",
        paddingTop: "1rem",
        borderTop: "1px solid rgba(100, 100, 100, 0.1)",
        background: "var(--background)",
        boxSizing: "border-box"
      }}>
        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%",
            padding: "1rem",
            borderRadius: "0.75rem",
            background: submitting ? "rgba(100, 100, 100, 0.3)" : "darkslateblue",
            color: "white",
            border: "none",
            fontSize: "1rem",
            fontWeight: "600",
            cursor: submitting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem"
          }}
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" width="1.25rem" />
              Saving...
            </>
          ) : (
            editingPassport ? "Update Passport" : "Save Passport"
          )}
        </button>
      </div>
    </form>
  );
};

// Passport Scanner Component
interface PassportScannerProps {
  open: boolean;
  onClose: () => void;
  onDataExtracted: (data: Partial<PassportRecord>) => void;
}

const PassportScanner: React.FC<PassportScannerProps> = ({ open, onClose, onDataExtracted }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [ocrReady, setOcrReady] = useState(getOcrLoadState().ready);
  const [ocrLoadProgress, setOcrLoadProgress] = useState(getOcrLoadState().progress);
  const [extractedText, setExtractedText] = useState<string>("");
  const [documentDetected, setDocumentDetected] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const edgeCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeOcrLoadState((state) => {
      setOcrReady(state.ready);
      setOcrLoadProgress(state.progress);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (open) {
      void ensureOcrWorker();
      if (!capturedImage) {
        startCamera();
      }
    }
    return () => {
      stopCamera();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [open, capturedImage]);

  useEffect(() => {
    if (videoRef.current && !capturedImage && open) {
      detectDocumentEdges();
    }
  }, [capturedImage, open]);

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
          width: { ideal: 1920 },
          height: { ideal: 1080 }
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
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const detectDocumentEdges = () => {
    const video = videoRef.current;
    const canvas = edgeCanvasRef.current;
    
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(detectDocumentEdges);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animationFrameRef.current = requestAnimationFrame(detectDocumentEdges);
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data for edge detection
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Convert to grayscale and detect edges using simple edge detection
    const width = canvas.width;
    const height = canvas.height;
    const edges: number[] = [];
    
    // Simple Sobel-like edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        // Sample neighboring pixels
        const grayRight = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
        const grayDown = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;
        
        const edgeStrength = Math.abs(gray - grayRight) + Math.abs(gray - grayDown);
        edges.push(edgeStrength);
      }
    }
    
    // Calculate average edge strength
    const avgEdgeStrength = edges.reduce((a, b) => a + b, 0) / edges.length;
    const hasDocument = avgEdgeStrength > 10; // Threshold for document detection
    
    setDocumentDetected(hasDocument);
    
    // Continue detection loop
    animationFrameRef.current = requestAnimationFrame(detectDocumentEdges);
  };

  const findDocumentBounds = (imageData: string): Promise<{ x: number, y: number, width: number, height: number } | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Use a simpler approach: crop to the center area where document is expected
        // Based on the visual guide (inset 5%), crop to that region
        const cropMargin = 0.05; // 5% margin like the visual guide
        const bounds = {
          x: Math.floor(img.width * cropMargin),
          y: Math.floor(img.height * cropMargin),
          width: Math.floor(img.width * (1 - cropMargin * 2)),
          height: Math.floor(img.height * (1 - cropMargin * 2))
        };
        
        console.log("Using guided crop bounds:", bounds);
        resolve(bounds);
      };
      
      img.onerror = () => {
        console.log("Image load error, using full image");
        resolve(null);
      };
      img.src = imageData;
    });
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      const maxWidth = 1920;
      const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
      const targetWidth = Math.floor(video.videoWidth * scale);
      const targetHeight = Math.floor(video.videoHeight * scale);

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        
        // Enhanced image preprocessing for passport OCR
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imageData.data;
        
        // Convert to grayscale, increase contrast, and sharpen
        for (let i = 0; i < data.length; i += 4) {
          // Grayscale conversion
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          
          // High contrast adjustment for better text clarity
          const contrastFactor = 1.5;
          const contrasted = ((gray - 128) * contrastFactor) + 128;
          
          // Brightness adjustment
          const brightnessFactor = 1.1;
          const final = Math.min(255, Math.max(0, contrasted * brightnessFactor));
          
          data[i] = final;
          data[i + 1] = final;
          data[i + 2] = final;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const capturedData = canvas.toDataURL('image/jpeg', 0.98);
        setCapturedImage(capturedData);
        stopCamera();
      }
    }
  };

  const processImage = async (imageData: string) => {
    setProcessing(true);
    try {
      // Crop to document bounds (the area inside the visual guide)
      const bounds = await findDocumentBounds(imageData);
      let processedImage = imageData;
      
      if (bounds) {
        console.log("Cropping to bounds:", bounds);
        
        // Crop to detected bounds
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageData;
        });
        
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = bounds.width;
        cropCanvas.height = bounds.height;
        const cropCtx = cropCanvas.getContext('2d');
        
        if (cropCtx) {
          // Draw the cropped region
          cropCtx.drawImage(
            img,
            bounds.x, bounds.y, bounds.width, bounds.height,
            0, 0, bounds.width, bounds.height
          );
          
          // Apply additional enhancement to cropped image
          const imgData = cropCtx.getImageData(0, 0, bounds.width, bounds.height);
          const data = imgData.data;
          
          // Sharpen the text
          const factor = 1.3;
          for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const enhanced = ((brightness - 128) * factor) + 128;
            const final = Math.min(255, Math.max(0, enhanced));
            data[i] = final;
            data[i + 1] = final;
            data[i + 2] = final;
          }
          
          cropCtx.putImageData(imgData, 0, 0);
          
          processedImage = cropCanvas.toDataURL('image/jpeg', 0.98);
          console.log("✓ Image cropped and enhanced. New dimensions:", bounds.width, "x", bounds.height);
          
          // Update the displayed captured image to show the cropped version
          setCapturedImage(processedImage);
        }
      } else {
        console.log("No cropping applied, using full image");
      }
      
      const worker = await ensureOcrWorker();
      console.log("Starting OCR recognition...");
      const result = await worker.recognize(processedImage, {
        lang: 'eng',
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,/-:()<>',
      });

      const text = result.data.text;
      console.log("Extracted passport text:", text);
      setExtractedText(text);

      const extractedData = parsePassportText(text);
      
      // Accept any extracted data (not just passportNumber or fullName)
      const hasAnyData = Object.keys(extractedData).length > 0;
      
      if (hasAnyData) {
        onDataExtracted(extractedData);
        toast.success("Passport data extracted! Please review and fill in missing fields.");
        setCapturedImage(null);
        setExtractedText("");
        onClose();
      } else {
        // Don't close - let user see the extracted text and try again
        toast.error("Could not extract passport data. You can see the text below or retake the photo.");
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

  const parsePassportText = (text: string): Partial<PassportRecord> => {
    const data: Partial<PassportRecord> = {};
    
    console.log("==================== PASSPORT OCR PARSING ====================");
    console.log("Full text:", text);
    
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    console.log("Lines:", lines);

    // Parse MRZ (Machine Readable Zone) - typically last 2 lines
    const mrzPattern = /^([A-Z0-9<]{44})$/;
    const mrzLines = lines.filter(line => mrzPattern.test(line));
    
    if (mrzLines.length >= 2) {
      console.log("MRZ detected:", mrzLines);
      const line1 = mrzLines[0];
      const line2 = mrzLines[1];
      
      // Parse passport number from MRZ line 2 (positions 0-8)
      const passportNum = line2.substring(0, 9).replace(/</g, '').trim();
      if (passportNum) {
        data.passportNumber = passportNum;
        console.log("✓ Passport Number from MRZ:", passportNum);
      }
      
      // Parse date of birth from MRZ line 2 (positions 13-18: YYMMDD)
      const dobStr = line2.substring(13, 19);
      if (/^\d{6}$/.test(dobStr)) {
        const year = parseInt(dobStr.substring(0, 2));
        const fullYear = year > 50 ? 1900 + year : 2000 + year;
        const month = dobStr.substring(2, 4);
        const day = dobStr.substring(4, 6);
        data.dateOfBirth = `${fullYear}-${month}-${day}`;
        console.log("✓ DOB from MRZ:", data.dateOfBirth);
      }
      
      // Parse expiry date from MRZ line 2 (positions 21-26: YYMMDD)
      const expiryStr = line2.substring(21, 27);
      if (/^\d{6}$/.test(expiryStr)) {
        const year = parseInt(expiryStr.substring(0, 2));
        const fullYear = year > 50 ? 1900 + year : 2000 + year;
        const month = expiryStr.substring(2, 4);
        const day = expiryStr.substring(4, 6);
        data.dateOfExpiry = `${fullYear}-${month}-${day}`;
        console.log("✓ Expiry from MRZ:", data.dateOfExpiry);
      }
      
      // Parse sex from MRZ line 2 (position 20)
      const sexChar = line2.charAt(20);
      if (sexChar === 'M' || sexChar === 'F') {
        data.sex = sexChar;
        console.log("✓ Sex from MRZ:", sexChar);
      }
      
      // Parse nationality from MRZ line 2 (positions 10-12)
      const natCode = line2.substring(10, 13).replace(/</g, '').trim();
      if (natCode) {
        data.nationality = natCode;
        console.log("✓ Nationality code from MRZ:", natCode);
      }
      
      // Parse name from MRZ line 1 (positions 5-43)
      const nameSection = line1.substring(5, 44).replace(/</g, ' ').trim();
      const nameParts = nameSection.split(/\s+/).filter(p => p.length > 0);
      if (nameParts.length > 0) {
        data.fullName = nameParts.join(' ');
        console.log("✓ Name from MRZ:", data.fullName);
      }
    }

    // Fallback: Try to extract from text fields
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
      
      // Passport number patterns - Indian passport specific
      if (!data.passportNumber) {
        // Check if this line contains "INDIAN" or variations
        if (/IND[I1]AN?/i.test(line)) {
          // Look for passport number pattern - more flexible
          const indianPassportMatch = line.match(/IND[I1]AN?[\s:]*([A-Z0-9][0-9O]{7,8})/i);
          if (indianPassportMatch) {
            // Replace common OCR errors (O->0)
            const cleaned = indianPassportMatch[1].toUpperCase().replace(/O/g, '0');
            data.passportNumber = cleaned;
            console.log("✓ Passport Number (Indian) from text:", data.passportNumber);
          } else if (nextLine) {
            // Check next line for passport number - more flexible
            const nextLineMatch = nextLine.match(/^([A-Z][0-9O]{7,8})/);
            if (nextLineMatch) {
              const cleaned = nextLineMatch[1].toUpperCase().replace(/O/g, '0');
              data.passportNumber = cleaned;
              console.log("✓ Passport Number (Indian, next line) from text:", data.passportNumber);
            }
          }
        }
        
        // General passport number patterns if not found with INDIAN label
        if (!data.passportNumber) {
          const passportPatterns = [
            /passport[\s]*(?:no|number|num|#)?[:\s]*([A-Z][0-9O]{6,9})/i,
            /^([A-Z][0-9O]{7,8})$/,
            /^([A-Z]{1,2}[0-9O]{6,8})$/,
            /\b([A-Z][0-9]{7,8})\b/  // Word boundary match
          ];
          
          for (const pattern of passportPatterns) {
            const match = line.match(pattern);
            if (match) {
              const cleaned = match[1].toUpperCase().replace(/O/g, '0');
              data.passportNumber = cleaned;
              console.log("✓ Passport Number from text:", data.passportNumber);
              break;
            }
          }
        }
      }
      
      // Name patterns - Indian passports have Surname and Given name separately
      let surname = '';
      let givenName = '';
      
      // Extract Surname
      if (/Surname/i.test(line)) {
        const sameLineMatch = line.match(/Surname[:\s]*([A-Z][A-Z\s]{1,})/i);
        if (sameLineMatch) {
          surname = sameLineMatch[1].trim();
          console.log("✓ Surname from text:", surname);
        } else if (nextLine && /^[A-Z][A-Z\s]*$/.test(nextLine)) {
          surname = nextLine.trim();
          console.log("✓ Surname (next line) from text:", surname);
        }
      }
      
      // Extract Given name
      if (/G[I1L]ven[\s]*[Nn]ame/i.test(line)) {
        const sameLineMatch = line.match(/G[I1L]ven[\s]*[Nn]ame[:\s]*([A-Z][A-Z\s]{2,})/i);
        if (sameLineMatch) {
          givenName = sameLineMatch[1].trim();
          console.log("✓ Given name from text:", givenName);
        } else if (nextLine && /^[A-Z][A-Z\s]+$/.test(nextLine) && nextLine.length > 2) {
          givenName = nextLine.trim();
          console.log("✓ Given name (next line) from text:", givenName);
        }
      }
      
      // Combine surname and given name if both found
      if (!data.fullName && (surname || givenName)) {
        data.fullName = `${givenName} ${surname}`.trim();
        if (data.fullName) {
          console.log("✓ Full Name combined:", data.fullName);
        }
      }
      
      // Fallback patterns if name still not found
      if (!data.fullName) {
        if (/^[Nn]ame[:\s]/i.test(line)) {
          const sameLineMatch = line.match(/[Nn]ame[:\s]*([A-Z][A-Z\s]{2,})/i);
          if (sameLineMatch) {
            data.fullName = sameLineMatch[1].trim();
            console.log("✓ Name (Name label) from text:", data.fullName);
          } else if (nextLine && /^[A-Z][A-Z\s]+$/.test(nextLine)) {
            data.fullName = nextLine.trim();
            console.log("✓ Name (Name label, next line) from text:", data.fullName);
          }
        }
      }
      
      // Date of birth patterns - prioritize "Date of birth" label
      if (!data.dateOfBirth) {
        // Check for "Date of birth" label specifically - handle variations
        if (/Date[\s]*of[\s]*b[I1]rth/i.test(line) || /D[O0]B/i.test(line)) {
          // Date should be on same line after colon or next line
          const sameLineMatch = line.match(/(?:Date[\s]*of[\s]*b[I1]rth|D[O0]B)[:\s]*(\d{1,2}[\s\/\.-]\d{1,2}[\s\/\.-]\d{2,4})/i);
          if (sameLineMatch) {
            const parsed = moment(sameLineMatch[1], ["DD/MM/YYYY", "DD-MM-YYYY", "DD MM YYYY", "DD.MM.YYYY", "DD/MM/YY"], true);
            if (parsed.isValid()) {
              data.dateOfBirth = parsed.format("YYYY-MM-DD");
              console.log("✓ DOB (Date of birth label) from text:", data.dateOfBirth);
            }
          } else if (nextLine) {
            const nextLineMatch = nextLine.match(/(\d{1,2}[\s\/\.-]\d{1,2}[\s\/\.-]\d{2,4})/);
            if (nextLineMatch) {
              const parsed = moment(nextLineMatch[1], ["DD/MM/YYYY", "DD-MM-YYYY", "DD MM YYYY", "DD.MM.YYYY", "DD/MM/YY"], true);
              if (parsed.isValid()) {
                data.dateOfBirth = parsed.format("YYYY-MM-DD");
                console.log("✓ DOB (Date of birth label, next line) from text:", data.dateOfBirth);
              }
            }
          }
        }
        // Fallback to general DOB patterns - any date in proper format
        else if (!data.dateOfBirth) {
          const dobPatterns = [
            /b[I1]rth[\s]*date[:\s]*(\d{1,2}[\s\/\.-]\d{1,2}[\s\/\.-]\d{2,4})/i,
          ];
          
          for (const pattern of dobPatterns) {
            const match = line.match(pattern);
            if (match) {
              const parsed = moment(match[1], ["DD/MM/YYYY", "DD-MM-YYYY", "DD MM YYYY", "DD.MM.YYYY", "DD/MM/YY"], true);
              if (parsed.isValid()) {
                data.dateOfBirth = parsed.format("YYYY-MM-DD");
                console.log("✓ DOB from text:", data.dateOfBirth);
                break;
              }
            }
          }
        }
      }
      
      // Date of issue patterns - Indian passport specific
      if (!data.dateOfIssue) {
        // Only match if explicitly has "issue" in the label (not expiry)
        if (/(?:Date[\s]*of[\s]*[Il1]ssue|[Il1]ssue[\s]*date)/i.test(line) && !/[Ee]xp[I1l]ry/i.test(line)) {
          const issuePatterns = [
            /(?:Date[\s]*of[\s]*[Il1]ssue|[Il1]ssue[\s]*date)[:\s]*(\d{1,2}[\s\/\.-]\d{1,2}[\s\/\.-]\d{2,4})/i,
            /(?:Date[\s]*of[\s]*[Il1]ssue|[Il1]ssue)[:\s]*(\d{1,2}[\s\/\.-]\d{1,2}[\s\/\.-]\d{2,4})/i
          ];
          
          for (const pattern of issuePatterns) {
            const match = line.match(pattern);
            if (match) {
              const parsed = moment(match[1], ["DD/MM/YYYY", "DD-MM-YYYY", "DD MM YYYY", "DD.MM.YYYY"], true);
              if (parsed.isValid()) {
                data.dateOfIssue = parsed.format("YYYY-MM-DD");
                console.log("✓ Issue Date from text:", data.dateOfIssue);
                break;
              }
            }
          }
          
          // Check next line if label found but no date on same line
          if (!data.dateOfIssue && nextLine) {
            const nextLineMatch = nextLine.match(/(\d{1,2}[\s\/\.-]\d{1,2}[\s\/\.-]\d{2,4})/);
            if (nextLineMatch) {
              const parsed = moment(nextLineMatch[1], ["DD/MM/YYYY", "DD-MM-YYYY", "DD MM YYYY", "DD.MM.YYYY"], true);
              if (parsed.isValid()) {
                data.dateOfIssue = parsed.format("YYYY-MM-DD");
                console.log("✓ Issue Date (next line) from text:", data.dateOfIssue);
              }
            }
          }
        }
      }
      
      // Date of expiry patterns - Indian passport specific
      if (!data.dateOfExpiry) {
        // Only match if explicitly has "expiry" or "valid" in the label (not issue)
        if (/(?:Date[\s]*of[\s]*[Ee]xp[I1l]ry|[Ee]xp[I1l]ry|Val[I1l]d[\s]*unt[I1l]l)/i.test(line) && !/[Il1]ssue/i.test(line)) {
          const expiryPatterns = [
            /(?:Date[\s]*of[\s]*[Ee]xp[I1l]ry|[Ee]xp[I1l]ry[\s]*date|Val[I1l]d[\s]*unt[I1l]l)[:\s]*(\d{1,2}[\s\/\.-]\d{1,2}[\s\/\.-]\d{2,4})/i,
            /(?:Date[\s]*of[\s]*[Ee]xp[I1l]ry|[Ee]xp[I1l]ry)[:\s]*(\d{1,2}[\s\/\.-]\d{1,2}[\s\/\.-]\d{2,4})/i
          ];
          
          for (const pattern of expiryPatterns) {
            const match = line.match(pattern);
            if (match) {
              const parsed = moment(match[1], ["DD/MM/YYYY", "DD-MM-YYYY", "DD MM YYYY", "DD.MM.YYYY"], true);
              if (parsed.isValid()) {
                // Ensure expiry date is different from issue date
                const expiryDate = parsed.format("YYYY-MM-DD");
                if (expiryDate !== data.dateOfIssue) {
                  data.dateOfExpiry = expiryDate;
                  console.log("✓ Expiry Date from text:", data.dateOfExpiry);
                  break;
                }
              }
            }
          }
          
          // Check next line if label found but no date on same line
          if (!data.dateOfExpiry && nextLine) {
            const nextLineMatch = nextLine.match(/(\d{1,2}[\s\/\.-]\d{1,2}[\s\/\.-]\d{2,4})/);
            if (nextLineMatch) {
              const parsed = moment(nextLineMatch[1], ["DD/MM/YYYY", "DD-MM-YYYY", "DD MM YYYY", "DD.MM.YYYY"], true);
              if (parsed.isValid()) {
                // Ensure expiry date is different from issue date
                const expiryDate = parsed.format("YYYY-MM-DD");
                if (expiryDate !== data.dateOfIssue) {
                  data.dateOfExpiry = expiryDate;
                  console.log("✓ Expiry Date (next line) from text:", data.dateOfExpiry);
                }
              }
            }
          }
        }
      }
      
      // Nationality patterns - Indian passport specific
      if (!data.nationality) {
        // For Indian passport, look for "INDIAN" or "IND"
        if (/IND[I1]AN?/i.test(line)) {
          data.nationality = 'INDIAN';
          console.log("✓ Nationality from text:", data.nationality);
        } else {
          const natPatterns = [
            /[Nn]at[I1l]onal[I1l]ty[:\s]*([A-Z\s]{3,})/i,
            /^([A-Z]{3})$/ // 3-letter country code
          ];
          
          for (const pattern of natPatterns) {
            const match = line.match(pattern);
            if (match) {
              data.nationality = match[1].trim().toUpperCase();
              console.log("✓ Nationality from text:", data.nationality);
              break;
            }
          }
        }
      }
      
      // Place of birth - Indian passport specific
      if (!data.placeOfBirth) {
        if (/(?:Place[\s]*of[\s]*[Bb][I1l]rth|[Bb][I1l]rth[\s]*place)/i.test(line)) {
          // Try same line first
          const sameLineMatch = line.match(/(?:Place[\s]*of[\s]*[Bb][I1l]rth|[Bb][I1l]rth[\s]*place)[:\s]*([A-Z][A-Za-z\s,]+)/i);
          if (sameLineMatch && sameLineMatch[1].length > 2) {
            data.placeOfBirth = sameLineMatch[1].trim();
            console.log("✓ Place of Birth from text:", data.placeOfBirth);
          } else if (nextLine && nextLine.length > 2 && /^[A-Z][A-Za-z\s,]+$/.test(nextLine)) {
            data.placeOfBirth = nextLine.trim();
            console.log("✓ Place of Birth (next line) from text:", data.placeOfBirth);
          }
        }
      }
      
      // Place of issue - Indian passport specific
      if (!data.placeOfIssue) {
        if (/(?:Place[\s]*of[\s]*[Il1]ssue|[Il1]ssu[I1l]ng[\s]*author[I1l]ty)/i.test(line)) {
          // Try same line first - more flexible pattern
          const sameLineMatch = line.match(/(?:Place[\s]*of[\s]*[Il1]ssue|[Il1]ssu[I1l]ng)[:\s]*([A-Za-z][A-Za-z\s,\.\-]+)/i);
          if (sameLineMatch && sameLineMatch[1].length > 2) {
            data.placeOfIssue = sameLineMatch[1].trim();
            console.log("✓ Place of Issue from text:", data.placeOfIssue);
          } else if (nextLine && nextLine.length > 2) {
            // More flexible - accept any text that looks like a place name
            const cleaned = nextLine.trim();
            if (cleaned.length > 2 && !/^\d+$/.test(cleaned)) {
              data.placeOfIssue = cleaned;
              console.log("✓ Place of Issue (next line) from text:", data.placeOfIssue);
            }
          }
        }
      }
      
      // Sex/Gender - Indian passport
      if (!data.sex) {
        // Check if line contains sex/gender label
        if (/(?:sex|gender)[:\s]/i.test(line)) {
          const sexMatch = line.match(/(?:sex|gender)[:\s]*(M|F|MALE|FEMALE|[Mm]ale|[Ff]emale)/i);
          if (sexMatch) {
            data.sex = sexMatch[1].charAt(0).toUpperCase();
            console.log("✓ Sex from text:", data.sex);
          } else if (nextLine && /^(M|F|MALE|FEMALE)$/i.test(nextLine)) {
            data.sex = nextLine.charAt(0).toUpperCase();
            console.log("✓ Sex (next line) from text:", data.sex);
          }
        }
        // Also check if entire line is just M or F
        else if (/^[MF]$/i.test(line.trim())) {
          data.sex = line.trim().toUpperCase();
          console.log("✓ Sex (standalone) from text:", data.sex);
        }
      }
    }

    // Fallback: Calculate expiry date from issue date if not found
    if (!data.dateOfExpiry && data.dateOfIssue) {
      const issueDate = moment(data.dateOfIssue);
      // Indian passport validity: 10 years from date of issue, minus 1 day
      const expiryDate = issueDate.add(10, 'years').subtract(1, 'day');
      data.dateOfExpiry = expiryDate.format("YYYY-MM-DD");
      console.log("✓ Expiry Date calculated from issue date:", data.dateOfExpiry);
    }

    console.log("Final extracted data:", data);
    return data;
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent style={{ maxWidth: "95vw", maxHeight: "90vh", padding: 0 }}>
        <DialogHeader style={{ padding: "1.5rem", paddingBottom: "1rem" }}>
          <DialogTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Camera width="1.25rem" />
            Scan Passport
          </DialogTitle>
          <DialogDescription>
            {!ocrReady 
              ? `Loading OCR engine... ${ocrLoadProgress}%` 
              : capturedImage 
                ? "Processing image..." 
                : "Position passport in frame and capture"}
          </DialogDescription>
        </DialogHeader>

        <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", background: "#000" }}>
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div style={{
                position: "absolute",
                inset: "5%",
                border: `2px dashed ${documentDetected ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 255, 255, 0.6)'}`,
                borderRadius: "1rem",
                pointerEvents: "none",
                transition: "border-color 0.3s ease"
              }} />
              {documentDetected && (
                <div style={{
                  position: "absolute",
                  top: "10%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(0, 255, 0, 0.9)",
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  pointerEvents: "none"
                }}>
                  Document Detected
                </div>
              )}
            </>
          ) : (
            <img src={capturedImage} alt="Captured" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          )}
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <canvas ref={edgeCanvasRef} style={{ display: "none" }} />
        </div>

        {extractedText && (
          <div style={{ padding: "1rem", maxHeight: "150px", overflowY: "auto", fontSize: "0.75rem", background: "rgba(100,100,100,0.05)" }}>
            <strong>Extracted Text:</strong>
            <pre style={{ whiteSpace: "pre-wrap", marginTop: "0.5rem", opacity: 0.7 }}>{extractedText}</pre>
          </div>
        )}

        <div style={{ padding: "1.5rem", paddingTop: "1rem", display: "flex", gap: "0.75rem" }}>
          {!capturedImage ? (
            <>
              <button
                onClick={handleClose}
                style={{
                  flex: 1,
                  padding: "0.875rem",
                  borderRadius: "0.75rem",
                  background: "rgba(100, 100, 100, 0.1)",
                  border: "none",
                  fontSize: "1rem",
                  fontWeight: "500",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                disabled={!ocrReady}
                style={{
                  flex: 2,
                  padding: "0.875rem",
                  borderRadius: "0.75rem",
                  background: ocrReady ? "mediumslateblue" : "rgba(100, 100, 100, 0.3)",
                  color: "white",
                  border: "none",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: ocrReady ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
              >
                <Camera width="1.25rem" />
                Capture
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setCapturedImage(null);
                  setExtractedText("");
                  startCamera();
                }}
                disabled={processing}
                style={{
                  flex: 1,
                  padding: "0.875rem",
                  borderRadius: "0.75rem",
                  background: "rgba(100, 100, 100, 0.1)",
                  border: "none",
                  fontSize: "1rem",
                  fontWeight: "500",
                  cursor: processing ? "not-allowed" : "pointer"
                }}
              >
                Retake
              </button>
              <button
                onClick={() => processImage(capturedImage)}
                disabled={processing}
                style={{
                  flex: 2,
                  padding: "0.875rem",
                  borderRadius: "0.75rem",
                  background: processing ? "rgba(100, 100, 100, 0.3)" : "mediumslateblue",
                  color: "white",
                  border: "none",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: processing ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
              >
                {processing ? (
                  <>
                    <Loader2 className="animate-spin" width="1.25rem" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ScanLine width="1.25rem" />
                    Extract Data
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Main Passports Component
export default function Passports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshCompleted, setRefreshCompleted] = useState(false);
  const [passports, setPassports] = useState<PassportRecord[]>([]);
  
  // Form states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [editingPassport, setEditingPassport] = useState<PassportRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [passportNumber, setPassportNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [placeOfIssue, setPlaceOfIssue] = useState("");
  const [dateOfIssue, setDateOfIssue] = useState("");
  const [dateOfExpiry, setDateOfExpiry] = useState("");
  const [nationality, setNationality] = useState("");
  const [sex, setSex] = useState("");
  
  // Detail view states
  const [selectedPassport, setSelectedPassport] = useState<PassportRecord | null>(null);
  const [drawerDetailOpen, setDrawerDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isMobile = window.innerWidth < 768;

  const fetchPassports = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      if (!user?.uid) return;

      const q = query(
        collection(db, "passports"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const fetchedPassports: PassportRecord[] = [];
      snapshot.forEach((doc) => {
        fetchedPassports.push({ id: doc.id, ...doc.data() } as PassportRecord);
      });

      setPassports(fetchedPassports);

      if (isManualRefresh) {
        setRefreshCompleted(true);
        setTimeout(() => setRefreshCompleted(false), 900);
      }
    } catch (error) {
      console.error("Error fetching passports:", error);
      toast.error("Failed to load passports");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchPassports();
    }
  }, [user?.uid]);

  const resetForm = () => {
    setPassportNumber("");
    setFullName("");
    setDateOfBirth("");
    setPlaceOfBirth("");
    setPlaceOfIssue("");
    setDateOfIssue("");
    setDateOfExpiry("");
    setNationality("");
    setSex("");
    setEditingPassport(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    setSubmitting(true);
    try {
      const passportData = {
        passportNumber,
        fullName,
        dateOfBirth,
        placeOfBirth,
        placeOfIssue,
        dateOfIssue,
        dateOfExpiry,
        nationality,
        sex,
        userId: user.uid,
        updatedAt: new Date(),
      };

      if (editingPassport) {
        await updateDoc(doc(db, "passports", editingPassport.id), passportData);
        toast.success("Passport updated successfully");
      } else {
        await addDoc(collection(db, "passports"), {
          ...passportData,
          createdAt: new Date(),
        });
        toast.success("Passport added successfully");
      }

      resetForm();
      setDrawerOpen(false);
      fetchPassports();
    } catch (error) {
      console.error("Error saving passport:", error);
      toast.error("Failed to save passport");
    } finally {
      setSubmitting(false);
    }
  };

  const handleScanPassport = () => {
    setScannerOpen(true);
  };

  const handleDataExtracted = (data: Partial<PassportRecord>) => {
    if (data.passportNumber) setPassportNumber(data.passportNumber);
    if (data.fullName) setFullName(data.fullName);
    if (data.dateOfBirth) setDateOfBirth(data.dateOfBirth);
    if (data.placeOfBirth) setPlaceOfBirth(data.placeOfBirth);
    if (data.placeOfIssue) setPlaceOfIssue(data.placeOfIssue);
    if (data.dateOfIssue) setDateOfIssue(data.dateOfIssue);
    if (data.dateOfExpiry) setDateOfExpiry(data.dateOfExpiry);
    if (data.nationality) setNationality(data.nationality);
    if (data.sex) setSex(data.sex);
    setScannerOpen(false);
  };

  const handleEdit = (passport: PassportRecord) => {
    setEditingPassport(passport);
    setPassportNumber(passport.passportNumber);
    setFullName(passport.fullName);
    setDateOfBirth(passport.dateOfBirth);
    setPlaceOfBirth(passport.placeOfBirth);
    setPlaceOfIssue(passport.placeOfIssue);
    setDateOfIssue(passport.dateOfIssue);
    setDateOfExpiry(passport.dateOfExpiry);
    setNationality(passport.nationality);
    setSex(passport.sex || "");
    setDrawerDetailOpen(false);
    setDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await deleteDoc(doc(db, "passports", deletingId));
      toast.success("Passport deleted");
      setDeleteDialogOpen(false);
      setDrawerDetailOpen(false);
      setDeletingId(null);
      fetchPassports();
    } catch (error) {
      console.error("Error deleting passport:", error);
      toast.error("Failed to delete passport");
    }
  };

  const showDeleteConfirmation = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const isExpired = (expiryDate: string) => {
    return moment(expiryDate).isBefore(moment(), 'day');
  };

  const isExpiringSoon = (expiryDate: string) => {
    const daysUntilExpiry = moment(expiryDate).diff(moment(), 'days');
    return daysUntilExpiry > 0 && daysUntilExpiry <= 60;
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
        <Back
          fixed
          blurBG
          title="Passports"
          subtitle={passports.length}
          extra={
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <RefreshButton
                onClick={() => fetchPassports(true)}
                refreshCompleted={refreshCompleted}
                fetchingData={refreshing}
              />
            </div>
          }
        />

        <div style={{ padding: "1.25rem", paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}>
          <div style={{ height: "2rem" }} />

          {/* Passports List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingBottom: "5.5rem", paddingTop: "2rem" }}>
            {loading ? (
              <div style={{ 
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "70vh",
                opacity: 0.5
              }}>
                <Loader2 className="animate-spin" />
              </div>
            ) : passports.length === 0 ? (
              <Empty style={{ minHeight: "70vh" }}>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BookMarked />
                  </EmptyMedia>
                  <EmptyTitle>No passports yet</EmptyTitle>
                  <EmptyDescription>Add your first passport record</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              passports.map((passport) => (
                <motion.div
                  key={passport.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedPassport(passport);
                    setDrawerDetailOpen(true);
                  }}
                  style={{
                    background: "rgba(100, 100, 100, 0.04)",
                    borderRadius: "1rem",
                    padding: "1.25rem",
                    cursor: "pointer",
                    border: "1px solid rgba(100, 100, 100, 0.1)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{
                        background: isExpired(passport.dateOfExpiry) ? "rgba(220, 38, 38, 0.1)" :
                                   isExpiringSoon(passport.dateOfExpiry) ? "rgba(234, 179, 8, 0.1)" :
                                   "rgba(123, 104, 238, 0.1)",
                        padding: "0.75rem",
                        borderRadius: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <BookMarked 
                          width="1.5rem" 
                          color={isExpired(passport.dateOfExpiry) ? "rgb(220, 38, 38)" :
                                isExpiringSoon(passport.dateOfExpiry) ? "rgb(234, 179, 8)" :
                                "mediumslateblue"} 
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.25rem" }}>
                          {passport.fullName}
                        </div>
                        <div style={{ fontSize: "0.875rem", opacity: 0.6 }}>
                          {passport.passportNumber}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", fontSize: "0.875rem" }}>
                    <div>
                      <div style={{ opacity: 0.6, marginBottom: "0.25rem" }}>Nationality</div>
                      <div style={{ fontWeight: "500" }}>{passport.nationality}</div>
                    </div>
                    <div>
                      <div style={{ opacity: 0.6, marginBottom: "0.25rem" }}>Expiry</div>
                      <div style={{ 
                        fontWeight: "500",
                        color: isExpired(passport.dateOfExpiry) ? "rgb(220, 38, 38)" :
                               isExpiringSoon(passport.dateOfExpiry) ? "rgb(234, 179, 8)" :
                               "inherit"
                      }}>
                        {moment(passport.dateOfExpiry).format("DD MMM YYYY")}
                        {isExpired(passport.dateOfExpiry) && " (Expired)"}
                        {isExpiringSoon(passport.dateOfExpiry) && " (Soon)"}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Add Button */}
        <motion.button
          initial={{ opacity: 0, y: isMobile ? 20 : 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.2 }}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: isMobile ? 1 : 1.05 }}
          onClick={() => {
            resetForm();
            setDrawerOpen(true);
          }}
          style={{
            transition: "none",
            position: "fixed",
            bottom: isMobile ? "calc(1rem + env(safe-area-inset-bottom, 0px))" : "calc(2rem + env(safe-area-inset-bottom, 0px))",
            right: isMobile ? "1rem" : "1.5rem",
            left: isMobile ? "1rem" : "auto",
            width: isMobile ? "calc(100% - 2rem)" : "3.5rem",
            height: isMobile ? "auto" : "3.5rem",
            padding: isMobile ? "1rem" : "0",
            borderRadius: isMobile ? "0.5rem" : "0.75rem",
            background: "darkslateblue",
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
            marginBottom: "1rem"
          }}
        >
          <Plus width="1.25rem" height="1.75rem" strokeWidth={2.5} />
          {isMobile && <span>Add Passport</span>}
        </motion.button>
      </motion.div>

      {/* Passport Form Modal */}
      <ResponsiveModal
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title=""
        description=""
      >
        <PassportFormContent
          passportNumber={passportNumber}
          setPassportNumber={setPassportNumber}
          fullName={fullName}
          setFullName={setFullName}
          dateOfBirth={dateOfBirth}
          setDateOfBirth={setDateOfBirth}
          placeOfBirth={placeOfBirth}
          setPlaceOfBirth={setPlaceOfBirth}
          placeOfIssue={placeOfIssue}
          setPlaceOfIssue={setPlaceOfIssue}
          dateOfIssue={dateOfIssue}
          setDateOfIssue={setDateOfIssue}
          dateOfExpiry={dateOfExpiry}
          setDateOfExpiry={setDateOfExpiry}
          nationality={nationality}
          setNationality={setNationality}
          sex={sex}
          setSex={setSex}
          editingPassport={editingPassport}
          submitting={submitting}
          handleSubmit={handleSubmit}
          onScanPassport={handleScanPassport}
        />
      </ResponsiveModal>

      {/* Passport Scanner */}
      <PassportScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDataExtracted={handleDataExtracted}
      />

      {/* Detail View Modal */}
      {selectedPassport && (
        <ResponsiveModal
          open={drawerDetailOpen}
          onOpenChange={setDrawerDetailOpen}
          title=""
          description=""
        >
          <div style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  background: "rgba(123, 104, 238, 0.1)",
                  padding: "0.75rem",
                  borderRadius: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <BookMarked width="1.5rem" color="mediumslateblue" />
                </div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "700", margin: 0 }}>
                  Passport Details
                </h2>
              </div>
              <button
                onClick={() => setDrawerDetailOpen(false)}
                style={{
                  background: "rgba(100, 100, 100, 0.08)",
                  border: "none",
                  borderRadius: "0.5rem",
                  padding: "0.5rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <X width="1.25rem" />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ background: "rgba(100, 100, 100, 0.05)", padding: "1rem", borderRadius: "0.75rem" }}>
                <div style={{ fontSize: "0.75rem", opacity: 0.6, marginBottom: "0.25rem" }}>PASSPORT NUMBER</div>
                <div style={{ fontSize: "1.125rem", fontWeight: "600" }}>{selectedPassport.passportNumber}</div>
              </div>

              <div style={{ background: "rgba(100, 100, 100, 0.05)", padding: "1rem", borderRadius: "0.75rem" }}>
                <div style={{ fontSize: "0.75rem", opacity: 0.6, marginBottom: "0.25rem" }}>FULL NAME</div>
                <div style={{ fontSize: "1.125rem", fontWeight: "600" }}>{selectedPassport.fullName}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
                <div style={{ background: "rgba(100, 100, 100, 0.05)", padding: "1rem", borderRadius: "0.75rem" }}>
                  <div style={{ fontSize: "0.75rem", opacity: 0.6, marginBottom: "0.25rem" }}>DATE OF BIRTH</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: "500" }}>
                    {moment(selectedPassport.dateOfBirth).format("DD MMM YYYY")}
                  </div>
                </div>

                {selectedPassport.sex && (
                  <div style={{ background: "rgba(100, 100, 100, 0.05)", padding: "1rem", borderRadius: "0.75rem" }}>
                    <div style={{ fontSize: "0.75rem", opacity: 0.6, marginBottom: "0.25rem" }}>SEX</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: "500" }}>
                      {selectedPassport.sex === 'M' ? 'Male' : 'Female'}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: "rgba(100, 100, 100, 0.05)", padding: "1rem", borderRadius: "0.75rem" }}>
                <div style={{ fontSize: "0.75rem", opacity: 0.6, marginBottom: "0.25rem" }}>NATIONALITY</div>
                <div style={{ fontSize: "1rem", fontWeight: "500" }}>{selectedPassport.nationality}</div>
              </div>

              {selectedPassport.placeOfBirth && (
                <div style={{ background: "rgba(100, 100, 100, 0.05)", padding: "1rem", borderRadius: "0.75rem" }}>
                  <div style={{ fontSize: "0.75rem", opacity: 0.6, marginBottom: "0.25rem" }}>PLACE OF BIRTH</div>
                  <div style={{ fontSize: "1rem", fontWeight: "500" }}>{selectedPassport.placeOfBirth}</div>
                </div>
              )}

              {selectedPassport.placeOfIssue && (
                <div style={{ background: "rgba(100, 100, 100, 0.05)", padding: "1rem", borderRadius: "0.75rem" }}>
                  <div style={{ fontSize: "0.75rem", opacity: 0.6, marginBottom: "0.25rem" }}>PLACE OF ISSUE</div>
                  <div style={{ fontSize: "1rem", fontWeight: "500" }}>{selectedPassport.placeOfIssue}</div>
                </div>
              )}

              {selectedPassport.dateOfIssue && (
                <div style={{ background: "rgba(100, 100, 100, 0.05)", padding: "1rem", borderRadius: "0.75rem" }}>
                  <div style={{ fontSize: "0.75rem", opacity: 0.6, marginBottom: "0.25rem" }}>DATE OF ISSUE</div>
                  <div style={{ fontSize: "1rem", fontWeight: "500" }}>
                    {moment(selectedPassport.dateOfIssue).format("DD MMM YYYY")}
                  </div>
                </div>
              )}

              <div style={{ 
                background: isExpired(selectedPassport.dateOfExpiry) ? "rgba(220, 38, 38, 0.1)" :
                           isExpiringSoon(selectedPassport.dateOfExpiry) ? "rgba(234, 179, 8, 0.1)" :
                           "rgba(100, 100, 100, 0.05)", 
                padding: "1rem", 
                borderRadius: "0.75rem",
                border: isExpired(selectedPassport.dateOfExpiry) ? "1px solid rgba(220, 38, 38, 0.2)" :
                        isExpiringSoon(selectedPassport.dateOfExpiry) ? "1px solid rgba(234, 179, 8, 0.2)" :
                        "none"
              }}>
                <div style={{ fontSize: "0.75rem", opacity: 0.6, marginBottom: "0.25rem" }}>DATE OF EXPIRY</div>
                <div style={{ 
                  fontSize: "1rem", 
                  fontWeight: "600",
                  color: isExpired(selectedPassport.dateOfExpiry) ? "rgb(220, 38, 38)" :
                         isExpiringSoon(selectedPassport.dateOfExpiry) ? "rgb(234, 179, 8)" :
                         "inherit"
                }}>
                  {moment(selectedPassport.dateOfExpiry).format("DD MMM YYYY")}
                  {isExpired(selectedPassport.dateOfExpiry) && " (Expired)"}
                  {isExpiringSoon(selectedPassport.dateOfExpiry) && " (Expiring Soon)"}
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  onClick={() => handleEdit(selectedPassport)}
                  style={{
                    flex: 1,
                    padding: "0.875rem",
                    borderRadius: "0.75rem",
                    background: "mediumslateblue",
                    color: "white",
                    border: "none",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => showDeleteConfirmation(selectedPassport.id)}
                  style={{
                    padding: "0.875rem",
                    borderRadius: "0.75rem",
                    background: "rgba(220, 38, 38, 0.1)",
                    color: "rgb(220, 38, 38)",
                    border: "none",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Trash width="1.25rem" />
                </button>
              </div>
            </div>
          </div>
        </ResponsiveModal>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent style={{ maxWidth: "400px", padding: "1.5rem" }}>
          <DialogHeader>
            <DialogTitle>Delete Passport</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this passport record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              onClick={() => setDeleteDialogOpen(false)}
              style={{
                flex: 1,
                padding: "0.75rem",
                borderRadius: "0.5rem",
                background: "rgba(100, 100, 100, 0.1)",
                border: "none",
                fontSize: "0.95rem",
                fontWeight: "500",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              style={{
                flex: 1,
                padding: "0.75rem",
                borderRadius: "0.5rem",
                background: "rgb(220, 38, 38)",
                color: "white",
                border: "none",
                fontSize: "0.95rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
