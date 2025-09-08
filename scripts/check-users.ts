import { db } from "../server/db";
import { users } from "../shared/schema";

async function checkUsers() {
  const allUsers = await db.select().from(users);
  console.log("All users in database:");
  console.log(JSON.stringify(allUsers, null, 2));
  process.exit(0);
}

checkUsers().catch(console.error);