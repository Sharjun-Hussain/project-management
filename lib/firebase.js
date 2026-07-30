import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log("[firebase.js] Initializing with config:", {
  apiKey:    firebaseConfig.apiKey    ? firebaseConfig.apiKey.slice(0, 12) + "..." : "MISSING!",
  projectId: firebaseConfig.projectId ?? "MISSING!",
  appId:     firebaseConfig.appId     ? "present" : "MISSING!",
});

const app     = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth    = getAuth(app);
const db      = getFirestore(app);
const storage = getStorage(app);

console.log("[firebase.js] db instance:", db ? "OK ✅" : "NULL ❌");

export { app, auth, db, storage };
