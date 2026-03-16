/**
 * Dedicated Tesseract worker using the 'mrz' language model.
 *
 * Unlike the general 'eng' model, 'mrz.traineddata' is specifically trained on
 * OCR-B font — the font mandated by ICAO 9303 for all passport MRZ zones.
 * This means '<' is never confused with 'C', 'L', or 'K', digit positions are
 * recognised correctly, and check digits pass reliably.
 *
 * This worker is kept separate from ocrWorker.ts (which uses 'eng' and is used
 * by other pages like the fuel log).
 */
import Tesseract from "tesseract.js";

type MrzLoadListener = (progress: number, status: string) => void;
type MrzLoadState = {
  ready: boolean;
  progress: number;
  status: string;
};

let workerInstance: Tesseract.Worker | null = null;
let workerPromise: Promise<Tesseract.Worker> | null = null;
const listeners = new Set<MrzLoadListener>();
const LOCAL_LANG_PATH = "/ocr";

let loadState: MrzLoadState = {
  ready: false,
  progress: 0,
  status: "Loading MRZ engine...",
};

export const subscribeMrzLoad = (fn: MrzLoadListener): (() => void) => {
  listeners.add(fn);
  fn(loadState.progress, loadState.status);
  return () => { listeners.delete(fn); };
};

const notify = (progress: number, status: string) => {
  loadState = {
    ready: progress >= 100,
    progress,
    status,
  };
  listeners.forEach((fn) => fn(progress, status));
};

export const getMrzLoadState = (): MrzLoadState => loadState;

const createMrzWorker = async (): Promise<Tesseract.Worker> => {
  // Try local WASM + remote mrz.traineddata (first run downloads once, then cached)
  const loggerFn = (m: { progress?: number; status?: string }) => {
    if (typeof m.progress === "number") {
      notify(
        Math.round(m.progress * 100),
        m.status ?? "Loading MRZ engine...",
      );
    }
  };

  // Attempt 1: local WASM core (already in public/ocr/)
  for (const corePath of [
    "/ocr/tesseract-core-simd.wasm.js",
    "/ocr/tesseract-core.wasm.js",
  ]) {
    try {
      const w = await Tesseract.createWorker("mrz", 1, {
        workerPath: "/ocr/worker.min.js",
        corePath,
        langPath: LOCAL_LANG_PATH,
        logger: loggerFn,
      });
      return w;
    } catch {
      // try next
    }
  }

  // Attempt 2: fully remote (CDN) — downloads WASM + mrz.traineddata
  notify(0, "Loading MRZ engine (remote fallback)...");
  return Tesseract.createWorker("mrz", 1, { logger: loggerFn });
};

export const ensureMrzWorker = (): Promise<Tesseract.Worker> => {
  if (workerInstance) {
    notify(100, "MRZ engine ready");
    return Promise.resolve(workerInstance);
  }
  if (workerPromise) return workerPromise;

  notify(0, "Loading MRZ engine...");
  workerPromise = createMrzWorker()
    .then((w) => {
      workerInstance = w;
      notify(100, "MRZ engine ready");
      return w;
    })
    .catch((err) => {
      workerPromise = null;
      notify(0, "Failed to load MRZ engine");
      throw err;
    });

  return workerPromise;
};

/** Call this on app start or when the passports page mounts to warm up the worker. */
export const preloadMrzWorker = () => {
  return ensureMrzWorker();
};
