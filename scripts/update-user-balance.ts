import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function updateUserBalance(username: string, newBalance: number) {
  try {
    console.log(`Updating balance for user: ${username}`);
    
    // Update user balance
    const result = await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.username, username))
      .returning();
    
    if (result.length === 0) {
      console.error(`User '${username}' not found!`);
      return;
    }
    
    const updatedUser = result[0];
    console.log(`✓ Successfully updated balance for '${updatedUser.username}'`);
    console.log(`  New balance: $${updatedUser.balance}`);
    
  } catch (error) {
    console.error("Error updating user balance:", error);
  } finally {
    process.exit(0);
  }
}

// Get username and balance from command line arguments
const username = process.argv[2] || 'sdfsdfsf';
const balance = parseFloat(process.argv[3] || '5000');

if (!username) {
  console.error("Usage: tsx scripts/update-user-balance.ts <username> <balance>");
  process.exit(1);
}

updateUserBalance(username, balance);