require("dotenv").config();
const prisma = require("./config/db");
async function check() {
  const papers = await prisma.paper.findMany({ select: { id: true, title: true, fileName: true, fileUrl: true } });
  console.log("Papers in DB:", papers);
}
check();
