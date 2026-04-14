// src/services/firebase.js
// Firebase client SDK initialization (Auth only)

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB1S5qowOC_JAbhX3SV6jJNQ_msMqdLIfQ",
  authDomain: "ijeeqt-d0100.firebaseapp.com",
  projectId: "ijeeqt-d0100",
  storageBucket: "ijeeqt-d0100.firebasestorage.app",
  messagingSenderId: "940108207602",
  appId: "1:940108207602:web:fac2b82df1538ca1b2c76b"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;
