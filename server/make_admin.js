require('dotenv').config();
const prisma = require("./config/db");

async function makeAdmin() {
  const email = "abishek25112004@gmail.com";
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`User with email ${email} not found.`);
      process.exit(1);
    }
    
    let roles = user.roles || [];
    if (!roles.includes("admin")) {
      roles.push("admin");
    }
    
    await prisma.user.update({
      where: { email },
      data: { roles }
    });
    console.log(`Successfully made ${email} an admin!`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

makeAdmin();
