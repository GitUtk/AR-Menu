import { NextResponse } from "next/server";
import {
  verifyPassword,
  generateSessionToken,
  verifySessionToken,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/login - Verify current admin session
export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const tokenMatch = cookieHeader.match(/admin_session=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (token && verifySessionToken(token)) {
      return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json({ authenticated: false });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

// POST /api/admin/login - Authenticate with password "utkarsh"
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    if (!verifyPassword(password)) {
      return NextResponse.json(
        { success: false, error: "Invalid password" },
        { status: 401 }
      );
    }

    const token = generateSessionToken();
    const response = NextResponse.json({ success: true, message: "Logged in" });

    response.cookies.set({
      name: "admin_session",
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 86400, // 24 hours
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Authentication error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/login - Logout admin
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.set({
    name: "admin_session",
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}
