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

const firebaseConfig = {
  apiKey: "AIzaSyD8LWJoohdEagKAhtVybbqlmzlJYD3w9KY",
  authDomain: "doc-record.firebaseapp.com",
  projectId: "doc-record",
  storageBucket: "doc-record.appspot.com",
  messagingSenderId: "834882723630",
  appId: "1:834882723630:web:f8efe9cbbfad7e69bd64bf",
};

// Lazy initialization - only runs when needed (during login)
let _app: ReturnType<typeof initializeApp> | null = null;
let _auth: ReturnType<typeof getAuth> | null = null;
let _db: ReturnType<typeof initializeFirestore> | null = null;
let _storage: ReturnType<typeof getStorage> | null = null;
let _initializing = false;

const initializeFirebase = () => {
  if (_app || _initializing) return;
  
  _initializing = true;
  console.log("🔄 Initializing Firebase (login triggered)...");
  const startTime = performance.now();
  
  // Initialize app
  _app = initializeApp(firebaseConfig, {
    automaticDataCollectionEnabled: false,
  });
  
  // Initialize auth
  _auth = getAuth(_app);
  setPersistence(_auth, browserLocalPersistence).catch((err) => {
    console.error("Error setting auth persistence:", err);
  });
  
  // Initialize Firestore
  _db = initializeFirestore(_app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
      cacheSizeBytes: 50 * 1024 * 1024,
    }),
    experimentalForceLongPolling: false,
  });
  
  console.log("✅ Firebase initialized in " + Math.round(performance.now() - startTime) + "ms");
};

// Export getters that initialize on demand
export const getFirebaseApp = () => {
  if (!_app) initializeFirebase();
  return _app!;
};

export const getFirebaseAuth = () => {
  if (!_auth) initializeFirebase();
  return _auth!;
};

export const getFirebaseDb = () => {
  if (!_db) initializeFirebase();
  return _db!;
};

// For backward compatibility
export const app = new Proxy({} as ReturnType<typeof initializeApp>, {
  get(_target, prop) {
    return (getFirebaseApp() as any)[prop];
  }
});

export const auth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(_target, prop) {
    return (getFirebaseAuth() as any)[prop];
  }
});

export const db = new Proxy({} as ReturnType<typeof initializeFirestore>, {
  get(_target, prop) {
    return (getFirebaseDb() as any)[prop];
  }
});

// Lazy-load Storage
const initializeStorage = () => {
  if (_storage) return _storage;
  
  const app = getFirebaseApp();
  _storage = getStorage(app);
  _storage.maxOperationRetryTime = 15000;
  
  return _storage;
};

export const getAppStorage = () => initializeStorage();

export const storage = new Proxy({} as ReturnType<typeof getStorage>, {
  get(_target, prop) {
    const storageInstance = initializeStorage();
    if (!storageInstance) return undefined;
    return (storageInstance as any)[prop];
  }
});
