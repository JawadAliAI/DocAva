import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDJFU-lqh-WBZAd6HvOqNTnz_3hF_AEBNQ",
    authDomain: "prowell-21a58.firebaseapp.com",
    projectId: "prowell-21a58",
    storageBucket: "prowell-21a58.firebasestorage.app",
    messagingSenderId: "522998581596",
    appId: "1:522998581596:web:1f65cd22d1f27314b65999",
    measurementId: "G-2B5FZHGMX0"
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
