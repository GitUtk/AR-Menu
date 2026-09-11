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

export const DISHES: Record<string, Dish> = {};

export const DISH_LIST: Dish[] = [];

export const CATEGORIES = [
  { id: "all", label: "All Items" },
  { id: "indian", label: "Indian" },
  { id: "italian", label: "Italian" },
  { id: "japanese", label: "Japanese" },
  { id: "signature", label: "Signature" },
  { id: "vegetarian", label: "Vegetarian" },
];
