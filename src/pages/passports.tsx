import { useAuth } from "@/components/AuthProvider";
import Back from "@/components/back";
import RefreshButton from "@/components/refresh-button";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { db } from "@/firebase";
import { ensureOcrWorker } from "@/utils/ocrWorker";
import { PSM } from "tesseract.js";
import { ensureMrzWorker, getMrzLoadState, subscribeMrzLoad } from "@/utils/mrzWorker";
import { parse as parseMRZText } from "mrz";
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where, orderBy } from "firebase/firestore";
import { motion } from "framer-motion";
import { 
  Calendar, Camera, Globe, Loader2, Plus, ScanLine, Trash, UserCircle, X, 
  FileText, MapPin, BookMarked, Download 
} from "lucide-react";
import * as XLSX from "@e965/xlsx";
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
  const [ocrReady, setOcrReady] = useState(() => getMrzLoadState().ready);
  const [ocrLoadProgress, setOcrLoadProgress] = useState(() => getMrzLoadState().progress);
  const [mrzStatus, setMrzStatus] = useState(() => getMrzLoadState().status);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const withTimeout = async <T,>(promiseFactory: () => Promise<T>, label: string, timeoutMs = 15000): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      return await Promise.race([
        promiseFactory(),
        new Promise<T>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(`${label} timed out`));
          }, timeoutMs);
        }),
      ]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };

  useEffect(() => {
    const current = getMrzLoadState();
    setOcrLoadProgress(current.progress);
    setOcrReady(current.ready);
    setMrzStatus(current.status);

    // Subscribe to the dedicated MRZ worker load progress
    const unsubscribe = subscribeMrzLoad((progress, status) => {
      setOcrLoadProgress(progress);
      setOcrReady(getMrzLoadState().ready);
      setMrzStatus(status);
      console.log(`[MRZ worker] ${status} ${progress}%`);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (open) {
      // Preload both workers
      void ensureMrzWorker();
      void ensureOcrWorker(); // still used for visual text pass
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
  // MRZ DATE CONVERSION — YYMMDD → YYYY-MM-DD
  // ============================================================
  const mrzDateToISO = (yymmdd: string, context: 'dob' | 'exp'): string | null => {
    if (!yymmdd || yymmdd.includes('<') || yymmdd.length !== 6) return null;
    const yy = parseInt(yymmdd.substring(0, 2));
    const mm = yymmdd.substring(2, 4);
    const dd = yymmdd.substring(4, 6);
    // DOB: if yy > current 2-digit year → person was born last century
    const currentYY = new Date().getFullYear() % 100;
    const year = context === 'dob'
      ? (yy > currentYY ? 1900 + yy : 2000 + yy)
      : 2000 + yy; // expiry is always this century
    const m = moment(`${year}-${mm}-${dd}`, 'YYYY-MM-DD', true);
    return m.isValid() ? m.format('YYYY-MM-DD') : null;
  };

  // ============================================================
  // MAP mrz.parse() result → PassportRecord
  // ============================================================
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapMRZResult = (parsed: any): Partial<PassportRecord> => {
    const data: Partial<PassportRecord> = {};
    const f = parsed.fields;
    if (!f) return data;

    const val = (field: string): string | undefined => f[field]?.value || undefined;

    // Passport number
    if (val('documentNumber')) data.passportNumber = val('documentNumber');

    // Full name — mrz parser returns lastName and firstName separately
    const last = val('lastName')?.trim() ?? '';
    const first = val('firstName')?.trim() ?? '';
    if (first && last) data.fullName = `${first} ${last}`;
    else if (first || last) data.fullName = (first || last);

    // Nationality
    if (val('nationality')) data.nationality = val('nationality');

    // Sex
    const sex = val('sex');
    if (sex === 'M' || sex === 'F') data.sex = sex;

    // Dates
    const dob = mrzDateToISO(val('birthDate') ?? '', 'dob');
    if (dob) data.dateOfBirth = dob;

    const exp = mrzDateToISO(val('expirationDate') ?? '', 'exp');
    if (exp) data.dateOfExpiry = exp;

    return data;
  };

  // ============================================================
  // MRZ LINE EXTRACTION — pull valid MRZ lines from OCR output
  // With mrz.traineddata, '<' is correctly recognised, so we can
  // rely on simple filtering rules without chevron normalization.
  // ============================================================
  const extractMRZLines = (rawText: string): string[] => {
    return rawText
      .split('\n')
      .map((l: string) => l.replace(/\s/g, '').replace(/[^A-Z0-9<]/gi, '').toUpperCase())
      .filter((l: string) => l.length >= 35 && l.includes('<'));
  };

  // ============================================================
  // MAIN PROCESSING — mrz worker for MRZ zone, ocr worker for visual text
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

      // Use the dedicated MRZ worker (mrz.traineddata — OCR-B specific)
      const mrzW = await withTimeout(() => ensureMrzWorker(), "MRZ engine", 45000);

      // Try MRZ crops: bottom 30% (tight), 45% (generous), 60% (very generous)
      const attempts = [
        { label: "bottom-30%", topPct: 0.70, contrast: 1.5, psm: PSM.SINGLE_BLOCK },
        { label: "bottom-45%", topPct: 0.55, contrast: 1.4, psm: PSM.SINGLE_BLOCK },
        { label: "bottom-60%", topPct: 0.40, contrast: 1.3, psm: PSM.SINGLE_BLOCK },
      ];

      let bestData: Partial<PassportRecord> = {};

      for (const attempt of attempts) {
        if (Object.keys(bestData).length >= 6) break;

        const cropY = Math.floor(img.height * attempt.topPct);
        const cropH = img.height - cropY;
        const scale = Math.max(1, Math.min(3, 2000 / img.width));

        const mrzImage = preprocessForMRZ(img, 0, cropY, img.width, cropH, scale, attempt.contrast);
        if (!mrzImage) continue;

        console.log(`── Attempt: ${attempt.label}, scale=${scale.toFixed(1)} ──`);

        await mrzW.setParameters({
          tessedit_pageseg_mode: attempt.psm,
          preserve_interword_spaces: '0',
        });

        const result: any = await withTimeout(
          () => mrzW.recognize(mrzImage),
          `MRZ recognition (${attempt.label})`,
          30000
        );
        console.log("Raw MRZ text:", result.data.text);

        const mrzLines = extractMRZLines(result.data.text);
        console.log("MRZ lines:", mrzLines);
        if (mrzLines.length < 2) continue;

        // Find the line-1 / line-2 pair
        let l1 = '', l2 = '';
        for (let i = 0; i < mrzLines.length - 1; i++) {
          if (mrzLines[i].startsWith('P') && mrzLines[i].includes('<<')) {
            l1 = mrzLines[i].substring(0, 44).padEnd(44, '<');
            l2 = mrzLines[i + 1].substring(0, 44).padEnd(44, '<');
            break;
          }
        }
        if (!l1) {
          l1 = mrzLines[mrzLines.length - 2].substring(0, 44).padEnd(44, '<');
          l2 = mrzLines[mrzLines.length - 1].substring(0, 44).padEnd(44, '<');
          if (l2.startsWith('P') && l2.includes('<<')) [l1, l2] = [l2, l1];
        }
        console.log("L1:", l1);
        console.log("L2:", l2);

        try {
          // autocorrect: true lets mrz fix O→0, I→1 etc. in the right positions
          const parsed = parseMRZText([l1, l2], { autocorrect: true });
          console.log("Parsed valid:", parsed.valid, parsed.fields);
          const mapped = mapMRZResult(parsed);
          if (Object.keys(mapped).length > Object.keys(bestData).length) {
            bestData = mapped;
          }
        } catch (e) {
          console.warn('mrz parse error:', e);
        }
      }

      // Full-page fallback if crops missed MRZ
      if (Object.keys(bestData).length < 3) {
        console.log("── Last resort: full page scan ──");
        const scale = img.width < 1200 ? 2 : (img.width < 2000 ? 1.5 : 1);
        const fullImg = preprocessForMRZ(img, 0, 0, img.width, img.height, scale, 1.3);
        if (fullImg) {
          await mrzW.setParameters({ tessedit_pageseg_mode: PSM.AUTO, preserve_interword_spaces: '0' });
          const fullResult: any = await withTimeout(
            () => mrzW.recognize(fullImg),
            "MRZ recognition (full page)",
            30000
          );
          const fullLines = extractMRZLines(fullResult.data.text);
          if (fullLines.length >= 2) {
            const l1 = fullLines[fullLines.length - 2].substring(0, 44).padEnd(44, '<');
            const l2 = fullLines[fullLines.length - 1].substring(0, 44).padEnd(44, '<');
            try {
              const parsed = parseMRZText([l1, l2], { autocorrect: true });
              const mapped = mapMRZResult(parsed);
              if (Object.keys(mapped).length > Object.keys(bestData).length) bestData = mapped;
            } catch { /* ignore */ }
          }
        }
      }

      // Expand nationality code to full name
      const nationalityMap: Record<string, string> = {
        'IND': 'INDIAN', 'USA': 'AMERICAN', 'GBR': 'BRITISH', 'PAK': 'PAKISTANI',
        'BGD': 'BANGLADESHI', 'LKA': 'SRI LANKAN', 'NPL': 'NEPALESE', 'PHL': 'FILIPINO',
        'EGY': 'EGYPTIAN', 'JOR': 'JORDANIAN', 'IRN': 'IRANIAN', 'IRQ': 'IRAQI',
        'SAU': 'SAUDI', 'ARE': 'EMIRATI', 'KWT': 'KUWAITI', 'QAT': 'QATARI',
        'OMN': 'OMANI', 'BHR': 'BAHRAINI', 'YEM': 'YEMENI', 'SYR': 'SYRIAN',
      };
      if (bestData.nationality && nationalityMap[bestData.nationality]) {
        bestData.nationality = nationalityMap[bestData.nationality];
      }

      // ── VISUAL TEXT PASS: Only for fields NOT in MRZ ──
      // placeOfBirth, placeOfIssue, dateOfIssue are NOT encoded in MRZ
      if (!bestData.placeOfBirth || !bestData.placeOfIssue || !bestData.dateOfIssue) {
        console.log("========== VISUAL TEXT PASS ==========");
        console.log("Missing:",
          !bestData.placeOfBirth ? "placeOfBirth" : "",
          !bestData.placeOfIssue ? "placeOfIssue" : "",
          !bestData.dateOfIssue ? "dateOfIssue" : ""
        );
        try {
          // Scan top 80% of passport (everything above MRZ zone)
          const topH = Math.floor(img.height * 0.80);
          const scale = img.width < 1200 ? 2 : (img.width < 2000 ? 1.5 : 1);
          const topImg = preprocessForMRZ(img, 0, 0, img.width, topH, scale, 1.4);
          if (topImg) {
            const ocrW = await withTimeout(() => ensureOcrWorker(), "OCR engine", 45000);
            await ocrW.setParameters({
              tessedit_char_whitelist: '',
              tessedit_pageseg_mode: PSM.SINGLE_COLUMN,
              preserve_interword_spaces: '1',
            });
            const topResult: any = await withTimeout(
              () => ocrW.recognize(topImg),
              "Visual OCR recognition",
              30000
            );
            const text = topResult.data.text;
            console.log("Visual text:\n", text);

            // Normalize lines: trim, remove empty
            const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

            // Log all lines for debugging
            console.log("Visual lines:", lines.map((l: string, idx: number) => `[${idx}] ${l}`));

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const next = (i + 1 < lines.length) ? lines[i + 1] : '';
              const next2 = (i + 2 < lines.length) ? lines[i + 2] : '';
              const next3 = (i + 3 < lines.length) ? lines[i + 3] : '';

              // Helper: check if a string looks like a place name (alpha-dominant, not a label)
              const looksLikePlace = (s: string): boolean => {
                if (s.length < 2) return false;
                if (!/^[A-Za-z]/.test(s)) return false;
                if (/date|expiry|passport|sex|nationality|surname|given|type|country|code/i.test(s)) return false;
                return true;
              };

              // Helper: extract a date from a string in DD/MM/YYYY format
              const extractDate = (s: string): string | null => {
                const dm = s.match(/(\d{1,2})\s*[\/\.\-]\s*(\d{1,2})\s*[\/\.\-]\s*(\d{2,4})/);
                if (!dm) return null;
                const p = moment(`${dm[1]}/${dm[2]}/${dm[3]}`, ["DD/MM/YYYY", "DD/MM/YY", "D/M/YYYY"], false);
                if (p.isValid() && p.year() >= 1990 && p.year() <= 2040) return p.format("YYYY-MM-DD");
                return null;
              };

              // ── Date of Issue ──
              if (!bestData.dateOfIssue && /date\s*of\s*issue|issue\s*date/i.test(line)) {
                for (const src of [line, next, next2]) {
                  const d = extractDate(src);
                  if (d) {
                    const yr = moment(d).year();
                    if (yr >= 2000 && yr <= 2026) {
                      bestData.dateOfIssue = d;
                      console.log("✓ Date of Issue:", d);
                      break;
                    }
                  }
                }
              }
              // Also catch lines that just say "issue" near dates
              if (!bestData.dateOfIssue && /issue/i.test(line) && !/place/i.test(line)) {
                const d = extractDate(line);
                if (d && moment(d).year() >= 2000 && moment(d).year() <= 2026) {
                  bestData.dateOfIssue = d;
                  console.log("✓ Date of Issue (inline):", d);
                }
              }

              // ── Place of Birth ──
              if (!bestData.placeOfBirth && /place\s*of\s*birth/i.test(line)) {
                // Try: value on same line after label
                const m = line.match(/place\s*of\s*birth[:\s\/\-]*([A-Za-z][A-Za-z\s,\.\-]{1,})/i);
                if (m && looksLikePlace(m[1].trim())) {
                  bestData.placeOfBirth = m[1].trim().replace(/\s+/g, ' ').substring(0, 50);
                }
                // Try next lines
                if (!bestData.placeOfBirth) {
                  for (const candidate of [next, next2, next3]) {
                    const cleaned = candidate.replace(/[^A-Za-z\s,\.\-]/g, '').trim();
                    if (looksLikePlace(cleaned) && cleaned.length > 1 &&
                        !/place\s*of|birth|issue/i.test(cleaned)) {
                      bestData.placeOfBirth = cleaned.replace(/\s+/g, ' ').substring(0, 50);
                      break;
                    }
                  }
                }
                if (bestData.placeOfBirth) console.log("✓ Place of Birth:", bestData.placeOfBirth);
              }

              // ── Place of Issue ──
              if (!bestData.placeOfIssue) {
                // Match "Place of Issue", "place of lssue", "place of 1ssue" etc.
                const isPlaceOfIssue = /place\s*of\s*(?:issue|[il1]ssue)/i.test(line) ||
                                       /issuing\s*authority/i.test(line) ||
                                       /issued?\s*at/i.test(line);
                if (isPlaceOfIssue) {
                  // Try: value on same line after label
                  const m = line.match(/(?:place\s*of\s*(?:issue|[il1]ssue)|issuing\s*authority|issued?\s*at)[:\s\/\-]*([A-Za-z][A-Za-z\s,\.\-]{1,})/i);
                  if (m && looksLikePlace(m[1].trim()) &&
                      !/birth/i.test(m[1])) {
                    bestData.placeOfIssue = m[1].trim().replace(/\s+/g, ' ').substring(0, 50);
                  }
                  // Try next lines
                  if (!bestData.placeOfIssue) {
                    for (const candidate of [next, next2, next3]) {
                      const cleaned = candidate.replace(/[^A-Za-z\s,\.\-]/g, '').trim();
                      if (looksLikePlace(cleaned) && cleaned.length > 1 &&
                          !/place\s*of|birth|issue/i.test(cleaned)) {
                        bestData.placeOfIssue = cleaned.replace(/\s+/g, ' ').substring(0, 50);
                        break;
                      }
                    }
                  }
                  if (bestData.placeOfIssue) console.log("✓ Place of Issue:", bestData.placeOfIssue);
                }
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

      console.log("==================== FINAL DATA ====================");
      console.log(bestData);

      if (Object.keys(bestData).length > 0) {
        onDataExtracted(bestData);
        toast.success("Passport data extracted! Review and fill in any missing fields.");
        setCapturedImage(null);
        onClose();
      } else {
        toast.error("Could not read MRZ. Ensure the bottom two lines of the passport are clearly visible and well-lit.");
      }
    } catch (error) {
      console.error("MRZ Scan error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to scan passport");
      setCapturedImage(null);
    } finally {
      setProcessing(false);
    }
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
              ? `Loading MRZ engine... ${ocrLoadProgress}%` 
              : processing
                ? "Reading MRZ zone..."
                : capturedImage
                  ? "Image captured. Tap Retake to try again."
                  : "Position the MRZ (bottom 2 lines of text) inside the highlighted zone"}
          </DialogDescription>
          <p style={{ fontSize: "0.78rem", opacity: 0.65, marginTop: "0.2rem" }}>
            MRZ Engine Status: {mrzStatus} {ocrReady ? "(Ready)" : `(${ocrLoadProgress}%)`}
          </p>
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

  const downloadExcel = () => {
    if (passports.length === 0) {
      toast.error("No passport records to export");
      return;
    }

    const rows = passports.map((p) => ({
      "Passport Number": p.passportNumber,
      "Full Name": p.fullName,
      "Date of Birth": p.dateOfBirth ? moment(p.dateOfBirth).format("DD/MM/YYYY") : "",
      "Nationality": p.nationality,
      "Sex": p.sex === "M" ? "Male" : p.sex === "F" ? "Female" : p.sex || "",
      "Place of Birth": p.placeOfBirth || "",
      "Place of Issue": p.placeOfIssue || "",
      "Date of Issue": p.dateOfIssue ? moment(p.dateOfIssue).format("DD/MM/YYYY") : "",
      "Date of Expiry": p.dateOfExpiry ? moment(p.dateOfExpiry).format("DD/MM/YYYY") : "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Passports");

    // Auto-size columns
    const colWidths = Object.keys(rows[0]).map((key) => ({
      wch: Math.max(key.length, ...rows.map((r) => String((r as Record<string, string>)[key] || "").length)) + 2,
    }));
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, `Passports_${moment().format("YYYY-MM-DD")}.xlsx`);
    toast.success("Passport list downloaded");
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
              {passports.length > 0 && (
                <button
                  onClick={downloadExcel}
                  style={{
                    background: "rgba(100, 100, 100, 0.08)",
                    border: "none",
                    borderRadius: "0.5rem",
                    padding: "0.5rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Download as Excel"
                >
                  <Download width="1.125rem" />
                </button>
              )}
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", gap: "0.75rem" }}>
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
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      
                      <div>
                        <div style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.25rem", textAlign:"left" }}>
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
