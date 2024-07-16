// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
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
