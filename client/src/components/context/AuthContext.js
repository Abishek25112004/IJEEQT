// src/context/AuthContext.js
// Global auth state — wraps Firebase Auth with user profile from Firestore

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);        // Firebase Auth user
  const [profile, setProfile] = useState(null);  // Firestore user profile
  const [loading, setLoading] = useState(true);

  // Fetch Firestore profile for the logged-in Firebase user
  const fetchProfile = async (firebaseUser) => {
    try {
      const docRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile({ uid: firebaseUser.uid, ...docSnap.data() });
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  /**
   * Register: creates Firebase Auth account + Firestore profile via backend
   */
  const register = async (name, email, password, role = "author", institution = "") => {
    // First create via backend (which handles Firestore profile creation)
    await authAPI.register({ name, email, password, role, institution });
    // Then sign in to get the Firebase Auth session
    const result = await signInWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    await fetchProfile(result.user);
    return result.user;
  };

  /**
   * Login with email and password
   */
  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await fetchProfile(result.user);
    return result.user;
  };

  /**
   * Logout and clear state
   */
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  /**
   * Refresh profile from Firestore (call after updating profile)
   */
  const refreshProfile = () => user && fetchProfile(user);

  const value = {
    user,
    profile,
    loading,
    login,
    register,
    logout,
    refreshProfile,
    isAdmin: profile?.role === "admin",
    isEditor: ["admin", "editor"].includes(profile?.role),
    isReviewer: ["admin", "editor", "reviewer"].includes(profile?.role),
    role: profile?.role || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
