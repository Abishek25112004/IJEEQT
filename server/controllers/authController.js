// controllers/authController.js
// Handles user registration and login via Firebase Auth + PostgreSQL (Prisma)

const { auth } = require("../config/firebase");
const { validationResult } = require("express-validator");
const prisma = require("../config/db");

/**
 * POST /api/auth/register
 * Creates Firebase Auth user and stores profile in PostgreSQL.
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

    // Store profile in PostgreSQL via Prisma
    await prisma.user.create({
      data: {
        uid: userRecord.uid,
        name,
        email,
        roles: ["author"], // array-based roles (default: author)
        bio: "",
      }
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
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error during registration" });
  }
};

/**
 * GET /api/auth/profile
 * Returns the logged-in user's PostgreSQL profile
 */
const getProfile = async (req, res) => {
  try {
    const userProfile = await prisma.user.findUnique({
      where: { uid: req.user.uid }
    });

    if (!userProfile) {
      return res.status(404).json({ error: "User profile not found" });
    }

    res.json(userProfile);
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * PUT /api/auth/profile
 * Updates the logged-in user's profile
 */
const updateProfile = async (req, res) => {
  const { name, bio } = req.body;

  const updates = {};
  if (name) updates.name = name;
  if (bio !== undefined) updates.bio = bio;

  try {
    await prisma.user.update({
      where: { uid: req.user.uid },
      data: updates
    });

    if (name) {
      await auth.updateUser(req.user.uid, { displayName: name });
    }

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Internal server error updating profile" });
  }
};

module.exports = { register, getProfile, updateProfile };
