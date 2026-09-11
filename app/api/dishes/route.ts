import { NextResponse } from "next/server";
import { connectToDatabase, DishModel } from "@/lib/db";
import { Dish } from "@/lib/dishes";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

// GET /api/dishes - Get list of dishes directly from MongoDB database
export async function GET() {
  try {
    await connectToDatabase();
    const docs = await DishModel.find({}).sort({ createdAt: -1 }).lean();

    const dishes: Dish[] = docs.map((doc: any) => ({
      id: doc.id,
      name: doc.name,
      model: doc.model,
      iosSrc: doc.iosSrc || "",
      poster: doc.poster,
      description: doc.description,
      price: doc.price,
      prepTime: doc.prepTime || "15 min",
      calories: doc.calories || "500 kcal",
      badge: doc.badge || "Chef Special",
      tags: Array.isArray(doc.tags) ? doc.tags : ["signature"],
      cameraOrbit: doc.cameraOrbit || "",
      arScale: doc.arScale || "1.0 1.0 1.0",
      rotation: doc.rotation || "0 0 0",
      position: doc.position || "0 0 0",
    }));

    return NextResponse.json({ success: true, dishes });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch dishes" },
      { status: 500 }
    );
  }
}

// POST /api/dishes - Create or update a dish item
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      model,
      poster,
      description,
      price,
      prepTime,
      calories,
      badge,
      tags,
      arScale,
    } = body;

    if (!name || !price || !description || !poster || !model) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, price, description, food image, and 3D model are required.",
        },
        { status: 400 }
      );
    }

    const dishId = (id || name).toLowerCase().replace(/[^a-z0-9]/g, "_");

    await connectToDatabase();

    const dishData = {
      id: dishId,
      name,
      model,
      poster,
      description,
      price: price.startsWith("₹") ? price : `₹${price}`,
      prepTime: prepTime || "15 min",
      calories: calories ? (calories.toLowerCase().includes("kcal") ? calories : `${calories} kcal`) : "500 kcal",
      badge: badge || "Chef Special",
      tags: Array.isArray(tags) && tags.length > 0 ? tags : ["signature"],
      arScale: arScale || "1.0 1.0 1.0",
      rotation: "0 0 0",
      position: "0 0 0",
    };

    const updatedDish = await DishModel.findOneAndUpdate(
      { id: dishId },
      dishData,
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      dish: updatedDish,
      message: `Dish "${name}" saved successfully to menu!`,
    });
  } catch (error: any) {
    console.error("Save dish error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to save menu dish." },
      { status: 500 }
    );
  }
}

// DELETE /api/dishes?id=... - Delete a custom dish
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Dish ID required for deletion." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const dish = await DishModel.findOne({ id: id.toLowerCase() });

    if (dish) {
      // Clean up linked Cloudinary assets (food photo & 3D GLB model)
      if (dish.poster) await deleteCloudinaryAsset(dish.poster);
      if (dish.model) await deleteCloudinaryAsset(dish.model);

      await DishModel.deleteOne({ id: id.toLowerCase() });
    }

    return NextResponse.json({
      success: true,
      message: `Dish #${id} deleted from menu.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete dish." },
      { status: 500 }
    );
  }
}
