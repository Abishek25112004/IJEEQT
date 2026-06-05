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

async function testCreatePaper() {
  try {
    console.log("Creating paper...");
    const paper = await prisma.paper.create({
      data: {
        title: "Test Paper",
        abstract: "Test Abstract",
        keywords: ["Test"],
        author: { connect: { email: "abishek25112004@gmail.com" } },
        authorName: "Abishek",
        authorEmail: "abishek25112004@gmail.com",
        status: "submitted",
        reviewers: [],
        coAuthors: [{ name: "Test CoAuthor", email: "co@author.com", institution: "Test" }]
      }
    });
    console.log("Success!", paper.id);
  } catch (error) {
    console.error("Failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCreatePaper();
