// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCD31z9_DZqRiHUlJ_Xw6tngHRt9YifI0o",
  authDomain: "smarttrashbin-873fd.firebaseapp.com",
  projectId: "smarttrashbin-873fd",
  storageBucket: "smarttrashbin-873fd.firebasestorage.app",
  messagingSenderId: "684188138536",
  appId: "1:684188138536:web:b56f21abe8988bf2dc891d",
  measurementId: "G-QE2H06BM5S",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services with error handling
let analytics, auth, db, functions;

try {
  analytics = getAnalytics(app);
} catch (error) {
  console.warn("Analytics initialization failed:", error);
}

try {
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);

  console.log("Firebase services initialized successfully");
} catch (error) {
  console.error("Firebase services initialization failed:", error);
  throw error;
}

// Export Firebase services
export { app, analytics, auth, db, functions };
