import mongoose from "mongoose";

export interface Order {
  id: string;
  dish_id: string;
  dish_name: string;
  price: string;
  quantity: number;
  table_number: string;
  notes?: string;
  status: "pending" | "preparing" | "served" | "cancelled";
  payment_method: "upi" | "cash";
  payment_status: "paid" | "pending_cash" | "failed";
  lock_duration_mins: number;
  table_token?: string;
  created_at: string;
  unlocked_at?: string;
}

interface MongooseGlobal {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseGlobal | undefined;
}

if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null };
}

const cached = global.mongooseCache;

/**
 * Generate a 5-digit capital alphanumeric token (e.g. "A8K9P")
 */
export function generateTableToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 chars (no ambiguous 0,O,1,I)
  let token = "";
  for (let i = 0; i < 5; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Mongoose Schemas & Models
const OrderSchema = new mongoose.Schema(
  {
    dish_id: { type: String, required: true },
    dish_name: { type: String, required: true },
    price: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    table_number: { type: String, required: true },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "preparing", "served", "cancelled"],
      default: "pending",
    },
    payment_method: {
      type: String,
      enum: ["upi", "cash"],
      default: "cash",
    },
    payment_status: {
      type: String,
      enum: ["paid", "pending_cash", "failed"],
      default: "pending_cash",
    },
    lock_duration_mins: {
      type: Number,
      default: 30,
    },
    table_token: {
      type: String,
      default: "",
    },
    unlocked_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

const AdminConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
});

export const OrderModel =
  mongoose.models.Order || mongoose.model("Order", OrderSchema);

export const AdminConfigModel =
  mongoose.models.AdminConfig ||
  mongoose.model("AdminConfig", AdminConfigSchema);

export async function connectToDatabase() {
  const mongodbUri = process.env.MONGODB_URI;

  if (!mongodbUri) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local or Vercel environment variables."
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(mongodbUri, opts).then((m) => {
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  // Seed default admin password hash if missing
  try {
    const defaultHash =
      process.env.ADMIN_PASSWORD_HASH ||
      "804b33542c3172aa05608e9d079e2a31726ace6dd4c78a130707862d76fbd30c";

    const adminConfig = await AdminConfigModel.findOne({ key: "admin_password_hash" });
    if (!adminConfig) {
      await AdminConfigModel.create({
        key: "admin_password_hash",
        value: defaultHash,
      });
    }
  } catch (err) {
    console.error("Error seeding admin config:", err);
  }

  return cached.conn;
}

/**
 * Check if a table is locked for the specified lock duration due to an active order.
 * If the user inputs the valid 5-digit capital table_token, allow them to place additional orders.
 */
export async function checkTableLockStatus(
  tableNumber: string,
  userToken?: string
): Promise<{
  locked: boolean;
  remainingMinutes: number;
  remainingSeconds: number;
  lockDurationMins: number;
  tokenVerified: boolean;
  tableToken?: string;
  orderTime?: string;
  orderId?: string;
}> {
  if (!tableNumber) {
    return {
      locked: false,
      remainingMinutes: 0,
      remainingSeconds: 0,
      lockDurationMins: 30,
      tokenVerified: false,
    };
  }

  await connectToDatabase();

  const formattedTable = String(tableNumber).trim().toLowerCase();

  // Find candidate active orders for this table that haven't been cancelled or manually unlocked
  const candidateOrders = await OrderModel.find({
    table_number: { $regex: new RegExp(`^${formattedTable}$`, "i") },
    status: { $ne: "cancelled" },
    $or: [{ unlocked_at: null }, { unlocked_at: { $exists: false } }],
  }).sort({ created_at: -1 });

  let activeOrder: any = null;
  let remainingMs = 0;

  for (const order of candidateOrders) {
    const lockMins = order.lock_duration_mins || 30;
    const orderTime = new Date(order.created_at || order.createdAt).getTime();
    const lockWindowMs = lockMins * 60 * 1000;
    const elapsed = Date.now() - orderTime;

    if (elapsed < lockWindowMs) {
      activeOrder = order;
      remainingMs = lockWindowMs - elapsed;
      break;
    }
  }

  if (!activeOrder) {
    return {
      locked: false,
      remainingMinutes: 0,
      remainingSeconds: 0,
      lockDurationMins: 30,
      tokenVerified: false,
    };
  }

  const cleanUserToken = userToken ? userToken.trim().toUpperCase() : "";
  const activeTableToken = activeOrder.table_token ? activeOrder.table_token.trim().toUpperCase() : "";
  const tokenVerified = !!(
    cleanUserToken &&
    activeTableToken &&
    cleanUserToken === activeTableToken
  );

  const remainingSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));

  return {
    locked: !tokenVerified,
    remainingMinutes,
    remainingSeconds,
    lockDurationMins: activeOrder.lock_duration_mins || 30,
    tokenVerified,
    tableToken: activeOrder.table_token,
    orderTime: activeOrder.created_at || activeOrder.createdAt,
    orderId: activeOrder._id.toString(),
  };
}
