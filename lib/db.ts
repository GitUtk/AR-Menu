import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

export interface Order {
  id: number;
  dish_id: string;
  dish_name: string;
  price: string;
  quantity: number;
  table_number: string;
  notes?: string;
  status: "pending" | "preparing" | "served" | "cancelled";
  created_at: string;
}

// On Vercel serverless functions, root directory is read-only. Only /tmp is writable.
const isVercel = !!process.env.VERCEL;

function getDatabase(): InstanceType<typeof Database> {
  const targetDir = isVercel ? "/tmp" : path.join(process.cwd(), "data");

  if (!isVercel && !fs.existsSync(targetDir)) {
    try {
      fs.mkdirSync(targetDir, { recursive: true });
    } catch {
      // Fallback
    }
  }

  const dbPath = path.join(targetDir, "orders.db");

  try {
    return new Database(dbPath);
  } catch (err) {
    // Fallback to /tmp if primary path is read-only
    const fallbackPath = path.join("/tmp", "orders.db");
    return new Database(fallbackPath);
  }
}

const db = getDatabase();

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dish_id TEXT NOT NULL,
    dish_name TEXT NOT NULL,
    price TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    table_number TEXT NOT NULL,
    notes TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;
