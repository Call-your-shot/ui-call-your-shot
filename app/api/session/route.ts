import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail, SESSION_COOKIE } from "@/lib/backend/session";

export async function GET() {
  return NextResponse.json({ email: await getSessionEmail() });
}

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "false") {
    return NextResponse.json({ message: "Demo account switching is disabled" }, { status: 403 });
  }
  const body = (await request.json()) as { email?: string };
  if (!body.email?.includes("@")) {
    return NextResponse.json({ message: "A valid email is required" }, { status: 400 });
  }
  const response = NextResponse.json({ email: body.email });
  response.cookies.set(SESSION_COOKIE, body.email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
