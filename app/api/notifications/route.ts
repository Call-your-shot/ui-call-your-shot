import { NextRequest, NextResponse } from "next/server";

export interface FrontendNotification {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
  actionRequired: boolean;
  relatedId: string;
}

export interface NotificationsApiResponse {
  notifications: FrontendNotification[];
}

// Proxies to the real backend's GET /api/notifications?email= — powers the
// topbar notification bell for signed-in users. Unlike the mutation routes
// above, this is a read with no meaningful local-mock equivalent, so it
// falls back to an empty list (same softer failure mode as /api/plans)
// rather than erroring out the whole app chrome.
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim();
  if (!email) {
    return NextResponse.json({ message: "email is required" }, { status: 400 });
  }

  const backendBaseUrl = process.env.BACKEND_URL;
  if (backendBaseUrl) {
    try {
      const res = await fetch(`${backendBaseUrl}/api/notifications?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error(`Notifications backend responded ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data?.notifications)) throw new Error("Notifications backend returned no usable notifications array");
      return NextResponse.json<NotificationsApiResponse>({ notifications: data.notifications });
    } catch (err) {
      console.error("[api/notifications] backend call failed, returning empty list:", err);
    }
  }

  return NextResponse.json<NotificationsApiResponse>({ notifications: [] });
}
