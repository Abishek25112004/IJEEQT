// controllers/authController.js
// Handles user registration and login via Firebase Auth + Firestore

const { auth, db } = require("../config/firebase");
const { validationResult } = require("express-validator");

/**
 * POST /api/auth/register
 * Creates Firebase Auth user and stores profile in Firestore.
 * Institution field is intentionally omitted.
 * Roles stored as an array for multi-role support.
 */
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    // Create Firebase Auth account
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // Store profile in Firestore — no institution field
    await db.collection("users").doc(userRecord.uid).set({
      name,
      email,
      roles: ["author"], // array-based roles (default: author)
      bio: "",
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      message: "User registered successfully",
      uid: userRecord.uid,
      roles: ["author"],
    });
  } catch (error) {
    if (error.code === "auth/email-already-exists") {
      return res.status(409).json({ error: "Email already registered" });
    }
    throw error;
  }
};

/**
 * GET /api/auth/profile
 * Returns the logged-in user's Firestore profile
 */
const getProfile = async (req, res) => {
  const userDoc = await db.collection("users").doc(req.user.uid).get();

  if (!userDoc.exists) {
    return res.status(404).json({ error: "User profile not found" });
  }

  res.json({ uid: req.user.uid, ...userDoc.data() });
};

/**
 * PUT /api/auth/profile
 * Updates the logged-in user's profile (no institution field)
 */
const updateProfile = async (req, res) => {
  const { name, bio } = req.body;

  const updates = {};
  if (name) updates.name = name;
  if (bio !== undefined) updates.bio = bio;
  updates.updatedAt = new Date().toISOString();

  await db.collection("users").doc(req.user.uid).update(updates);

  if (name) {
    await auth.updateUser(req.user.uid, { displayName: name });
  }

  res.json({ message: "Profile updated successfully" });
};

module.exports = { register, getProfile, updateProfile };
