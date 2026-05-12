const prisma = require('../config/db');

async function main() {
  try {
    const content = await prisma.siteContent.findUnique({
      where: { key: 'editorial_board' }
    });
    console.log('QUERY_RESULT:' + JSON.stringify(content));
  } catch (e) {
    console.error('QUERY_ERROR:' + e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
