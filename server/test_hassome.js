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

async function testReviewersQuery() {
  try {
    const reviewerRoles = ["reviewer", "editor", "admin", "manager"];
    console.log("Testing hasSome...");
    const users = await prisma.user.findMany({
      where: {
        roles: {
          hasSome: reviewerRoles
        }
      }
    });
    console.log("Success!", users);
  } catch (error) {
    console.error("Failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testReviewersQuery();
