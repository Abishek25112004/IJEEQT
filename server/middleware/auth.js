// middleware/auth.js
// Verifies Firebase ID tokens sent from the client
// Also supports role-based access control

const { auth, db } = require("../config/firebase");

/**
 * Middleware: Verify Firebase Auth token
 * Attaches decoded user to req.user
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;

    // Fetch the user's role from Firestore
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    if (userDoc.exists) {
      req.user.role = userDoc.data().role || "author";
      req.user.name = userDoc.data().name;
    } else {
      req.user.role = "author";
    }

    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * Middleware factory: Restrict to specific roles
 * Usage: requireRole("admin") or requireRole(["admin", "editor"])
 */
const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
      });
    }

    next();
  };
};

module.exports = { verifyToken, requireRole };
