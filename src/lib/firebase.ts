import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAn4UeXHZ4nysaowWVKOTNoZgup9HwEfYM",
  authDomain: "anhos-c0b6e.firebaseapp.com",
  projectId: "anhos-c0b6e",
  storageBucket: "anhos-c0b6e.firebasestorage.app",
  messagingSenderId: "918736710226",
  appId: "1:918736710226:web:3086c52eb071101a0bcd8b",
  measurementId: "G-QQRW5M40DS"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
