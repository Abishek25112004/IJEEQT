// src/context/AuthContext.js
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
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (firebaseUser) => {
    try {
      const docRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Normalize roles — support both old role string and new roles array
        const roles = Array.isArray(data.roles) && data.roles.length > 0
          ? data.roles
          : [data.role || "author"];
        setProfile({ uid: firebaseUser.uid, ...data, roles });
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

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

  const register = async (name, email, password) => {
    await authAPI.register({ name, email, password });
    const result = await signInWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    await fetchProfile(result.user);
    return result.user;
  };

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await fetchProfile(result.user);
    return result.user;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = () => user && fetchProfile(user);

  // Helper: check if user has a specific role (works with roles array)
  const hasRole = (role) => {
    if (!profile) return false;
    return Array.isArray(profile.roles)
      ? profile.roles.includes(role)
      : profile.role === role;
  };

  const value = {
    user,
    profile,
    loading,
    login,
    register,
    logout,
    refreshProfile,
    hasRole,
    isAdmin: hasRole("admin"),
    isEditor: hasRole("admin") || hasRole("editor"),
    isManager: hasRole("manager"),
    isReviewer: hasRole("admin") || hasRole("editor") || hasRole("reviewer") || hasRole("manager"),
    // Primary role string for display
    role: Array.isArray(profile?.roles) ? profile.roles[0] : (profile?.role || null),
    roles: profile?.roles || [],
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