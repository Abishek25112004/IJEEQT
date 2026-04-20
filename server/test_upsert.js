const prisma = require('./config/db');

async function test() {
  try {
    const result = await prisma.siteContent.upsert({
      where: { key: 'test_key' },
      update: { value: { test: true } },
      create: { key: 'test_key', value: { test: true } }
    });
    console.log("Upsert success:", result);
  } catch (err) {
    console.error("Upsert failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
