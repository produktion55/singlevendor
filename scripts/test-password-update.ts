import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function testPasswordUpdate() {
  try {
    // First, let's check if we can update a user's password directly
    const username = "testuser";
    const newPassword = "newpassword123";
    
    console.log(`Testing password update for user: ${username}`);
    
    // Update the password
    const result = await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.username, username))
      .returning();
    
    if (result.length === 0) {
      console.error(`User '${username}' not found!`);
      return;
    }
    
    const updatedUser = result[0];
    console.log(`✓ Password update successful for '${updatedUser.username}'`);
    console.log(`  Password field was updated in database`);
    
    // Verify the password was actually changed
    const verifyUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    
    if (verifyUser[0].password === newPassword) {
      console.log(`✓ Password verification successful`);
      console.log(`  New password: ${newPassword}`);
    } else {
      console.error(`✗ Password verification failed`);
    }
    
  } catch (error) {
    console.error("Error during password update test:", error);
  } finally {
    process.exit(0);
  }
}

testPasswordUpdate();