require('dotenv').config();
const prisma = require('./config/db');

async function main() {
  const paper = await prisma.paper.findFirst({ where: { status: 'published' } });
  console.log(paper.fileUrl);
  console.log(paper.fileName);
}

main()
  .catch(e => console.error(e))
  .finally(() => process.exit(0));
