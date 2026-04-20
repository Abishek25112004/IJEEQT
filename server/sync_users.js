require("dotenv").config();
const { auth } = require("./config/firebase");
const prisma = require("./config/db");

async function syncUsers() {
  try {
    console.log("Fetching Firebase users...");
    const listUsersResult = await auth.listUsers(1000);
    const firebaseUsers = listUsersResult.users;
    
    console.log(`Found ${firebaseUsers.length} Firebase users. Checking PostgreSQL...`);
    
    for (const fbUser of firebaseUsers) {
      const dbUser = await prisma.user.findUnique({
        where: { uid: fbUser.uid }
      });
      
      if (!dbUser) {
        console.log(`User ${fbUser.email} not in DB. Creating...`);
        await prisma.user.create({
          data: {
            uid: fbUser.uid,
            name: fbUser.displayName || fbUser.email.split("@")[0],
            email: fbUser.email,
            roles: ["author"],
            bio: "",
          }
        });
        console.log(`✅ Created DB user for ${fbUser.email}`);
      } else {
        console.log(`✓ User ${fbUser.email} already in DB.`);
      }
    }
    
    console.log("Sync complete!");
  } catch (err) {
    console.error("Error syncing users:", err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

syncUsers();
