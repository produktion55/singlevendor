import { db } from "../server/db";
import { users, inviteCodes, products } from "../shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Create an invite code
  const [inviteCode] = await db.insert(inviteCodes).values({
    code: "WELCOME2025",
    isActive: true,
  }).returning();
  console.log("Created invite code:", inviteCode.code);

  // Create admin user
  const [adminUser] = await db.insert(users).values({
    username: "admin",
    password: "admin123", // In production, this should be hashed
    email: "admin@example.com",
    publicName: "Administrator",
    balance: 1000.00,
    role: "admin",
    inviteCode: inviteCode.code,
  }).returning();
  console.log("Created admin user:", adminUser.username);

  // Create regular user  
  const [regularUser] = await db.insert(users).values({
    username: "testuser",
    password: "user123", // In production, this should be hashed
    email: "user@example.com",
    publicName: "Test User",
    balance: 100.00,
    role: "user",
    inviteCode: inviteCode.code,
  }).returning();
  console.log("Created test user:", regularUser.username);

  // Create some sample products
  const sampleProducts = [
    {
      title: "Premium License Key",
      description: "Access to premium features for 1 year",
      price: 49.99,
      category: "shop",
      subcategory: "software",
      type: "license_key",
      stock: 100,
      isActive: true,
    },
    {
      title: "Digital Art Pack",
      description: "Collection of high-quality digital art assets",
      price: 29.99,
      category: "shop",
      subcategory: "digital_content",
      type: "digital_file",
      stock: 50,
      isActive: true,
    },
    {
      title: "Invoice Generator",
      description: "Generate professional invoices",
      price: 9.99,
      category: "generator",
      type: "service",
      isActive: true,
    },
  ];

  for (const product of sampleProducts) {
    const [createdProduct] = await db.insert(products).values(product).returning();
    console.log("Created product:", createdProduct.title);
  }

  console.log("\nDatabase seeded successfully!");
  console.log("\nYou can now login with:");
  console.log("Admin: username=admin, password=admin123");
  console.log("User: username=testuser, password=user123");
  console.log("Invite code for new registrations: WELCOME2025");
  
  process.exit(0);
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});