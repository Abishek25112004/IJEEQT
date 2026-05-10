/**
 * Production Reset Script
 * Clears all test data from PostgreSQL, Cloudinary, and Firebase
 * while preserving admin user(s).
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const prisma = require("../config/db");
const cloudinary = require("../config/cloudinary");
const admin = require("firebase-admin");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

async function resetAll() {
  console.log("=== PRODUCTION RESET ===\n");

  // ──────────────────────────────────────────────
  // Step 1: Find admin users (to preserve them)
  // ──────────────────────────────────────────────
  const adminUsers = await prisma.user.findMany({
    where: { roles: { has: "admin" } },
  });
  const adminUids = adminUsers.map((u) => u.uid);
  console.log(`Found ${adminUsers.length} admin user(s) to preserve:`);
  adminUsers.forEach((u) => console.log(`  - ${u.name} (${u.email}) [${u.uid}]`));

  // ──────────────────────────────────────────────
  // Step 2: Clear PostgreSQL tables (order matters for FK)
  // ──────────────────────────────────────────────
  console.log("\n--- Clearing PostgreSQL ---");

  const delPayments = await prisma.payment.deleteMany({});
  console.log(`  Deleted ${delPayments.count} payments`);

  const delReviews = await prisma.review.deleteMany({});
  console.log(`  Deleted ${delReviews.count} reviews`);

  const delAssignments = await prisma.reviewAssignment.deleteMany({});
  console.log(`  Deleted ${delAssignments.count} review assignments`);

  const delPapers = await prisma.paper.deleteMany({});
  console.log(`  Deleted ${delPapers.count} papers`);

  const delProfiles = await prisma.reviewerProfile.deleteMany({
    where: { uid: { notIn: adminUids } },
  });
  console.log(`  Deleted ${delProfiles.count} reviewer profiles (non-admin)`);

  const delUsers = await prisma.user.deleteMany({
    where: { uid: { notIn: adminUids } },
  });
  console.log(`  Deleted ${delUsers.count} non-admin users`);

  // Keep SiteContent as-is (editorial board, call for papers, etc.)
  console.log("  SiteContent preserved (editorial board, etc.)");

  // ──────────────────────────────────────────────
  // Step 3: Clear Cloudinary (papers folder)
  // ──────────────────────────────────────────────
  console.log("\n--- Clearing Cloudinary ---");
  try {
    const result = await cloudinary.api.delete_resources_by_prefix("papers/", {
      resource_type: "raw",
    });
    const deletedCount = Object.keys(result.deleted || {}).length;
    console.log(`  Deleted ${deletedCount} files from Cloudinary`);
  } catch (e) {
    if (e.http_code === 404) {
      console.log("  No files found in Cloudinary papers/ folder");
    } else {
      console.error("  Cloudinary error:", e.message);
    }
  }

  // ──────────────────────────────────────────────
  // Step 4: Clear Firebase Auth (non-admin users)
  // ──────────────────────────────────────────────
  console.log("\n--- Clearing Firebase Auth ---");
  let deletedFirebase = 0;
  let nextPageToken;
  do {
    const listResult = await admin.auth().listUsers(1000, nextPageToken);
    const nonAdminUids = listResult.users
      .filter((u) => !adminUids.includes(u.uid))
      .map((u) => u.uid);

    if (nonAdminUids.length > 0) {
      await admin.auth().deleteUsers(nonAdminUids);
      deletedFirebase += nonAdminUids.length;
    }
    nextPageToken = listResult.pageToken;
  } while (nextPageToken);
  console.log(`  Deleted ${deletedFirebase} non-admin Firebase users`);

  // ──────────────────────────────────────────────
  // Done
  // ──────────────────────────────────────────────
  console.log("\n=== RESET COMPLETE ===");
  console.log("Admin user(s) preserved. All test data cleared.");
  console.log("The application is ready for ISSN submission.\n");

  await prisma.$disconnect();
  process.exit(0);
}

resetAll().catch((err) => {
  console.error("RESET FAILED:", err);
  process.exit(1);
});
