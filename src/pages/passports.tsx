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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
    };
  }, [open, capturedImage]);

  const handleClose = () => {
    setCapturedImage(null);
    setProcessing(false);
    stopCamera();
    onClose();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
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

  // Capture and immediately start processing
  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const capturedData = canvas.toDataURL('image/png', 1.0);
    setCapturedImage(capturedData);
    stopCamera();

    await processImage(capturedData);
  };

  // ============================================================
  // IMAGE PREPROCESSING — Grayscale + Contrast
  // Let Tesseract handle binarization internally.
  // ============================================================
  const preprocessForMRZ = (
    sourceImg: HTMLImageElement,
    cropX: number, cropY: number, cropW: number, cropH: number,
    targetScale: number,
    contrastFactor: number
  ): string | null => {
    const c = document.createElement('canvas');
    c.width = Math.round(cropW * targetScale);
    c.height = Math.round(cropH * targetScale);
    const ctx = c.getContext('2d');
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceImg, cropX, cropY, cropW, cropH, 0, 0, c.width, c.height);

    const imgData = ctx.getImageData(0, 0, c.width, c.height);
    const px = imgData.data;
    for (let i = 0; i < px.length; i += 4) {
      const gray = px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114;
      const adjusted = Math.min(255, Math.max(0, ((gray - 128) * contrastFactor) + 128));
      px[i] = adjusted;
      px[i + 1] = adjusted;
      px[i + 2] = adjusted;
    }
    ctx.putImageData(imgData, 0, 0);
    return c.toDataURL('image/png', 1.0);
  };

  // ============================================================
  // MAIN PROCESSING — MRZ Only
  // ============================================================
  const processImage = async (imageData: string) => {
    setProcessing(true);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageData;
      });

      console.log("========== MRZ SCAN ==========");
      console.log("Image:", img.width, "x", img.height);

      const worker = await ensureOcrWorker();

      // Try two MRZ crops: bottom 30% first (tight), then bottom 45% (generous)
      const attempts = [
        { label: "bottom-30%", topPct: 0.70, contrast: 1.5 },
        { label: "bottom-45%", topPct: 0.55, contrast: 1.4 },
      ];

      let bestData: Partial<PassportRecord> = {};

      for (const attempt of attempts) {
        if (Object.keys(bestData).length >= 5) break;

        const cropY = Math.floor(img.height * attempt.topPct);
        const cropH = img.height - cropY;
        // Scale so output width is ~2000px for crisp MRZ chars
        const scale = Math.max(1, Math.min(3, 2000 / img.width));

        const mrzImage = preprocessForMRZ(img, 0, cropY, img.width, cropH, scale, attempt.contrast);
        if (!mrzImage) continue;

        console.log(`── Attempt: ${attempt.label}, scale=${scale.toFixed(1)} ──`);

        await worker.setParameters({
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789< ',
          tessedit_pageseg_mode: '6',
          preserve_interword_spaces: '0',
        });

        const result = await worker.recognize(mrzImage);
        console.log("Raw MRZ text:", result.data.text);
        console.log("Confidence:", result.data.confidence);

        const parsed = parseMRZ(result.data.text);
        if (Object.keys(parsed).length > Object.keys(bestData).length) {
          bestData = parsed;
        }
      }

      // If tight crops failed, try full-page with MRZ whitelist as last resort
      if (Object.keys(bestData).length < 3) {
        console.log("── Last resort: full page with MRZ whitelist ──");
        const scale = img.width < 1200 ? 2 : (img.width < 2000 ? 1.5 : 1);
        const fullImg = preprocessForMRZ(img, 0, 0, img.width, img.height, scale, 1.3);
        if (fullImg) {
          await worker.setParameters({
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789< ',
            tessedit_pageseg_mode: '3',
            preserve_interword_spaces: '0',
          });
          const fullResult = await worker.recognize(fullImg);
          console.log("Full page MRZ text:", fullResult.data.text);
          const fullParsed = parseMRZ(fullResult.data.text);
          if (Object.keys(fullParsed).length > Object.keys(bestData).length) {
            bestData = fullParsed;
          }
        }
      }

      // Expand nationality
      if (bestData.nationality === 'IND') bestData.nationality = 'INDIAN';

      // ── VISUAL TEXT PASS: Grab fields NOT in MRZ ──
      // Place of birth, place of issue, date of issue are only in printed text (top ~70%)
      if (!bestData.placeOfBirth || !bestData.placeOfIssue || !bestData.dateOfIssue) {
        console.log("========== VISUAL TEXT PASS ==========");
        try {
          const topH = Math.floor(img.height * 0.75);
          const scale = img.width < 1200 ? 2 : (img.width < 2000 ? 1.5 : 1);
          const topImg = preprocessForMRZ(img, 0, 0, img.width, topH, scale, 1.4);
          if (topImg) {
            await worker.setParameters({
              tessedit_char_whitelist: '',
              tessedit_pageseg_mode: '3',
              preserve_interword_spaces: '1',
            });
            const topResult = await worker.recognize(topImg);
            const text = topResult.data.text;
            console.log("Visual text:\n", text);

            const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

            const getNext = (idx: number): string => {
              for (let j = idx + 1; j < lines.length; j++) {
                if (lines[j].length > 0) return lines[j];
              }
              return '';
            };

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const next = getNext(i);
              const next2 = getNext(i + 1);

              // Date of Issue / Date of Expiry (often on one line)
              if (!bestData.dateOfIssue && (/[Ii]ssue/i.test(line) || /[Ee]xp[il1]r/i.test(line))) {
                const dateRe = /(\d{1,2}[\s\/\.\-]\d{1,2}[\s\/\.\-]\d{2,4})/g;
                const dates: string[] = [];
                for (const src of [line, next, next2]) {
                  let m;
                  while ((m = dateRe.exec(src)) !== null) dates.push(m[1]);
                  dateRe.lastIndex = 0;
                }
                for (const ds of dates) {
                  const p = moment(ds, ["DD/MM/YYYY", "DD-MM-YYYY", "DD.MM.YYYY", "DD/MM/YY"], true);
                  if (!p.isValid()) continue;
                  if (!bestData.dateOfIssue && p.year() >= 2000 && p.year() <= 2026) {
                    bestData.dateOfIssue = p.format("YYYY-MM-DD");
                    console.log("✓ Date of Issue:", bestData.dateOfIssue);
                  } else if (!bestData.dateOfExpiry && p.year() >= 2020) {
                    const val = p.format("YYYY-MM-DD");
                    if (val !== bestData.dateOfIssue) {
                      bestData.dateOfExpiry = val;
                      console.log("✓ Date of Expiry (visual):", bestData.dateOfExpiry);
                    }
                  }
                }
              }

              // Place of Birth
              if (!bestData.placeOfBirth && /[Pp]lace[\s]*of[\s]*[Bb]irth/i.test(line)) {
                const m = line.match(/[Pp]lace[\s]*of[\s]*[Bb]irth[:\s]*([A-Za-z][A-Za-z\s,\.]{2,})/i);
                if (m && !/date|issue|expiry/i.test(m[1])) {
                  bestData.placeOfBirth = m[1].trim().replace(/\s+/g, ' ').substring(0, 50);
                } else if (next.length > 2 && /^[A-Za-z]/.test(next) && !/date|issue|expiry|sex/i.test(next)) {
                  bestData.placeOfBirth = next.trim().replace(/\s+/g, ' ').substring(0, 50);
                }
                if (bestData.placeOfBirth) console.log("✓ Place of Birth:", bestData.placeOfBirth);
              }

              // Place of Issue
              if (!bestData.placeOfIssue && /[Pp]lace[\s]*of[\s]*[Il1i]ssue/i.test(line)) {
                const m = line.match(/[Pp]lace[\s]*of[\s]*[Il1i]ssue[:\s\/]*([A-Za-z0-9][A-Za-z0-9\s,\.\-]{2,})/i);
                if (m && !/date|birth|expiry|sex/i.test(m[1])) {
                  bestData.placeOfIssue = m[1].trim().replace(/\s+/g, ' ').substring(0, 50);
                } else if (next.length > 2 && /^[A-Za-z]/.test(next) && !/date|birth|expiry|sex|passport|given|surname/i.test(next)) {
                  bestData.placeOfIssue = next.trim().replace(/\s+/g, ' ').substring(0, 50);
                } else if (next2.length > 2 && /^[A-Za-z]/.test(next2) && !/date|birth|expiry|sex|passport|given|surname/i.test(next2)) {
                  bestData.placeOfIssue = next2.trim().replace(/\s+/g, ' ').substring(0, 50);
                }
                if (bestData.placeOfIssue) console.log("✓ Place of Issue:", bestData.placeOfIssue);
              }
            }
          }
        } catch (e) {
          console.warn("Visual text pass failed:", e);
        }
      }

      // Fallback: calculate expiry from issue date if MRZ missed it
      if (!bestData.dateOfExpiry && bestData.dateOfIssue) {
        const d = moment(bestData.dateOfIssue);
        if (d.isValid()) {
          bestData.dateOfExpiry = d.add(10, 'years').subtract(1, 'day').format("YYYY-MM-DD");
          console.log("✓ Expiry (calculated):", bestData.dateOfExpiry);
        }
      }

      console.log("==================== FINAL MRZ DATA ====================");
      console.log(bestData);

      if (Object.keys(bestData).length > 0) {
        onDataExtracted(bestData);
        toast.success("MRZ data extracted! Review and fill in any missing fields.");
        setCapturedImage(null);
        onClose();
      } else {
        toast.error("Could not read MRZ. Ensure the bottom two lines of the passport are clearly visible and well-lit.");
      }
    } catch (error) {
      console.error("MRZ Scan error:", error);
      toast.error("Failed to scan passport");
      setCapturedImage(null);
    } finally {
      setProcessing(false);
    }
  };

  // ============================================================
  // MRZ PARSER — Finds MRZ lines in any OCR text block
  // ============================================================
  // ICAO 9303: 2 lines × 44 chars. Line 1 starts with P, line 2 has digits.
  // MRZ characters: A-Z 0-9 <
  const parseMRZ = (rawText: string): Partial<PassportRecord> => {
    const data: Partial<PassportRecord> = {};
    if (!rawText || rawText.length < 40) return data;

    console.log("── MRZ parse ──");

    // Extract potential MRZ lines: strip non-MRZ chars per line, keep lines 30+ chars with '<'
    const lines = rawText.split('\n')
      .map(l => l.replace(/[^A-Z0-9<]/gi, '').toUpperCase())
      .filter(l => l.length >= 30 && l.includes('<'));

    console.log("MRZ candidates:", lines.map(l => `[${l.length}] ${l}`));

    if (lines.length < 2) {
      // Try merging consecutive short lines
      const rawLines = rawText.split('\n')
        .map(l => l.replace(/[^A-Z0-9<]/gi, '').toUpperCase())
        .filter(l => l.length > 0);
      const merged: string[] = [];
      let buf = '';
      for (const rl of rawLines) {
        buf += rl;
        if (buf.length >= 30 && buf.includes('<')) {
          merged.push(buf);
          buf = '';
        }
      }
      if (buf.length >= 30 && buf.includes('<')) merged.push(buf);

      if (merged.length >= 2) {
        lines.length = 0;
        lines.push(...merged);
        console.log("After merge:", lines.map(l => `[${l.length}] ${l}`));
      }
    }

    if (lines.length < 2) {
      console.log("Not enough MRZ lines found");
      return data;
    }

    // Pick the best pair: line1 should start with 'P' and contain '<<'
    let line1 = '';
    let line2 = '';

    for (let i = 0; i < lines.length - 1; i++) {
      const a = lines[i];
      const b = lines[i + 1];
      if (a.startsWith('P') && a.includes('<<')) {
        line1 = a;
        line2 = b;
        break;
      }
    }

    // Fallback: just use last two lines
    if (!line1) {
      line1 = lines[lines.length - 2];
      line2 = lines[lines.length - 1];
      // Swap if needed
      if (line2.startsWith('P') && line2.includes('<<')) {
        [line1, line2] = [line2, line1];
      }
    }

    // Normalize to 44 chars
    line1 = line1.substring(0, 44).padEnd(44, '<');
    line2 = line2.substring(0, 44).padEnd(44, '<');

    console.log("L1:", line1);
    console.log("L2:", line2);

    // ── LINE 1: P<COUNTRY<SURNAME<<GIVEN<NAMES ──
    const nameSection = line1.substring(5);
    const nameParts = nameSection.split('<<').filter(p => p.replace(/</g, '').length > 0);
    if (nameParts.length >= 2) {
      const surname = nameParts[0].replace(/</g, ' ').trim();
      const given = nameParts.slice(1).map(p => p.replace(/</g, ' ').trim()).join(' ');
      if (surname && given) {
        data.fullName = `${given} ${surname}`;
        console.log("✓ Name:", data.fullName);
      }
    } else if (nameParts.length === 1) {
      data.fullName = nameParts[0].replace(/</g, ' ').trim();
    }

    // ── LINE 2 field extraction with position-aware digit/alpha correction ──
    // Helper: correct common OCR errors for digit-only positions
    const toDigits = (s: string) => s
      .replace(/O/g, '0').replace(/o/g, '0')
      .replace(/I/g, '1').replace(/l/g, '1').replace(/L/g, '1')
      .replace(/S/g, '5').replace(/s/g, '5')
      .replace(/B/g, '8').replace(/G/g, '6')
      .replace(/Z/g, '2').replace(/z/g, '2')
      .replace(/A/g, '4').replace(/T/g, '7')
      .replace(/[^0-9]/g, '');

    // [0-8] Passport number
    const passRaw = line2.substring(0, 9).replace(/</g, '');
    if (passRaw.length >= 6) {
      // First 1-2 chars are typically alpha, rest digits
      const alphaEnd = passRaw.search(/\d/);
      const alpha = alphaEnd > 0 ? passRaw.substring(0, alphaEnd) : passRaw.substring(0, 1);
      const digits = alphaEnd > 0 ? passRaw.substring(alphaEnd) : passRaw.substring(1);
      const fixedDigits = toDigits(digits);
      data.passportNumber = alpha + fixedDigits;
      console.log("✓ Passport:", data.passportNumber);
    }

    // [10-12] Nationality
    const nat = line2.substring(10, 13).replace(/</g, '').replace(/[0-9]/g, (d) => {
      const map: Record<string, string> = { '0': 'O', '1': 'I', '5': 'S', '8': 'B' };
      return map[d] || d;
    });
    if (nat.length >= 2) {
      data.nationality = nat;
      console.log("✓ Nationality:", nat);
    }

    // [13-18] DOB (YYMMDD)
    const dobStr = toDigits(line2.substring(13, 19));
    if (dobStr.length === 6) {
      const yy = parseInt(dobStr.substring(0, 2));
      const mm = dobStr.substring(2, 4);
      const dd = dobStr.substring(4, 6);
      const year = yy > 50 ? 1900 + yy : 2000 + yy;
      const dobMoment = moment(`${year}-${mm}-${dd}`, 'YYYY-MM-DD', true);
      if (dobMoment.isValid()) {
        data.dateOfBirth = dobMoment.format('YYYY-MM-DD');
        console.log("✓ DOB:", data.dateOfBirth);
      }
    }

    // [20] Sex
    const sexRaw = line2.charAt(20).toUpperCase();
    const sexMap: Record<string, string> = { 'M': 'M', 'F': 'F', '0': 'M' };
    if (sexMap[sexRaw]) {
      data.sex = sexMap[sexRaw];
      console.log("✓ Sex:", data.sex);
    }

    // [21-26] Expiry (YYMMDD)
    const expStr = toDigits(line2.substring(21, 27));
    if (expStr.length === 6) {
      const yy = parseInt(expStr.substring(0, 2));
      const mm = expStr.substring(2, 4);
      const dd = expStr.substring(4, 6);
      const year = yy > 50 ? 1900 + yy : 2000 + yy;
      const expMoment = moment(`${year}-${mm}-${dd}`, 'YYYY-MM-DD', true);
      if (expMoment.isValid()) {
        data.dateOfExpiry = expMoment.format('YYYY-MM-DD');
        console.log("✓ Expiry:", data.dateOfExpiry);
      }
    }

    console.log("── MRZ result:", Object.keys(data).length, "fields ──");
    return data;
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent style={{ maxWidth: "95vw", maxHeight: "90vh", padding: 0 }}>
        <DialogHeader style={{ padding: "1rem 1.5rem 0.5rem" }}>
          <DialogTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ScanLine width="1.25rem" />
            MRZ Passport Scanner
          </DialogTitle>
          <DialogDescription>
            {!ocrReady 
              ? `Loading OCR engine... ${ocrLoadProgress}%` 
              : processing
                ? "Reading MRZ zone..."
                : capturedImage
                  ? "Image captured. Tap Retake to try again."
                  : "Position the MRZ (bottom 2 lines of text) inside the highlighted zone"}
          </DialogDescription>
        </DialogHeader>

        <div style={{ position: "relative", width: "100%", aspectRatio: "3/2", background: "#000", overflow: "hidden" }}>
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {/* Passport outline */}
              <div style={{
                position: "absolute",
                inset: "4%",
                border: "2px solid rgba(255, 255, 255, 0.35)",
                borderRadius: "0.5rem",
                pointerEvents: "none",
              }} />
              {/* MRZ guide zone — highlighted bottom strip */}
              <div style={{
                position: "absolute",
                left: "4%",
                right: "4%",
                bottom: "4%",
                height: "22%",
                border: "2px solid mediumslateblue",
                borderRadius: "0.25rem",
                background: "rgba(123, 104, 238, 0.12)",
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <span style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textShadow: "0 1px 3px rgba(0,0,0,0.7)",
                  textTransform: "uppercase",
                }}>
                  MRZ Zone — Align the two bottom lines here
                </span>
              </div>
            </>
          ) : (
            <img src={capturedImage} alt="Captured" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          )}
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>

        <div style={{ padding: "1rem 1.5rem", display: "flex", gap: "0.75rem" }}>
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
                onClick={captureAndProcess}
                disabled={!ocrReady || processing}
                style={{
                  flex: 2,
                  padding: "0.875rem",
                  borderRadius: "0.75rem",
                  background: (ocrReady && !processing) ? "mediumslateblue" : "rgba(100, 100, 100, 0.3)",
                  color: "white",
                  border: "none",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: (ocrReady && !processing) ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
              >
                {processing ? (
                  <>
                    <Loader2 className="animate-spin" width="1.25rem" />
                    Scanning MRZ...
                  </>
                ) : (
                  <>
                    <ScanLine width="1.25rem" />
                    Scan Passport
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setCapturedImage(null);
                startCamera();
              }}
              disabled={processing}
              style={{
                flex: 1,
                padding: "0.875rem",
                borderRadius: "0.75rem",
                background: processing ? "rgba(100, 100, 100, 0.3)" : "rgba(100, 100, 100, 0.1)",
                border: "none",
                fontSize: "1rem",
                fontWeight: "500",
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
                  <Camera width="1.25rem" />
                  Retake
                </>
              )}
            </button>
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
