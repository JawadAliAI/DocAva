import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app, auth, db;

try {
    app = initializeApp(firebaseConfig);
    console.log("✅ Firebase initialized");

    // Initialize Analytics (non-blocking)
    try {
        const analytics = getAnalytics(app);
    } catch (error) {
        console.warn("⚠️ Analytics failed:", error.message);
    }

    auth = getAuth(app);
    db = getFirestore(app);

} catch (error) {
    console.error("❌ Firebase init failed:", error.message);
    console.log("App will run without Firebase");
    auth = null;
    db = null;
}

export { auth, db };
