import crypto from "crypto";
import { connectToDatabase, AdminConfigModel } from "./db";

// SHA-256 hash of password "utkarsh" fallback
export const DEFAULT_ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH ||
  "804b33542c3172aa05608e9d079e2a31726ace6dd4c78a130707862d76fbd30c";

// Secret for signing session cookies
export const SESSION_SECRET =
  process.env.SESSION_SECRET || "ar_restaurant_admin_secret_key_2026";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password.trim()).digest("hex");
}

export async function verifyPassword(password: string): Promise<boolean> {
  if (!password) return false;
  const hash = hashPassword(password);

  try {
    await connectToDatabase();
    const adminConfig = await AdminConfigModel.findOne({ key: "admin_password_hash" });
    if (adminConfig && adminConfig.value) {
      return hash === adminConfig.value;
    }
  } catch (err) {
    console.error("Error checking password in DB:", err);
  }

  // Fallback check against default hash
  return hash === DEFAULT_ADMIN_PASSWORD_HASH;
}

export function generateSessionToken(): string {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(timestamp)
    .digest("hex");
  return `${timestamp}.${signature}`;
}

export function verifySessionToken(token: string): boolean {
  if (!token || !token.includes(".")) return false;
  const [timestamp, signature] = token.split(".");
  const expectedSignature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(timestamp)
    .digest("hex");

  if (signature !== expectedSignature) return false;

  // Session valid for 24 hours
  const tokenAgeMs = Date.now() - parseInt(timestamp, 10);
  const maxAgeMs = 24 * 60 * 60 * 1000;
  return tokenAgeMs >= 0 && tokenAgeMs <= maxAgeMs;
}
