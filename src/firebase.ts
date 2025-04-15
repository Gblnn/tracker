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

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with multi-tab persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const storage = getStorage();
export const auth = getAuth();

// Set default persistence for Auth
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("Error setting auth persistence:", err);
});
