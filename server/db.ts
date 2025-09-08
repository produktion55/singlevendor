import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";

const databasePath = process.env.DATABASE_URL || "./database.db";
const sqlite = new Database(databasePath);

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Enable WAL mode for better concurrent access
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });