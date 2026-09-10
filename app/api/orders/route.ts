import { NextResponse } from "next/server";
import db, { Order } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/orders - Fetch all orders
export async function GET() {
  try {
    const stmt = db.prepare("SELECT * FROM orders ORDER BY created_at DESC");
    const orders = stmt.all() as Order[];
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

    const stmt = db.prepare(`
      INSERT INTO orders (dish_id, dish_name, price, quantity, table_number, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `);

    const result = stmt.run(
      dish_id || "custom",
      dish_name,
      price || "₹0",
      quantity || 1,
      String(table_number).trim(),
      notes || ""
    );

    const newOrderStmt = db.prepare("SELECT * FROM orders WHERE id = ?");
    const newOrder = newOrderStmt.get(result.lastInsertRowid) as Order;

    return NextResponse.json({ success: true, order: newOrder });
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

    const stmt = db.prepare("UPDATE orders SET status = ? WHERE id = ?");
    stmt.run(status, id);

    const updatedStmt = db.prepare("SELECT * FROM orders WHERE id = ?");
    const updatedOrder = updatedStmt.get(id) as Order;

    return NextResponse.json({ success: true, order: updatedOrder });
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

    if (id === "all") {
      db.prepare("DELETE FROM orders").run();
    } else {
      db.prepare("DELETE FROM orders WHERE id = ?").run(Number(id));
    }

    return NextResponse.json({ success: true, message: "Order deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete order" },
      { status: 500 }
    );
  }
}
