// Firebase configuration and initialization
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
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Auth and Firestore
const auth = firebase.auth();
const db = firebase.firestore();

// Export for use in other files
window.auth = auth;
window.db = db;
