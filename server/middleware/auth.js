// middleware/auth.js
// Verifies Firebase ID tokens and supports multi-role (roles[]) access control
// Migrated to use PostgreSQL via Prisma

const { auth } = require("../config/firebase");
const prisma = require("../config/db");

/**
 * Middleware: Verify Firebase Auth token
 * Attaches decoded user + PostgreSQL roles to req.user
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;

    // Fetch the user's roles from PostgreSQL
    const userDoc = await prisma.user.findUnique({
      where: { uid: decodedToken.uid }
    });

    if (userDoc) {
      req.user.name = userDoc.name;
      req.user.email = userDoc.email;

      if (Array.isArray(userDoc.roles) && userDoc.roles.length > 0) {
        req.user.roles = userDoc.roles;
        req.user.role = userDoc.roles[0]; // primary role for compat
      } else {
        req.user.role = "author";
        req.user.roles = ["author"];
      }
    } else {
      req.user.role = "author";
      req.user.roles = ["author"];
    }

    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * Middleware factory: Restrict to specific roles
 * Checks if the user has ANY of the required roles.
 * Usage: requireRole("admin") or requireRole(["admin", "editor", "manager"])
 */
const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check against roles array
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.role || "author"];
    const hasAccess = userRoles.some((r) => allowedRoles.includes(r));

    if (!hasAccess) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
      });
    }

    next();
  };
};

module.exports = { verifyToken, requireRole };
