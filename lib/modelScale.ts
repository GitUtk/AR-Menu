/**
 * 3D Model Scaling & Proportional Normalization Utility
 * 
 * Benchmark Reference Standards:
 * - Classic Burger (Finger food / Bun): ~0.20m footprint (arScale: "0.25 0.25 0.25")
 * - Butter Chicken (Curry bowl + naan): ~0.24m footprint (arScale: "16.0 16.0 16.0")
 * - Sushi Platter (Platter / 12 pcs): ~0.28m footprint (arScale: "6.6 6.6 6.6")
 * - Pizza Margherita (12" Wood-fired pie): ~0.32m footprint (arScale: "2.0 2.0 2.0")
 */

export interface BoundingBox {
  min: [number, number, number];
  max: [number, number, number];
  size: [number, number, number];
  extent: number; // Maximum dimension among width, height, depth
}

/**
 * Parse GLB binary buffer to extract vertex position min/max bounds from glTF JSON header
 */
export function parseGlbBoundingBox(buffer: Buffer): BoundingBox | null {
  try {
    if (!buffer || buffer.length < 20) return null;

    // Check magic bytes "glTF" (0x46544C67)
    const magic = buffer.readUInt32LE(0);
    if (magic !== 0x46544c67) return null;

    // Chunk 0 offset is byte 12
    const chunkLength = buffer.readUInt32LE(12);
    const chunkType = buffer.readUInt32LE(16);

    // Chunk type 0x4E4F534A is "JSON"
    if (chunkType !== 0x4e4f534a) return null;

    const jsonBuffer = buffer.subarray(20, 20 + chunkLength);
    const jsonString = jsonBuffer.toString("utf-8");
    const gltf = JSON.parse(jsonString);

    if (!gltf.accessors || !Array.isArray(gltf.accessors)) return null;

    let overallMin: [number, number, number] = [Infinity, Infinity, Infinity];
    let overallMax: [number, number, number] = [-Infinity, -Infinity, -Infinity];
    let foundPositionAccessor = false;

    for (const accessor of gltf.accessors) {
      if (
        accessor.type === "VEC3" &&
        Array.isArray(accessor.min) &&
        accessor.min.length === 3 &&
        Array.isArray(accessor.max) &&
        accessor.max.length === 3
      ) {
        foundPositionAccessor = true;
        for (let i = 0; i < 3; i++) {
          if (accessor.min[i] < overallMin[i]) overallMin[i] = accessor.min[i];
          if (accessor.max[i] > overallMax[i]) overallMax[i] = accessor.max[i];
        }
      }
    }

    if (!foundPositionAccessor) return null;

    const dx = Math.abs(overallMax[0] - overallMin[0]);
    const dy = Math.abs(overallMax[1] - overallMin[1]);
    const dz = Math.abs(overallMax[2] - overallMin[2]);
    const extent = Math.max(dx, dy, dz);

    if (extent <= 0 || !isFinite(extent)) return null;

    return {
      min: overallMin,
      max: overallMax,
      size: [dx, dy, dz],
      extent,
    };
  } catch (err) {
    console.warn("Failed to parse GLB bounding box:", err);
    return null;
  }
}

/**
 * Determine physical real-world target footprint (in meters) for a dish type
 * based on the 4 reference dish standards.
 */
export function getTargetPhysicalFootprint(name: string = "", tags: string[] = []): number {
  const lowerName = name.toLowerCase();
  const lowerTags = tags.map((t) => t.toLowerCase());

  // 1. Pizza / Dosa / Large Shared Platters -> ~0.32m (Anchored to Pizza Margherita)
  if (
    lowerName.includes("pizza") ||
    lowerName.includes("dosa") ||
    lowerName.includes("platter") ||
    lowerTags.includes("pizza") ||
    lowerTags.includes("sharing")
  ) {
    return 0.32;
  }

  // 2. Curries / Bowls / Pasta / Biryani / Main Rice Dishes -> ~0.24m (Anchored to Butter Chicken & Sushi)
  if (
    lowerName.includes("chicken") ||
    lowerName.includes("paneer") ||
    lowerName.includes("curry") ||
    lowerName.includes("pasta") ||
    lowerName.includes("tagliatelle") ||
    lowerName.includes("biryani") ||
    lowerName.includes("rice") ||
    lowerName.includes("noodle") ||
    lowerName.includes("ramen") ||
    lowerName.includes("sushi") ||
    lowerTags.includes("indian") ||
    lowerTags.includes("italian") ||
    lowerTags.includes("japanese")
  ) {
    return 0.24;
  }

  // 3. Burgers / Sandwiches / Tacos / Wraps / Small Starters -> ~0.20m (Anchored to Classic Burger)
  if (
    lowerName.includes("burger") ||
    lowerName.includes("sandwich") ||
    lowerName.includes("taco") ||
    lowerName.includes("wrap") ||
    lowerName.includes("starter") ||
    lowerName.includes("fries") ||
    lowerName.includes("dessert") ||
    lowerName.includes("cake")
  ) {
    return 0.20;
  }

  // Default fallback footprint: ~0.25m
  return 0.25;
}

/**
 * Calculate proportional uniform arScale string ("X.XXX X.XXX X.XXX") for a 3D model
 */
export function calculateProportionalArScale(
  glbBuffer?: Buffer | null,
  name: string = "",
  tags: string[] = []
): string {
  const targetFootprint = getTargetPhysicalFootprint(name, tags);

  if (glbBuffer) {
    const bbox = parseGlbBoundingBox(glbBuffer);
    if (bbox && bbox.extent > 0) {
      let scaleFactor = targetFootprint / bbox.extent;
      // Clamp scale factor within reasonable bounds (0.01 to 100)
      scaleFactor = Math.max(0.01, Math.min(100, scaleFactor));
      const formatted = scaleFactor.toFixed(3);
      return `${formatted} ${formatted} ${formatted}`;
    }
  }

  // Fallback category scale factor if GLB buffer extent is unavailable
  const fallbackScale = (targetFootprint * 4.0).toFixed(3);
  return `${fallbackScale} ${fallbackScale} ${fallbackScale}`;
}
