export interface Dish {
  id: string;
  name: string;
  model: string;
  iosSrc?: string;
  poster?: string;
  description: string;
  price: string;
  prepTime: string;
  calories: string;
  badge: string;
  tags: string[];
  cameraOrbit?: string;
  arScale?: string;
  rotation?: string;
  position?: string;
}

const CDN = "https://cdn.jsdelivr.net/gh/abdullah880/ar-restaurant-menu@main";

export const DISHES: Record<string, Dish> = {
  butter_chicken: {
    id: "butter_chicken",
    name: "Butter Chicken",
    model: "/models/butter_chicken.glb",
    iosSrc: `${CDN}/models/butter_chicken.usdz`,
    poster: "/images/dishes/butter_chicken.png",
    description:
      "Tender tandoor-kissed chicken simmered in a velvety tomato-cream sauce spiced with garam masala, fenugreek, and hand-ground Kashmiri chilies. Served with garlic naan.",
    price: "₹450",
    prepTime: "20 min",
    calories: "740 kcal",
    badge: "Staff Favourite",
    tags: ["indian", "chicken"],
    arScale: "16.0 16.0 16.0",
    rotation: "0 0 0",
    position: "0 0 0",
  },
  pasta: {
    id: "pasta",
    name: "Truffle Tagliatelle",
    model: "/models/pasta.glb",
    iosSrc: `${CDN}/models/pasta.usdz`,
    poster: "/images/dishes/pasta.png",
    description:
      "Hand-rolled egg tagliatelle tossed in a silky parmesan cream sauce with freshly shaved black truffle and toasted pine nuts.",
    price: "₹550",
    prepTime: "18 min",
    calories: "720 kcal",
    badge: "Signature",
    tags: ["italian", "truffle"],
    arScale: "6.6 6.6 6.6",
    rotation: "0 0 0",
    position: "0 0 0",
  },
  pizza: {
    id: "pizza",
    name: "Italian Pizza Margherita",
    model: "/models/pizza.glb",
    iosSrc: `${CDN}/models/pizza.usdz`,
    poster: "/images/dishes/pizza.png",
    description:
      "Wood-fired Neapolitan pizza with San Marzano tomato sauce, fresh mozzarella di bufala, basil, and extra virgin olive oil.",
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
  burger: {
    id: "burger",
    name: "Classic Burger",
    model: "/models/burger.glb",
    iosSrc: `${CDN}/models/burger.usdz`,
    poster: "/images/dishes/burger.png",
    description:
      "Juicy beef patty with melted cheddar, crisp lettuce, vine-ripened tomato, and our signature house sauce on a toasted brioche bun.",
    price: "₹350",
    prepTime: "12 min",
    calories: "680 kcal",
    badge: "Chef's Choice",
    tags: ["signature", "beef"],
    arScale: "0.25 0.25 0.25",
    rotation: "0 0 0",
    position: "0 0 0",
  },
  sushi: {
    id: "sushi",
    name: "Sushi Platter",
    model: "/models/sushi.glb",
    iosSrc: `${CDN}/models/sushi.usdz`,
    poster: "/images/dishes/sushi.png",
    description:
      "Chef's selection of 12 pieces featuring premium salmon, tuna, yellowtail, and sweet shrimp nigiri with fresh wasabi.",
    price: "₹750",
    prepTime: "10 min",
    calories: "450 kcal",
    badge: "Premium",
    tags: ["seafood", "japanese"],
    arScale: "6.6 6.6 6.6",
    rotation: "0 0 0",
    position: "0 0 0",
  },
};

export const DISH_LIST = Object.values(DISHES);

export const CATEGORIES = [
  { id: "all", label: "All Items" },
  { id: "indian", label: "Indian" },
  { id: "italian", label: "Italian" },
  { id: "japanese", label: "Japanese" },
  { id: "signature", label: "Signature" },
  { id: "vegetarian", label: "Vegetarian" },
];
