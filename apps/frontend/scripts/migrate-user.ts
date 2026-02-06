/**
 * One-time user migration script
 * Migrates all entries from credentials user to Google-authenticated user
 *
 * Usage:
 * 1. Set MONGODB_URL in your environment
 * 2. npx ts-node scripts/migrate-user.ts
 */

import { MongoClient, ObjectId } from "mongodb";

// IDs provided by user
const OLD_USER_ID = "6969b814b7c689d76bdb8c65"; // Credentials user
const NEW_USER_ID = "698613581102606100ae70c8"; // Google user
 
async function migrateUserData() {
  const uri = process.env.MONGODB_URL;
  if (!uri) {
    throw new Error("MONGODB_URL not set");
  }

  const client = await MongoClient.connect(uri);
  const db = client.db();

  try {
    const oldId = new ObjectId(OLD_USER_ID);
    const newId = new ObjectId(NEW_USER_ID);

    // Verify both users exist
    const oldUser = await db.collection("users").findOne({ _id: oldId });
    const newUser = await db.collection("users").findOne({ _id: newId });

    if (!oldUser) {
      throw new Error(`Old user ${OLD_USER_ID} not found`);
    }
    if (!newUser) {
      throw new Error(`New user ${NEW_USER_ID} not found`);
    }

    console.log("Found users:");
    console.log("  Old (credentials):", oldUser.username || oldUser.name, oldUser.email || "(no email)");
    console.log("  New (Google):", newUser.name, newUser.email);

    // Count entries before migration
    const oldEntriesCount = await db.collection("entries").countDocuments({ userId: oldId });
    const newEntriesCount = await db.collection("entries").countDocuments({ userId: newId });

    console.log(`\nEntries found:`);
    console.log(`  Linked to old user: ${oldEntriesCount}`);
    console.log(`  Linked to new user: ${newEntriesCount}`);

    if (oldEntriesCount === 0) {
      console.log("\nNo entries to migrate. Old user has no entries.");
      return;
    }

    // Migrate entries
    const result = await db.collection("entries").updateMany(
      { userId: oldId },
      { $set: { userId: newId } }
    );

    console.log(`\nMigrated ${result.modifiedCount} entries to new user`);

    // Optionally: Delete the old user
    // Uncomment after verifying migration worked:
    // await db.collection("users").deleteOne({ _id: oldId });
    // console.log("Deleted old user");

    // Optionally: Delete any accounts linked to old user
    // await db.collection("accounts").deleteMany({ userId: oldId });
    // console.log("Deleted old user's accounts");

    console.log("\nMigration complete!");
    console.log("Verify your entries are visible with the Google account, then:");
    console.log("1. Uncomment the delete lines to clean up old user data");
    console.log("2. Re-run this script");

  } finally {
    await client.close();
  }
}

migrateUserData().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
