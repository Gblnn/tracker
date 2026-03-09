import Tesseract, { PSM } from "tesseract.js";

type OcrLoadState = {
  ready: boolean;
  progress: number;
  status: string;
};

type OcrLoadListener = (state: OcrLoadState) => void;
type WorkerInitOptions = {
  workerPath?: string;
  corePath?: string;
  langPath?: string;
};

let workerInstance: any = null;
let workerPromise: Promise<any> | null = null;

let loadState: OcrLoadState = {
  ready: false,
  progress: 0,
  status: "Preparing OCR engine...",
};

const listeners = new Set<OcrLoadListener>();
const LOCAL_LANG_PATH = "/ocr";

const workerLoadAttempts: Array<{ label: string; options: WorkerInitOptions }> = [
  {
    label: "local SIMD core",
    options: {
      workerPath: "/ocr/worker.min.js",
      corePath: "/ocr/tesseract-core-simd.wasm.js",
      langPath: LOCAL_LANG_PATH,
    },
  },
  {
    label: "local standard core",
    options: {
      workerPath: "/ocr/worker.min.js",
      corePath: "/ocr/tesseract-core.wasm.js",
      langPath: LOCAL_LANG_PATH,
    },
  },
  {
    label: "remote fallback",
    options: {},
  },
];

const publishLoadState = () => {
  listeners.forEach((listener) => listener(loadState));
};

const setLoadState = (nextState: Partial<OcrLoadState>) => {
  loadState = {
    ...loadState,
    ...nextState,
  };
  publishLoadState();
};

export const getOcrLoadState = (): OcrLoadState => loadState;

export const subscribeOcrLoadState = (listener: OcrLoadListener) => {
  listeners.add(listener);
  listener(loadState);

  return () => {
    listeners.delete(listener);
  };
};

const createWorkerWithOptions = async (label: string, options: WorkerInitOptions) => {
  const worker = await Tesseract.createWorker("eng", 1, {
    ...options,
    logger: (message) => {
      const normalizedStatus = message.status
        ? message.status.replace(/\s+/g, " ").trim()
        : "Loading OCR engine...";

      const formattedStatus = normalizedStatus
        ? normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)
        : "Loading OCR engine...";

      const nextProgress =
        typeof message.progress === "number"
          ? Math.max(0, Math.min(100, Math.round(message.progress * 100)))
          : loadState.progress;

      setLoadState({
        status: `${formattedStatus} (${label})`,
        progress: nextProgress,
      });
    },
  });

  await worker.setParameters({
    tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    preserve_interword_spaces: "0",
  });

  return worker;
};

const initializeWorkerWithFallback = async () => {
  let lastError: unknown = null;

  for (const attempt of workerLoadAttempts) {
    try {
      setLoadState({
        ready: false,
        progress: 0,
        status: `Initializing OCR engine (${attempt.label})...`,
      });

      const worker = await createWorkerWithOptions(attempt.label, attempt.options);
      return worker;
    } catch (error) {
      lastError = error;
      console.error(`OCR init failed using ${attempt.label}:`, error);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unable to initialize OCR worker");
};

export const ensureOcrWorker = async () => {
  if (workerInstance) {
    setLoadState({ ready: true, progress: 100, status: "OCR engine ready" });
    return workerInstance;
  }

  if (!workerPromise) {
    setLoadState({ ready: false, progress: 0, status: "Loading OCR engine..." });

    workerPromise = initializeWorkerWithFallback()
      .then(async (worker) => {
        workerInstance = worker;
        setLoadState({ ready: true, progress: 100, status: "OCR engine ready" });
        return worker;
      })
      .catch((error) => {
        workerPromise = null;
        setLoadState({ ready: false, progress: 0, status: "Failed to load OCR engine" });
        throw error;
      });
  }

  return workerPromise;
};

export const preloadOcrWorker = () => {
  void ensureOcrWorker();
};
