// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

// Firebase configuration with direct values to match the working project
const firebaseConfig = {
    apiKey: "AIzaSyDF8HgLVsPAbNjCATP7v6pMjhKslOnAjOc",
    authDomain: "com-capstone-unitechhr-cecca.firebaseapp.com",
    projectId: "com-capstone-unitechhr-cecca",
    storageBucket: "com-capstone-unitechhr-cecca.appspot.com",
    messagingSenderId: "1087281687437",
    appId: "1:1087281687437:web:cf6caf25d1a1f5be042bc4",
    measurementId: "G-P9TZQKWPJ0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const messaging = typeof window !== "undefined" ? getMessaging(app) : null;

export { db, auth, storage, messaging };
