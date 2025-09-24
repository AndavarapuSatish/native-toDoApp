import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBx_qLzdH5k3sx3WPOh0h3bJRdU7QTj1Xw",
  authDomain: "native-todoapp-a5ee1.firebaseapp.com",
  projectId: "native-todoapp-a5ee1",
  storageBucket: "native-todoapp-a5ee1.firebasestorage.app",
  messagingSenderId: "185833555348",
  appId: "1:185833555348:web:e8c573c80f6625e5a07b81"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);