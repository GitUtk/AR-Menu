import { NextResponse } from "next/server";
import {
  connectToDatabase,
  OrderModel,
  checkTableLockStatus,
  generateTableToken,
} from "@/lib/db";

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
    payment_method: doc.payment_method || "cash",
    payment_status: doc.payment_status || "pending_cash",
    lock_duration_mins: doc.lock_duration_mins || 30,
    table_token: doc.table_token || "",
    created_at: doc.created_at || doc.createdAt || new Date().toISOString(),
    unlocked_at: doc.unlocked_at ? doc.unlocked_at.toISOString() : null,
  };
}

// GET /api/orders - Fetch all orders OR check table lock with 5-digit token verification
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const checkTable = searchParams.get("check_table");
    const userToken = searchParams.get("token") || searchParams.get("table_token") || undefined;

    if (checkTable) {
      const lockStatus = await checkTableLockStatus(checkTable, userToken);
      return NextResponse.json({ success: true, ...lockStatus });
    }

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

// POST /api/orders - Place order with 5-digit capital alphanumeric token verification
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      dish_id,
      dish_name,
      price,
      quantity,
      table_number,
      notes,
      payment_method,
      payment_status,
      lock_duration_mins,
      table_token,
    } = body;

    if (!dish_name || !table_number) {
      return NextResponse.json(
        { success: false, error: "Dish name and table number are required." },
        { status: 400 }
      );
    }

    const tableTrimmed = String(table_number).trim();
    const cleanUserToken = table_token ? String(table_token).trim().toUpperCase() : "";

    // Check table lock status
    const lockCheck = await checkTableLockStatus(tableTrimmed, cleanUserToken);

    if (lockCheck.locked) {
      return NextResponse.json(
        {
          success: false,
          locked: true,
          error: `Table ${tableTrimmed} is locked! Please enter the 5-digit Table Token (e.g. A8K9P) to add items, wait ~${lockCheck.remainingMinutes} min(s), or ask restaurant staff.`,
        },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const method = payment_method === "upi" ? "upi" : "cash";
    const payStatus = payment_status || (method === "upi" ? "paid" : "pending_cash");
    const duration = [20, 30, 40, 60].includes(Number(lock_duration_mins))
      ? Number(lock_duration_mins)
      : 30;

    // Reuse existing 5-digit token for active table lock session or generate new 5-digit token
    const finalToken =
      lockCheck.tableToken ||
      (cleanUserToken.length === 5 ? cleanUserToken : generateTableToken());

    const newDoc = await OrderModel.create({
      dish_id: dish_id || "custom",
      dish_name,
      price: price || "₹0",
      quantity: quantity || 1,
      table_number: tableTrimmed,
      notes: notes || "",
      status: "pending",
      payment_method: method,
      payment_status: payStatus,
      lock_duration_mins: duration,
      table_token: finalToken,
    });

    return NextResponse.json({
      success: true,
      order: formatOrder(newDoc),
      table_token: finalToken,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to place order" },
      { status: 500 }
    );
  }
}

// PATCH /api/orders - Update order status or unlock table
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, action } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Order ID is required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Staff unlock table action
    if (action === "unlock") {
      const unlockedDoc = await OrderModel.findByIdAndUpdate(
        id,
        { unlocked_at: new Date() },
        { new: true }
      );
      return NextResponse.json({
        success: true,
        message: "Table unlocked successfully",
        order: formatOrder(unlockedDoc),
      });
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: "New status is required." },
        { status: 400 }
      );
    }

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
