require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const postgres = require("postgres");
const { PrismaClient } = require("@prisma/client");

// PostgreSQL URL (source) - using internal hostname for execution on Render Shell
const pgUrl = process.env.OLD_DATABASE_URL || "postgresql://abishek:xZo0kmtfQpXyB6c3dG0WkHbqmG5alkW8@dpg-d7o6442qqhas738alru0-a.singapore-postgres.render.com/ijeeqt";
// TiDB URL (target)
const tidbUrl = "mysql://agroob2kzHCZAgH.root:HG27rsobQQkU4Nit@gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com:4000/ijeeqt?sslaccept=strict";

async function runMigration() {
  console.log("🚀 Starting Database Migration from Render PostgreSQL to TiDB...");

  const mariadb = require('mariadb');
  const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
  
  process.env.DATABASE_URL = tidbUrl;
  const pool = mariadb.createPool(tidbUrl.replace(/^mysql:/, 'mariadb:'));
  const adapter = new PrismaMariaDb(pool);
  const prisma = new PrismaClient({ adapter });

  const sql = postgres(pgUrl, {
    ssl: "require",
    max: 1,
    connect_timeout: 10,
    idle_timeout: 10,
    debug: (connection, query, parameters) => {
      console.log('DEBUG:', query || 'connection status check', parameters);
    }
  });

  try {
    const maxRetries = 10;
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`Connecting to PostgreSQL using porsager/postgres... (Attempt ${i + 1}/${maxRetries})`);
        await sql`SELECT 1`;
        console.log("✅ Connected to source PostgreSQL database.");
        break;
      } catch (err) {
        console.warn(`⚠️ PostgreSQL connection attempt failed: ${err.message}`);
        if (i === maxRetries - 1) throw err;
        console.log("Waiting 5 seconds before retrying...");
        await new Promise(res => setTimeout(res, 5000));
      }
    }

    // Helper function to read all rows from a PostgreSQL table
    const fetchTableData = async (tableName) => {
      console.log(`Reading table "${tableName}" from PostgreSQL...`);
      return await sql`SELECT * FROM ${sql(tableName)}`;
    };

    // 1. Fetch all data
    const siteContents = await fetchTableData("SiteContent");
    const headerLayouts = await fetchTableData("HeaderLayout");
    const users = await fetchTableData("User");
    const reviewerProfiles = await fetchTableData("ReviewerProfile");
    const papers = await fetchTableData("Paper");
    const reviews = await fetchTableData("Review");
    const reviewAssignments = await fetchTableData("ReviewAssignment");
    const payments = await fetchTableData("Payment");

    console.log("\n📦 Data Summary from PostgreSQL:");
    console.log(`- SiteContent: ${siteContents.length} rows`);
    console.log(`- HeaderLayout: ${headerLayouts.length} rows`);
    console.log(`- User: ${users.length} rows`);
    console.log(`- ReviewerProfile: ${reviewerProfiles.length} rows`);
    console.log(`- Paper: ${papers.length} rows`);
    console.log(`- Review: ${reviews.length} rows`);
    console.log(`- ReviewAssignment: ${reviewAssignments.length} rows`);
    console.log(`- Payment: ${payments.length} rows\n`);

    // Connect to TiDB Prisma
    await prisma.$connect();
    console.log("✅ Connected to target TiDB (MySQL) database.");

    // Clean target tables in correct dependency order
    console.log("Cleaning target tables in TiDB...");
    await prisma.payment.deleteMany({});
    await prisma.reviewAssignment.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.paper.deleteMany({});
    await prisma.reviewerProfile.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.headerLayout.deleteMany({});
    await prisma.siteContent.deleteMany({});
    console.log("✅ Target tables cleaned.");

    // 2. Insert Users
    console.log("Migrating Users...");
    for (const u of users) {
      await prisma.user.create({
        data: {
          uid: u.uid,
          name: u.name,
          email: u.email,
          roles: Array.isArray(u.roles) ? u.roles : [],
          bio: u.bio,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        },
      });
    }
    console.log(`✅ Migrated ${users.length} Users.`);

    // 3. Insert Reviewer Profiles
    console.log("Migrating Reviewer Profiles...");
    for (const p of reviewerProfiles) {
      await prisma.reviewerProfile.create({
        data: {
          uid: p.uid,
          phone: p.phone,
          university: p.university,
          specialization: p.specialization,
          hasExperience: p.hasExperience,
          experienceDetails: p.experienceDetails,
          completedAt: p.completedAt,
        },
      });
    }
    console.log(`✅ Migrated ${reviewerProfiles.length} Reviewer Profiles.`);

    // 4. Insert Papers
    console.log("Migrating Papers...");
    for (const p of papers) {
      await prisma.paper.create({
        data: {
          id: p.id,
          title: p.title,
          abstract: p.abstract,
          keywords: Array.isArray(p.keywords) ? p.keywords : [],
          domain: p.domain,
          authorId: p.authorId,
          authorName: p.authorName,
          authorEmail: p.authorEmail,
          institution: p.institution,
          coAuthors: p.coAuthors || [],
          fileUrl: p.fileUrl,
          fileName: p.fileName,
          originalFileUrl: p.originalFileUrl,
          originalFileName: p.originalFileName,
          status: p.status,
          submittedAt: p.submittedAt,
          updatedAt: p.updatedAt,
          reviewers: Array.isArray(p.reviewers) ? p.reviewers : [],
          volume: p.volume,
          issue: p.issue,
          doi: p.doi,
          year: p.year,
          editorComments: p.editorComments,
        },
      });
    }
    console.log(`✅ Migrated ${papers.length} Papers.`);

    // 5. Insert Reviews
    console.log("Migrating Reviews...");
    for (const r of reviews) {
      await prisma.review.create({
        data: {
          id: r.id,
          paperId: r.paperId,
          reviewerId: r.reviewerId,
          positives: r.positives,
          negatives: r.negatives,
          corrections: r.corrections,
          suggestions: r.suggestions,
          decision: r.decision,
          confidenceLevel: r.confidenceLevel,
          overallComments: r.overallComments,
          comments: r.comments,
          createdAt: r.createdAt,
        },
      });
    }
    console.log(`✅ Migrated ${reviews.length} Reviews.`);

    // 6. Insert Review Assignments
    console.log("Migrating Review Assignments...");
    for (const a of reviewAssignments) {
      await prisma.reviewAssignment.create({
        data: {
          id: a.id,
          paperId: a.paperId,
          reviewerId: a.reviewerId,
          status: a.status,
          assignedAt: a.assignedAt,
          respondedAt: a.respondedAt,
        },
      });
    }
    console.log(`✅ Migrated ${reviewAssignments.length} Review Assignments.`);

    // 7. Insert Payments
    console.log("Migrating Payments...");
    for (const py of payments) {
      await prisma.payment.create({
        data: {
          id: py.id,
          paperId: py.paperId,
          amount: py.amount,
          status: py.status,
          razorpayOrderId: py.razorpayOrderId,
          razorpayPaymentId: py.razorpayPaymentId,
          createdAt: py.createdAt,
        },
      });
    }
    console.log(`✅ Migrated ${payments.length} Payments.`);

    // 8. Insert Site Content
    console.log("Migrating Site Content...");
    for (const sc of siteContents) {
      await prisma.siteContent.create({
        data: {
          key: sc.key,
          value: sc.value || {},
          updatedAt: sc.updatedAt,
        },
      });
    }
    console.log(`✅ Migrated ${siteContents.length} Site Content records.`);

    // 9. Insert Header Layouts
    console.log("Migrating Header Layouts...");
    for (const hl of headerLayouts) {
      await prisma.headerLayout.create({
        data: {
          id: hl.id,
          journalName: hl.journalName,
          layout: hl.layout || [],
          createdAt: hl.createdAt,
          updatedAt: hl.updatedAt,
        },
      });
    }
    console.log(`✅ Migrated ${headerLayouts.length} Header Layout records.`);

    console.log("\n🎉 Database migration finished successfully!");

  } catch (error) {
    console.error("❌ Migration failed with error:", error);
  } finally {
    if (sql) await sql.end();
    await prisma.$disconnect();
  }
}

runMigration();
