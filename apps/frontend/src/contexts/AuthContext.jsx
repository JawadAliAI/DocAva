import React, { useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState();
    const [loading, setLoading] = useState(true);

    async function signup(email, password, name, username) {
        if (!auth) {
            console.warn("⚠️ Firebase unavailable. Creating dummy user.");
            const dummyUser = { uid: "dummy-user-123", email, displayName: name };
            setCurrentUser(dummyUser);
            return { user: dummyUser };
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update Profile
        await updateProfile(user, {
            displayName: name
        });

        // Create User Document
        try {
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                username: username,
                email: email,
                createdAt: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error writing user document: ", error);
            // Continue even if DB write fails, as Auth is successful
        }

        return userCredential;
    }

    function login(email, password) {
        if (!auth) {
            console.warn("⚠️ Firebase unavailable. Logging in as dummy user.");
            const dummyUser = { uid: "dummy-user-123", email, displayName: "Demo User" };
            setCurrentUser(dummyUser);
            return Promise.resolve({ user: dummyUser });
        }
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        if (!auth) {
            setCurrentUser(null);
            return Promise.resolve();
        }
        return signOut(auth);
    }

    useEffect(() => {
        // If auth is null (Firebase failed), skip auth entirely
        if (!auth) {
            console.warn("⚠️ Firebase auth unavailable, skipping authentication");
            setCurrentUser(null);
            setLoading(false);
            return;
        }

        // Set a timeout to prevent infinite loading
        const timeout = setTimeout(() => {
            console.warn("Firebase auth taking too long, forcing load...");
            setLoading(false);
        }, 3000);

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            clearTimeout(timeout);
            setCurrentUser(user);
            setLoading(false);
        });

        return () => {
            clearTimeout(timeout);
            unsubscribe();
        };
    }, []);

    const value = {
        currentUser,
        login,
        signup,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
