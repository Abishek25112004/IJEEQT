// config/firebase.js
// Firebase Admin SDK initialization
// This gives the server elevated privileges to manage Firestore, Auth, and Storage

const admin = require("firebase-admin");

const initializeFirebase = () => {
  // Avoid re-initializing if already done (important in dev with hot reload)
  if (admin.apps.length > 0) return admin;

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  console.log("✅ Firebase Admin initialized");
  return admin;
};

const firebase = initializeFirebase();

// Export commonly-used services
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
const bucket = storage.bucket();

module.exports = { firebase, db, auth, storage, bucket };
