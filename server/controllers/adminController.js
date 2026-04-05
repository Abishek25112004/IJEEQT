// controllers/adminController.js
// Admin-only operations: user management, statistics
// Supports multi-role system (roles[] array) with backward compatibility

const { db, auth } = require("../config/firebase");

const ALL_VALID_ROLES = ["admin", "editor", "manager", "reviewer", "author"];

/**
 * GET /api/admin/users
 * Get all users with their roles
 */
const getAllUsers = async (req, res) => {
  const snapshot = await db.collection("users").orderBy("createdAt", "desc").get();
  const users = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      ...data,
      // Normalize: if old single-role format, convert for display
      roles: Array.isArray(data.roles)
        ? data.roles
        : [data.role || "author"],
    };
  });
  res.json({ users, total: users.length });
};

/**
 * PATCH /api/admin/users/:uid/role
 * Assign multiple roles to a user.
 * Body: { roles: ["author", "reviewer"] }
 * Also stores rich roleUpdatedBy object with admin's name, email, and role.
 */
const updateUserRole = async (req, res) => {
  const { uid } = req.params;
  const { roles } = req.body;

  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    return res.status(400).json({ error: "roles must be a non-empty array" });
  }

  const invalidRoles = roles.filter((r) => !ALL_VALID_ROLES.includes(r));
  if (invalidRoles.length > 0) {
    return res.status(400).json({
      error: `Invalid role(s): ${invalidRoles.join(", ")}. Valid roles: ${ALL_VALID_ROLES.join(", ")}`,
    });
  }

  // Prevent changing own role
  if (uid === req.user.uid) {
    return res.status(400).json({ error: "Cannot change your own role" });
  }

  // Fetch admin's own profile for rich roleUpdatedBy
  const adminDoc = await db.collection("users").doc(req.user.uid).get();
  const adminData = adminDoc.exists ? adminDoc.data() : {};

  const roleUpdatedBy = {
    uid: req.user.uid,
    name: adminData.name || req.user.name || "Unknown Admin",
    email: adminData.email || req.user.email || "",
    roles: Array.isArray(adminData.roles)
      ? adminData.roles
      : [adminData.role || "admin"],
  };

  await db.collection("users").doc(uid).update({
    roles,
    // Keep legacy role field as primary role for backward compat
    role: roles[0],
    roleUpdatedAt: new Date().toISOString(),
    roleUpdatedBy,
  });

  res.json({ message: `User roles updated to: ${roles.join(", ")}` });
};

/**
 * DELETE /api/admin/users/:uid
 * Delete a user account
 */
const deleteUser = async (req, res) => {
  const { uid } = req.params;

  if (uid === req.user.uid) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }

  await auth.deleteUser(uid);
  await db.collection("users").doc(uid).delete();

  res.json({ message: "User deleted successfully" });
};

/**
 * GET /api/admin/stats
 * Dashboard statistics — handles both old role and new roles[] format
 */
const getDashboardStats = async (req, res) => {
  const [papersSnap, usersSnap, reviewsSnap] = await Promise.all([
    db.collection("papers").get(),
    db.collection("users").get(),
    db.collection("reviews").get(),
  ]);

  const papers = papersSnap.docs.map((d) => d.data());
  const statusCounts = papers.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const users = usersSnap.docs.map((d) => d.data());
  const roleCounts = users.reduce((acc, u) => {
    // Handle both roles[] array and legacy role string
    const userRoles = Array.isArray(u.roles) ? u.roles : [u.role || "author"];
    userRoles.forEach((role) => {
      acc[role] = (acc[role] || 0) + 1;
    });
    return acc;
  }, {});

  res.json({
    papers: { total: papers.length, byStatus: statusCounts },
    users: { total: users.length, byRole: roleCounts },
    reviews: { total: reviewsSnap.size },
  });
};

/**
 * GET /api/admin/reviewers
 * Get all users with reviewer/editor/admin/manager role (for assignment dropdown)
 * Handles both old role and new roles[] array format
 */
const getReviewers = async (req, res) => {
  // Fetch all users and filter in code to support both role formats
  const snapshot = await db.collection("users").get();

  const reviewerRoles = ["reviewer", "editor", "admin", "manager"];

  const reviewers = snapshot.docs
    .map((doc) => {
      const data = doc.data();
      const userRoles = Array.isArray(data.roles)
        ? data.roles
        : [data.role || "author"];
      return {
        uid: doc.id,
        name: data.name,
        email: data.email,
        roles: userRoles,
        // Legacy compatibility
        role: userRoles[0],
      };
    })
    .filter((u) => u.roles.some((r) => reviewerRoles.includes(r)));

  res.json({ reviewers });
};

module.exports = { getAllUsers, updateUserRole, deleteUser, getDashboardStats, getReviewers };
