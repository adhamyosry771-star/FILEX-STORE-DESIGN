import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyAVq-5DQN51-CFomeUdZeI7v1X4rVUz8fI",
  authDomain: "filex-store-6caf0.firebaseapp.com",
  projectId: "filex-store-6caf0",
  storageBucket: "filex-store-6caf0.firebasestorage.app",
  messagingSenderId: "296363203690",
  appId: "1:296363203690:web:203ade8301ea277819fe13"
};

// Initialize Firebase safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
