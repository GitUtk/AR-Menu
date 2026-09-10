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

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "orders.db");
const db = new Database(dbPath);

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
