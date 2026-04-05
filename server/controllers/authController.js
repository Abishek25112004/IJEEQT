// controllers/authController.js
// Handles user registration and login via Firebase Auth + Firestore

const { auth, db } = require("../config/firebase");
const { validationResult } = require("express-validator");

/**
 * POST /api/auth/register
 * Creates Firebase Auth user and stores profile in Firestore
 */
const register = async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { name, email, password, role = "author" } = req.body;

  // Only allow certain roles during self-registration
  const allowedRoles = ["author", "reviewer"];
  const assignedRole = allowedRoles.includes(role) ? role : "author";

  try {
    // Create Firebase Auth account
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // Store extended profile in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      name,
      email,
      role: assignedRole,
      createdAt: new Date().toISOString(),
      institution: req.body.institution || "",
      bio: "",
    });

    res.status(201).json({
      message: "User registered successfully",
      uid: userRecord.uid,
      role: assignedRole,
    });
  } catch (error) {
    // Firebase Auth error codes
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
 * Updates the logged-in user's profile
 */
const updateProfile = async (req, res) => {
  const { name, institution, bio } = req.body;

  const updates = {};
  if (name) updates.name = name;
  if (institution !== undefined) updates.institution = institution;
  if (bio !== undefined) updates.bio = bio;
  updates.updatedAt = new Date().toISOString();

  await db.collection("users").doc(req.user.uid).update(updates);

  // Also update Firebase Auth display name if changed
  if (name) {
    await auth.updateUser(req.user.uid, { displayName: name });
  }

  res.json({ message: "Profile updated successfully" });
};

module.exports = { register, getProfile, updateProfile };
