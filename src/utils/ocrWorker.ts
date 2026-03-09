import Tesseract, { PSM } from "tesseract.js";

type OcrLoadState = {
  ready: boolean;
  progress: number;
  status: string;
};

type OcrLoadListener = (state: OcrLoadState) => void;

let workerInstance: any = null;
let workerPromise: Promise<any> | null = null;

let loadState: OcrLoadState = {
  ready: false,
  progress: 0,
  status: "Preparing OCR engine...",
};

const listeners = new Set<OcrLoadListener>();

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

export const ensureOcrWorker = async () => {
  if (workerInstance) {
    setLoadState({ ready: true, progress: 100, status: "OCR engine ready" });
    return workerInstance;
  }

  if (!workerPromise) {
    setLoadState({ ready: false, progress: 0, status: "Loading OCR engine..." });

    workerPromise = Tesseract.createWorker("eng", 1, {
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

        setLoadState({ status: formattedStatus, progress: nextProgress });
      },
    })
      .then(async (worker) => {
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
          preserve_interword_spaces: "0",
        });

        workerInstance = worker;
        setLoadState({ ready: true, progress: 100, status: "OCR engine ready" });
        return worker;
      })
      .catch((error) => {
        workerPromise = null;
        setLoadState({ ready: false, status: "Failed to load OCR engine" });
        throw error;
      });
  }

  return workerPromise;
};

export const preloadOcrWorker = () => {
  void ensureOcrWorker();
};
