# AR Restaurant Menu

An interactive, web-based Augmented Reality (AR) menu application for modern dining experiences. Built with Next.js 14 (App Router, TypeScript, Tailwind CSS), Shadcn UI Design System, `@google/model-viewer`, A-Frame, and AR.js.

---


## Overview

The AR Restaurant Menu enables guests to view high-fidelity 3D renderings of menu items and preview dishes in Augmented Reality directly through their smartphone camera without installing a native app.

---

## Key Features

- **Next.js 14 App Router**: Built with TypeScript and Tailwind CSS using a sleek dark theme (`#09090b` / `zinc-950`).
- **Interactive 3D Dish Viewer**: Full 360-degree turntable controls, zoom, camera reset, and full-screen preview powered by Google Model Viewer.
- **In-Browser WebAR Camera**: Computer vision Hiro marker tracking integrated via A-Frame and AR.js.
- **Static Route Pages**: Clean `/dish/[id]` dynamic routing for direct dish access (`/dish/butter_chicken`, `/dish/pasta`, `/dish/pizza`, `/dish/burger`, `/dish/sushi`).
- **Print-Ready A4 Markers PDF**: Includes a print-optimized document (`hiro_markers_a4.pdf`) containing dual Hiro tracking markers formatted for restaurant table stands.

---

## Dish Catalog

| Dish Name | Category | Price | Prep Time | Calories | Route |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Butter Chicken** | Indian / Chicken | ₹450 | 20 min | 740 kcal | `/dish/butter_chicken` |
| **Truffle Tagliatelle** | Italian / Truffle | ₹550 | 18 min | 720 kcal | `/dish/pasta` |
| **Italian Pizza Margherita** | Italian / Vegetarian | ₹420 | 15 min | 820 kcal | `/dish/pizza` |
| **Classic Burger** | Signature / Beef | ₹350 | 12 min | 680 kcal | `/dish/burger` |
| **Sushi Platter** | Seafood / Japanese | ₹750 | 10 min | 450 kcal | `/dish/sushi` |

---

## Local Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Access the application at `http://localhost:3000`.
---

## Credits

Made with ❤️ by **Team Sentinel**

- [GitUtk](https://github.com/GitUtk)
- [tejeetvkumar](https://github.com/tejeetvkumar)
- [TanyaSharma](https://github.com/TanyaSharma-19)


---

## License

MIT License.
