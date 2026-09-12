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

const DishSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    model: { type: String, required: true },
    iosSrc: { type: String, default: "" },
    poster: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: String, required: true },
    prepTime: { type: String, default: "15 min" },
    calories: { type: String, default: "500 kcal" },
    badge: { type: String, default: "Chef Special" },
    tags: { type: [String], default: ["signature"] },
    cameraOrbit: { type: String, default: "" },
    arScale: { type: String, default: "1.0 1.0 1.0" },
    rotation: { type: String, default: "0 0 0" },
    position: { type: String, default: "0 0 0" },
  },
  {
    timestamps: true,
  }
);

export const OrderModel =
  mongoose.models.Order || mongoose.model("Order", OrderSchema);

export const AdminConfigModel =
  mongoose.models.AdminConfig ||
  mongoose.model("AdminConfig", AdminConfigSchema);

export const DishModel =
  mongoose.models.Dish || mongoose.model("Dish", DishSchema);

const CDN = "https://cdn.jsdelivr.net/gh/abdullah880/ar-restaurant-menu@main";

export const INITIAL_SEED_DISHES = [
  {
    id: "butter_chicken",
    name: "Butter Chicken",
    model: "https://res.cloudinary.com/dakh7ac7j/raw/upload/v1789153938/ar_restaurant_models/yeipdtm3vk8wcrqqorrh.glb",
    iosSrc: `${CDN}/models/butter_chicken.usdz`,
    poster: "https://res.cloudinary.com/dakh7ac7j/image/upload/v1789153936/ar_restaurant_inputs/icb5qu7cjxejrxjqyiel.png",
    description: "Tender tandoor-kissed chicken simmered in a velvety tomato-cream sauce spiced with garam masala, fenugreek, and hand-ground Kashmiri chilies. Served with garlic naan.",
    price: "₹450",
    prepTime: "20 min",
    calories: "740 kcal",
    badge: "Staff Favourite",
    tags: ["indian", "chicken"],
    arScale: "16.0 16.0 16.0",
    rotation: "0 0 0",
    position: "0 0 0",
  },
  {
    id: "pasta",
    name: "Truffle Tagliatelle",
    model: "https://res.cloudinary.com/dakh7ac7j/raw/upload/v1789153941/ar_restaurant_models/jteab389spevjrq4qils.glb",
    iosSrc: `${CDN}/models/pasta.usdz`,
    poster: "https://res.cloudinary.com/dakh7ac7j/image/upload/v1789153939/ar_restaurant_inputs/qyqubfwwt4injmljchhx.png",
    description: "Hand-rolled egg tagliatelle tossed in a silky parmesan cream sauce with freshly shaved black truffle and toasted pine nuts.",
    price: "₹550",
    prepTime: "18 min",
    calories: "720 kcal",
    badge: "Signature",
    tags: ["italian", "truffle"],
    arScale: "6.6 6.6 6.6",
    rotation: "0 0 0",
    position: "0 0 0",
  },
  {
    id: "pizza",
    name: "Italian Pizza Margherita",
    model: `${CDN}/models/pizza.glb`,
    iosSrc: `${CDN}/models/pizza.usdz`,
    poster: "https://res.cloudinary.com/dakh7ac7j/image/upload/v1789153942/ar_restaurant_inputs/nrxfen4tt2c0bibvj7hl.png",
    description: "Wood-fired Neapolitan pizza with San Marzano tomato sauce, fresh mozzarella di bufala, basil, and extra virgin olive oil.",
    price: "₹420",
    prepTime: "15 min",
    calories: "820 kcal",
    badge: "Wood-Fired",
    tags: ["vegetarian", "italian"],
    cameraOrbit: "0deg 85deg 100%",
    arScale: "2.0 2.0 2.0",
    rotation: "0 0 0",
    position: "0 0 0",
  },
  {
    id: "burger",
    name: "Classic Burger",
    model: "https://res.cloudinary.com/dakh7ac7j/raw/upload/v1789153948/ar_restaurant_models/vupqws4rjdrhdqvlmry5.glb",
    iosSrc: `${CDN}/models/burger.usdz`,
    poster: "https://res.cloudinary.com/dakh7ac7j/image/upload/v1789153946/ar_restaurant_inputs/hih4qvruegqsvhsg3xiw.png",
    description: "Juicy beef patty with melted cheddar, crisp lettuce, vine-ripened tomato, and our signature house sauce on a toasted brioche bun.",
    price: "₹350",
    prepTime: "12 min",
    calories: "680 kcal",
    badge: "Chef's Choice",
    tags: ["signature", "beef"],
    arScale: "0.25 0.25 0.25",
    rotation: "0 0 0",
    position: "0 0 0",
  },
  {
    id: "sushi",
    name: "Sushi Platter",
    model: "https://res.cloudinary.com/dakh7ac7j/raw/upload/v1789153950/ar_restaurant_models/gay411eea7he7eqtfob5.glb",
    iosSrc: `${CDN}/models/sushi.usdz`,
    poster: "https://res.cloudinary.com/dakh7ac7j/image/upload/v1789153949/ar_restaurant_inputs/casqpnywfegbt0rjqnxg.png",
    description: "Chef's selection of 12 pieces featuring premium salmon, tuna, yellowtail, and sweet shrimp nigiri with fresh wasabi.",
    price: "₹750",
    prepTime: "10 min",
    calories: "450 kcal",
    badge: "Premium",
    tags: ["seafood", "japanese"],
    arScale: "6.6 6.6 6.6",
    rotation: "0 0 0",
    position: "0 0 0",
  },
  {
    id: "dosa",
    name: "Crispy Masala Dosa",
    model: "https://res.cloudinary.com/dakh7ac7j/raw/upload/v1789153952/ar_restaurant_models/psur6tga8cdzysvhilg6.glb",
    iosSrc: `${CDN}/models/dosa.usdz`,
    poster: "https://res.cloudinary.com/dakh7ac7j/image/upload/v1789153951/ar_restaurant_inputs/c9vrgyagymwwd2yucyvp.png",
    description: "Crispy golden fermented rice and lentil crepe stuffed with spiced potato masala, served with authentic coconut chutney and piping hot sambar.",
    price: "₹220",
    prepTime: "15 min",
    calories: "490 kcal",
    badge: "South Indian Special",
    tags: ["indian", "vegetarian"],
    arScale: "5.0 5.0 5.0",
    rotation: "0 0 0",
    position: "0 0 0",
  },
];

export async function seedDishesIfEmpty() {
  try {
    const count = await DishModel.countDocuments();
    if (count === 0) {
      console.log("Seeding initial dishes into MongoDB database...");
      for (const dish of INITIAL_SEED_DISHES) {
        await DishModel.updateOne({ id: dish.id }, { $setOnInsert: dish }, { upsert: true });
      }
    }
  } catch (err) {
    console.error("Error seeding dishes:", err);
  }
}

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
    const defaultHash = process.env.ADMIN_PASSWORD_HASH || "";

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

  // Seed initial dishes into MongoDB if empty
  await seedDishesIfEmpty();

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
