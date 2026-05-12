require('dotenv').config();
const prisma = require('../config/db');

async function main() {
  try {
    console.log('DB URL prefix:', (process.env.DATABASE_URL || '').substring(0, 30) + '...');
    console.log('Testing siteContent.findUnique...');
    const content = await prisma.siteContent.findUnique({
      where: { key: 'indexing_abstracting' }
    });
    console.log('SUCCESS:', JSON.stringify(content));
  } catch (e) {
    console.error('FULL ERROR:', e.message);
    console.error('ERROR CODE:', e.code);
    console.error('ERROR META:', JSON.stringify(e.meta));
  } finally {
    await prisma.$disconnect();
  }
}

main();
