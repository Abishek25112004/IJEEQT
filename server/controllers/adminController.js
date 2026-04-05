// controllers/adminController.js
// Admin-only operations: user management, statistics

const { db, auth } = require("../config/firebase");

/**
 * GET /api/admin/users
 * Get all users with their roles
 */
const getAllUsers = async (req, res) => {
  const snapshot = await db.collection("users").orderBy("createdAt", "desc").get();
  const users = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
  res.json({ users, total: users.length });
};

/**
 * PATCH /api/admin/users/:uid/role
 * Change a user's role
 */
const updateUserRole = async (req, res) => {
  const { uid } = req.params;
  const { role } = req.body;

  const validRoles = ["admin", "editor", "reviewer", "author"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `Role must be: ${validRoles.join(", ")}` });
  }

  // Prevent changing own role
  if (uid === req.user.uid) {
    return res.status(400).json({ error: "Cannot change your own role" });
  }

  await db.collection("users").doc(uid).update({
    role,
    roleUpdatedAt: new Date().toISOString(),
    roleUpdatedBy: req.user.uid,
  });

  res.json({ message: `User role updated to: ${role}` });
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

  // Delete from Firebase Auth and Firestore
  await auth.deleteUser(uid);
  await db.collection("users").doc(uid).delete();

  res.json({ message: "User deleted successfully" });
};

/**
 * GET /api/admin/stats
 * Dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  // Run all queries in parallel for performance
  const [papersSnap, usersSnap, reviewsSnap] = await Promise.all([
    db.collection("papers").get(),
    db.collection("users").get(),
    db.collection("reviews").get(),
  ]);

  const papers = papersSnap.docs.map((d) => d.data());

  // Count papers by status
  const statusCounts = papers.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  // Count users by role
  const users = usersSnap.docs.map((d) => d.data());
  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  res.json({
    papers: {
      total: papers.length,
      byStatus: statusCounts,
    },
    users: {
      total: users.length,
      byRole: roleCounts,
    },
    reviews: {
      total: reviewsSnap.size,
    },
  });
};

/**
 * GET /api/admin/reviewers
 * Get all users with reviewer role (for assignment dropdown)
 */
const getReviewers = async (req, res) => {
  const snapshot = await db.collection("users")
    .where("role", "in", ["reviewer", "editor", "admin"])
    .get();

  const reviewers = snapshot.docs.map((doc) => ({
    uid: doc.id,
    name: doc.data().name,
    email: doc.data().email,
    institution: doc.data().institution,
    role: doc.data().role,
  }));

  res.json({ reviewers });
};

module.exports = { getAllUsers, updateUserRole, deleteUser, getDashboardStats, getReviewers };
