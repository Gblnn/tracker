import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { toast } from "sonner";

const firebaseConfig = {
  apiKey: "AIzaSyD8LWJoohdEagKAhtVybbqlmzlJYD3w9KY",
  authDomain: "doc-record.firebaseapp.com",
  projectId: "doc-record",
  storageBucket: "doc-record.appspot.com",
  messagingSenderId: "834882723630",
  appId: "1:834882723630:web:f8efe9cbbfad7e69bd64bf",
};

// Initialize Firebase app immediately
const startTime = performance.now();
toast.info("🔄 Starting Firebase initialization...");

export const app = initializeApp(firebaseConfig, {
  automaticDataCollectionEnabled: false,
});
toast.success("✅ Firebase app initialized (" + Math.round(performance.now() - startTime) + "ms)");

// PRIORITY: Initialize Auth FIRST (critical for app startup)
const authStartTime = performance.now();
toast.info("⚡ Initializing Auth (priority)...");
export const auth = getAuth(app);

// Set default persistence for Auth with error handling
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    toast.success("✅ Auth initialized (" + Math.round(performance.now() - authStartTime) + "ms)");
  })
  .catch((err) => {
    console.error("Error setting auth persistence:", err);
    toast.error("⚠️ Auth persistence error");
  });

// Initialize Firestore immediately after Auth (needed by AuthProvider)
const dbStartTime = performance.now();
toast.info("🔄 Initializing Firestore...");
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: 50 * 1024 * 1024, // 50MB cache size
  }),
  experimentalForceLongPolling: false, // Use WebSocket when possible
});
toast.success("✅ Firestore initialized (" + Math.round(performance.now() - dbStartTime) + "ms)");

// Lazy-load Storage (only when first accessed - less critical)
let _storage: ReturnType<typeof getStorage> | null = null;

const initializeStorage = () => {
  if (_storage) return _storage;
  
  const storageStartTime = performance.now();
  toast.info("🔄 Initializing Storage (on-demand)...");
  
  _storage = getStorage(app);
  _storage.maxOperationRetryTime = 15000; // 15 seconds max retry
  
  toast.success("✅ Storage initialized (" + Math.round(performance.now() - storageStartTime) + "ms)");
  return _storage;
};

// Export storage with lazy initialization via getter
export const getAppStorage = () => initializeStorage();

// For backward compatibility, keep storage export
export const storage = new Proxy({} as ReturnType<typeof getStorage>, {
  get(_target, prop) {
    const storageInstance = initializeStorage();
    if (!storageInstance) return undefined;
    return (storageInstance as any)[prop];
  }
});
