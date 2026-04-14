// controllers/adminController.js
// Admin-only operations: user management, statistics
// Supports multi-role system (roles[] array) with backward compatibility

const { auth } = require("../config/firebase");
const prisma = require("../config/db");

const ALL_VALID_ROLES = ["admin", "editor", "manager", "reviewer", "author"];

/**
 * GET /api/admin/users
 * Get all users with their roles
 */
const getAllUsers = async (req, res) => {
  try {
    const allUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" }
    });

    const users = allUsers.map((data) => ({
      ...data,
      // Normalize: keep legacy role field as primary role for backward compat
      role: data.roles?.[0] || "author"
    }));

    res.json({ users, total: users.length });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * PATCH /api/admin/users/:uid/role
 * Assign multiple roles to a user.
 * Body: { roles: ["author", "reviewer"] }
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

  try {
    await prisma.user.update({
      where: { uid },
      data: {
        roles: roles
      }
    });

    res.json({ message: `User roles updated to: ${roles.join(", ")}` });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Internal server error" });
  }
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

  try {
    await auth.deleteUser(uid);
    await prisma.user.delete({
      where: { uid }
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/admin/stats
 * Dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const [papers, users, reviewsCount] = await Promise.all([
      prisma.paper.findMany({ select: { status: true } }),
      prisma.user.findMany({ select: { roles: true } }),
      prisma.review.count(),
    ]);

    const statusCounts = papers.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    const roleCounts = users.reduce((acc, u) => {
      const userRoles = u.roles && u.roles.length > 0 ? u.roles : ["author"];
      userRoles.forEach((role) => {
        acc[role] = (acc[role] || 0) + 1;
      });
      return acc;
    }, {});

    res.json({
      papers: { total: papers.length, byStatus: statusCounts },
      users: { total: users.length, byRole: roleCounts },
      reviews: { total: reviewsCount },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/admin/reviewers
 * Get all users with reviewer/editor/admin/manager role
 */
const getReviewers = async (req, res) => {
  try {
    const reviewerRoles = ["reviewer", "editor", "admin", "manager"];

    // Prisma doesn't have an easy native "ARRAY && ARRAY" overlap for string[], 
    // but in newer Prisma we can use hasSome.
    const allUsers = await prisma.user.findMany({
      where: {
        roles: {
          hasSome: reviewerRoles
        }
      }
    });

    const reviewers = allUsers.map((data) => ({
      uid: data.uid,
      name: data.name,
      email: data.email,
      roles: data.roles,
      role: data.roles[0] || "author"
    }));

    res.json({ reviewers });
  } catch (error) {
    console.error("Error fetching reviewers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getAllUsers, updateUserRole, deleteUser, getDashboardStats, getReviewers };
