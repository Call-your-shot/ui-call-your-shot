import { NextRequest, NextResponse } from "next/server";
import { backendFetch, backendErrorResponse } from "@/lib/backend/server";
import { SESSION_COOKIE } from "@/lib/backend/session";

interface SignInRequestBody {
  email?: string;
}

export interface SignInApiResponse {
  ok: boolean;
  email?: string;
  message?: string;
}

export async function POST(req: NextRequest) {
  let body: SignInRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<SignInApiResponse>(
      { ok: false, message: "Malformed request body" },
      { status: 400 }
    );
  }

  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json<SignInApiResponse>({ ok: false, message: "Email is required" }, { status: 400 });
  }

  try {
    try {
      await backendFetch("/create-user", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("already exists")) {
        throw error;
      }
    }
    const response = NextResponse.json<SignInApiResponse>({ ok: true, email });
    response.cookies.set(SESSION_COOKIE, email, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (err) {
    return backendErrorResponse(err);
  }
}
