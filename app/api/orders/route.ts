import { NextResponse } from "next/server";
import { connectToDatabase, OrderModel } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatOrder(doc: any) {
  return {
    id: doc._id.toString(),
    dish_id: doc.dish_id,
    dish_name: doc.dish_name,
    price: doc.price,
    quantity: doc.quantity,
    table_number: doc.table_number,
    notes: doc.notes || "",
    status: doc.status,
    created_at: doc.created_at || doc.createdAt || new Date().toISOString(),
  };
}

// GET /api/orders - Fetch all orders
export async function GET() {
  try {
    await connectToDatabase();
    const rawOrders = await OrderModel.find({}).sort({ created_at: -1, createdAt: -1 });
    const orders = rawOrders.map(formatOrder);
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders - Place a new order
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { dish_id, dish_name, price, quantity, table_number, notes } = body;

    if (!dish_name || !table_number) {
      return NextResponse.json(
        { success: false, error: "Dish name and table number are required." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const newDoc = await OrderModel.create({
      dish_id: dish_id || "custom",
      dish_name,
      price: price || "₹0",
      quantity: quantity || 1,
      table_number: String(table_number).trim(),
      notes: notes || "",
      status: "pending",
    });

    return NextResponse.json({ success: true, order: formatOrder(newDoc) });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to place order" },
      { status: 500 }
    );
  }
}

// PATCH /api/orders - Update order status
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "Order ID and new status are required." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const updatedDoc = await OrderModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedDoc) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order: formatOrder(updatedDoc) });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update order" },
      { status: 500 }
    );
  }
}

// DELETE /api/orders - Delete an order by ID (or clear all if id = 'all')
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Order ID is required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    if (id === "all") {
      await OrderModel.deleteMany({});
    } else {
      await OrderModel.findByIdAndDelete(id);
    }

    return NextResponse.json({ success: true, message: "Order deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete order" },
      { status: 500 }
    );
  }
}
