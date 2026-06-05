require('dotenv').config();
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const { PrismaClient } = require('@prisma/client');

let poolConfig = undefined;
if (process.env.DATABASE_URL) {
  const urlString = process.env.DATABASE_URL.trim();
  const parsed = new URL(urlString);
  poolConfig = {
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.substring(1),
    ssl: parsed.searchParams.get('sslaccept') === 'strict' ? { rejectUnauthorized: false } : undefined,
    connectionLimit: 5
  };
}

const adapter = new PrismaMariaDb(poolConfig);
const prisma = new PrismaClient({ adapter });

async function testAdminQueries() {
  try {
    console.log("Testing getUsers...");
    await prisma.user.findMany();
    console.log("Success getUsers");
    
    console.log("Testing getPapers...");
    await prisma.paper.findMany();
    console.log("Success getPapers");

    console.log("Testing getReviewerProfiles...");
    await prisma.reviewerProfile.findMany();
    console.log("Success getReviewerProfiles");

    console.log("Testing getReviewAssignments...");
    await prisma.paper.findMany({ where: { status: 'under_review' } }); // Approx
    console.log("Success getReviewAssignments");

    console.log("Testing getReviews...");
    await prisma.review.findMany();
    console.log("Success getReviews");

  } catch (error) {
    console.error("Query failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminQueries();
