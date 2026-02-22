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

// Initialize Firebase with performance settings
const startTime = performance.now();
toast.info("🔄 Starting Firebase initialization...");

export const app = initializeApp(firebaseConfig, {
  automaticDataCollectionEnabled: false, // Only enable data collection when needed
});
toast.success("✅ Firebase app initialized (" + Math.round(performance.now() - startTime) + "ms)");

// Initialize Firestore with optimized persistence settings
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

// Initialize storage with custom settings
const storageStartTime = performance.now();
toast.info("🔄 Initializing Storage...");
export const storage = getStorage(app);

// Configure storage settings after initialization
storage.maxOperationRetryTime = 15000; // 15 seconds max retry
toast.success("✅ Storage initialized (" + Math.round(performance.now() - storageStartTime) + "ms)");

const authStartTime = performance.now();
toast.info("🔄 Initializing Auth...");
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
