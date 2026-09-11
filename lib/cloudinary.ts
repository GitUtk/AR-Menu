import crypto from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dakh7ac7j";
const API_KEY = process.env.CLOUDINARY_API_KEY || "318799848925279";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "rsFhOOjOcqraq2iUPSfuQrUxi3g";

/**
 * Extract Cloudinary public_id from a full URL.
 * e.g. https://res.cloudinary.com/.../ar_restaurant_inputs/xyz.png -> ar_restaurant_inputs/xyz
 * e.g. https://res.cloudinary.com/.../ar_restaurant_models/abc.glb -> ar_restaurant_models/abc.glb
 */
export function extractCloudinaryPublicId(url: string, resourceType: "image" | "raw"): string | null {
  if (!url || !url.includes("cloudinary.com")) return null;
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/");
    const uploadIndex = pathParts.indexOf("upload");
    if (uploadIndex === -1) return null;

    let remaining = pathParts.slice(uploadIndex + 1);
    if (remaining[0] && remaining[0].startsWith("v") && /^\d+$/.test(remaining[0].substring(1))) {
      remaining = remaining.slice(1);
    }

    let publicIdWithExt = remaining.join("/");
    if (resourceType === "image") {
      const lastDotIndex = publicIdWithExt.lastIndexOf(".");
      if (lastDotIndex !== -1) {
        return publicIdWithExt.substring(0, lastDotIndex);
      }
    }
    return publicIdWithExt;
  } catch {
    return null;
  }
}

/**
 * Deletes an asset (image or raw GLB model) from Cloudinary storage.
 */
export async function deleteCloudinaryAsset(url: string | undefined | null) {
  if (!url || !url.includes("cloudinary.com")) return;

  const isRaw = url.includes("/raw/upload/");
  const resourceType: "raw" | "image" = isRaw ? "raw" : "image";
  const publicId = extractCloudinaryPublicId(url, resourceType);

  if (!publicId) return;

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
    const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

    const body = new URLSearchParams({
      public_id: publicId,
      api_key: API_KEY,
      timestamp: timestamp.toString(),
      signature: signature,
    });

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/destroy`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const data = await res.json();
    console.log(`Cloudinary deletion (${resourceType} - ${publicId}):`, data);
    return data;
  } catch (err) {
    console.error(`Failed to delete Cloudinary asset (${url}):`, err);
  }
}
