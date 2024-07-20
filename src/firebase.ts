import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from 'firebase/auth'

const firebaseConfig = {

    apiKey: "AIzaSyDHEK5fSNrTJJczkFMV0h6MmYjPS44cnO0",
    authDomain: "ssu-db-ec149.firebaseapp.com",
    projectId: "ssu-db-ec149",
    storageBucket: "ssu-db-ec149.appspot.com",
    messagingSenderId: "358217039306",
    appId: "1:358217039306:web:1c091e2355728ed352a333"
  };

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)
export const storage = getStorage()
export const auth = getAuth()