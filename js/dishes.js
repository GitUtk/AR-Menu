/**
 * dishes.js — Dish Registry
 *
 * To add a dish:
 *   1. Drop the .glb (and optional .usdz) into /models/
 *   2. Add one entry to DISHES below.
 *   No other changes needed.
 */

/** @type {string} CDN base for all model assets */
const CDN = "https://cdn.jsdelivr.net/gh/abdullah880/ar-restaurant-menu@main";

/**
 * @typedef {Object} Dish
 * @property {string}   id
 * @property {string}   name
 * @property {string}   model       - URL to .glb file
 * @property {string}   [iosSrc]    - URL to .usdz file (required for iOS AR)
 * @property {string}   [poster]    - URL to poster image shown while model loads
 * @property {string}   description
 * @property {string}   price       - Formatted price string, e.g. "$19.00"
 * @property {string}   prepTime    - e.g. "20 min"
 * @property {string}   calories    - e.g. "740 kcal"
 * @property {string}   badge       - Short label shown in the badge chip
 * @property {string[]} tags        - Category/ingredient tags for filtering
 * @property {string}   [cameraOrbit] - Default orbit for model-viewer, e.g. "0deg 75deg 105%"
 */

/** @type {Record<string, Dish>} */
export const DISHES = {
  // ── Mains ──────────────────────────────────────────────────────────────────
  butter_chicken: {
    id: "butter_chicken",
    name: "Butter Chicken",
    model: `${CDN}/models/butter_chicken.glb`,
    iosSrc: `${CDN}/models/butter_chicken.usdz`,
    poster: `${CDN}/models/butter_chicken-poster.webp`,
    description:
      "Tender tandoor-kissed chicken simmered in a velvety tomato-cream sauce spiced with garam masala, fenugreek, and hand-ground Kashmiri chilies. Served with garlic naan.",
    price: "$19.00",
    prepTime: "20 min",
    calories: "740 kcal",
    badge: "Staff Favourite",
    tags: ["indian", "chicken"],
    arScale: "16.0 16.0 16.0",
  },
  pasta: {
    id: "pasta",
    name: "Truffle Tagliatelle",
    model: `${CDN}/models/pasta.glb`,
    iosSrc: `${CDN}/models/pasta.usdz`,
    poster: `${CDN}/models/pasta-poster.webp`,
    description:
      "Hand-rolled egg tagliatelle tossed in a silky parmesan cream sauce with freshly shaved black truffle and toasted pine nuts.",
    price: "$22.00",
    prepTime: "18 min",
    calories: "720 kcal",
    badge: "Signature",
    tags: ["italian", "truffle"],
    arScale: "6.6 6.6 6.6",
  },
  pizza: {
    id: "pizza",
    name: "Italian Pizza Margherita",
    model: `${CDN}/models/pizza.glb`,
    iosSrc: `${CDN}/models/pizza.usdz`,
    poster: `${CDN}/models/pizza-poster.webp`,
    description:
      "Wood-fired Neapolitan pizza with San Marzano tomato sauce, fresh mozzarella di bufala, basil, and extra virgin olive oil.",
    price: "$18.00",
    prepTime: "15 min",
    calories: "820 kcal",
    badge: "Wood-Fired",
    tags: ["vegetarian", "italian"],
    cameraOrbit: "0deg 85deg 100%",
    arScale: "2.0 2.0 2.0",
  },

  // ── Starters ───────────────────────────────────────────────────────────────
  burger: {
    id: "burger",
    name: "Classic Burger",
    model: `${CDN}/models/burger.glb`,
    iosSrc: `${CDN}/models/burger.usdz`,
    poster: `${CDN}/models/burger-poster.webp`,
    description:
      "Juicy beef patty with melted cheddar, crisp lettuce, vine-ripened tomato, and our signature house sauce on a toasted brioche bun.",
    price: "$14.50",
    prepTime: "12 min",
    calories: "680 kcal",
    badge: "Chef's Choice",
    tags: ["signature", "beef"],
    arScale: "0.25 0.25 0.25",
  },
  sushi: {
    id: "sushi",
    name: "Sushi Platter",
    model: `${CDN}/models/sushi.glb`,
    iosSrc: `${CDN}/models/sushi.usdz`,
    poster: `${CDN}/models/sushi-poster.webp`,
    description:
      "Chef's selection of 12 pieces featuring premium salmon, tuna, yellowtail, and sweet shrimp nigiri with fresh wasabi.",
    price: "$28.00",
    prepTime: "10 min",
    calories: "450 kcal",
    badge: "Premium",
    tags: ["seafood", "japanese"],
    arScale: "6.6 6.6 6.6",
  },
};
