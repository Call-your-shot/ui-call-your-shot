import { NextRequest, NextResponse } from "next/server";

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

  const backendBaseUrl = process.env.BACKEND_URL;
  if (!backendBaseUrl) {
    // No account service configured — demo auth still succeeds locally so
    // the rest of the app stays usable without it running.
    return NextResponse.json<SignInApiResponse>({ ok: true, email });
  }

  try {
    const res = await fetch(`${backendBaseUrl}/create-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    // 201 = new account, 400 = "already exists" — demo auth treats a
    // returning user the same as a new one, there's no separate login
    // endpoint yet. Any other status is a genuine backend problem.
    if (!res.ok && res.status !== 400) {
      throw new Error(`create-user responded ${res.status}`);
    }

    return NextResponse.json<SignInApiResponse>({ ok: true, email });
  } catch (err) {
    // Never block the demo on the account service being down.
    console.error("[api/signin] create-user call failed, proceeding anyway:", err);
    return NextResponse.json<SignInApiResponse>({ ok: true, email });
  }
}
