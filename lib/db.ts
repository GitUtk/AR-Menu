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
  created_at: string;
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
