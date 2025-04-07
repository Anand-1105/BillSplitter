import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBQRzy56t-JCch9i5GT03K-t5vCgTnvvfo",
  authDomain: "aiproject-e0db6.firebaseapp.com",
  projectId: "aiproject-e0db6",
  storageBucket: "aiproject-e0db6.firebasestorage.app",
  messagingSenderId: "137880598873",
  appId: "1:137880598873:web:6fec8a86ddb3959f08b448",
  measurementId: "G-TP85Y6LGDG",
  databaseURL: "https://aiproject-e0db6-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const analytics = getAnalytics(app);
export const googleProvider = new GoogleAuthProvider();
